import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import { getAllWeapons, type WeaponDef } from '../weapons/WeaponSystem';
import { getAllSkins, type SkinDef } from '../config/skins.config';
import { getAllCharacters, type CharacterDef } from '../config/characters.config';
import {
  purchaseWeapon,
  equipWeapon,
  purchaseSkin,
  equipSkin,
  purchaseCharacter,
  equipCharacter,
  canAfford,
  type PlayerSave,
} from '../systems/EconomySystem';
import { type LadderState } from '../systems/LadderSystem';
import { persistSave } from '../utils/saveClient';

type ShopTab = 'weapons' | 'skins' | 'fish';

export class ShopScene extends Phaser.Scene {
  private playerSave!: PlayerSave;
  private ladderState!: LadderState;
  private playerCharId!: string;
  private coinsText!: Phaser.GameObjects.Text;
  private activeTab: ShopTab = 'weapons';

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(data: { playerSave: PlayerSave; ladderState: LadderState; playerCharId: string; tab?: ShopTab }): void {
    this.playerSave = data.playerSave;
    this.ladderState = data.ladderState;
    this.playerCharId = data.playerCharId;
    this.activeTab = data.tab || 'weapons';
    persistSave(this.playerSave);
    this.cameras.main.setBackgroundColor('#0d1a2d');

    // Title
    this.add.text(GAME_WIDTH / 2, 20, 'SHOP', {
      fontSize: '28px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coins
    this.coinsText = this.add.text(GAME_WIDTH / 2, 50, `Coins: ${this.playerSave.coins}`, {
      fontSize: '16px', color: '#ffcc00',
    }).setOrigin(0.5);

    // Tabs
    const weaponsTab = this.add.text(GAME_WIDTH / 2 - 120, 75, '[ WEAPONS ]', {
      fontSize: '14px',
      color: this.activeTab === 'weapons' ? '#ffcc00' : '#556677',
      fontStyle: this.activeTab === 'weapons' ? 'bold' : 'normal',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const skinsTab = this.add.text(GAME_WIDTH / 2, 75, '[ SKINS ]', {
      fontSize: '14px',
      color: this.activeTab === 'skins' ? '#ffcc00' : '#556677',
      fontStyle: this.activeTab === 'skins' ? 'bold' : 'normal',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const fishTab = this.add.text(GAME_WIDTH / 2 + 120, 75, '[ FISH ]', {
      fontSize: '14px',
      color: this.activeTab === 'fish' ? '#ffcc00' : '#556677',
      fontStyle: this.activeTab === 'fish' ? 'bold' : 'normal',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    weaponsTab.on('pointerdown', () => this.switchTab('weapons'));
    skinsTab.on('pointerdown', () => this.switchTab('skins'));
    fishTab.on('pointerdown', () => this.switchTab('fish'));

    // Content
    if (this.activeTab === 'weapons') {
      this.renderWeapons();
    } else if (this.activeTab === 'skins') {
      this.renderSkins();
    } else {
      this.renderFish();
    }

    // Back button
    const backBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '[ BACK TO LADDER ]', {
      fontSize: '16px', color: '#88bbdd',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffcc00'));
    backBtn.on('pointerout', () => backBtn.setColor('#88bbdd'));
    backBtn.on('pointerdown', () => {
      this.scene.start('LadderScene', {
        ladderState: this.ladderState,
        playerSave: this.playerSave,
        playerCharId: this.playerCharId,
      });
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('LadderScene', {
        ladderState: this.ladderState,
        playerSave: this.playerSave,
        playerCharId: this.playerCharId,
      });
    });
  }

  private switchTab(tab: ShopTab): void {
    this.scene.restart({
      playerSave: this.playerSave,
      ladderState: this.ladderState,
      playerCharId: this.playerCharId,
      tab,
    });
  }

  private renderWeapons(): void {
    const weapons = getAllWeapons();
    weapons.forEach((w, i) => {
      const y = 110 + i * 75;
      this.createWeaponEntry(w, y);
    });
  }

  private renderSkins(): void {
    const skins = getAllSkins();
    skins.forEach((s, i) => {
      const y = 110 + i * 50;
      this.createSkinEntry(s, y);
    });
  }

  private createWeaponEntry(weapon: WeaponDef, y: number): void {
    const owned = this.playerSave.unlockedWeapons.includes(weapon.id);
    const equipped = this.playerSave.equippedWeapon === weapon.id;
    const affordable = canAfford(this.playerSave, weapon.price);

    this.add.text(40, y, weapon.name, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    });

    const statsText = weapon.type === 'melee'
      ? `Melee | ${weapon.damage} dmg | ${weapon.range}px range`
      : `Ranged | ${weapon.damage} dmg | ${weapon.projectileSpeed}px/s`;
    this.add.text(40, y + 22, statsText, {
      fontSize: '11px', color: '#88aacc',
    });

    if (equipped) {
      this.add.text(GAME_WIDTH - 40, y + 10, 'EQUIPPED', {
        fontSize: '14px', color: '#44cc44',
      }).setOrigin(1, 0);
    } else if (owned) {
      const equipBtn = this.add.text(GAME_WIDTH - 40, y + 10, '[ EQUIP ]', {
        fontSize: '14px', color: '#44aaff',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      equipBtn.on('pointerdown', () => {
        this.playerSave = equipWeapon(this.playerSave, weapon.id);
        this.switchTab('weapons');
      });
    } else {
      const priceColor = affordable ? '#ffcc00' : '#664444';
      const buyBtn = this.add.text(GAME_WIDTH - 40, y + 10, `[ BUY ${weapon.price} ]`, {
        fontSize: '14px', color: priceColor,
      }).setOrigin(1, 0);

      if (affordable) {
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => {
          this.playerSave = purchaseWeapon(this.playerSave, weapon.id, weapon.price);
          this.switchTab('weapons');
        });
      }
    }
  }

  private renderFish(): void {
    const chars = getAllCharacters().filter(c => {
      // Hide secret characters until the player has unlocked them via code.
      if (!c.secret) return true;
      return this.playerSave.purchasedCharacters.includes(c.id);
    });
    chars.forEach((c, i) => {
      const y = 110 + i * 55;
      this.createFishEntry(c, y);
    });
  }

  private createFishEntry(char: CharacterDef, y: number): void {
    const isStarter = char.rarity === 'common';
    const owned = isStarter || this.playerSave.purchasedCharacters.includes(char.id);
    const equipped = this.playerSave.equippedCharacter === char.id;
    const price = char.unlockCost || 0;
    const affordable = canAfford(this.playerSave, price);

    // Color swatch
    const g = this.add.graphics();
    g.fillStyle(char.color, 1);
    g.fillCircle(30, y + 12, 8);

    // Rarity color
    const rarityColors: Record<string, string> = {
      common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', legendary: '#cc44ff',
    };

    this.add.text(50, y, char.name, {
      fontSize: '14px', color: rarityColors[char.rarity] || '#ffffff', fontStyle: 'bold',
    });

    this.add.text(50, y + 18, `${char.rarity.toUpperCase()}`, {
      fontSize: '10px', color: '#667788',
    });

    if (equipped) {
      this.add.text(GAME_WIDTH - 40, y + 8, 'EQUIPPED', {
        fontSize: '13px', color: '#44cc44',
      }).setOrigin(1, 0);
    } else if (owned) {
      const equipBtn = this.add.text(GAME_WIDTH - 40, y + 8, '[ EQUIP ]', {
        fontSize: '13px', color: '#44aaff',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      equipBtn.on('pointerdown', () => {
        this.playerSave = equipCharacter(this.playerSave, char.id);
        this.playerCharId = char.id;
        this.switchTab('fish');
      });
    } else {
      const priceColor = affordable ? '#ffcc00' : '#664444';
      const buyBtn = this.add.text(GAME_WIDTH - 40, y + 8, `[ BUY ${price} ]`, {
        fontSize: '13px', color: priceColor,
      }).setOrigin(1, 0);

      if (affordable) {
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => {
          this.playerSave = purchaseCharacter(this.playerSave, char.id, price);
          this.switchTab('fish');
        });
      }
    }
  }

  private createSkinEntry(skin: SkinDef, y: number): void {
    const owned = this.playerSave.unlockedSkins.includes(skin.id);
    const equipped = this.playerSave.equippedSkin === skin.id;
    const affordable = canAfford(this.playerSave, skin.price);

    // Color preview swatch
    const g = this.add.graphics();
    g.fillStyle(skin.color, 1);
    g.fillCircle(30, y + 12, 8);

    // Rarity color
    const rarityColor = skin.rarity === 'legendary' ? '#cc44ff'
      : skin.rarity === 'rare' ? '#44aaff' : '#ffffff';

    this.add.text(50, y, skin.name, {
      fontSize: '14px', color: rarityColor, fontStyle: 'bold',
    });

    this.add.text(50, y + 18, skin.description, {
      fontSize: '10px', color: '#667788',
    });

    if (equipped) {
      this.add.text(GAME_WIDTH - 40, y + 8, 'EQUIPPED', {
        fontSize: '13px', color: '#44cc44',
      }).setOrigin(1, 0);
    } else if (owned) {
      const equipBtn = this.add.text(GAME_WIDTH - 40, y + 8, '[ EQUIP ]', {
        fontSize: '13px', color: '#44aaff',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      equipBtn.on('pointerdown', () => {
        this.playerSave = equipSkin(this.playerSave, skin.id);
        this.switchTab('skins');
      });
    } else {
      const priceColor = affordable ? '#ffcc00' : '#664444';
      const buyBtn = this.add.text(GAME_WIDTH - 40, y + 8, `[ BUY ${skin.price} ]`, {
        fontSize: '13px', color: priceColor,
      }).setOrigin(1, 0);

      if (affordable) {
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => {
          this.playerSave = purchaseSkin(this.playerSave, skin.id, skin.price);
          this.switchTab('skins');
        });
      }
    }
  }
}
