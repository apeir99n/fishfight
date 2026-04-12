import { describe, it, expect } from 'vitest';
import {
  createParasiteState,
  shouldTransform,
  updateParasite,
  type ParasiteState,
} from '../ParasiteTransformSystem';

describe('ParasiteTransformSystem', () => {
  describe('createParasiteState', () => {
    it('creates active state when parasite skin equipped', () => {
      const state = createParasiteState(true);
      expect(state.active).toBe(true);
      expect(state.transformed).toBe(false);
      expect(state.transforming).toBe(false);
      expect(state.dragonFishActive).toBe(false);
    });

    it('creates inactive state when parasite not equipped', () => {
      const state = createParasiteState(false);
      expect(state.active).toBe(false);
    });
  });

  describe('shouldTransform', () => {
    it('triggers at HP < 50%', () => {
      const state = createParasiteState(true);
      expect(shouldTransform(state, 49, 100)).toBe(true);
    });

    it('does not trigger at HP >= 50%', () => {
      const state = createParasiteState(true);
      expect(shouldTransform(state, 50, 100)).toBe(false);
    });

    it('does not trigger if already transformed', () => {
      let state = createParasiteState(true);
      state = { ...state, transformed: true };
      expect(shouldTransform(state, 30, 100)).toBe(false);
    });

    it('does not trigger if not active', () => {
      const state = createParasiteState(false);
      expect(shouldTransform(state, 30, 100)).toBe(false);
    });
  });

  describe('updateParasite', () => {
    it('starts transformation animation', () => {
      let state = createParasiteState(true);
      state = updateParasite(state, 0, true); // trigger transform
      expect(state.transforming).toBe(true);
      expect(state.transformTimer).toBeGreaterThan(0);
    });

    it('counts down transform timer', () => {
      let state = createParasiteState(true);
      state = updateParasite(state, 0, true);
      const initialTimer = state.transformTimer;
      state = updateParasite(state, 0.1, false);
      expect(state.transformTimer).toBeLessThan(initialTimer);
    });

    it('completes transformation when timer expires', () => {
      let state = createParasiteState(true);
      state = updateParasite(state, 0, true);
      // Fast forward
      state = updateParasite(state, 10, false);
      expect(state.transformed).toBe(true);
      expect(state.transforming).toBe(false);
      expect(state.knockbackMultiplier).toBe(1.5);
    });

    it('knockback bonus persists after transformation', () => {
      let state = createParasiteState(true);
      state = updateParasite(state, 0, true);
      state = updateParasite(state, 10, false);
      state = updateParasite(state, 5, false);
      expect(state.knockbackMultiplier).toBe(1.5);
    });

    it('only transforms once per fight', () => {
      let state = createParasiteState(true);
      state = updateParasite(state, 0, true);
      state = updateParasite(state, 10, false);
      expect(state.transformed).toBe(true);
      // Try to transform again
      state = updateParasite(state, 0, true);
      expect(state.transforming).toBe(false); // no second transform
    });
  });
});
