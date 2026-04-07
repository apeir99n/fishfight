import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import { createPlayerSave } from '../systems/EconomySystem';

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

    // Debug: skip to boss
    const debugBtn = this.add.text(GAME_WIDTH / 2, 330, '[ DEBUG: FIGHT CHEF ]', {
      fontSize: '12px', color: '#664444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    debugBtn.on('pointerover', () => debugBtn.setColor('#ff4444'));
    debugBtn.on('pointerout', () => debugBtn.setColor('#664444'));
    debugBtn.on('pointerdown', () => {
      this.scene.start('FightScene', {
        playerCharId: 'tuna',
        enemyCharId: 'carp',
        playerWeapon: 'toy_fish',
        aiLevel: 10,
        arenaId: 'restaurant',
        enemyType: 'boss',
        enemyId: 'chef',
        playerSave: createPlayerSave(),
      });
    });

    const debugMega = this.add.text(GAME_WIDTH / 2, 355, '[ DEBUG: FIGHT MEGA-FISH ]', {
      fontSize: '12px', color: '#664444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    debugMega.on('pointerover', () => debugMega.setColor('#ff4444'));
    debugMega.on('pointerout', () => debugMega.setColor('#664444'));
    debugMega.on('pointerdown', () => {
      this.scene.start('FightScene', {
        playerCharId: 'tuna',
        enemyCharId: 'carp',
        playerWeapon: 'toy_fish',
        aiLevel: 6,
        arenaId: 'ship',
        enemyType: 'boss',
        enemyId: 'mega_fish',
        playerSave: createPlayerSave(),
      });
    });

    // Version
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.2.0-dev', {
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
