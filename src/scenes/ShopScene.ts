import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import { getAllWeapons, type WeaponDef } from '../weapons/WeaponSystem';
import {
  purchaseWeapon,
  equipWeapon,
  canAfford,
  type PlayerSave,
} from '../systems/EconomySystem';
import { type LadderState } from '../systems/LadderSystem';

export class ShopScene extends Phaser.Scene {
  private playerSave!: PlayerSave;
  private ladderState!: LadderState;
  private playerCharId!: string;
  private coinsText!: Phaser.GameObjects.Text;
  private itemTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(data: { playerSave: PlayerSave; ladderState: LadderState; playerCharId: string }): void {
    this.playerSave = data.playerSave;
    this.ladderState = data.ladderState;
    this.playerCharId = data.playerCharId;
    this.itemTexts = [];
    this.cameras.main.setBackgroundColor('#0d1a2d');

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'WEAPON SHOP', {
      fontSize: '28px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Coins
    this.coinsText = this.add.text(GAME_WIDTH / 2, 65, `Coins: ${this.playerSave.coins}`, {
      fontSize: '16px', color: '#ffcc00',
    }).setOrigin(0.5);

    // Weapons list
    const weapons = getAllWeapons();
    weapons.forEach((w, i) => {
      const y = 120 + i * 80;
      this.createWeaponEntry(w, y);
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

  private createWeaponEntry(weapon: WeaponDef, y: number): void {
    const owned = this.playerSave.unlockedWeapons.includes(weapon.id);
    const equipped = this.playerSave.equippedWeapon === weapon.id;
    const affordable = canAfford(this.playerSave, weapon.price);

    // Name
    this.add.text(40, y, weapon.name, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    });

    // Type & stats
    const statsText = weapon.type === 'melee'
      ? `Melee | ${weapon.damage} dmg | ${weapon.range}px range`
      : `Ranged | ${weapon.damage} dmg | ${weapon.projectileSpeed}px/s`;
    this.add.text(40, y + 22, statsText, {
      fontSize: '11px', color: '#88aacc',
    });

    // Price / Status / Button
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
        this.scene.restart({
          playerSave: this.playerSave,
          ladderState: this.ladderState,
          playerCharId: this.playerCharId,
        });
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
          this.coinsText.setText(`Coins: ${this.playerSave.coins}`);
          this.scene.restart({
            playerSave: this.playerSave,
            ladderState: this.ladderState,
            playerCharId: this.playerCharId,
          });
        });
      }
    }
  }
}
