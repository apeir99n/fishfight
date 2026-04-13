import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../config/game.config';

// Verbose combat logging. Flip to false to silence the channel once the
// simultaneous-hit behaviour is confirmed stable.
const DEBUG_COMBAT = true;
const dlog = (...args: unknown[]): void => {
  if (DEBUG_COMBAT) console.log('[combat]', ...args);
};
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
  registerHit,
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
import { addCoins, getCoinBonus, recordArenaPlayed, recordBossDefeated, type PlayerSave } from '../systems/EconomySystem';
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
import {
  createParasiteState,
  shouldTransform,
  updateParasite,
  type ParasiteState,
} from '../systems/ParasiteTransformSystem';
import {
  createPoisonState,
  triggerPoison,
  updatePoison,
  isPoisonActive,
  isPoisonOnCooldown,
  type PoisonState,
} from '../systems/PoisonSystem';
import {
  createInkState,
  triggerInk,
  updateInk,
  isInkActive,
  isInkOnCooldown,
  type InkState,
} from '../systems/InkSystem';
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
  private fishingHookX = 0;
  private fishingHookTarget: 'player' | 'enemy' = 'player';
  private parasiteState!: ParasiteState;
  private dragonFishX = 0;
  private dragonFishY = 0;
  private parasiteNameTimer = 0;
  private companionActive = false;
  private companionCooldown = 0;
  private companionX = 0;
  private companionY = 0;
  private swordSwingTimer = 0;
  private playerWasAttacking = false;
  private poisonState!: PoisonState;
  private poisonHitApplied = false;
  private inkState!: InkState;
  private inkHitApplied = false;
  private inkFrozenText!: Phaser.GameObjects.Text;
  private poisonedText!: Phaser.GameObjects.Text;

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

    // Parasite transform
    this.parasiteState = createParasiteState(this.playerSave?.equippedSkin === 'parasite');
    this.dragonFishX = 0;
    this.dragonFishY = 0;

    // Random events
    this.eventState = createEventState();
    this.eventRollTimer = 10; // first possible event after 10 seconds
    this.eventWarningText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '', {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Pufferfish poison ability
    this.poisonState = createPoisonState(playerCharId === 'pufferfish');
    this.poisonHitApplied = false;
    // Squid ink ability
    this.inkState = createInkState(playerCharId === 'squid');
    this.inkHitApplied = false;
    this.inkFrozenText = this.add.text(0, 0, 'INK FROZEN!', {
      fontSize: '12px', color: '#333333', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setVisible(false);

    this.poisonedText = this.add.text(0, 0, 'POISONED!', {
      fontSize: '12px', color: '#44ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setVisible(false);

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

    let playerDisplayName = playerDef.name;
    if (this.parasiteState.active) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789/.=-!@#$%';
      playerDisplayName = Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    this.playerNameText = this.add.text(20, 50, playerDisplayName, {
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
    this.updateParasite(dt);
    this.updatePoisonAbility(dt);
    this.updateInkAbility(dt);
    // Sword swing animation — trigger on attack start
    if (this.player.combat.isAttacking && !this.playerWasAttacking && this.playerSave?.equippedSkin === 'fish_sword') {
      this.swordSwingTimer = 0.125;
    }
    this.playerWasAttacking = this.player.combat.isAttacking;
    if (this.swordSwingTimer > 0) {
      this.swordSwingTimer = Math.max(0, this.swordSwingTimer - dt);
    }
    this.checkHits();
    if (this.parasiteState.active) {
      this.parasiteNameTimer += dt;
      if (this.parasiteNameTimer >= 1) {
        this.parasiteNameTimer = 0;
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789/.=-!@#$%';
        this.playerNameText.setText(Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
      }
    }
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
      dlog('player attack start', { type: 'light', hp: p.combat.hp });
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
      p.combat = startAttack(p.combat, AttackType.Heavy);
      dlog('player attack start', { type: 'heavy', hp: p.combat.hp });
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.L)) {
      if (this.poisonState.enabled && !isPoisonOnCooldown(this.poisonState) && !isPoisonActive(this.poisonState)) {
        // Pufferfish poison ability
        this.poisonState = triggerPoison(this.poisonState);
        this.poisonHitApplied = false;
        dlog('pufferfish poison triggered');
      } else if (this.inkState.enabled && !isInkOnCooldown(this.inkState) && !isInkActive(this.inkState)) {
        // Squid ink ability
        this.inkState = triggerInk(this.inkState);
        this.inkHitApplied = false;
        dlog('squid ink triggered');
      } else {
        // Fire equipped weapon
        const result = fireWeapon(p.weapon, p.movement.x, p.movement.y, p.movement.facingRight);
        p.weapon = result.state;
        if (result.meleeHit) {
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
        dlog('ai attack start', { type: 'light', dist: Math.round(dist), hp: e.combat.hp });
        break;
      case AIAction.HeavyAttack:
        e.combat = startAttack(e.combat, AttackType.Heavy);
        dlog('ai attack start', { type: 'heavy', dist: Math.round(dist), hp: e.combat.hp });
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

    const isParasitePlayer = fighter === this.player && this.parasiteState.active;
    if (isParasitePlayer) {
      fighter.sprite.setTint(0x000000);
    } else if (fighter.combat.isAttacking) {
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

    // One hit per swing. Without this guard, the ±30ms active window
    // below spans 3-4 frames at 60 FPS, so the same swing used to
    // register damage, knockback, and a tint delayedCall every frame —
    // which was the source of the "simultaneous hit = lag" bug.
    if (attacker.combat.hasHit) return;

    const attackDuration = attacker.combat.currentAttack === AttackType.Light ? 0.25
      : attacker.combat.currentAttack === AttackType.Heavy ? 0.65 : 0.4;
    const halfDuration = attackDuration / 2;
    const elapsed = attackDuration - attacker.combat.attackTimer;

    if (Math.abs(elapsed - halfDuration) > 0.03) return;

    const dist = Math.abs(attacker.movement.x - defender.movement.x);
    const attackRange = attacker.combat.currentAttack === AttackType.Special ? 150 : 80;
    if (dist > attackRange) {
      dlog('whiff (out of range)', {
        attack: attacker.combat.currentAttack, dist: Math.round(dist), range: attackRange,
      });
      // Mark swing as "resolved" even on whiff so we don't re-enter the
      // window on subsequent frames in case the defender walks back in.
      attacker.combat = registerHit(attacker.combat);
      return;
    }

    const damage = calculateDamage(attacker.combat.currentAttack, defender.combat.isBlocking);
    defender.combat = applyDamage(defender.combat, damage);

    let kb = calculateKnockback(attacker.combat.currentAttack, defender.combat.hp, defender.combat.maxHp);
    // Xenomorph knockback bonus
    if (attacker === this.player && this.parasiteState.transformed) {
      kb *= this.parasiteState.knockbackMultiplier;
    }
    const direction = attacker.movement.x < defender.movement.x ? 1 : -1;
    defender.movement.velocityX = kb * direction * 3;
    defender.movement.velocityY = -kb * 0.5;
    defender.movement.isOnGround = false;

    attacker.combat = registerHit(attacker.combat);

    dlog('hit landed', {
      attack: attacker.combat.currentAttack,
      blocked: defender.combat.isBlocking,
      damage,
      kb: Math.round(kb),
      defenderHp: defender.combat.hp,
      defenderMaxHp: defender.combat.maxHp,
      dist: Math.round(dist),
    });

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

    if (pKO) {
      dlog('KO: player', {
        x: Math.round(this.player.movement.x),
        y: Math.round(this.player.movement.y),
        hp: this.player.combat.hp,
      });
      this.endMatch('DEFEAT');
    } else if (eKO) {
      dlog('KO: enemy', {
        x: Math.round(this.enemy.movement.x),
        y: Math.round(this.enemy.movement.y),
        hp: this.enemy.combat.hp,
      });
      this.endMatch('K.O.!');
    }
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
    } else if (won && this.ladderState && this.playerSave) {
      const baseCoins = getCoinsForFight(this.ladderState.currentFight);
      const bonus = getCoinBonus(this.playerSave);
      const coins = Math.round(baseCoins * bonus);
      const bonusText = bonus > 1 ? ` (x${bonus.toFixed(1)})` : '';
      this.resultText.setText(`${text}\n+${coins} coins${bonusText}`);
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
          const baseCoins = getCoinsForFight(this.ladderState.currentFight);
          const bonus = getCoinBonus(updatedSave);
          const coins = Math.round(baseCoins * bonus);
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
      if (this.eventState.activeEvent === 'fishing_hook') {
        // Pick a random drop point, catch whichever fighter is closer,
        // and immediately remove half their current HP. One-shot effect —
        // the active duration only keeps the line on screen for the
        // snatch animation.
        this.fishingHookX = 120 + Math.random() * (GAME_WIDTH - 240);
        const pDist = Math.abs(this.player.movement.x - this.fishingHookX);
        const eDist = Math.abs(this.enemy.movement.x - this.fishingHookX);
        this.fishingHookTarget = pDist <= eDist ? 'player' : 'enemy';
        const target = this.fishingHookTarget === 'player' ? this.player : this.enemy;
        const damage = Math.floor(target.combat.hp / 2);
        target.combat = applyDamage(target.combat, damage);
        target.movement.velocityY = -260;
        target.movement.isOnGround = false;
        target.sprite.setTint(0xff0000);
        this.time.delayedCall(180, () => {
          if (!target.combat.isBlocking && !target.combat.isAttacking) {
            target.sprite.clearTint();
          }
        });
        dlog('fishing hook caught', {
          target: this.fishingHookTarget,
          hookX: Math.round(this.fishingHookX),
          damage,
          newHp: target.combat.hp,
        });
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
      case 'fishing_hook': {
        // Yank the caught fighter up toward the hook while the line is
        // still on screen — the damage was already applied once on
        // activation, this is just visual drag.
        const target = this.fishingHookTarget === 'player' ? this.player : this.enemy;
        target.movement.velocityY = -180;
        target.movement.isOnGround = false;
        target.movement.x += (this.fishingHookX - target.movement.x) * 6 * dt;
        break;
      }
    }
  }

  private updatePoisonAbility(dt: number): void {
    if (!this.poisonState.enabled) return;

    this.poisonState = updatePoison(this.poisonState, dt);

    // Apply stun if poison cloud is active and enemy is in range
    if (isPoisonActive(this.poisonState) && !this.poisonHitApplied) {
      const dist = Math.abs(this.player.movement.x - this.enemy.movement.x);
      if (dist <= this.poisonState.range) {
        this.enemy.movement = applyHitstun(this.enemy.movement, 0, 0, this.poisonState.stunDuration);
        this.enemy.sprite.setTint(0x44ff44);
        this.poisonHitApplied = true;
        dlog('pufferfish poison hit — enemy stunned for', this.poisonState.stunDuration, 's');
        this.time.delayedCall(this.poisonState.stunDuration * 1000, () => {
          if (!this.enemy.combat.isBlocking && !this.enemy.combat.isAttacking) {
            this.enemy.sprite.clearTint();
          }
        });
      }
    }
  }

  private updateInkAbility(dt: number): void {
    if (!this.inkState.enabled) return;

    this.inkState = updateInk(this.inkState, dt);

    // Apply freeze if ink is active and enemy is in range
    if (isInkActive(this.inkState) && !this.inkHitApplied) {
      const dist = Math.abs(this.player.movement.x - this.enemy.movement.x);
      if (dist <= this.inkState.range) {
        this.enemy.movement = applyHitstun(this.enemy.movement, 0, 0, this.inkState.stunDuration);
        this.enemy.sprite.setTint(0x111111);
        this.inkHitApplied = true;
        dlog('squid ink hit — enemy frozen for', this.inkState.stunDuration, 's');
        this.time.delayedCall(this.inkState.stunDuration * 1000, () => {
          if (!this.enemy.combat.isBlocking && !this.enemy.combat.isAttacking) {
            this.enemy.sprite.clearTint();
          }
        });
      }
    }
  }

  private updateParasite(dt: number): void {
    if (!this.parasiteState.active) return;

    const trigger = shouldTransform(this.parasiteState, this.player.combat.hp, this.player.combat.maxHp);
    this.parasiteState = updateParasite(this.parasiteState, dt, trigger);

    // Xenomorph visual is handled in renderEffects
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

    // Poison cloud
    if (isPoisonActive(this.poisonState)) {
      this.graphics.fillStyle(0x44ff44, 0.3);
      this.graphics.fillCircle(this.player.movement.x, this.player.movement.y - 16, this.poisonState.range);
      this.graphics.lineStyle(2, 0x22cc22, 0.5);
      this.graphics.strokeCircle(this.player.movement.x, this.player.movement.y - 16, this.poisonState.range);
    }

    // Poison effect on stunned enemy
    if (this.poisonHitApplied && isInHitstun(this.enemy.movement)) {
      const ex = this.enemy.movement.x;
      const ey = this.enemy.movement.y - 16;
      const t = Date.now() / 300;
      // Poison bubbles rising around enemy
      for (let i = 0; i < 5; i++) {
        const bx = ex + Math.sin(t + i * 1.3) * 20;
        const by = ey - 10 - ((t * 15 + i * 12) % 40);
        const r = 2 + Math.sin(t + i) * 1;
        this.graphics.fillStyle(0x44ff44, 0.6 - i * 0.08);
        this.graphics.fillCircle(bx, by, r);
      }
      // Green haze around enemy
      this.graphics.fillStyle(0x44ff44, 0.1);
      this.graphics.fillCircle(ex, ey, 35);
      // Floating label
      this.poisonedText.setPosition(ex, ey - 45).setVisible(true);
    } else {
      this.poisonedText.setVisible(false);
    }

    // Poison cooldown indicator
    if (this.poisonState.enabled && isPoisonOnCooldown(this.poisonState)) {
      const cdPct = this.poisonState.cooldownTimer / 8;
      this.graphics.fillStyle(0x44ff44, 0.4);
      this.graphics.fillRect(this.player.movement.x - 15, this.player.movement.y - 55, 30 * (1 - cdPct), 4);
      this.graphics.lineStyle(1, 0x44ff44, 0.6);
      this.graphics.strokeRect(this.player.movement.x - 15, this.player.movement.y - 55, 30, 4);
    }

    // Ink cloud
    if (isInkActive(this.inkState)) {
      this.graphics.fillStyle(0x000000, 0.5);
      this.graphics.fillCircle(this.player.movement.x, this.player.movement.y - 16, this.inkState.range);
      this.graphics.lineStyle(2, 0x222222, 0.6);
      this.graphics.strokeCircle(this.player.movement.x, this.player.movement.y - 16, this.inkState.range);
    }

    // Ink freeze cube on enemy
    if (this.inkHitApplied && isInHitstun(this.enemy.movement)) {
      const ex = this.enemy.movement.x;
      const ey = this.enemy.movement.y - 16;
      // Black ink cube around enemy
      this.graphics.fillStyle(0x000000, 0.4);
      this.graphics.fillRect(ex - 25, ey - 25, 50, 50);
      this.graphics.lineStyle(2, 0x222222, 0.8);
      this.graphics.strokeRect(ex - 25, ey - 25, 50, 50);
      // Ink drip particles
      const t = Date.now() / 250;
      for (let i = 0; i < 4; i++) {
        const dx = ex - 20 + i * 13;
        const dy = ey + 25 + ((t * 10 + i * 8) % 20);
        this.graphics.fillStyle(0x111111, 0.7 - i * 0.1);
        this.graphics.fillCircle(dx, dy, 2);
      }
      this.inkFrozenText.setPosition(ex, ey - 35).setVisible(true);
    } else {
      this.inkFrozenText.setVisible(false);
    }

    // Ink cooldown indicator
    if (this.inkState.enabled && isInkOnCooldown(this.inkState)) {
      const cdPct = this.inkState.cooldownTimer / 12;
      this.graphics.fillStyle(0x222222, 0.6);
      this.graphics.fillRect(this.player.movement.x - 15, this.player.movement.y - 55, 30 * (1 - cdPct), 4);
      this.graphics.lineStyle(1, 0x444444, 0.8);
      this.graphics.strokeRect(this.player.movement.x - 15, this.player.movement.y - 55, 30, 4);
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

    // Carp T-shirt skin — white shirt on back half of fish with mini carp drawing
    // Applies to carp/tuna/sakabambaspis (fish-shaped characters)
    if (
      this.playerSave?.equippedSkin === 'carp_tshirt' &&
      ['carp', 'tuna', 'sakabambaspis'].includes(this.playerCharId)
    ) {
      const px = this.player.movement.x;
      const py = this.player.movement.y - 16;
      const dir = this.player.movement.facingRight ? 1 : -1;
      // White shirt patch on front half (body, toward facing direction)
      const shirtCenterX = px + dir * 6;
      const shirtCenterY = py;
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillRoundedRect(shirtCenterX - 10, shirtCenterY - 7, 20, 14, 2);
      // Small carp drawing in center of shirt
      // Body
      this.graphics.fillStyle(0xff8800, 1);
      this.graphics.fillEllipse(shirtCenterX, shirtCenterY, 10, 5);
      // Tail
      this.graphics.fillTriangle(
        shirtCenterX - dir * 5, shirtCenterY,
        shirtCenterX - dir * 9, shirtCenterY - 3,
        shirtCenterX - dir * 9, shirtCenterY + 3,
      );
      // Eye
      this.graphics.fillStyle(0x000000, 1);
      this.graphics.fillCircle(shirtCenterX + dir * 3, shirtCenterY - 1, 0.8);
    }

    // Fish Sword skin — tiny sword on top of the fish
    if (this.playerSave?.equippedSkin === 'fish_sword') {
      const px = this.player.movement.x;
      const py = this.player.movement.y - 40; // on top of fish, pivot point
      // Rotate toward opponent's actual side (not fish facing direction)
      const toOpponent = this.enemy.movement.x >= this.player.movement.x ? 1 : -1;
      const bladeLen = 32;
      // Swing animation: 0 → 90° toward opponent → 0 over 0.125s
      const progress = this.swordSwingTimer > 0 ? 1 - this.swordSwingTimer / 0.125 : 0;
      const swingAngle = Math.sin(Math.PI * progress) * (Math.PI / 2) * toOpponent;

      const rotXY = (lx: number, ly: number): { x: number; y: number } => {
        const cos = Math.cos(swingAngle);
        const sin = Math.sin(swingAngle);
        return {
          x: px + lx * cos - ly * sin,
          y: py + lx * sin + ly * cos,
        };
      };

      // Blade (straight upright by default, tapered tip at (0, -bladeLen))
      const bladeBaseL = rotXY(-2, 0);
      const bladeBaseR = rotXY(2, 0);
      const bladeTip = rotXY(0, -bladeLen);
      this.graphics.fillStyle(0xccccff, 1);
      this.graphics.fillTriangle(
        bladeBaseL.x, bladeBaseL.y,
        bladeBaseR.x, bladeBaseR.y,
        bladeTip.x, bladeTip.y,
      );
      // Blade highlight
      const hlStart = rotXY(0, 0);
      const hlEnd = rotXY(0, -bladeLen + 2);
      this.graphics.lineStyle(1, 0xffffff, 0.9);
      this.graphics.lineBetween(hlStart.x, hlStart.y, hlEnd.x, hlEnd.y);
      // Crossguard (rect, rotated)
      const cgA = rotXY(-6, 0);
      const cgB = rotXY(6, 0);
      const cgC = rotXY(6, 3);
      const cgD = rotXY(-6, 3);
      this.graphics.fillStyle(0x888888, 1);
      this.graphics.fillTriangle(cgA.x, cgA.y, cgB.x, cgB.y, cgC.x, cgC.y);
      this.graphics.fillTriangle(cgA.x, cgA.y, cgC.x, cgC.y, cgD.x, cgD.y);
      // Hilt
      const hA = rotXY(-2, 3);
      const hB = rotXY(2, 3);
      const hC = rotXY(2, 9);
      const hD = rotXY(-2, 9);
      this.graphics.fillStyle(0x663300, 1);
      this.graphics.fillTriangle(hA.x, hA.y, hB.x, hB.y, hC.x, hC.y);
      this.graphics.fillTriangle(hA.x, hA.y, hC.x, hC.y, hD.x, hD.y);
      // Pommel
      const pom = rotXY(0, 10);
      this.graphics.fillStyle(0xffcc00, 1);
      this.graphics.fillCircle(pom.x, pom.y, 2);
    }

    // Parasite skin visuals — fish turns fully black (same shape, black eyes)
    if (this.parasiteState.active) {
      this.player.sprite.setTint(0x000000);
    }
    if (this.parasiteState.active && !this.parasiteState.transformed && !this.parasiteState.transforming) {
      // Facehugger on player's face
      const fx = this.player.movement.x + (this.player.movement.facingRight ? 8 : -8);
      const fy = this.player.movement.y - 20;
      this.graphics.fillStyle(0x220022, 1);
      this.graphics.fillEllipse(fx, fy, 14, 10);
      // Legs
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        this.graphics.lineStyle(1, 0x330033, 1);
        this.graphics.lineBetween(fx, fy, fx + Math.cos(angle) * 10, fy + Math.sin(angle) * 8);
      }
    }
    if (this.parasiteState.transforming) {
      // Detaching animation — parasite shaking and falling off
      const shake = Math.sin(Date.now() / 30) * 5;
      const fallProgress = 1 - (this.parasiteState.transformTimer / 1.0);
      const fx = this.player.movement.x + shake;
      const fy = this.player.movement.y - 20 + fallProgress * 40;
      this.graphics.fillStyle(0x220022, 0.8 - fallProgress * 0.5);
      this.graphics.fillEllipse(fx, fy, 14 - fallProgress * 6, 10 - fallProgress * 4);
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
        case 'fishing_hook': {
          // Vertical line from top of screen down to the caught fighter,
          // ending in a small J-shaped hook anchored at that fighter's
          // mouth-ish height.
          const caught = this.fishingHookTarget === 'player' ? this.player : this.enemy;
          const hookX = caught.movement.x;
          const hookY = caught.movement.y - 18;
          // Taut fishing line
          this.graphics.lineStyle(1, 0xeeeeee, 0.9);
          this.graphics.lineBetween(hookX, 0, hookX, hookY);
          // Hook curve — short vertical + small arc (approximated with 2 line segments)
          this.graphics.lineStyle(2, 0xcccccc, 1);
          this.graphics.lineBetween(hookX, hookY, hookX, hookY + 6);
          this.graphics.lineBetween(hookX, hookY + 6, hookX + 5, hookY + 8);
          this.graphics.lineBetween(hookX + 5, hookY + 8, hookX + 5, hookY + 4);
          // Glint
          this.graphics.fillStyle(0xffffff, 0.8);
          this.graphics.fillCircle(hookX + 1, hookY + 2, 1);
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
