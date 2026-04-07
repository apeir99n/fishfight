import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Display loading text
    const loadingText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Loading...',
      { fontSize: '20px', color: '#ffffff' }
    );
    loadingText.setOrigin(0.5);

    // TODO: Load sprites, audio, and other assets here
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
