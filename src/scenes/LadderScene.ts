import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game.config';
import {
  createLadderState,
  getNextFight,
  isLadderComplete,
  type LadderState,
} from '../systems/LadderSystem';
import { markTutorialSeen, type PlayerSave } from '../systems/EconomySystem';
import { findCode } from '../config/codes.config';
import { getCharacter } from '../config/characters.config';
import { getSkin } from '../config/skins.config';
import { getStoryState, shouldPufferfishJoin, shouldPufferfishDepart } from '../systems/StorySystem';
import { persistSave } from '../utils/saveClient';

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
    persistSave(this.playerSave);
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

    // Code redemption button (top-right, same row as Fight 1)
    const codeBtn = this.add.text(GAME_WIDTH - 20, 100, '[ CODE ]', {
      fontSize: '16px', color: '#ff88cc',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    codeBtn.on('pointerover', () => codeBtn.setColor('#ffcc00'));
    codeBtn.on('pointerout', () => codeBtn.setColor('#ff88cc'));
    codeBtn.on('pointerdown', () => this.promptForCode());

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
    fightBtn.on('pointerdown', () => this.startFight(fight));

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
    this.input.keyboard!.on('keydown-ENTER', () => this.startFight(fight));
  }

  private startFight(fight: ReturnType<typeof getNextFight>): void {
    if (!this.playerSave.tutorialSeen) {
      this.showTutorial(() => {
        this.playerSave = markTutorialSeen(this.playerSave);
        persistSave(this.playerSave);
        this.launchFight(fight);
      });
      return;
    }
    this.launchFight(fight);
  }

  private launchFight(fight: ReturnType<typeof getNextFight>): void {
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
  }

  private promptForCode(): void {
    const raw = window.prompt('Enter a secret code:');
    if (raw === null) return; // cancelled
    const trimmed = raw.trim();
    if (!trimmed) return;

    const match = findCode(trimmed);
    if (!match) {
      this.flashBanner('Invalid code', '#ff4444');
      return;
    }

    if (match.reward.type === 'skin') {
      const skin = getSkin(match.reward.id);
      if (!skin) {
        this.flashBanner('Reward missing', '#ff4444');
        return;
      }
      if (this.playerSave.unlockedSkins.includes(match.reward.id)) {
        this.flashBanner(`Already owned: ${skin.name}`, '#ffaa00');
        return;
      }
      this.playerSave = {
        ...this.playerSave,
        unlockedSkins: [...this.playerSave.unlockedSkins, match.reward.id],
      };
      persistSave(this.playerSave);
      this.flashBanner(match.description ?? `Unlocked skin: ${skin.name}`, '#44cc66');
      return;
    }

    if (match.reward.type === 'character') {
      const char = getCharacter(match.reward.id);
      if (!char) {
        this.flashBanner('Reward missing', '#ff4444');
        return;
      }
      if (this.playerSave.purchasedCharacters.includes(match.reward.id)) {
        this.flashBanner(`Already owned: ${char.name}`, '#ffaa00');
        return;
      }
      this.playerSave = {
        ...this.playerSave,
        purchasedCharacters: [...this.playerSave.purchasedCharacters, match.reward.id],
      };
      persistSave(this.playerSave);
      this.flashBanner(match.description ?? `Unlocked fish: ${char.name}`, '#44cc66');
    }
  }

  private flashBanner(message: string, color: string): void {
    const banner = this.add.text(GAME_WIDTH / 2, 70, message, {
      fontSize: '14px', color, fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(200);
    this.time.delayedCall(2500, () => banner.destroy());
  }

  private showTutorial(onClose: () => void): void {
    // Dark backdrop
    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.85,
    ).setDepth(100).setInteractive();

    // Panel
    const panel = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH - 80, GAME_HEIGHT - 80,
      0x0d2137, 1,
    ).setStrokeStyle(2, 0xffcc00).setDepth(100);

    const title = this.add.text(GAME_WIDTH / 2, 70, 'THE TIDE TURNS TODAY', {
      fontSize: '22px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101);

    const bodyText =
      'A lone fish on dry land. An opponent hungry for battle.\n' +
      'Only one will remain in the arena.\n\n' +
      'J — Light punch    K — Heavy attack\n' +
      'L — Special ability    F — Block incoming blows\n\n' +
      'Knock your rival clean out of sight to win.\n' +
      'They will fight back — move, dodge, and strike!\n\n' +
      'Earn coins in every battle. Spend them on fish,\n' +
      'weapons and skins. Some gear is free — just for you.';

    const body = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, bodyText, {
      fontSize: '13px', color: '#cfe8ff', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(101);

    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, '[ LET\'S FIGHT ]', {
      fontSize: '20px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#ffcc00'));
    startBtn.on('pointerout', () => startBtn.setColor('#ff4444'));
    const close = (): void => {
      backdrop.destroy();
      panel.destroy();
      title.destroy();
      body.destroy();
      startBtn.destroy();
      onClose();
    };
    startBtn.on('pointerdown', close);
    this.input.keyboard!.once('keydown-ENTER', close);
    this.input.keyboard!.once('keydown-SPACE', close);
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
