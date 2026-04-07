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

export class FightScene extends Phaser.Scene {
  private fighterState!: FighterState;
  private fighterSprite!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private floor!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'FightScene' });
  }

  preload(): void {
    // Load the tuna fish GIF as spritesheet — for now use a placeholder rectangle
    // We'll swap in the real sprite once we set up the sprite pipeline
  }

  create(): void {
    // Background — ocean blue
    this.cameras.main.setBackgroundColor('#1a3a5c');

    // Floor
    this.floor = this.add.rectangle(
      GAME_WIDTH / 2, PHYSICS.floorY + 25,
      GAME_WIDTH, 50,
      0x8B7355
    );

    // Water line decoration
    this.add.rectangle(GAME_WIDTH / 2, PHYSICS.floorY, GAME_WIDTH, 2, 0x44aaff);

    // Fighter state (start on ground)
    this.fighterState = createFighterState(GAME_WIDTH / 2, PHYSICS.floorY);
    this.fighterState.isOnGround = true;

    // Fighter sprite — placeholder colored rectangle for now
    this.fighterSprite = this.add.sprite(
      this.fighterState.x,
      this.fighterState.y,
      '__DEFAULT'
    );
    // Since we don't have a texture yet, draw a colored rectangle as the fish
    this.fighterSprite.destroy();
    this.createFighterGraphic();

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    // HUD
    this.add.text(10, 10, 'Arrow keys / WASD to move, Up/W to jump', {
      fontSize: '12px',
      color: '#88bbdd',
    });

    this.add.text(10, 26, '', { fontSize: '12px', color: '#00ff00' }).setName('fpsText');
  }

  private fishGraphic!: Phaser.GameObjects.Graphics;

  private createFighterGraphic(): void {
    this.fishGraphic = this.add.graphics();
    this.drawFish();
  }

  private drawFish(): void {
    this.fishGraphic.clear();
    const x = this.fighterState.x;
    const y = this.fighterState.y;
    const dir = this.fighterState.facingRight ? 1 : -1;

    // Body (ellipse)
    this.fishGraphic.fillStyle(0x4488ff, 1);
    this.fishGraphic.fillEllipse(x, y - 10, 40, 20);

    // Tail
    this.fishGraphic.fillTriangle(
      x - dir * 20, y - 10,
      x - dir * 32, y - 20,
      x - dir * 32, y,
    );

    // Eye
    this.fishGraphic.fillStyle(0xffffff, 1);
    this.fishGraphic.fillCircle(x + dir * 10, y - 13, 4);
    this.fishGraphic.fillStyle(0x000000, 1);
    this.fishGraphic.fillCircle(x + dir * 11, y - 13, 2);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Input
    const leftDown = this.cursors.left.isDown || this.input.keyboard!.addKey('A').isDown;
    const rightDown = this.cursors.right.isDown || this.input.keyboard!.addKey('D').isDown;
    const jumpDown = this.cursors.up.isDown || this.jumpKey.isDown;

    // Movement
    if (leftDown) {
      this.fighterState = moveLeft(this.fighterState);
    } else if (rightDown) {
      this.fighterState = moveRight(this.fighterState);
    } else {
      this.fighterState = stopHorizontal(this.fighterState);
    }

    // Jump
    if (jumpDown) {
      this.fighterState = jump(this.fighterState);
    }

    // Physics
    this.fighterState = applyGravity(this.fighterState, dt);
    this.fighterState.x += this.fighterState.velocityX * dt;
    this.fighterState.y += this.fighterState.velocityY * dt;
    this.fighterState = applyFloorCollision(this.fighterState, PHYSICS.floorY);

    // Arena bounds (keep fish on screen)
    if (this.fighterState.x < 20) this.fighterState.x = 20;
    if (this.fighterState.x > GAME_WIDTH - 20) this.fighterState.x = GAME_WIDTH - 20;

    // Render
    this.drawFish();

    // FPS
    const fpsText = this.children.getByName('fpsText') as Phaser.GameObjects.Text;
    if (fpsText) {
      fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }
  }
}
