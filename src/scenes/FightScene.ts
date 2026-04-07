import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../config/game.config';
import { getCharacter, type CharacterDef } from '../config/characters.config';
import { getArena, type ArenaDef } from '../config/arenas.config';
import { getEnemy, getBossPhase, type EnemyDef } from '../config/enemies.config';
import {
  createFighterState,
  moveLeft,
  moveRight,
  stopHorizontal,
  jump,
  applyGravity,
  applyFloorCollision,
  applyHitstun,
  updateHitstun,
  isInHitstun,
  type FighterState,
} from '../systems/MovementSystem';
import {
  createCombatState,
  startAttack,
  updateAttack,
  applyBlock,
  calculateDamage,
  calculateKnockback,
  applyDamage,
  checkKO,
  AttackType,
  type CombatState,
} from '../systems/CombatSystem';
import {
  createWeaponState,
  fireWeapon,
  updateProjectiles,
  checkProjectileHit,
  type WeaponState,
} from '../weapons/WeaponSystem';
import {
  createAIState,
  decideAction,
  updateAI,
  AIAction,
  type AIState,
  type AIContext,
} from '../systems/AISystem';
import {
  completeFight,
  getCoinsForFight,
  type LadderState,
} from '../systems/LadderSystem';
import { addCoins, recordArenaPlayed, recordBossDefeated, type PlayerSave } from '../systems/EconomySystem';
import {
  createPetState,
  applySpeedBoost,
  applyFlight,
  updateFlightTimer,
  updateAutoShoot,
  type PetState,
} from '../systems/PetSystem';
import { getPet } from '../config/pets.config';
import { getStoryState } from '../systems/StorySystem';
import { getQuote, personalityFromSlider } from '../systems/PersonalitySystem';
import { getNewGamePlusScaling } from '../systems/NewGamePlusSystem';
import {
  createEventState,
  rollForEvent,
  updateEvent,
  getActiveEvent,
  type RandomEventState,
} from '../systems/RandomEventSystem';

interface Fighter {
  movement: FighterState;
  combat: CombatState;
  charDef: CharacterDef;
  sprite: Phaser.GameObjects.Sprite;
  weapon: WeaponState;
  enemyDef?: EnemyDef;       // set for human/boss enemies
  humanGraphic?: Phaser.GameObjects.Graphics; // drawn for humans instead of sprite
}

export class FightScene extends Phaser.Scene {
  private player!: Fighter;
  private enemy!: Fighter;
  private aiState!: AIState;
  private graphics!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private matchOver = false;
  private resultText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;
  private enemyNameText!: Phaser.GameObjects.Text;
  private ladderState: LadderState | null = null;
  private playerSave: PlayerSave | null = null;
  private playerCharId = 'tuna';
  private petState!: PetState;
  private eventState!: RandomEventState;
  private eventRollTimer = 0;
  private eventWarningText!: Phaser.GameObjects.Text;
  private lightningX = 0;
  private seagullTarget: 'player' | 'enemy' = 'player';
  private companionActive = false;
  private companionCooldown = 0;
  private companionX = 0;
  private companionY = 0;

  constructor() {
    super({ key: 'FightScene' });
  }

  private arena!: ArenaDef;

  create(data: { playerCharId?: string; enemyCharId?: string; playerWeapon?: string; enemyWeapon?: string; aiLevel?: number; arenaId?: string; ladderState?: LadderState; playerSave?: PlayerSave; enemyType?: string; enemyId?: string }): void {
    this.matchOver = false;
    this.ladderState = data.ladderState || null;
    this.playerSave = data.playerSave || null;
    this.playerCharId = data.playerCharId || 'tuna';

    const playerCharId = this.playerCharId;
    const enemyCharId = data.enemyCharId || 'carp';
    const playerDef = getCharacter(playerCharId)!;
    const enemyDef = getCharacter(enemyCharId)!;
    const playerWeaponId = data.playerWeapon || 'toy_fish';
    const enemyWeaponId = data.enemyWeapon || 'pufferfish_cannon';
    const aiLevel = data.aiLevel || 3;
    const humanEnemyDef = data.enemyId ? getEnemy(data.enemyId) : undefined;

    this.arena = getArena(data.arenaId || 'sea')!;
    this.aiState = createAIState(aiLevel);
    this.petState = createPetState(this.playerSave?.equippedPet ?? null);

    // Random events
    this.eventState = createEventState();
    this.eventRollTimer = 10; // first possible event after 10 seconds
    this.eventWarningText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Pufferfish companion from story arc
    const story = getStoryState(this.playerSave?.ladderClears ?? 0);
    this.companionActive = story.pufferfishCompanion;
    this.companionCooldown = 3;
    this.companionX = 100;
    this.companionY = PHYSICS.floorY - 20;

    // Render arena layers
    this.cameras.main.setBackgroundColor(this.arena.bgColor);
    for (const layer of this.arena.layers) {
      this.add.rectangle(
        GAME_WIDTH / 2, layer.y + layer.height / 2,
        GAME_WIDTH, layer.height,
        layer.color, layer.alpha ?? 1,
      );
    }

    // Water shimmer line
    this.add.rectangle(GAME_WIDTH / 2, this.arena.floorY - 5, GAME_WIDTH, 2, 0x44aaff, 0.5);

    this.graphics = this.add.graphics();

    // Create fighters with sprites and weapons
    this.player = this.createFighter(playerDef, 200, true, playerWeaponId);
    this.enemy = this.createFighter(enemyDef, 600, false, enemyWeaponId);

    // Override enemy stats for human enemies
    if (humanEnemyDef) {
      this.enemy.enemyDef = humanEnemyDef;
      this.enemy.combat = { ...this.enemy.combat, hp: humanEnemyDef.hp, maxHp: humanEnemyDef.hp };
      this.enemy.sprite.setVisible(false);
      this.enemy.humanGraphic = this.add.graphics();
    }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      D: this.input.keyboard!.addKey('D'),
      J: this.input.keyboard!.addKey('J'),
      K: this.input.keyboard!.addKey('K'),
      L: this.input.keyboard!.addKey('L'),
      F: this.input.keyboard!.addKey('F'),
    };

    // HUD
    this.add.text(GAME_WIDTH / 2, 10, 'Move: Arrows/WASD | J: Light | K: Heavy | L: Special | F: Block', {
      fontSize: '11px', color: '#88bbdd',
    }).setOrigin(0.5, 0);

    this.playerNameText = this.add.text(20, 50, playerDef.name, {
      fontSize: '12px', color: '#ffffff',
    });
    this.enemyNameText = this.add.text(GAME_WIDTH - 20, 50, enemyDef.name, {
      fontSize: '12px', color: '#ffffff',
    }).setOrigin(1, 0);

    // NG+ scaling
    const ngCycle = Math.max(0, (this.playerSave?.ladderClears ?? 0) - 1);
    if (ngCycle > 0) {
      const scaling = getNewGamePlusScaling(ngCycle);
      this.enemy.combat = {
        ...this.enemy.combat,
        hp: Math.round(this.enemy.combat.hp * scaling.hpMultiplier),
        maxHp: Math.round(this.enemy.combat.maxHp * scaling.hpMultiplier),
      };
      this.aiState = {
        ...this.aiState,
        params: {
          ...this.aiState.params,
          reactionTime: Math.max(50, Math.round(this.aiState.params.reactionTime * scaling.reactionMultiplier)),
        },
      };
      // Show cycle indicator
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, `NG+ Cycle ${ngCycle}`, {
        fontSize: '10px', color: '#ff8844',
      }).setOrigin(0.5);
    }

    // Pre-fight personality quote
    const personality = personalityFromSlider(this.playerSave?.personality ?? 0.5);
    const preFightQuote = getQuote(personality, 'pre_fight');
    const quoteBubble = this.add.text(this.player.movement.x, this.player.movement.y - 60, preFightQuote, {
      fontSize: '11px', color: '#ffffff', backgroundColor: '#333333',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(10);
    this.time.delayedCall(2500, () => quoteBubble.destroy());

    this.add.text(10, GAME_HEIGHT - 16, '', { fontSize: '11px', color: '#00ff00' }).setName('fpsText');

    this.resultText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '32px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  private createFighter(charDef: CharacterDef, x: number, facingRight: boolean, weaponId: string): Fighter {
    const movement = {
      ...createFighterState(x, PHYSICS.floorY),
      isOnGround: true,
      facingRight,
    };

    const sprite = this.add.sprite(x, PHYSICS.floorY - 16, charDef.spriteSheet);
    sprite.play(`${charDef.id}_idle`);
    sprite.setScale(3);
    sprite.setFlipX(!facingRight);

    return {
      movement,
      combat: createCombatState(),
      charDef,
      sprite,
      weapon: createWeaponState(weaponId),
    };
  }

  update(_time: number, delta: number): void {
    if (this.matchOver) return;
    const dt = delta / 1000;

    this.handleInput();
    this.updateAIEnemy(dt);
    this.updateFighter(this.player, dt);
    this.updateFighter(this.enemy, dt);
    this.updatePet(dt);
    this.updateCompanion(dt);
    this.updateRandomEvents(dt);
    this.checkHits();
    this.checkMatchEnd();
    this.renderEffects();
    this.syncSprites();

    const fpsText = this.children.getByName('fpsText') as Phaser.GameObjects.Text;
    if (fpsText) fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }

  private handleInput(): void {
    const p = this.player;

    const leftDown = this.cursors.left.isDown || this.keys.A.isDown;
    const rightDown = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpDown = this.cursors.up.isDown || this.keys.W.isDown;

    if (leftDown) p.movement = moveLeft(p.movement);
    else if (rightDown) p.movement = moveRight(p.movement);
    else p.movement = stopHorizontal(p.movement);

    if (jumpDown) p.movement = jump(p.movement);

    p.combat = applyBlock(p.combat, this.keys.F.isDown);

    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
      p.combat = startAttack(p.combat, AttackType.Light);
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
      p.combat = startAttack(p.combat, AttackType.Heavy);
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.L)) {
      // Fire equipped weapon
      const result = fireWeapon(p.weapon, p.movement.x, p.movement.y, p.movement.facingRight);
      p.weapon = result.state;
      if (result.meleeHit) {
        // Melee weapon — check if enemy is in range and apply damage directly
        const dist = Math.abs(p.movement.x - this.enemy.movement.x);
        if (dist <= result.meleeHit.rangeX) {
          this.enemy.combat = applyDamage(this.enemy.combat, result.meleeHit.damage);
          const dir = p.movement.x < this.enemy.movement.x ? 1 : -1;
          this.enemy.movement.velocityX = result.meleeHit.knockback * dir * 3;
          this.enemy.movement.velocityY = -result.meleeHit.knockback * 0.5;
          this.enemy.movement.isOnGround = false;
          this.enemy.sprite.setTint(0xff0000);
          this.time.delayedCall(100, () => {
            if (!this.enemy.combat.isBlocking && !this.enemy.combat.isAttacking) {
              this.enemy.sprite.clearTint();
            }
          });
        }
      }
    }
  }

  private updateAIEnemy(dt: number): void {
    this.aiState = updateAI(this.aiState, dt);

    // Boss phase scaling
    if (this.enemy.enemyDef?.type === 'boss') {
      const totalPhases = this.enemy.enemyDef.id === 'chef' ? 3 : 2;
      const phase = getBossPhase(this.enemy.combat.hp, this.enemy.combat.maxHp, totalPhases);
      if (phase >= 2) {
        const intensity = phase === 3 ? 1.0 : 0.6;
        this.aiState = {
          ...this.aiState,
          params: {
            ...this.aiState.params,
            reactionTime: Math.min(this.aiState.params.reactionTime, 250 - intensity * 80),
            aggression: Math.max(this.aiState.params.aggression, 0.6 + intensity * 0.15),
            attackFrequency: Math.max(this.aiState.params.attackFrequency, 0.6 + intensity * 0.15),
          },
        };
      }
    }

    // Only decide when cooldown is up
    if (this.aiState.reactionCooldown > 0) return;

    const e = this.enemy;
    const p = this.player;
    const dist = Math.abs(e.movement.x - p.movement.x);

    const ctx: AIContext = {
      aiX: e.movement.x,
      aiY: e.movement.y,
      playerX: p.movement.x,
      playerY: p.movement.y,
      aiHp: e.combat.hp,
      playerHp: p.combat.hp,
      playerIsAttacking: p.combat.isAttacking,
      aiIsOnGround: e.movement.isOnGround,
      distToPlayer: dist,
    };

    const action = decideAction(this.aiState, ctx);
    this.aiState = {
      ...this.aiState,
      reactionCooldown: this.aiState.params.reactionTime / 1000,
      lastAction: action,
    };

    // Face the player
    e.movement.facingRight = p.movement.x > e.movement.x;

    // Execute action
    switch (action) {
      case AIAction.MoveToward:
        e.movement = p.movement.x < e.movement.x
          ? moveLeft(e.movement) : moveRight(e.movement);
        break;
      case AIAction.MoveAway:
        e.movement = p.movement.x < e.movement.x
          ? moveRight(e.movement) : moveLeft(e.movement);
        break;
      case AIAction.Jump:
        e.movement = jump(e.movement);
        break;
      case AIAction.LightAttack:
        e.combat = startAttack(e.combat, AttackType.Light);
        break;
      case AIAction.HeavyAttack:
        e.combat = startAttack(e.combat, AttackType.Heavy);
        break;
      case AIAction.WeaponAttack: {
        const result = fireWeapon(e.weapon, e.movement.x, e.movement.y, e.movement.facingRight);
        e.weapon = result.state;
        if (result.meleeHit) {
          if (dist <= result.meleeHit.rangeX) {
            p.combat = applyDamage(p.combat, result.meleeHit.damage);
            const dir = e.movement.x < p.movement.x ? 1 : -1;
            p.movement.velocityX = result.meleeHit.knockback * dir * 3;
            p.movement.velocityY = -result.meleeHit.knockback * 0.5;
            p.movement.isOnGround = false;
            p.sprite.setTint(0xff0000);
            this.time.delayedCall(100, () => {
              if (!p.combat.isBlocking && !p.combat.isAttacking) {
                p.sprite.clearTint();
              }
            });
          }
        }
        break;
      }
      case AIAction.Block:
        e.combat = applyBlock(e.combat, true);
        // Release block after a short time
        this.time.delayedCall(300, () => {
          e.combat = applyBlock(e.combat, false);
        });
        break;
      case AIAction.Idle:
      default:
        e.movement = stopHorizontal(e.movement);
        break;
    }
  }

  private updateFighter(fighter: Fighter, dt: number): void {
    fighter.movement = applyGravity(fighter.movement, dt);
    fighter.movement.x += fighter.movement.velocityX * dt;
    fighter.movement.y += fighter.movement.velocityY * dt;
    fighter.movement = applyFloorCollision(fighter.movement, PHYSICS.floorY);
    fighter.combat = updateAttack(fighter.combat, dt);
    fighter.weapon = updateProjectiles(fighter.weapon, dt, GAME_WIDTH);
  }

  private syncSprites(): void {
    this.syncFighterSprite(this.player);
    this.syncFighterSprite(this.enemy);
  }

  private syncFighterSprite(fighter: Fighter): void {
    const { x, y } = fighter.movement;

    if (fighter.humanGraphic && fighter.enemyDef) {
      const g = fighter.humanGraphic;
      g.clear();
      const dir = fighter.movement.facingRight ? 1 : -1;
      const isBoss = fighter.enemyDef.type === 'boss';
      const isEnraged = isBoss && getBossPhase(fighter.combat.hp, fighter.combat.maxHp) === 2;
      const baseColor = isEnraged ? 0xff2222 : fighter.enemyDef.color;
      const color = fighter.combat.isAttacking ? 0xffff00
        : fighter.combat.isBlocking ? 0x8888ff
        : baseColor;

      if (isBoss && fighter.enemyDef!.id === 'chef') {
        // Draw The Chef
        const totalPhases = 3;
        const phase = getBossPhase(fighter.combat.hp, fighter.combat.maxHp, totalPhases);
        const phaseColor = phase === 3 ? 0xff2222 : phase === 2 ? 0xffaa00 : color;
        const pulse = phase >= 2 ? Math.sin(Date.now() / (phase === 3 ? 80 : 120)) * 2 : 0;

        // Legs
        g.fillStyle(0x222222, 1);
        g.fillRect(x - 8, y - 8, 7, 12);
        g.fillRect(x + 1, y - 8, 7, 12);
        // Body (apron)
        g.fillStyle(phaseColor, 1);
        g.fillRect(x - 14, y - 65 + pulse, 28, 60);
        // Apron front
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(x - 10, y - 50 + pulse, 20, 40);
        // Head
        g.fillStyle(0xddaa88, 1);
        g.fillCircle(x, y - 73 + pulse, 11);
        // Chef hat
        g.fillStyle(0xffffff, 1);
        g.fillRect(x - 10, y - 95 + pulse, 20, 18);
        g.fillRect(x - 14, y - 82 + pulse, 28, 6);
        // Eyes (angrier per phase)
        g.fillStyle(0x000000, 1);
        g.fillCircle(x + dir * 4, y - 75 + pulse, phase >= 2 ? 3 : 2);
        // Weapon arm
        if (fighter.combat.isAttacking) {
          g.lineStyle(3, 0xcccccc, 1);
          g.lineBetween(x + dir * 14, y - 50 + pulse, x + dir * 45, y - 60 + pulse);
          // Knife/pan at end
          g.fillStyle(0xaaaaaa, 1);
          g.fillRect(x + dir * 40, y - 66 + pulse, 10, 14);
        }
        // Phase glow
        if (phase >= 2) {
          const glowColor = phase === 3 ? 0xff0000 : 0xffaa00;
          g.lineStyle(2, glowColor, 0.3 + Math.sin(Date.now() / 150) * 0.2);
          g.strokeRect(x - 18, y - 98 + pulse, 36, 102);
        }
      } else if (isBoss) {
        // Draw Mega-Fish as giant fish
        const pulse = isEnraged ? Math.sin(Date.now() / 100) * 3 : 0;
        g.fillStyle(color, 1);
        g.fillEllipse(x, y - 30 + pulse, 80, 40);
        g.fillTriangle(x - dir * 40, y - 30, x - dir * 60, y - 50, x - dir * 60, y - 10);
        g.fillStyle(isEnraged ? 0xff4444 : 0x224466, 1);
        g.fillTriangle(x, y - 50 + pulse, x - 15, y - 30, x + 15, y - 30);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(x + dir * 25, y - 35, 6);
        g.fillStyle(isEnraged ? 0xff0000 : 0x000000, 1);
        g.fillCircle(x + dir * 26, y - 35, 3);
        g.fillStyle(0xffffff, 1);
        for (let t = 0; t < 4; t++) {
          g.fillTriangle(
            x + dir * (10 + t * 8), y - 22,
            x + dir * (14 + t * 8), y - 22,
            x + dir * (12 + t * 8), y - 16,
          );
        }
        if (isEnraged) {
          g.lineStyle(2, 0xff0000, 0.4 + Math.sin(Date.now() / 150) * 0.3);
          g.strokeEllipse(x, y - 30, 90, 50);
        }
      } else {
        // Draw human enemy as tall figure
        g.fillStyle(color, 1);
        g.fillRect(x - 12, y - 60, 24, 55);
        g.fillStyle(0xddaa88, 1);
        g.fillCircle(x, y - 68, 10);
        g.fillStyle(0x000000, 1);
        g.fillCircle(x + dir * 4, y - 70, 2);
        if (fighter.combat.isAttacking) {
          g.lineStyle(3, 0xaaaaaa, 1);
          g.lineBetween(x + dir * 12, y - 40, x + dir * 40, y - 50);
        }
        g.fillStyle(color, 0.8);
        g.fillRect(x - 8, y - 5, 7, 10);
        g.fillRect(x + 1, y - 5, 7, 10);
      }
      return;
    }

    fighter.sprite.setPosition(x, y - 16);
    fighter.sprite.setFlipX(!fighter.movement.facingRight);

    if (fighter.combat.isAttacking) {
      fighter.sprite.setTint(0xffff00);
    } else if (fighter.combat.isBlocking) {
      fighter.sprite.setTint(0x8888ff);
    } else {
      fighter.sprite.clearTint();
    }
  }

  private checkHits(): void {
    this.resolveAttack(this.player, this.enemy);
    this.resolveAttack(this.enemy, this.player);
    this.resolveProjectiles(this.player, this.enemy);
    this.resolveProjectiles(this.enemy, this.player);
  }

  private resolveProjectiles(attacker: Fighter, defender: Fighter): void {
    const remaining: typeof attacker.weapon.projectiles = [];
    for (const proj of attacker.weapon.projectiles) {
      if (checkProjectileHit(proj, defender.movement.x, defender.movement.y - 16, 25)) {
        // Hit!
        const blocked = defender.combat.isBlocking;
        const dmg = blocked ? proj.damage * 0.5 : proj.damage;
        defender.combat = applyDamage(defender.combat, dmg);
        const dir = proj.velocityX > 0 ? 1 : -1;
        defender.movement.velocityX = proj.knockback * dir * 2;
        defender.movement.velocityY = -proj.knockback * 0.3;
        defender.movement.isOnGround = false;
        defender.sprite.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          if (!defender.combat.isBlocking && !defender.combat.isAttacking) {
            defender.sprite.clearTint();
          }
        });
      } else {
        remaining.push(proj);
      }
    }
    attacker.weapon = { ...attacker.weapon, projectiles: remaining };
  }

  private resolveAttack(attacker: Fighter, defender: Fighter): void {
    if (!attacker.combat.isAttacking || !attacker.combat.currentAttack) return;

    const attackDuration = attacker.combat.currentAttack === AttackType.Light ? 0.25
      : attacker.combat.currentAttack === AttackType.Heavy ? 0.65 : 0.4;
    const halfDuration = attackDuration / 2;
    const elapsed = attackDuration - attacker.combat.attackTimer;

    if (Math.abs(elapsed - halfDuration) > 0.03) return;

    const dist = Math.abs(attacker.movement.x - defender.movement.x);
    const attackRange = attacker.combat.currentAttack === AttackType.Special ? 150 : 80;
    if (dist > attackRange) return;

    const damage = calculateDamage(attacker.combat.currentAttack, defender.combat.isBlocking);
    defender.combat = applyDamage(defender.combat, damage);

    const kb = calculateKnockback(attacker.combat.currentAttack, defender.combat.hp, defender.combat.maxHp);
    const direction = attacker.movement.x < defender.movement.x ? 1 : -1;
    defender.movement.velocityX = kb * direction * 3;
    defender.movement.velocityY = -kb * 0.5;
    defender.movement.isOnGround = false;

    // Hit flash
    defender.sprite.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (!defender.combat.isBlocking && !defender.combat.isAttacking) {
        defender.sprite.clearTint();
      }
    });
  }

  private checkMatchEnd(): void {
    const ko = this.arena.koZones;
    const pKO = checkKO(
      this.player.movement.y, this.player.movement.x,
      ko.left, ko.right, ko.top
    );
    const eKO = checkKO(
      this.enemy.movement.y, this.enemy.movement.x,
      ko.left, ko.right, ko.top
    );

    if (pKO) this.endMatch('DEFEAT');
    else if (eKO) this.endMatch('K.O.!');
  }

  private endMatch(text: string): void {
    this.matchOver = true;
    const won = text === 'K.O.!';
    const isChefFight = this.enemy.enemyDef?.id === 'chef';

    // Show result
    // Post-fight personality quote
    const postPersonality = personalityFromSlider(this.playerSave?.personality ?? 0.5);
    const postQuote = getQuote(postPersonality, won ? 'victory' : 'defeat');
    this.add.text(this.player.movement.x, this.player.movement.y - 50, postQuote, {
      fontSize: '11px', color: '#ffffff', backgroundColor: '#333333',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(10);

    if (won && isChefFight) {
      this.resultText.setText('FREEDOM!');
      this.showLiberationScene();
    } else if (won && this.ladderState) {
      const coins = getCoinsForFight(this.ladderState.currentFight);
      this.resultText.setText(`${text}\n+${coins} coins`);
    } else {
      this.resultText.setText(text);
    }

    const delay = won && isChefFight ? 4000 : 2000;
    this.time.delayedCall(delay, () => {
      if (this.ladderState && this.playerSave) {
        // Update ladder and economy
        const updatedLadder = completeFight(this.ladderState, won);
        let updatedSave = this.playerSave;
        if (won) {
          const coins = getCoinsForFight(this.ladderState.currentFight);
          updatedSave = addCoins(updatedSave, coins);
          updatedSave = recordArenaPlayed(updatedSave, this.arena.id);
          if (this.enemy.enemyDef?.type === 'boss') {
            updatedSave = recordBossDefeated(updatedSave, this.enemy.enemyDef.id);
          }
        }
        this.scene.start('LadderScene', {
          ladderState: updatedLadder,
          playerSave: updatedSave,
          playerCharId: this.playerCharId,
        });
      } else {
        this.scene.start('MenuScene');
      }
    });
  }

  private showLiberationScene(): void {
    // Fish flying free — simple animated fish rising from the bottom
    const colors = [0x4488ff, 0xff8800, 0xff3333, 0x33cccc, 0xcc44ff];
    for (let i = 0; i < 12; i++) {
      const startX = 60 + Math.random() * (GAME_WIDTH - 120);
      const startY = GAME_HEIGHT + 20 + Math.random() * 100;
      const color = colors[i % colors.length];

      const fish = this.add.graphics();
      fish.fillStyle(color, 1);
      fish.fillEllipse(0, 0, 20, 10);
      fish.fillTriangle(-10, 0, -18, -6, -18, 6);
      fish.fillStyle(0xffffff, 1);
      fish.fillCircle(5, -2, 2);
      fish.setPosition(startX, startY);
      fish.setDepth(5);

      this.tweens.add({
        targets: fish,
        y: -40,
        x: startX + (Math.random() - 0.5) * 100,
        duration: 2000 + Math.random() * 1500,
        delay: i * 150,
        ease: 'Sine.easeOut',
      });
    }

    // "ALL FISH ARE FREE!" text after fish start flying
    this.time.delayedCall(1000, () => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'ALL FISH ARE FREE!', {
        fontSize: '18px', color: '#44ccff', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10);
    });
  }

  private updateRandomEvents(dt: number): void {
    // Periodically roll for events
    this.eventRollTimer -= dt;
    if (this.eventRollTimer <= 0) {
      this.eventState = rollForEvent(this.eventState);
      this.eventRollTimer = 8 + Math.random() * 7; // next roll in 8-15s
    }

    // Update event timers
    const prevEvent = this.eventState.activeEvent;
    this.eventState = updateEvent(this.eventState, dt);

    // Warning text
    if (this.eventState.warningTimer > 0 && this.eventState.pendingEvent) {
      const event = getActiveEvent({ ...this.eventState, activeEvent: this.eventState.pendingEvent });
      this.eventWarningText.setText(event?.warning || 'WARNING!');
      this.eventWarningText.setAlpha(0.5 + Math.sin(Date.now() / 100) * 0.5);
    } else {
      this.eventWarningText.setText('');
    }

    // Event just activated
    if (this.eventState.activeEvent && !prevEvent) {
      if (this.eventState.activeEvent === 'lightning') {
        this.lightningX = 100 + Math.random() * (GAME_WIDTH - 200);
      }
      if (this.eventState.activeEvent === 'seagull') {
        this.seagullTarget = Math.random() < 0.5 ? 'player' : 'enemy';
      }
    }

    // Apply active event effects
    const activeEvent = getActiveEvent(this.eventState);
    if (!activeEvent) return;

    switch (activeEvent.id) {
      case 'lightning': {
        // Damage fighters near the strike point
        const pDist = Math.abs(this.player.movement.x - this.lightningX);
        const eDist = Math.abs(this.enemy.movement.x - this.lightningX);
        if (pDist < 60) {
          this.player.combat = applyDamage(this.player.combat, activeEvent.damage! * dt * 2);
          this.player.movement.velocityY = -200;
          this.player.movement.isOnGround = false;
        }
        if (eDist < 60) {
          this.enemy.combat = applyDamage(this.enemy.combat, activeEvent.damage! * dt * 2);
          this.enemy.movement.velocityY = -200;
          this.enemy.movement.isOnGround = false;
        }
        break;
      }
      case 'poison_rain': {
        // Both fighters take damage over time
        this.player.combat = applyDamage(this.player.combat, activeEvent.damage! * dt);
        this.enemy.combat = applyDamage(this.enemy.combat, activeEvent.damage! * dt);
        break;
      }
      case 'seagull': {
        // Carry one fighter upward
        const target = this.seagullTarget === 'player' ? this.player : this.enemy;
        if (this.eventState.eventTimer > 1) {
          target.movement.velocityY = -150;
          target.movement.isOnGround = false;
        }
        break;
      }
      // super_weapon: visual only in this implementation (weapon spawn point rendered)
    }
  }

  private updateCompanion(dt: number): void {
    if (!this.companionActive) return;

    // Follow player loosely
    const targetX = this.player.movement.x + (this.player.movement.facingRight ? -40 : 40);
    const targetY = this.player.movement.y - 20;
    this.companionX += (targetX - this.companionX) * 2 * dt;
    this.companionY += (targetY - this.companionY) * 2 * dt;

    // Attack enemy periodically
    this.companionCooldown -= dt;
    if (this.companionCooldown <= 0) {
      const dist = Math.abs(this.companionX - this.enemy.movement.x);
      if (dist < 120) {
        this.enemy.combat = applyDamage(this.enemy.combat, 3);
        this.enemy.sprite.setTint(0x33cccc);
        this.time.delayedCall(100, () => {
          if (!this.enemy.combat.isBlocking && !this.enemy.combat.isAttacking) {
            this.enemy.sprite.clearTint();
          }
        });
      }
      this.companionCooldown = 2.5;
    }
  }

  private updatePet(dt: number): void {
    if (!this.petState.active) return;

    // Speed boost — applied when moving
    const pet = getPet(this.petState.petId!);
    if (pet?.effect.type === 'speed_boost') {
      const boosted = applySpeedBoost(this.petState, 200);
      if (this.player.movement.velocityX !== 0) {
        const dir = this.player.movement.velocityX > 0 ? 1 : -1;
        this.player.movement.velocityX = dir * boosted;
      }
    }

    // Flight — suppress gravity when jump held and flight available
    if (pet?.effect.type === 'flight') {
      const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown;
      const canFly = applyFlight(this.petState);
      if (jumpHeld && canFly && !this.player.movement.isOnGround) {
        this.player.movement.velocityY = Math.min(this.player.movement.velocityY, -100);
      }
      this.petState = updateFlightTimer(this.petState, dt, jumpHeld && canFly && !this.player.movement.isOnGround);
    }

    // Auto-shoot
    if (pet?.effect.type === 'auto_shoot') {
      const result = updateAutoShoot(this.petState, dt);
      this.petState = result.state;
      if (result.shouldFire) {
        this.enemy.combat = applyDamage(this.enemy.combat, result.damage);
        this.enemy.sprite.setTint(0xff8800);
        this.time.delayedCall(100, () => {
          if (!this.enemy.combat.isBlocking && !this.enemy.combat.isAttacking) {
            this.enemy.sprite.clearTint();
          }
        });
      }
    }
  }

  private renderEffects(): void {
    this.graphics.clear();

    // Attack arcs
    for (const fighter of [this.player, this.enemy]) {
      if (fighter.combat.isAttacking) {
        const dir = fighter.movement.facingRight ? 1 : -1;
        const reach = fighter.combat.currentAttack === AttackType.Special ? 60 : 35;
        this.graphics.lineStyle(2, 0xffff00, 0.8);
        this.graphics.strokeCircle(
          fighter.movement.x + dir * reach,
          fighter.movement.y - 16,
          12
        );
      }

      // Block shield
      if (fighter.combat.isBlocking) {
        this.graphics.lineStyle(3, 0x44aaff, 0.7);
        this.graphics.strokeCircle(fighter.movement.x, fighter.movement.y - 16, 30);
      }
    }

    // Projectiles
    for (const fighter of [this.player, this.enemy]) {
      for (const proj of fighter.weapon.projectiles) {
        // Draw carrot projectile
        this.graphics.fillStyle(0xff8800, 1);
        this.graphics.fillTriangle(
          proj.x + (proj.velocityX > 0 ? 8 : -8), proj.y,
          proj.x + (proj.velocityX > 0 ? -4 : 4), proj.y - 3,
          proj.x + (proj.velocityX > 0 ? -4 : 4), proj.y + 3,
        );
        // Carrot top (green)
        this.graphics.fillStyle(0x44cc44, 1);
        const tailX = proj.velocityX > 0 ? -4 : 4;
        this.graphics.fillTriangle(
          proj.x + tailX, proj.y - 4,
          proj.x + tailX, proj.y + 4,
          proj.x + tailX * 2, proj.y,
        );
      }
    }

    // Random event visuals
    const activeEvent = getActiveEvent(this.eventState);
    if (activeEvent) {
      switch (activeEvent.id) {
        case 'lightning': {
          // Lightning bolt
          this.graphics.lineStyle(4, 0xffff00, 0.9);
          const lx = this.lightningX;
          this.graphics.lineBetween(lx, 0, lx + 10, 80);
          this.graphics.lineBetween(lx + 10, 80, lx - 5, 160);
          this.graphics.lineBetween(lx - 5, 160, lx + 8, 300);
          this.graphics.lineBetween(lx + 8, 300, lx, PHYSICS.floorY);
          // Flash
          this.graphics.fillStyle(0xffff00, 0.1 + Math.random() * 0.1);
          this.graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
          break;
        }
        case 'poison_rain': {
          // Green rain drops
          for (let i = 0; i < 20; i++) {
            const rx = (Date.now() / 3 + i * 47) % GAME_WIDTH;
            const ry = (Date.now() / 2 + i * 83) % GAME_HEIGHT;
            this.graphics.fillStyle(0x44ff44, 0.5);
            this.graphics.fillRect(rx, ry, 2, 8);
          }
          // Green tint overlay
          this.graphics.fillStyle(0x00ff00, 0.05);
          this.graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
          break;
        }
        case 'seagull': {
          // Draw seagull
          const target = this.seagullTarget === 'player' ? this.player : this.enemy;
          const sx = target.movement.x;
          const sy = Math.min(target.movement.y - 40, 80);
          this.graphics.fillStyle(0xffffff, 1);
          this.graphics.fillEllipse(sx, sy, 30, 12);
          // Wings flapping
          const wingY = Math.sin(Date.now() / 100) * 8;
          this.graphics.fillTriangle(sx - 15, sy, sx - 30, sy + wingY - 5, sx - 5, sy);
          this.graphics.fillTriangle(sx + 15, sy, sx + 30, sy + wingY - 5, sx + 5, sy);
          // Beak
          this.graphics.fillStyle(0xff8800, 1);
          this.graphics.fillTriangle(sx + 15, sy, sx + 22, sy + 2, sx + 15, sy + 4);
          break;
        }
        case 'super_weapon': {
          // Glowing weapon spawn point
          const spawnX = GAME_WIDTH / 2;
          const spawnY = PHYSICS.floorY - 30;
          const glow = 0.5 + Math.sin(Date.now() / 200) * 0.3;
          this.graphics.fillStyle(0xffcc00, glow);
          this.graphics.fillStar(spawnX, spawnY, 5, 10, 20);
          break;
        }
      }
    }

    // Warning flash
    if (this.eventState.warningTimer > 0) {
      this.graphics.lineStyle(3, 0xff4444, 0.3 + Math.sin(Date.now() / 80) * 0.3);
      this.graphics.strokeRect(5, 5, GAME_WIDTH - 10, GAME_HEIGHT - 10);
    }

    // Pufferfish companion (story arc)
    if (this.companionActive) {
      const cx = this.companionX;
      const cy = this.companionY + Math.sin(Date.now() / 250) * 3;
      const dir = this.player.movement.facingRight ? 1 : -1;
      // Body
      this.graphics.fillStyle(0x33cccc, 1);
      this.graphics.fillCircle(cx, cy, 10);
      // Spikes
      this.graphics.fillStyle(0x44dddd, 1);
      for (let a = 0; a < 6; a++) {
        const angle = (a / 6) * Math.PI * 2 + Date.now() / 500;
        const sx = cx + Math.cos(angle) * 12;
        const sy = cy + Math.sin(angle) * 12;
        this.graphics.fillCircle(sx, sy, 2);
      }
      // Eye
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillCircle(cx + dir * 4, cy - 3, 3);
      this.graphics.fillStyle(0x000000, 1);
      this.graphics.fillCircle(cx + dir * 5, cy - 3, 1.5);
    }

    // Pet companion
    if (this.petState.active && this.petState.petId) {
      const pet = getPet(this.petState.petId);
      if (pet) {
        const px = this.player.movement.x + (this.player.movement.facingRight ? -25 : 25);
        const py = this.player.movement.y - 30 + Math.sin(Date.now() / 300) * 4;
        this.graphics.fillStyle(pet.color, 1);
        this.graphics.fillEllipse(px, py, 14, 8);
        const tailDir = this.player.movement.facingRight ? -1 : 1;
        this.graphics.fillTriangle(px + tailDir * 7, py, px + tailDir * 12, py - 4, px + tailDir * 12, py + 4);
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(px + (this.player.movement.facingRight ? 3 : -3), py - 1, 2);
      }
    }

    // HP bars
    this.drawHPBar(20, 30, 200, 16, this.player.combat, this.player.charDef.color);
    this.drawHPBar(GAME_WIDTH - 220, 30, 200, 16, this.enemy.combat, this.enemy.charDef.color);
  }

  private drawHPBar(
    x: number, y: number,
    width: number, height: number,
    combat: CombatState,
    color: number,
  ): void {
    const g = this.graphics;
    g.fillStyle(0x333333, 1);
    g.fillRect(x, y, width, height);

    const hpRatio = combat.hp / combat.maxHp;
    const hpColor = hpRatio > 0.5 ? color : hpRatio > 0.25 ? 0xffaa00 : 0xff2222;
    g.fillStyle(hpColor, 1);
    g.fillRect(x, y, width * hpRatio, height);

    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeRect(x, y, width, height);
  }
}
