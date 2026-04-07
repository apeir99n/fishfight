import { ECONOMY } from '../config/game.config';
import { getArenaForFight } from '../config/arenas.config';
import { getHumanEnemies } from '../config/enemies.config';

export interface FightInfo {
  fightNumber: number;
  aiLevel: number;
  arenaId: string;
  isBoss: boolean;
  enemyCharId: string;
  enemyType: 'fish' | 'human' | 'boss';
  enemyId?: string; // enemy config id for human/boss enemies
}

export interface LadderState {
  currentFight: number;
  totalCoins: number;
  wins: number;
  losses: number;
  ladderClears: number;
}

const TOTAL_FIGHTS = 10;

const ENEMY_ROTATION = ['carp', 'tuna', 'squid', 'carp', 'tuna', 'squid', 'carp', 'squid', 'tuna', 'carp'];

export function createLadderState(): LadderState {
  return {
    currentFight: 1,
    totalCoins: 0,
    wins: 0,
    losses: 0,
    ladderClears: 0,
  };
}

export function getCoinsForFight(fightNumber: number): number {
  return ECONOMY.baseCoinsPerFight + (fightNumber - 1) * ECONOMY.coinsIncrement;
}

// Special enemies by fight number
const SPECIAL_FIGHT_MAP: Record<number, { enemyId: string; type: 'human' | 'boss' }> = {
  6: { enemyId: 'mega_fish', type: 'boss' },
  7: { enemyId: 'fisherman', type: 'human' },
  8: { enemyId: 'diver', type: 'human' },
  9: { enemyId: 'sushi_master', type: 'human' },
};

export function getNextFight(state: LadderState): FightInfo {
  const fightNum = state.currentFight;
  const special = SPECIAL_FIGHT_MAP[fightNum];

  if (special) {
    return {
      fightNumber: fightNum,
      aiLevel: fightNum,
      arenaId: getArenaForFight(fightNum),
      isBoss: special.type === 'boss',
      enemyCharId: 'carp',
      enemyType: special.type,
      enemyId: special.enemyId,
    };
  }

  return {
    fightNumber: fightNum,
    aiLevel: fightNum,
    arenaId: getArenaForFight(fightNum),
    isBoss: fightNum === TOTAL_FIGHTS,
    enemyCharId: ENEMY_ROTATION[(fightNum - 1) % ENEMY_ROTATION.length],
    enemyType: fightNum === TOTAL_FIGHTS ? 'boss' : 'fish',
  };
}

export function completeFight(state: LadderState, won: boolean): LadderState {
  if (!won) {
    return { ...state, losses: state.losses + 1 };
  }

  const coins = getCoinsForFight(state.currentFight);
  const nextFight = state.currentFight + 1;
  const ladderDone = state.currentFight >= TOTAL_FIGHTS;

  return {
    ...state,
    currentFight: ladderDone ? nextFight : nextFight,
    totalCoins: state.totalCoins + coins,
    wins: state.wins + 1,
    ladderClears: ladderDone ? state.ladderClears + 1 : state.ladderClears,
  };
}

export function isLadderComplete(state: LadderState): boolean {
  return state.currentFight > TOTAL_FIGHTS;
}
