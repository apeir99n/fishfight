import { describe, it, expect } from 'vitest';
import {
  getSkin,
  getAllSkins,
  type SkinDef,
} from '../skins.config';

describe('Skins Config', () => {
  describe('getAllSkins', () => {
    it('returns exactly 6 skins', () => {
      expect(getAllSkins().length).toBe(6);
    });

    it('each skin has required fields', () => {
      for (const skin of getAllSkins()) {
        expect(skin.id).toBeTruthy();
        expect(skin.name).toBeTruthy();
        expect(skin.price).toBeGreaterThanOrEqual(0);
        expect(skin.color).toBeDefined();
      }
    });
  });

  describe('getSkin', () => {
    it('returns Cap skin at 30 coins', () => {
      const s = getSkin('cap');
      expect(s).toBeDefined();
      expect(s!.name).toBe('Cap');
      expect(s!.price).toBe(30);
    });

    it('returns Frying Pan Hat at 30 coins', () => {
      const s = getSkin('frying_pan_hat');
      expect(s).toBeDefined();
      expect(s!.name).toBe('Frying Pan Hat');
      expect(s!.price).toBe(30);
    });

    it('returns Carp T-shirt at 30 coins', () => {
      const s = getSkin('carp_tshirt');
      expect(s).toBeDefined();
      expect(s!.price).toBe(30);
    });

    it('returns Carrot Mouth at 200 coins', () => {
      const s = getSkin('carrot_mouth');
      expect(s).toBeDefined();
      expect(s!.price).toBe(200);
    });

    it('returns Fish Sword at 200 coins', () => {
      const s = getSkin('fish_sword');
      expect(s).toBeDefined();
      expect(s!.price).toBe(200);
    });

    it('returns Parasite at 690 coins (legendary)', () => {
      const s = getSkin('parasite');
      expect(s).toBeDefined();
      expect(s!.price).toBe(690);
      expect(s!.rarity).toBe('legendary');
    });

    it('returns undefined for unknown skin', () => {
      expect(getSkin('nonexistent')).toBeUndefined();
    });
  });

  describe('pricing tiers', () => {
    it('has 3 budget skins at 30 coins', () => {
      const budget = getAllSkins().filter(s => s.price === 30);
      expect(budget.length).toBe(3);
    });

    it('has 2 premium skins at 200 coins', () => {
      const premium = getAllSkins().filter(s => s.price === 200);
      expect(premium.length).toBe(2);
    });

    it('has 1 legendary skin at 690 coins', () => {
      const legendary = getAllSkins().filter(s => s.price === 690);
      expect(legendary.length).toBe(1);
    });
  });
});
