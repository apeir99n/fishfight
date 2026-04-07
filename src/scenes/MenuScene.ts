import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor('#1a3a5c');

    // Title
    this.add.text(GAME_WIDTH / 2, 120, 'FISH FIGHT', {
      fontSize: '48px',
      color: '#ffcc00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 175, 'Where Fish Fight Back', {
      fontSize: '16px',
      color: '#88bbdd',
    }).setOrigin(0.5);

    // Start button
    const startButton = this.add.text(GAME_WIDTH / 2, 280, '[ START ]', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => startButton.setColor('#ffcc00'));
    startButton.on('pointerout', () => startButton.setColor('#ffffff'));
    startButton.on('pointerdown', () => {
      this.scene.start('CharSelectScene');
    });

    // FPS counter (dev mode)
    this.add.text(10, 10, '', { fontSize: '12px', color: '#00ff00' })
      .setName('fpsText');

    // Version
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0-dev', {
      fontSize: '10px',
      color: '#556677',
    }).setOrigin(1, 1);
  }

  update(): void {
    const fpsText = this.children.getByName('fpsText') as Phaser.GameObjects.Text;
    if (fpsText) {
      fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }
  }
}
