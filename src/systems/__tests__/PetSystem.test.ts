import { describe, it, expect } from 'vitest';
import {
  createPetState,
  applySpeedBoost,
  applyFlight,
  updateAutoShoot,
  updateFlightTimer,
  type PetState,
} from '../PetSystem';

describe('PetSystem', () => {
  describe('createPetState', () => {
    it('creates state with no pet equipped', () => {
      const state = createPetState(null);
      expect(state.petId).toBeNull();
      expect(state.active).toBe(false);
    });

    it('creates state with pet equipped', () => {
      const state = createPetState('clownfish');
      expect(state.petId).toBe('clownfish');
      expect(state.active).toBe(true);
    });
  });

  describe('applySpeedBoost', () => {
    it('doubles speed when Walking Fish is equipped', () => {
      const state = createPetState('walking_fish');
      const baseSpeed = 200;
      expect(applySpeedBoost(state, baseSpeed)).toBe(400);
    });

    it('returns base speed when no pet equipped', () => {
      const state = createPetState(null);
      expect(applySpeedBoost(state, 200)).toBe(200);
    });

    it('returns base speed for non-speed pets', () => {
      const state = createPetState('clownfish');
      expect(applySpeedBoost(state, 200)).toBe(200);
    });
  });

  describe('applyFlight', () => {
    it('allows flight when Flying Fish is equipped and time remains', () => {
      const state = createPetState('flying_fish');
      expect(applyFlight(state)).toBe(true);
    });

    it('denies flight when timer is expired', () => {
      let state = createPetState('flying_fish');
      state = { ...state, flightTimeRemaining: 0 };
      expect(applyFlight(state)).toBe(false);
    });

    it('denies flight for non-flight pets', () => {
      const state = createPetState('clownfish');
      expect(applyFlight(state)).toBe(false);
    });
  });

  describe('updateFlightTimer', () => {
    it('decrements flight time when flying', () => {
      let state = createPetState('flying_fish');
      state = updateFlightTimer(state, 0.5, true);
      expect(state.flightTimeRemaining).toBe(59.5);
    });

    it('does not decrement when not flying', () => {
      let state = createPetState('flying_fish');
      state = updateFlightTimer(state, 0.5, false);
      expect(state.flightTimeRemaining).toBe(60);
    });

    it('clamps to zero', () => {
      let state = createPetState('flying_fish');
      state = updateFlightTimer(state, 100, true);
      expect(state.flightTimeRemaining).toBe(0);
    });
  });

  describe('updateAutoShoot', () => {
    it('fires when Sniper Fish cooldown is ready', () => {
      let state = createPetState('sniper_fish');
      state = { ...state, autoShootCooldown: 0 };
      const result = updateAutoShoot(state, 0.1);
      expect(result.shouldFire).toBe(true);
      expect(result.state.autoShootCooldown).toBeGreaterThan(0);
      expect(result.damage).toBeGreaterThan(0);
    });

    it('does not fire when on cooldown', () => {
      let state = createPetState('sniper_fish');
      state = { ...state, autoShootCooldown: 1.0 };
      const result = updateAutoShoot(state, 0.1);
      expect(result.shouldFire).toBe(false);
      expect(result.state.autoShootCooldown).toBeCloseTo(0.9);
    });

    it('does not fire for non-sniper pets', () => {
      const state = createPetState('clownfish');
      const result = updateAutoShoot(state, 0.1);
      expect(result.shouldFire).toBe(false);
    });
  });
});
