import { describe, it, expect } from 'vitest';
import {
  createInkState,
  triggerInk,
  updateInk,
  isInkActive,
  isInkOnCooldown,
  type InkState,
} from '../InkSystem';

describe('InkSystem', () => {
  describe('createInkState', () => {
    it('creates enabled state for squid', () => {
      const state = createInkState(true);
      expect(state.enabled).toBe(true);
      expect(state.active).toBe(false);
      expect(state.cooldownTimer).toBe(0);
      expect(state.stunDuration).toBe(5);
    });

    it('creates disabled state for non-squid', () => {
      const state = createInkState(false);
      expect(state.enabled).toBe(false);
    });
  });

  describe('triggerInk', () => {
    it('activates ink when enabled and off cooldown', () => {
      const state = createInkState(true);
      const result = triggerInk(state);
      expect(result.active).toBe(true);
      expect(result.activeTimer).toBeGreaterThan(0);
    });

    it('does not activate when disabled', () => {
      const state = createInkState(false);
      const result = triggerInk(state);
      expect(result.active).toBe(false);
    });

    it('does not activate when on cooldown', () => {
      let state = createInkState(true);
      state = triggerInk(state);
      state = updateInk(state, 2); // deactivate, starts cooldown
      const result = triggerInk(state);
      expect(result.active).toBe(false);
    });
  });

  describe('updateInk', () => {
    it('ticks down active timer', () => {
      let state = createInkState(true);
      state = triggerInk(state);
      const before = state.activeTimer;
      state = updateInk(state, 0.3);
      expect(state.activeTimer).toBe(before - 0.3);
    });

    it('deactivates and starts cooldown when timer expires', () => {
      let state = createInkState(true);
      state = triggerInk(state);
      state = updateInk(state, 2); // past 0.8s active
      expect(state.active).toBe(false);
      expect(state.cooldownTimer).toBeGreaterThan(0);
    });

    it('cooldown reaches zero and allows re-trigger', () => {
      let state = createInkState(true);
      state = triggerInk(state);
      state = updateInk(state, 30); // past active + cooldown
      expect(isInkOnCooldown(state)).toBe(false);
      state = triggerInk(state);
      expect(state.active).toBe(true);
    });
  });

  describe('isInkActive', () => {
    it('returns false when not triggered', () => {
      expect(isInkActive(createInkState(true))).toBe(false);
    });

    it('returns true when triggered', () => {
      let state = createInkState(true);
      state = triggerInk(state);
      expect(isInkActive(state)).toBe(true);
    });
  });
});
