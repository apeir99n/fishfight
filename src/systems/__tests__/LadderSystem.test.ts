import { describe, it, expect } from 'vitest';
import {
  createLadderState,
  getNextFight,
  completeFight,
  getCoinsForFight,
  isLadderComplete,
  type LadderState,
} from '../LadderSystem';

describe('LadderSystem', () => {
  describe('createLadderState', () => {
    it('creates ladder at fight 1 with 0 coins', () => {
      const state = createLadderState();
      expect(state.currentFight).toBe(1);
      expect(state.totalCoins).toBe(0);
      expect(state.wins).toBe(0);
      expect(state.losses).toBe(0);
      expect(state.ladderClears).toBe(0);
    });
  });

  describe('getCoinsForFight', () => {
    it('fight 1 awards 10 coins', () => {
      expect(getCoinsForFight(1)).toBe(10);
    });

    it('fight 2 awards 11 coins', () => {
      expect(getCoinsForFight(2)).toBe(11);
    });

    it('fight 10 awards 19 coins', () => {
      expect(getCoinsForFight(10)).toBe(19);
    });

    it('full ladder yields ~145 coins', () => {
      let total = 0;
      for (let i = 1; i <= 10; i++) total += getCoinsForFight(i);
      expect(total).toBe(145);
    });
  });

  describe('getNextFight', () => {
    it('returns fight info with AI level scaling', () => {
      const state = createLadderState();
      const fight = getNextFight(state);
      expect(fight.fightNumber).toBe(1);
      expect(fight.aiLevel).toBe(1);
      expect(fight.arenaId).toBe('sea');
    });

    it('AI level matches fight number', () => {
      let state = createLadderState();
      state = { ...state, currentFight: 5 };
      const fight = getNextFight(state);
      expect(fight.aiLevel).toBe(5);
    });

    it('fight 10 is the boss fight', () => {
      let state = createLadderState();
      state = { ...state, currentFight: 10 };
      const fight = getNextFight(state);
      expect(fight.isBoss).toBe(true);
      expect(fight.aiLevel).toBe(10);
    });
  });

  describe('completeFight', () => {
    it('winning advances to next fight and awards coins', () => {
      const state = createLadderState();
      const result = completeFight(state, true);
      expect(result.currentFight).toBe(2);
      expect(result.totalCoins).toBe(10);
      expect(result.wins).toBe(1);
    });

    it('losing does not advance but tracks loss', () => {
      const state = createLadderState();
      const result = completeFight(state, false);
      expect(result.currentFight).toBe(1); // stays at same fight
      expect(result.totalCoins).toBe(0);   // no coins
      expect(result.losses).toBe(1);
    });

    it('accumulates coins over multiple wins', () => {
      let state = createLadderState();
      state = completeFight(state, true); // fight 1: +10
      state = completeFight(state, true); // fight 2: +11
      state = completeFight(state, true); // fight 3: +12
      expect(state.totalCoins).toBe(33);
      expect(state.currentFight).toBe(4);
    });
  });

  describe('isLadderComplete', () => {
    it('not complete at fight 9', () => {
      let state = createLadderState();
      state = { ...state, currentFight: 10 };
      expect(isLadderComplete(state)).toBe(false);
    });

    it('complete after winning fight 10', () => {
      let state = createLadderState();
      state = { ...state, currentFight: 10 };
      state = completeFight(state, true);
      expect(isLadderComplete(state)).toBe(true);
      expect(state.ladderClears).toBe(1);
    });
  });
});
