import { describe, it, expect } from 'vitest';
import {
  getPet,
  getAllPets,
  isPetUnlocked,
  type PetDef,
} from '../pets.config';

describe('Pets Config', () => {
  describe('getAllPets', () => {
    it('returns exactly 4 pets', () => {
      expect(getAllPets().length).toBe(4);
    });

    it('each pet has required fields', () => {
      for (const pet of getAllPets()) {
        expect(pet.id).toBeTruthy();
        expect(pet.name).toBeTruthy();
        expect(pet.effect).toBeDefined();
        expect(pet.color).toBeDefined();
        expect(pet.unlockCondition).toBeDefined();
      }
    });
  });

  describe('getPet', () => {
    it('returns Clownfish pet', () => {
      const p = getPet('clownfish');
      expect(p).toBeDefined();
      expect(p!.name).toBe('Clownfish');
      expect(p!.effect.type).toBe('none');
      expect(p!.unlockCondition.type).toBe('arena');
      expect(p!.unlockCondition.arenaId).toBe('sea');
    });

    it('returns Walking Fish pet', () => {
      const p = getPet('walking_fish');
      expect(p).toBeDefined();
      expect(p!.name).toBe('Walking Fish');
      expect(p!.effect.type).toBe('speed_boost');
      expect(p!.effect.multiplier).toBe(2);
      expect(p!.unlockCondition.type).toBe('arena');
      expect(p!.unlockCondition.arenaId).toBe('fish_market');
    });

    it('returns Flying Fish pet', () => {
      const p = getPet('flying_fish');
      expect(p).toBeDefined();
      expect(p!.name).toBe('Flying Fish');
      expect(p!.effect.type).toBe('flight');
      expect(p!.effect.maxDuration).toBe(60);
      expect(p!.unlockCondition.type).toBe('arena');
      expect(p!.unlockCondition.arenaId).toBe('ship');
    });

    it('returns Sniper Fish pet', () => {
      const p = getPet('sniper_fish');
      expect(p).toBeDefined();
      expect(p!.name).toBe('Sniper Fish');
      expect(p!.effect.type).toBe('auto_shoot');
      expect(p!.effect.damage).toBeGreaterThan(0);
      expect(p!.effect.interval).toBeGreaterThan(0);
      expect(p!.unlockCondition.type).toBe('boss_clear');
    });

    it('returns undefined for unknown pet', () => {
      expect(getPet('nonexistent')).toBeUndefined();
    });
  });

  describe('isPetUnlocked', () => {
    it('Clownfish unlocks when Sea arena has been played', () => {
      expect(isPetUnlocked('clownfish', { arenasPlayed: ['sea'], bossesDefeated: [] })).toBe(true);
      expect(isPetUnlocked('clownfish', { arenasPlayed: [], bossesDefeated: [] })).toBe(false);
    });

    it('Walking Fish unlocks when Fish Market has been played', () => {
      expect(isPetUnlocked('walking_fish', { arenasPlayed: ['fish_market'], bossesDefeated: [] })).toBe(true);
      expect(isPetUnlocked('walking_fish', { arenasPlayed: ['sea'], bossesDefeated: [] })).toBe(false);
    });

    it('Flying Fish unlocks when Ship has been played', () => {
      expect(isPetUnlocked('flying_fish', { arenasPlayed: ['ship'], bossesDefeated: [] })).toBe(true);
    });

    it('Sniper Fish unlocks when Chef boss defeated', () => {
      expect(isPetUnlocked('sniper_fish', { arenasPlayed: [], bossesDefeated: ['chef'] })).toBe(true);
      expect(isPetUnlocked('sniper_fish', { arenasPlayed: ['restaurant'], bossesDefeated: [] })).toBe(false);
    });
  });
});
