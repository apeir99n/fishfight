import Phaser from 'phaser';
import { getAllCharacters } from '../config/characters.config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading...',
      { fontSize: '20px', color: '#ffffff' }
    );
    loadingText.setOrigin(0.5);

    // Load all character spritesheets
    for (const char of getAllCharacters()) {
      this.load.spritesheet(char.spriteSheet, `assets/sprites/${char.spriteSheet}.png`, {
        frameWidth: char.frameWidth,
        frameHeight: char.frameHeight,
      });
    }
  }

  create(): void {
    // Create idle animations for each character
    for (const char of getAllCharacters()) {
      this.anims.create({
        key: `${char.id}_idle`,
        frames: this.anims.generateFrameNumbers(char.spriteSheet, {
          start: 0,
          end: char.frameCount - 1,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    this.scene.start('MenuScene');
  }
}
