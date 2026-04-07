import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../config/game.config';
import { getCharacter, type CharacterDef } from '../config/characters.config';
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
  charDef: CharacterDef;
  sprite: Phaser.GameObjects.Sprite;
}

export class FightScene extends Phaser.Scene {
  private player!: Fighter;
  private enemy!: Fighter;
  private graphics!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private matchOver = false;
  private resultText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;
  private enemyNameText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'FightScene' });
  }

  create(data: { playerCharId?: string; enemyCharId?: string }): void {
    this.matchOver = false;
    this.cameras.main.setBackgroundColor('#1a3a5c');

    const playerCharId = data.playerCharId || 'tuna';
    const enemyCharId = data.enemyCharId || 'carp';
    const playerDef = getCharacter(playerCharId)!;
    const enemyDef = getCharacter(enemyCharId)!;

    // Floor
    this.add.rectangle(GAME_WIDTH / 2, PHYSICS.floorY + 25, GAME_WIDTH, 50, 0x8B7355);
    this.add.rectangle(GAME_WIDTH / 2, PHYSICS.floorY, GAME_WIDTH, 2, 0x44aaff);

    this.graphics = this.add.graphics();

    // Create fighters with sprites
    this.player = this.createFighter(playerDef, 200, true);
    this.enemy = this.createFighter(enemyDef, 600, false);

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

  private createFighter(charDef: CharacterDef, x: number, facingRight: boolean): Fighter {
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
    };
  }

  update(_time: number, delta: number): void {
    if (this.matchOver) return;
    const dt = delta / 1000;

    this.handleInput();
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
      p.combat = startAttack(p.combat, AttackType.Special);
    }
  }

  private updateFighter(fighter: Fighter, dt: number): void {
    fighter.movement = applyGravity(fighter.movement, dt);
    fighter.movement.x += fighter.movement.velocityX * dt;
    fighter.movement.y += fighter.movement.velocityY * dt;
    fighter.movement = applyFloorCollision(fighter.movement, PHYSICS.floorY);
    fighter.combat = updateAttack(fighter.combat, dt);
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
    const pKO = checkKO(
      this.player.movement.y, this.player.movement.x,
      PHYSICS.arenaLeft - 50, PHYSICS.arenaRight + 50, PHYSICS.arenaTop
    );
    const eKO = checkKO(
      this.enemy.movement.y, this.enemy.movement.x,
      PHYSICS.arenaLeft - 50, PHYSICS.arenaRight + 50, PHYSICS.arenaTop
    );

    if (pKO) this.endMatch('DEFEAT');
    else if (eKO) this.endMatch('K.O.!');
  }

  private endMatch(text: string): void {
    this.matchOver = true;
    this.resultText.setText(text);
    this.time.delayedCall(2000, () => {
      this.scene.start('MenuScene');
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
