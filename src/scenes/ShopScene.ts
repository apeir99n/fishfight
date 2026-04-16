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

// Scroll viewport (vertical band between tabs and back button / arrow buttons)
const SCROLL_TOP = 95;
const SCROLL_BOTTOM = GAME_HEIGHT - 55;
const SCROLL_STEP = 50;

export class ShopScene extends Phaser.Scene {
  private playerSave!: PlayerSave;
  private ladderState!: LadderState;
  private playerCharId!: string;
  private coinsText!: Phaser.GameObjects.Text;
  private activeTab: ShopTab = 'weapons';

  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private contentHeight = 0;
  private upBtn!: Phaser.GameObjects.Text;
  private downBtn!: Phaser.GameObjects.Text;

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

    // Scroll container + mask for entries
    this.scrollContainer = this.add.container(0, 0);
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, SCROLL_TOP, GAME_WIDTH, SCROLL_BOTTOM - SCROLL_TOP);
    this.scrollContainer.setMask(maskShape.createGeometryMask());

    // Content
    let lastBottom = 110;
    if (this.activeTab === 'weapons') {
      lastBottom = this.renderWeapons();
    } else if (this.activeTab === 'skins') {
      lastBottom = this.renderSkins();
    } else {
      lastBottom = this.renderFish();
    }
    this.contentHeight = lastBottom - SCROLL_TOP;
    this.scrollY = 0;
    this.scrollContainer.y = 0;

    // Scroll buttons (on the right edge of scroll area)
    this.upBtn = this.add.text(GAME_WIDTH - 20, SCROLL_TOP + 10, '▲', {
      fontSize: '20px', color: '#88bbdd', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.upBtn.on('pointerdown', () => this.scrollBy(-SCROLL_STEP));

    this.downBtn = this.add.text(GAME_WIDTH - 20, SCROLL_BOTTOM - 30, '▼', {
      fontSize: '20px', color: '#88bbdd', fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.downBtn.on('pointerdown', () => this.scrollBy(SCROLL_STEP));
    this.updateScrollButtons();

    // Keyboard and mouse-wheel scrolling
    this.input.keyboard!.on('keydown-UP', () => this.scrollBy(-SCROLL_STEP));
    this.input.keyboard!.on('keydown-DOWN', () => this.scrollBy(SCROLL_STEP));
    this.input.keyboard!.on('keydown-PAGE_UP', () => this.scrollBy(-SCROLL_STEP * 3));
    this.input.keyboard!.on('keydown-PAGE_DOWN', () => this.scrollBy(SCROLL_STEP * 3));
    this.input.on('wheel', (_pointer: unknown, _go: unknown, _dx: number, dy: number) => {
      this.scrollBy(dy * 0.5);
    });

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

  private scrollBy(delta: number): void {
    const visibleHeight = SCROLL_BOTTOM - SCROLL_TOP;
    const maxScroll = Math.max(0, this.contentHeight - visibleHeight + 20);
    this.scrollY = Math.max(0, Math.min(maxScroll, this.scrollY + delta));
    this.scrollContainer.y = -this.scrollY;
    this.updateScrollButtons();
  }

  private updateScrollButtons(): void {
    const visibleHeight = SCROLL_BOTTOM - SCROLL_TOP;
    const maxScroll = Math.max(0, this.contentHeight - visibleHeight + 20);
    this.upBtn.setColor(this.scrollY > 0 ? '#88bbdd' : '#3a4a5a');
    this.downBtn.setColor(this.scrollY < maxScroll ? '#88bbdd' : '#3a4a5a');
  }

  private addContent<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.scrollContainer.add(obj);
    return obj;
  }

  private switchTab(tab: ShopTab): void {
    this.scene.restart({
      playerSave: this.playerSave,
      ladderState: this.ladderState,
      playerCharId: this.playerCharId,
      tab,
    });
  }

  private renderWeapons(): number {
    const weapons = getAllWeapons();
    let y = 110;
    weapons.forEach((w) => {
      this.createWeaponEntry(w, y);
      y += 75;
    });
    return y;
  }

  private renderSkins(): number {
    const skins = getAllSkins();
    let y = 110;
    skins.forEach((s) => {
      this.createSkinEntry(s, y);
      y += 50;
    });
    return y;
  }

  private createWeaponEntry(weapon: WeaponDef, y: number): void {
    const owned = this.playerSave.unlockedWeapons.includes(weapon.id);
    const equipped = this.playerSave.equippedWeapon === weapon.id;
    const affordable = canAfford(this.playerSave, weapon.price);

    this.addContent(this.add.text(40, y, weapon.name, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }));

    const statsText = weapon.type === 'melee'
      ? `Melee | ${weapon.damage} dmg | ${weapon.range}px range`
      : `Ranged | ${weapon.damage} dmg | ${weapon.projectileSpeed}px/s`;
    this.addContent(this.add.text(40, y + 22, statsText, {
      fontSize: '11px', color: '#88aacc',
    }));

    if (equipped) {
      this.addContent(this.add.text(GAME_WIDTH - 40, y + 10, 'EQUIPPED', {
        fontSize: '14px', color: '#44cc44',
      }).setOrigin(1, 0));
    } else if (owned) {
      const equipBtn = this.addContent(this.add.text(GAME_WIDTH - 40, y + 10, '[ EQUIP ]', {
        fontSize: '14px', color: '#44aaff',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));

      equipBtn.on('pointerdown', () => {
        this.playerSave = equipWeapon(this.playerSave, weapon.id);
        this.switchTab('weapons');
      });
    } else {
      const priceColor = affordable ? '#ffcc00' : '#664444';
      const buyBtn = this.addContent(this.add.text(GAME_WIDTH - 40, y + 10, `[ BUY ${weapon.price} ]`, {
        fontSize: '14px', color: priceColor,
      }).setOrigin(1, 0));

      if (affordable) {
        buyBtn.setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => {
          this.playerSave = purchaseWeapon(this.playerSave, weapon.id, weapon.price);
          this.switchTab('weapons');
        });
      }
    }
  }

  private renderFish(): number {
    const chars = getAllCharacters().filter(c => {
      // Hide secret characters until the player has unlocked them via code.
      if (!c.secret) return true;
      return this.playerSave.purchasedCharacters.includes(c.id);
    });
    let y = 110;
    chars.forEach((c) => {
      this.createFishEntry(c, y);
      y += 55;
    });
    return y;
  }

  private createFishEntry(char: CharacterDef, y: number): void {
    const isStarter = char.rarity === 'common';
    const owned = isStarter || this.playerSave.purchasedCharacters.includes(char.id);
    const equipped = this.playerSave.equippedCharacter === char.id;
    const price = char.unlockCost || 0;
    const affordable = canAfford(this.playerSave, price);

    // Color swatch
    const g = this.addContent(this.add.graphics());
    g.fillStyle(char.color, 1);
    g.fillCircle(30, y + 12, 8);

    // Rarity color
    const rarityColors: Record<string, string> = {
      common: '#aaaaaa', uncommon: '#44cc44', rare: '#4488ff', legendary: '#cc44ff', exclusive: '#ff88cc',
    };

    this.addContent(this.add.text(50, y, char.name, {
      fontSize: '14px', color: rarityColors[char.rarity] || '#ffffff', fontStyle: 'bold',
    }));

    this.addContent(this.add.text(50, y + 18, `${char.rarity.toUpperCase()}`, {
      fontSize: '10px', color: '#667788',
    }));

    if (equipped) {
      this.addContent(this.add.text(GAME_WIDTH - 40, y + 8, 'EQUIPPED', {
        fontSize: '13px', color: '#44cc44',
      }).setOrigin(1, 0));
    } else if (owned) {
      const equipBtn = this.addContent(this.add.text(GAME_WIDTH - 40, y + 8, '[ EQUIP ]', {
        fontSize: '13px', color: '#44aaff',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));

      equipBtn.on('pointerdown', () => {
        this.playerSave = equipCharacter(this.playerSave, char.id);
        this.playerCharId = char.id;
        this.switchTab('fish');
      });
    } else {
      const priceColor = affordable ? '#ffcc00' : '#664444';
      const buyBtn = this.addContent(this.add.text(GAME_WIDTH - 40, y + 8, `[ BUY ${price} ]`, {
        fontSize: '13px', color: priceColor,
      }).setOrigin(1, 0));

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
    const g = this.addContent(this.add.graphics());
    g.fillStyle(skin.color, 1);
    g.fillCircle(30, y + 12, 8);

    // Rarity color
    const rarityColor = skin.rarity === 'legendary' ? '#cc44ff'
      : skin.rarity === 'rare' ? '#44aaff' : '#ffffff';

    this.addContent(this.add.text(50, y, skin.name, {
      fontSize: '14px', color: rarityColor, fontStyle: 'bold',
    }));

    this.addContent(this.add.text(50, y + 18, skin.description, {
      fontSize: '10px', color: '#667788',
    }));

    if (equipped) {
      this.addContent(this.add.text(GAME_WIDTH - 40, y + 8, 'EQUIPPED', {
        fontSize: '13px', color: '#44cc44',
      }).setOrigin(1, 0));
    } else if (owned) {
      const equipBtn = this.addContent(this.add.text(GAME_WIDTH - 40, y + 8, '[ EQUIP ]', {
        fontSize: '13px', color: '#44aaff',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));

      equipBtn.on('pointerdown', () => {
        this.playerSave = equipSkin(this.playerSave, skin.id);
        this.switchTab('skins');
      });
    } else {
      const priceColor = affordable ? '#ffcc00' : '#664444';
      const buyBtn = this.addContent(this.add.text(GAME_WIDTH - 40, y + 8, `[ BUY ${skin.price} ]`, {
        fontSize: '13px', color: priceColor,
      }).setOrigin(1, 0));

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
