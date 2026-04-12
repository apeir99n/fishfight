import { describe, it, expect } from 'vitest';
import {
  createPlayerSave,
  addCoins,
  canAfford,
  purchaseWeapon,
  equipWeapon,
  purchaseCharacter,
  equipCharacter,
  getCoinBonus,
  type PlayerSave,
} from '../EconomySystem';

describe('EconomySystem', () => {
  describe('createPlayerSave', () => {
    it('creates default save with starter items', () => {
      const save = createPlayerSave();
      expect(save.coins).toBe(0);
      expect(save.unlockedWeapons).toContain('toy_fish');
      expect(save.equippedWeapon).toBe('toy_fish');
      expect(save.ladderClears).toBe(0);
    });
  });

  describe('addCoins', () => {
    it('adds coins to save', () => {
      const save = createPlayerSave();
      const result = addCoins(save, 50);
      expect(result.coins).toBe(50);
    });
  });

  describe('canAfford', () => {
    it('returns true when enough coins', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      expect(canAfford(save, 100)).toBe(true);
    });

    it('returns false when not enough coins', () => {
      const save = createPlayerSave();
      expect(canAfford(save, 100)).toBe(false);
    });
  });

  describe('purchaseWeapon', () => {
    it('deducts coins and unlocks weapon', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      const result = purchaseWeapon(save, 'pufferfish_cannon', 100);
      expect(result.coins).toBe(100);
      expect(result.unlockedWeapons).toContain('pufferfish_cannon');
    });

    it('does not purchase if cannot afford', () => {
      const save = createPlayerSave();
      const result = purchaseWeapon(save, 'pufferfish_cannon', 100);
      expect(result.coins).toBe(0);
      expect(result.unlockedWeapons).not.toContain('pufferfish_cannon');
    });

    it('does not purchase if already owned', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      save = purchaseWeapon(save, 'pufferfish_cannon', 100);
      const result = purchaseWeapon(save, 'pufferfish_cannon', 100);
      expect(result.coins).toBe(100); // not charged again
    });
  });

  describe('equipWeapon', () => {
    it('equips an unlocked weapon', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      save = purchaseWeapon(save, 'pufferfish_cannon', 100);
      const result = equipWeapon(save, 'pufferfish_cannon');
      expect(result.equippedWeapon).toBe('pufferfish_cannon');
    });

    it('does not equip a locked weapon', () => {
      const save = createPlayerSave();
      const result = equipWeapon(save, 'pufferfish_cannon');
      expect(result.equippedWeapon).toBe('toy_fish'); // unchanged
    });
  });

  describe('purchaseCharacter', () => {
    it('deducts coins and adds to purchasedCharacters', () => {
      let save = createPlayerSave();
      save = addCoins(save, 100);
      const result = purchaseCharacter(save, 'squid', 50);
      expect(result.coins).toBe(50);
      expect(result.purchasedCharacters).toContain('squid');
    });

    it('does not purchase if cannot afford', () => {
      const save = createPlayerSave();
      const result = purchaseCharacter(save, 'squid', 50);
      expect(result.coins).toBe(0);
      expect(result.purchasedCharacters).not.toContain('squid');
    });

    it('does not purchase if already owned', () => {
      let save = createPlayerSave();
      save = addCoins(save, 100);
      save = purchaseCharacter(save, 'squid', 50);
      const result = purchaseCharacter(save, 'squid', 50);
      expect(result.coins).toBe(50); // not charged again
    });
  });

  describe('totalSpent tracking', () => {
    it('purchaseWeapon increases totalSpent', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      save = purchaseWeapon(save, 'pufferfish_cannon', 20);
      expect(save.totalSpent).toBe(20);
    });

    it('purchaseCharacter increases totalSpent', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      save = purchaseCharacter(save, 'squid', 50);
      expect(save.totalSpent).toBe(50);
    });

    it('multiple purchases accumulate totalSpent', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      save = purchaseWeapon(save, 'pufferfish_cannon', 20);
      save = purchaseCharacter(save, 'squid', 50);
      expect(save.totalSpent).toBe(70);
    });
  });

  describe('getCoinBonus', () => {
    it('returns 1.0x multiplier when nothing spent', () => {
      const save = createPlayerSave();
      expect(getCoinBonus(save)).toBe(1);
    });

    it('returns higher multiplier after spending coins', () => {
      let save = createPlayerSave();
      save = addCoins(save, 200);
      save = purchaseWeapon(save, 'pufferfish_cannon', 20);
      save = purchaseCharacter(save, 'squid', 50);
      expect(getCoinBonus(save)).toBeGreaterThan(1);
    });

    it('gives 10% bonus per 50 coins spent', () => {
      let save = createPlayerSave();
      save = { ...save, totalSpent: 100 };
      expect(getCoinBonus(save)).toBeCloseTo(1.2);
    });

    it('caps at 2x multiplier', () => {
      let save = createPlayerSave();
      save = { ...save, totalSpent: 10000 };
      expect(getCoinBonus(save)).toBe(2);
    });
  });

  describe('equipCharacter', () => {
    it('equips a purchased character', () => {
      let save = createPlayerSave();
      save = addCoins(save, 50);
      save = purchaseCharacter(save, 'squid', 50);
      const result = equipCharacter(save, 'squid');
      expect(result.equippedCharacter).toBe('squid');
    });

    it('equips a starter character without purchase', () => {
      const save = createPlayerSave();
      const result = equipCharacter(save, 'carp');
      expect(result.equippedCharacter).toBe('carp');
    });

    it('does not equip an unpurchased non-starter character', () => {
      const save = createPlayerSave();
      const result = equipCharacter(save, 'squid');
      expect(result.equippedCharacter).toBe('tuna'); // unchanged default
    });
  });
});
