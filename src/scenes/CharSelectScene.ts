import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import {
  getAllCharacters,
  isCharacterUnlocked,
  type CharacterDef,
} from '../config/characters.config';
import { createPlayerSave, equipCharacter, purchaseCharacter, type PlayerSave } from '../systems/EconomySystem';
import { persistSave } from '../utils/saveClient';
import { personalityFromSlider } from '../systems/PersonalitySystem';

export class CharSelectScene extends Phaser.Scene {
  private characters!: CharacterDef[];
  private selectedIndex = 0;
  private sprites: Phaser.GameObjects.Sprite[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private selectorGraphics!: Phaser.GameObjects.Graphics;
  private playerSave!: PlayerSave;

  constructor() {
    super({ key: 'CharSelectScene' });
  }

  create(data?: { playerSave?: PlayerSave }): void {
    this.cameras.main.setBackgroundColor('#0d2137');
    this.characters = getAllCharacters().filter(c =>
      !c.secret || (data?.playerSave?.purchasedCharacters.includes(c.id) ?? false)
    );
    this.playerSave = data?.playerSave || createPlayerSave();
    persistSave(this.playerSave);
    const equippedIdx = this.characters.findIndex(c => c.id === this.playerSave.equippedCharacter);
    this.selectedIndex = equippedIdx >= 0 ? equippedIdx : 0;
    this.sprites = [];

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'CHOOSE YOUR FISH', {
      fontSize: '28px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Character sprites
    const spacing = 120;
    const startX = GAME_WIDTH / 2 - (spacing * (this.characters.length - 1)) / 2;

    for (let i = 0; i < this.characters.length; i++) {
      const char = this.characters[i];
      const x = startX + i * spacing;
      const y = GAME_HEIGHT / 2 - 30;
      const unlocked = isCharacterUnlocked(
        char.id, this.playerSave.ladderClears, this.playerSave.coins, this.playerSave.purchasedCharacters
      );

      const sprite = this.add.sprite(x, y, char.spriteSheet);
      sprite.play(`${char.id}_idle`);
      sprite.setScale(2.5);

      if (!unlocked) {
        sprite.setTint(0x333333);
      }

      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        this.selectedIndex = i;
        this.updateSelection();
      });

      this.sprites.push(sprite);

      // Name + rarity
      const rarityColors: Record<string, string> = {
        common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', legendary: '#cc44ff'
      };
      this.add.text(x, y + 50, char.name, {
        fontSize: '12px', color: rarityColors[char.rarity] || '#ffffff',
      }).setOrigin(0.5);

      // Lock icon
      if (!unlocked) {
        this.add.text(x, y - 5, '🔒', { fontSize: '20px' }).setOrigin(0.5);
      }
    }

    // Selection indicator
    this.selectorGraphics = this.add.graphics();

    // Info text
    this.nameText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, '', {
      fontSize: '20px', color: '#ffcc00',
    }).setOrigin(0.5);

    this.infoText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 75, '', {
      fontSize: '12px', color: '#88bbdd',
    }).setOrigin(0.5);

    this.updateSelection();

    // Fight button
    const fightBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '[ FIGHT! ]', {
      fontSize: '24px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    fightBtn.on('pointerover', () => fightBtn.setColor('#ffcc00'));
    fightBtn.on('pointerout', () => fightBtn.setColor('#ff4444'));
    fightBtn.on('pointerdown', () => this.tryStartGame());

    // Keyboard
    this.input.keyboard!.on('keydown-LEFT', () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      this.selectedIndex = Math.min(this.characters.length - 1, this.selectedIndex + 1);
      this.updateSelection();
    });
    this.input.keyboard!.on('keydown-ENTER', () => this.tryStartGame());

    // Coins display
    this.add.text(20, 10, `Coins: ${this.playerSave.coins}`, {
      fontSize: '12px', color: '#ffcc00',
    });

    // Personality slider
    const sliderX = GAME_WIDTH - 150;
    const sliderY = 30;
    this.add.text(sliderX, sliderY - 12, 'Personality', {
      fontSize: '10px', color: '#88bbdd',
    }).setOrigin(0.5);

    const sliderBg = this.add.rectangle(sliderX, sliderY + 8, 100, 8, 0x333333);
    const sliderHandle = this.add.rectangle(
      sliderX - 50 + this.playerSave.personality * 100, sliderY + 8, 12, 16, 0xffcc00,
    ).setInteractive({ draggable: true, useHandCursor: true });

    const personalityLabel = this.add.text(sliderX, sliderY + 22, '', {
      fontSize: '10px', color: '#ffcc00',
    }).setOrigin(0.5);

    const updateLabel = () => {
      const level = personalityFromSlider(this.playerSave.personality);
      personalityLabel.setText(level.toUpperCase());
    };
    updateLabel();

    sliderHandle.on('drag', (_: unknown, dragX: number) => {
      const clamped = Phaser.Math.Clamp(dragX, sliderX - 50, sliderX + 50);
      sliderHandle.x = clamped;
      this.playerSave = { ...this.playerSave, personality: (clamped - (sliderX - 50)) / 100 };
      updateLabel();
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'Arrow keys to select, Enter to fight', {
      fontSize: '10px', color: '#556677',
    }).setOrigin(0.5);
  }

  private tryStartGame(): void {
    const char = this.characters[this.selectedIndex];
    const unlocked = isCharacterUnlocked(
      char.id, this.playerSave.ladderClears, this.playerSave.coins, this.playerSave.purchasedCharacters
    );

    if (!unlocked && char.unlockCost) {
      // Try to purchase
      const updated = purchaseCharacter(this.playerSave, char.id, char.unlockCost);
      if (updated !== this.playerSave) {
        this.playerSave = updated;
        this.scene.restart({ playerSave: this.playerSave });
        return;
      }
      return; // Can't afford
    }

    if (!unlocked) return; // Locked by clears

    // Record the chosen fish as equipped so rejoining restores it.
    this.playerSave = equipCharacter(this.playerSave, char.id);
    persistSave(this.playerSave);
    this.scene.start('LadderScene', {
      playerCharId: char.id,
      playerSave: this.playerSave,
    });
  }

  private updateSelection(): void {
    const char = this.characters[this.selectedIndex];
    const unlocked = isCharacterUnlocked(
      char.id, this.playerSave.ladderClears, this.playerSave.coins, this.playerSave.purchasedCharacters
    );

    this.nameText.setText(`> ${char.name} <`);

    if (unlocked) {
      this.infoText.setText(`${char.rarity.toUpperCase()} — Ready to fight!`);
    } else if (char.unlockCost) {
      const canBuy = this.playerSave.coins >= char.unlockCost;
      this.infoText.setText(`${char.unlockCost} coins to unlock${canBuy ? ' — Press Enter to buy!' : ''}`);
    } else if (char.unlockClear) {
      this.infoText.setText(`Complete ladder ${char.unlockClear} times to unlock`);
    }

    // Draw selection box
    this.selectorGraphics.clear();
    const sprite = this.sprites[this.selectedIndex];
    const borderColor = unlocked ? 0xffcc00 : 0x666666;
    this.selectorGraphics.lineStyle(2, borderColor, 1);
    this.selectorGraphics.strokeRect(sprite.x - 24, sprite.y - 24, 48, 48);
  }
}
