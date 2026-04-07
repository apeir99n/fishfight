import { describe, it, expect } from 'vitest';
import {
  getCharacter,
  getAllCharacters,
  getStarterCharacters,
  type CharacterDef,
} from '../characters.config';

describe('Characters Config', () => {
  describe('getCharacter', () => {
    it('returns Tuna character definition', () => {
      const tuna = getCharacter('tuna');
      expect(tuna).toBeDefined();
      expect(tuna!.id).toBe('tuna');
      expect(tuna!.name).toBe('Tuna');
      expect(tuna!.rarity).toBe('common');
      expect(tuna!.spriteSheet).toBe('tuna_sheet');
      expect(tuna!.frameWidth).toBe(32);
      expect(tuna!.frameHeight).toBe(32);
      expect(tuna!.frameCount).toBe(6);
      expect(tuna!.color).toBe(0x4488ff);
    });

    it('returns Carp character definition', () => {
      const carp = getCharacter('carp');
      expect(carp).toBeDefined();
      expect(carp!.id).toBe('carp');
      expect(carp!.name).toBe('Carp');
      expect(carp!.rarity).toBe('common');
      expect(carp!.spriteSheet).toBe('carp_sheet');
      expect(carp!.color).toBe(0xff8800);
    });

    it('Tuna and Carp have different colors', () => {
      const tuna = getCharacter('tuna');
      const carp = getCharacter('carp');
      expect(tuna!.color).not.toBe(carp!.color);
    });

    it('returns undefined for unknown character', () => {
      const unknown = getCharacter('nonexistent');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getAllCharacters', () => {
    it('returns at least 2 characters', () => {
      const all = getAllCharacters();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('includes both Tuna and Carp', () => {
      const all = getAllCharacters();
      const ids = all.map(c => c.id);
      expect(ids).toContain('tuna');
      expect(ids).toContain('carp');
    });
  });

  describe('getStarterCharacters', () => {
    it('returns only common rarity characters', () => {
      const starters = getStarterCharacters();
      expect(starters.every(c => c.rarity === 'common')).toBe(true);
    });

    it('includes Tuna and Carp', () => {
      const starters = getStarterCharacters();
      const ids = starters.map(c => c.id);
      expect(ids).toContain('tuna');
      expect(ids).toContain('carp');
    });
  });
});
