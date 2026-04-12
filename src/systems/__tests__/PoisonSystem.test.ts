import { describe, it, expect } from 'vitest';
import {
  createPoisonState,
  triggerPoison,
  updatePoison,
  isPoisonActive,
  isPoisonOnCooldown,
  type PoisonState,
} from '../PoisonSystem';

describe('PoisonSystem', () => {
  describe('createPoisonState', () => {
    it('creates inactive poison state when enabled', () => {
      const state = createPoisonState(true);
      expect(state.enabled).toBe(true);
      expect(state.active).toBe(false);
      expect(state.cooldownTimer).toBe(0);
      expect(state.stunDuration).toBe(2);
    });

    it('creates disabled state when not pufferfish', () => {
      const state = createPoisonState(false);
      expect(state.enabled).toBe(false);
    });
  });

  describe('triggerPoison', () => {
    it('activates poison when enabled and off cooldown', () => {
      const state = createPoisonState(true);
      const result = triggerPoison(state);
      expect(result.active).toBe(true);
      expect(result.activeTimer).toBeGreaterThan(0);
    });

    it('does not activate when disabled', () => {
      const state = createPoisonState(false);
      const result = triggerPoison(state);
      expect(result.active).toBe(false);
    });

    it('does not activate when on cooldown', () => {
      let state = createPoisonState(true);
      state = triggerPoison(state);
      state = updatePoison(state, 1); // deactivate (active lasts 0.5s), starts cooldown
      expect(state.cooldownTimer).toBeGreaterThan(0);
      const result = triggerPoison(state);
      // should not re-activate while on cooldown
      expect(result.active).toBe(false);
    });
  });

  describe('updatePoison', () => {
    it('ticks down active timer', () => {
      let state = createPoisonState(true);
      state = triggerPoison(state);
      const before = state.activeTimer;
      state = updatePoison(state, 0.5);
      expect(state.activeTimer).toBe(before - 0.5);
    });

    it('deactivates and starts cooldown when timer expires', () => {
      let state = createPoisonState(true);
      state = triggerPoison(state);
      state = updatePoison(state, 1); // past 0.5s active duration
      expect(state.active).toBe(false);
      expect(state.cooldownTimer).toBeGreaterThan(0);
    });

    it('ticks down cooldown timer', () => {
      let state = createPoisonState(true);
      state = triggerPoison(state);
      state = updatePoison(state, 1); // deactivate, starts cooldown
      const cd = state.cooldownTimer;
      state = updatePoison(state, 1);
      expect(state.cooldownTimer).toBe(cd - 1);
    });

    it('cooldown reaches zero and allows re-trigger', () => {
      let state = createPoisonState(true);
      state = triggerPoison(state);
      state = updatePoison(state, 20); // past active + cooldown
      expect(isPoisonOnCooldown(state)).toBe(false);
      state = triggerPoison(state);
      expect(state.active).toBe(true);
    });
  });

  describe('isPoisonActive', () => {
    it('returns false when not triggered', () => {
      expect(isPoisonActive(createPoisonState(true))).toBe(false);
    });

    it('returns true when triggered', () => {
      let state = createPoisonState(true);
      state = triggerPoison(state);
      expect(isPoisonActive(state)).toBe(true);
    });
  });
});
