import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CharSelectScene } from './scenes/CharSelectScene';
import { LadderScene } from './scenes/LadderScene';
import { ShopScene } from './scenes/ShopScene';
import { FightScene } from './scenes/FightScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/game.config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, CharSelectScene, LadderScene, ShopScene, FightScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  pixelArt: true,
  antialias: false,
  roundPixels: true,
};

new Phaser.Game(config);
