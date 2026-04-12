import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import {
  createLadderState,
  getNextFight,
  isLadderComplete,
  type LadderState,
} from '../systems/LadderSystem';
import { type PlayerSave } from '../systems/EconomySystem';
import { getStoryState, shouldPufferfishJoin, shouldPufferfishDepart } from '../systems/StorySystem';

export class LadderScene extends Phaser.Scene {
  private ladderState!: LadderState;
  private playerSave!: PlayerSave;
  private playerCharId!: string;

  constructor() {
    super({ key: 'LadderScene' });
  }

  create(data: { ladderState?: LadderState; playerSave: PlayerSave; playerCharId: string }): void {
    this.ladderState = data.ladderState || createLadderState();
    this.playerSave = data.playerSave;
    this.playerCharId = data.playerCharId;
    this.cameras.main.setBackgroundColor('#0d2137');

    if (isLadderComplete(this.ladderState)) {
      this.showVictory();
      return;
    }

    const fight = getNextFight(this.ladderState);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'ARCADE LADDER', {
      fontSize: '24px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Fight list
    for (let i = 1; i <= 10; i++) {
      const y = 70 + i * 30;
      const isCurrent = i === fight.fightNumber;
      const isDone = i < fight.fightNumber;
      const isBoss = i === 10;

      const isMiniBoss = i === 6;
      const isHuman = i >= 7 && i <= 9;
      const specialNames: Record<number, string> = { 6: 'MEGA-FISH', 7: 'Fisherman', 8: 'Diver', 9: 'Sushi Master' };
      const label = isBoss ? `Fight ${i} — BOSS`
        : isMiniBoss ? `Fight ${i} — ${specialNames[i]} [MINI-BOSS]`
        : isHuman ? `Fight ${i} — ${specialNames[i]}`
        : `Fight ${i}`;
      const color = isDone ? '#44aa44' : isCurrent ? '#ffcc00' : '#556677';
      const prefix = isDone ? '  ' : isCurrent ? '> ' : '  ';

      this.add.text(GAME_WIDTH / 2 - 80, y, `${prefix}${label}`, {
        fontSize: '14px', color, fontStyle: isCurrent ? 'bold' : 'normal',
      });

      // AI level indicator
      this.add.text(GAME_WIDTH / 2 + 100, y, `Lv.${i}`, {
        fontSize: '12px', color: '#446688',
      });
    }

    // Coins
    this.add.text(20, GAME_HEIGHT - 50, `Coins: ${this.playerSave.coins}`, {
      fontSize: '14px', color: '#ffcc00',
    });

    // Weapon
    this.add.text(20, GAME_HEIGHT - 30, `Weapon: ${this.playerSave.equippedWeapon.replace('_', ' ')}`, {
      fontSize: '12px', color: '#88bbdd',
    });

    // Buttons
    const fightBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, `[ FIGHT ${fight.fightNumber} ]`, {
      fontSize: '22px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    fightBtn.on('pointerover', () => fightBtn.setColor('#ffcc00'));
    fightBtn.on('pointerout', () => fightBtn.setColor('#ff4444'));
    fightBtn.on('pointerdown', () => {
      this.scene.start('FightScene', {
        playerCharId: this.playerCharId,
        enemyCharId: fight.enemyCharId,
        playerWeapon: this.playerSave.equippedWeapon,
        enemyWeapon: fight.fightNumber > 5 ? 'pufferfish_cannon' : 'toy_fish',
        aiLevel: fight.aiLevel,
        arenaId: fight.arenaId,
        ladderState: this.ladderState,
        playerSave: this.playerSave,
        enemyType: fight.enemyType,
        enemyId: fight.enemyId,
      });
    });

    // Fish button
    const fishBtn = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 80, '[ FISH ]', {
      fontSize: '16px', color: '#44cc88',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    fishBtn.on('pointerover', () => fishBtn.setColor('#ffcc00'));
    fishBtn.on('pointerout', () => fishBtn.setColor('#44cc88'));
    fishBtn.on('pointerdown', () => {
      this.scene.start('ShopScene', {
        ladderState: this.ladderState,
        playerSave: this.playerSave,
        playerCharId: this.playerCharId,
        tab: 'fish',
      });
    });

    // Shop button
    const shopBtn = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 55, '[ SHOP ]', {
      fontSize: '16px', color: '#88bbdd',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    shopBtn.on('pointerover', () => shopBtn.setColor('#ffcc00'));
    shopBtn.on('pointerout', () => shopBtn.setColor('#88bbdd'));
    shopBtn.on('pointerdown', () => {
      this.scene.start('ShopScene', {
        ladderState: this.ladderState,
        playerSave: this.playerSave,
        playerCharId: this.playerCharId,
      });
    });

    // Keyboard shortcut
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.scene.start('FightScene', {
        playerCharId: this.playerCharId,
        enemyCharId: fight.enemyCharId,
        playerWeapon: this.playerSave.equippedWeapon,
        enemyWeapon: fight.fightNumber > 5 ? 'pufferfish_cannon' : 'toy_fish',
        aiLevel: fight.aiLevel,
        arenaId: fight.arenaId,
        ladderState: this.ladderState,
        playerSave: this.playerSave,
        enemyType: fight.enemyType,
        enemyId: fight.enemyId,
      });
    });
  }

  private showVictory(): void {
    this.add.text(GAME_WIDTH / 2, 100, 'VICTORY!', {
      fontSize: '48px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 160, 'You completed the ladder!', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 200, `Total coins earned: ${this.playerSave.coins}`, {
      fontSize: '16px', color: '#ffcc00',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 230, `Ladder clears: ${this.ladderState.ladderClears}`, {
      fontSize: '14px', color: '#88bbdd',
    }).setOrigin(0.5);

    // Story triggers
    const clears = this.ladderState.ladderClears;
    const story = getStoryState(clears);
    if (shouldPufferfishJoin(clears)) {
      this.add.text(GAME_WIDTH / 2, 270, 'Pufferfish joins your crew!', {
        fontSize: '16px', color: '#33cccc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, 290, 'A companion will fight alongside you.', {
        fontSize: '12px', color: '#88cccc',
      }).setOrigin(0.5);
    } else if (shouldPufferfishDepart(clears)) {
      this.add.text(GAME_WIDTH / 2, 260, 'Pufferfish says farewell...', {
        fontSize: '16px', color: '#33cccc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, 280, 'But a legendary fish appears!', {
        fontSize: '14px', color: '#cc44ff',
      }).setOrigin(0.5);
      this.add.text(GAME_WIDTH / 2, 300, 'SAKABAMBASPIS UNLOCKED!', {
        fontSize: '18px', color: '#cc44ff', fontStyle: 'bold',
      }).setOrigin(0.5);
    } else if (story.pufferfishCompanion) {
      this.add.text(GAME_WIDTH / 2, 270, 'Pufferfish fights with you!', {
        fontSize: '12px', color: '#33cccc',
      }).setOrigin(0.5);
    }

    const menuBtn = this.add.text(GAME_WIDTH / 2, story.sakabambaspisUnlocked ? 340 : 320, '[ MAIN MENU ]', {
      fontSize: '20px', color: '#ff4444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffcc00'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#ff4444'));
    menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
