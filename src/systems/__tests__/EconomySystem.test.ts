import { describe, it, expect } from 'vitest';
import {
  createPlayerSave,
  addCoins,
  canAfford,
  purchaseWeapon,
  equipWeapon,
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
});
