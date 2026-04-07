import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../config/game.config';
import { getCharacter, type CharacterDef } from '../config/characters.config';
import { getArena, type ArenaDef } from '../config/arenas.config';
import {
  createFighterState,
  moveLeft,
  moveRight,
  stopHorizontal,
  jump,
  applyGravity,
  applyFloorCollision,
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
import { addCoins, type PlayerSave } from '../systems/EconomySystem';

interface Fighter {
  movement: FighterState;
  combat: CombatState;
  charDef: CharacterDef;
  sprite: Phaser.GameObjects.Sprite;
  weapon: WeaponState;
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

  constructor() {
    super({ key: 'FightScene' });
  }

  private arena!: ArenaDef;

  create(data: { playerCharId?: string; enemyCharId?: string; playerWeapon?: string; enemyWeapon?: string; aiLevel?: number; arenaId?: string; ladderState?: LadderState; playerSave?: PlayerSave }): void {
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

    this.arena = getArena(data.arenaId || 'sea')!;
    this.aiState = createAIState(aiLevel);

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
    fighter.sprite.setPosition(x, y - 16);
    fighter.sprite.setFlipX(!fighter.movement.facingRight);

    // Tint effects
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

    // Show coins earned
    if (won && this.ladderState) {
      const coins = getCoinsForFight(this.ladderState.currentFight);
      this.resultText.setText(`${text}\n+${coins} coins`);
    } else {
      this.resultText.setText(text);
    }

    this.time.delayedCall(2000, () => {
      if (this.ladderState && this.playerSave) {
        // Update ladder and economy
        const updatedLadder = completeFight(this.ladderState, won);
        let updatedSave = this.playerSave;
        if (won) {
          const coins = getCoinsForFight(this.ladderState.currentFight);
          updatedSave = addCoins(updatedSave, coins);
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
