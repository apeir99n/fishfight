import { describe, it, expect } from 'vitest';
import {
  getNewGamePlusScaling,
  applyNGPlusToEnemy,
  type NGPlusScaling,
} from '../NewGamePlusSystem';

describe('NewGamePlusSystem', () => {
  describe('getNewGamePlusScaling', () => {
    it('cycle 0 (first playthrough) has no scaling', () => {
      const s = getNewGamePlusScaling(0);
      expect(s.hpMultiplier).toBe(1);
      expect(s.damageMultiplier).toBe(1);
      expect(s.reactionMultiplier).toBe(1);
    });

    it('cycle 1 applies 1.15x HP, 1.1x damage, 0.9x reaction', () => {
      const s = getNewGamePlusScaling(1);
      expect(s.hpMultiplier).toBeCloseTo(1.15);
      expect(s.damageMultiplier).toBeCloseTo(1.1);
      expect(s.reactionMultiplier).toBeCloseTo(0.9);
    });

    it('cycle 2 compounds the scaling', () => {
      const s = getNewGamePlusScaling(2);
      expect(s.hpMultiplier).toBeCloseTo(1.15 * 1.15);
      expect(s.damageMultiplier).toBeCloseTo(1.1 * 1.1);
      expect(s.reactionMultiplier).toBeCloseTo(0.9 * 0.9);
    });

    it('cycle 5 is a serious challenge', () => {
      const s = getNewGamePlusScaling(5);
      expect(s.hpMultiplier).toBeGreaterThan(1.5);
      expect(s.damageMultiplier).toBeGreaterThan(1.3);
      expect(s.reactionMultiplier).toBeLessThan(0.7);
    });

    it('scales infinitely', () => {
      const s10 = getNewGamePlusScaling(10);
      const s20 = getNewGamePlusScaling(20);
      expect(s20.hpMultiplier).toBeGreaterThan(s10.hpMultiplier);
      expect(s20.damageMultiplier).toBeGreaterThan(s10.damageMultiplier);
      expect(s20.reactionMultiplier).toBeLessThan(s10.reactionMultiplier);
    });
  });

  describe('applyNGPlusToEnemy', () => {
    it('scales enemy HP by cycle multiplier', () => {
      const result = applyNGPlusToEnemy(100, 10, 500, 1);
      expect(result.hp).toBeCloseTo(115);
    });

    it('scales enemy damage', () => {
      const result = applyNGPlusToEnemy(100, 10, 500, 1);
      expect(result.damage).toBeCloseTo(11);
    });

    it('scales reaction time down', () => {
      const result = applyNGPlusToEnemy(100, 10, 500, 1);
      expect(result.reactionTime).toBeCloseTo(450);
    });

    it('reaction time has a floor of 50ms', () => {
      const result = applyNGPlusToEnemy(100, 10, 100, 20);
      expect(result.reactionTime).toBeGreaterThanOrEqual(50);
    });
  });
});
