import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../config/game.config';
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

interface Fighter {
  movement: FighterState;
  combat: CombatState;
  color: number;
}

export class FightScene extends Phaser.Scene {
  private player!: Fighter;
  private enemy!: Fighter;
  private graphics!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private matchOver = false;
  private resultText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'FightScene' });
  }

  create(): void {
    this.matchOver = false;
    this.cameras.main.setBackgroundColor('#1a3a5c');

    // Floor
    this.add.rectangle(GAME_WIDTH / 2, PHYSICS.floorY + 25, GAME_WIDTH, 50, 0x8B7355);
    this.add.rectangle(GAME_WIDTH / 2, PHYSICS.floorY, GAME_WIDTH, 2, 0x44aaff);

    // Player (left side, blue)
    this.player = {
      movement: { ...createFighterState(200, PHYSICS.floorY), isOnGround: true },
      combat: createCombatState(),
      color: 0x4488ff,
    };

    // Enemy (right side, red — dummy for now)
    this.enemy = {
      movement: { ...createFighterState(600, PHYSICS.floorY), isOnGround: true, facingRight: false },
      combat: createCombatState(),
      color: 0xff4444,
    };

    this.graphics = this.add.graphics();

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      D: this.input.keyboard!.addKey('D'),
      J: this.input.keyboard!.addKey('J'), // Light attack
      K: this.input.keyboard!.addKey('K'), // Heavy attack
      L: this.input.keyboard!.addKey('L'), // Special attack
      F: this.input.keyboard!.addKey('F'), // Block
    };

    // HUD text
    this.add.text(GAME_WIDTH / 2, 10, 'Move: Arrows/WASD | J: Light | K: Heavy | L: Special | F: Block', {
      fontSize: '11px', color: '#88bbdd',
    }).setOrigin(0.5, 0);

    this.add.text(10, GAME_HEIGHT - 16, '', { fontSize: '11px', color: '#00ff00' }).setName('fpsText');

    this.resultText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '32px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  update(_time: number, delta: number): void {
    if (this.matchOver) return;
    const dt = delta / 1000;

    this.handleInput();
    this.updateFighter(this.player, dt);
    this.updateFighter(this.enemy, dt);
    this.checkHits();
    this.checkMatchEnd();
    this.render();

    const fpsText = this.children.getByName('fpsText') as Phaser.GameObjects.Text;
    if (fpsText) fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
  }

  private handleInput(): void {
    const p = this.player;

    // Movement
    const leftDown = this.cursors.left.isDown || this.keys.A.isDown;
    const rightDown = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpDown = this.cursors.up.isDown || this.keys.W.isDown;

    if (leftDown) p.movement = moveLeft(p.movement);
    else if (rightDown) p.movement = moveRight(p.movement);
    else p.movement = stopHorizontal(p.movement);

    if (jumpDown) p.movement = jump(p.movement);

    // Block
    p.combat = applyBlock(p.combat, this.keys.F.isDown);

    // Attacks (only on key down, not held)
    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
      p.combat = startAttack(p.combat, AttackType.Light);
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.K)) {
      p.combat = startAttack(p.combat, AttackType.Heavy);
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.L)) {
      p.combat = startAttack(p.combat, AttackType.Special);
    }
  }

  private updateFighter(fighter: Fighter, dt: number): void {
    // Physics
    fighter.movement = applyGravity(fighter.movement, dt);
    fighter.movement.x += fighter.movement.velocityX * dt;
    fighter.movement.y += fighter.movement.velocityY * dt;
    fighter.movement = applyFloorCollision(fighter.movement, PHYSICS.floorY);

    // Attack timer
    fighter.combat = updateAttack(fighter.combat, dt);
  }

  private checkHits(): void {
    // Check if player's attack hits enemy
    this.resolveAttack(this.player, this.enemy);
  }

  private resolveAttack(attacker: Fighter, defender: Fighter): void {
    if (!attacker.combat.isAttacking || !attacker.combat.currentAttack) return;

    // Simple hit check: attack lands at the peak of the animation (halfway through)
    const attackDuration = attacker.combat.currentAttack === AttackType.Light ? 0.25
      : attacker.combat.currentAttack === AttackType.Heavy ? 0.65 : 0.4;
    const halfDuration = attackDuration / 2;
    const elapsed = attackDuration - attacker.combat.attackTimer;

    // Only hit once at the midpoint (within a small window)
    if (Math.abs(elapsed - halfDuration) > 0.03) return;

    // Range check
    const dist = Math.abs(attacker.movement.x - defender.movement.x);
    const attackRange = attacker.combat.currentAttack === AttackType.Special ? 150 : 80;
    if (dist > attackRange) return;

    // Apply damage
    const damage = calculateDamage(attacker.combat.currentAttack, defender.combat.isBlocking);
    defender.combat = applyDamage(defender.combat, damage);

    // Apply knockback
    const kb = calculateKnockback(attacker.combat.currentAttack, defender.combat.hp, defender.combat.maxHp);
    const direction = attacker.movement.x < defender.movement.x ? 1 : -1;
    defender.movement.velocityX = kb * direction * 3;
    defender.movement.velocityY = -kb * 0.5;
    defender.movement.isOnGround = false;
  }

  private checkMatchEnd(): void {
    // Check KO by arena exit
    const pKO = checkKO(
      this.player.movement.y, this.player.movement.x,
      PHYSICS.arenaLeft - 50, PHYSICS.arenaRight + 50, PHYSICS.arenaTop
    );
    const eKO = checkKO(
      this.enemy.movement.y, this.enemy.movement.x,
      PHYSICS.arenaLeft - 50, PHYSICS.arenaRight + 50, PHYSICS.arenaTop
    );

    if (pKO) {
      this.endMatch('DEFEAT');
    } else if (eKO) {
      this.endMatch('K.O.!');
    }
  }

  private endMatch(text: string): void {
    this.matchOver = true;
    this.resultText.setText(text);

    this.time.delayedCall(2000, () => {
      this.scene.start('MenuScene');
    });
  }

  private render(): void {
    this.graphics.clear();
    this.drawFighter(this.player);
    this.drawFighter(this.enemy);
    this.drawHUD();
  }

  private drawFighter(fighter: Fighter): void {
    const { x, y } = fighter.movement;
    const dir = fighter.movement.facingRight ? 1 : -1;
    const g = this.graphics;

    // Flash white when blocking
    const color = fighter.combat.isBlocking ? 0xaaaaff : fighter.color;

    // Flash red when attacking
    const bodyColor = fighter.combat.isAttacking ? 0xffff00 : color;

    // Body
    g.fillStyle(bodyColor, 1);
    g.fillEllipse(x, y - 10, 40, 20);

    // Tail
    g.fillTriangle(
      x - dir * 20, y - 10,
      x - dir * 32, y - 20,
      x - dir * 32, y,
    );

    // Eye
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x + dir * 10, y - 13, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(x + dir * 11, y - 13, 2);

    // Attack visual (swing arc)
    if (fighter.combat.isAttacking) {
      g.lineStyle(2, 0xffff00, 0.8);
      const reach = fighter.combat.currentAttack === AttackType.Special ? 60 : 35;
      g.strokeCircle(x + dir * reach, y - 10, 12);
    }

    // Block visual (shield)
    if (fighter.combat.isBlocking) {
      g.lineStyle(3, 0x44aaff, 0.7);
      g.strokeCircle(x, y - 10, 25);
    }
  }

  private drawHUD(): void {
    const g = this.graphics;
    const barWidth = 200;
    const barHeight = 16;

    // Player HP (left side)
    this.drawHPBar(g, 20, 30, barWidth, barHeight, this.player.combat, 0x4488ff);

    // Enemy HP (right side)
    this.drawHPBar(g, GAME_WIDTH - 20 - barWidth, 30, barWidth, barHeight, this.enemy.combat, 0xff4444);
  }

  private drawHPBar(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number,
    width: number, height: number,
    combat: CombatState,
    color: number,
  ): void {
    // Background
    g.fillStyle(0x333333, 1);
    g.fillRect(x, y, width, height);

    // HP fill
    const hpRatio = combat.hp / combat.maxHp;
    const hpColor = hpRatio > 0.5 ? color : hpRatio > 0.25 ? 0xffaa00 : 0xff2222;
    g.fillStyle(hpColor, 1);
    g.fillRect(x, y, width * hpRatio, height);

    // Border
    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeRect(x, y, width, height);
  }
}
