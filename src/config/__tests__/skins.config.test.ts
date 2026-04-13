import { describe, it, expect } from 'vitest';
import {
  getSkin,
  getAllSkins,
  type SkinDef,
} from '../skins.config';

describe('Skins Config', () => {
  describe('getAllSkins', () => {
    it('returns exactly 5 skins', () => {
      expect(getAllSkins().length).toBe(5);
    });

    it('each skin has required fields', () => {
      for (const skin of getAllSkins()) {
        expect(skin.id).toBeTruthy();
        expect(skin.name).toBeTruthy();
        expect(skin.price).toBeGreaterThanOrEqual(0);
        expect(skin.color).toBeDefined();
      }
    });

    it('all skins are free', () => {
      for (const skin of getAllSkins()) {
        expect(skin.price).toBe(0);
      }
    });
  });

  describe('getSkin', () => {
    it('returns Cap skin', () => {
      const s = getSkin('cap');
      expect(s).toBeDefined();
      expect(s!.name).toBe('Cap');
      expect(s!.price).toBe(0);
    });

    it('returns Frying Pan Hat', () => {
      const s = getSkin('frying_pan_hat');
      expect(s).toBeDefined();
      expect(s!.name).toBe('Frying Pan Hat');
      expect(s!.price).toBe(0);
    });

    it('returns Carp T-shirt', () => {
      const s = getSkin('carp_tshirt');
      expect(s).toBeDefined();
      expect(s!.price).toBe(0);
    });

it('returns Fish Sword', () => {
      const s = getSkin('fish_sword');
      expect(s).toBeDefined();
      expect(s!.price).toBe(0);
    });

    it('returns Parasite (legendary)', () => {
      const s = getSkin('parasite');
      expect(s).toBeDefined();
      expect(s!.price).toBe(0);
      expect(s!.rarity).toBe('legendary');
    });

    it('returns undefined for unknown skin', () => {
      expect(getSkin('nonexistent')).toBeUndefined();
    });
  });
});
