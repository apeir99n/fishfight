import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import { getStarterCharacters, type CharacterDef } from '../config/characters.config';
import { createPlayerSave } from '../systems/EconomySystem';

export class CharSelectScene extends Phaser.Scene {
  private characters!: CharacterDef[];
  private selectedIndex = 0;
  private sprites: Phaser.GameObjects.Sprite[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private selectorGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'CharSelectScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d2137');
    this.characters = getStarterCharacters();
    this.selectedIndex = 0;
    this.sprites = [];

    // Title
    this.add.text(GAME_WIDTH / 2, 40, 'CHOOSE YOUR FISH', {
      fontSize: '28px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Character sprites
    const spacing = 140;
    const startX = GAME_WIDTH / 2 - (spacing * (this.characters.length - 1)) / 2;

    for (let i = 0; i < this.characters.length; i++) {
      const char = this.characters[i];
      const x = startX + i * spacing;
      const y = GAME_HEIGHT / 2 - 20;

      const sprite = this.add.sprite(x, y, char.spriteSheet);
      sprite.play(`${char.id}_idle`);
      sprite.setScale(3); // Scale up the 32x32 sprites
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        this.selectedIndex = i;
        this.updateSelection();
      });

      this.sprites.push(sprite);

      // Character name below
      this.add.text(x, y + 60, char.name, {
        fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5);
    }

    // Selection indicator
    this.selectorGraphics = this.add.graphics();
    this.updateSelection();

    // Selected name (larger)
    this.nameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
      fontSize: '20px', color: '#ffcc00',
    }).setOrigin(0.5);

    // Fight button
    const fightBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '[ FIGHT! ]', {
      fontSize: '24px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    fightBtn.on('pointerover', () => fightBtn.setColor('#ffcc00'));
    fightBtn.on('pointerout', () => fightBtn.setColor('#ff4444'));
    fightBtn.on('pointerdown', () => {
      this.scene.start('LadderScene', {
        playerCharId: this.characters[this.selectedIndex].id,
        playerSave: createPlayerSave(),
      });
    });

    // Keyboard nav
    this.input.keyboard!.on('keydown-LEFT', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      this.selectedIndex = Math.min(this.characters.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.scene.start('LadderScene', {
        playerCharId: this.characters[this.selectedIndex].id,
        playerSave: createPlayerSave(),
      });
    });

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'Arrow keys to select, Enter to fight', {
      fontSize: '10px', color: '#556677',
    }).setOrigin(0.5);
  }

  private updateSelection(): void {
    const char = this.characters[this.selectedIndex];
    this.nameText?.setText(`> ${char.name} <`);

    // Draw selection box
    this.selectorGraphics.clear();
    const sprite = this.sprites[this.selectedIndex];
    this.selectorGraphics.lineStyle(2, 0xffcc00, 1);
    this.selectorGraphics.strokeRect(
      sprite.x - 28, sprite.y - 28, 56, 56
    );
  }
}
