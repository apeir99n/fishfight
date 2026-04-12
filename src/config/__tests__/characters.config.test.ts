import { describe, it, expect } from 'vitest';
import {
  getCharacter,
  getAllCharacters,
  getStarterCharacters,
  getUnlockableCharacters,
  isCharacterUnlocked,
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

    it('returns Squid character definition', () => {
      const squid = getCharacter('squid');
      expect(squid).toBeDefined();
      expect(squid!.id).toBe('squid');
      expect(squid!.name).toBe('Squid');
      expect(squid!.rarity).toBe('uncommon');
      expect(squid!.spriteSheet).toBe('squid_sheet');
      expect(squid!.frameCount).toBe(5);
      expect(squid!.unlockCost).toBe(0);
    });

    it('returns Pufferfish character definition', () => {
      const puffer = getCharacter('pufferfish');
      expect(puffer).toBeDefined();
      expect(puffer!.id).toBe('pufferfish');
      expect(puffer!.name).toBe('Pufferfish');
      expect(puffer!.rarity).toBe('rare');
      expect(puffer!.unlockCost).toBe(0);
    });

    it('returns Sakabambaspis character definition', () => {
      const saka = getCharacter('sakabambaspis');
      expect(saka).toBeDefined();
      expect(saka!.id).toBe('sakabambaspis');
      expect(saka!.name).toBe('Sakabambaspis');
      expect(saka!.rarity).toBe('legendary');
      expect(saka!.unlockCost).toBe(0);
    });

    it('all 5 characters have different colors', () => {
      const all = getAllCharacters();
      const colors = all.map(c => c.color);
      expect(new Set(colors).size).toBe(5);
    });

    it('returns undefined for unknown character', () => {
      expect(getCharacter('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllCharacters', () => {
    it('returns exactly 5 characters', () => {
      expect(getAllCharacters().length).toBe(5);
    });
  });

  describe('getStarterCharacters', () => {
    it('returns only common rarity characters', () => {
      const starters = getStarterCharacters();
      expect(starters.every(c => c.rarity === 'common')).toBe(true);
      expect(starters.length).toBe(2);
    });
  });

  describe('getUnlockableCharacters', () => {
    it('returns non-common characters', () => {
      const unlockable = getUnlockableCharacters();
      expect(unlockable.length).toBe(3);
      expect(unlockable.every(c => c.rarity !== 'common')).toBe(true);
    });
  });

  describe('isCharacterUnlocked', () => {
    it('starters are always unlocked', () => {
      expect(isCharacterUnlocked('tuna', 0, 0, [])).toBe(true);
      expect(isCharacterUnlocked('carp', 0, 0, [])).toBe(true);
    });

    it('squid unlocks when purchased', () => {
      expect(isCharacterUnlocked('squid', 0, 0, [])).toBe(false);
      expect(isCharacterUnlocked('squid', 0, 0, ['squid'])).toBe(true);
    });

    it('pufferfish unlocks when purchased', () => {
      expect(isCharacterUnlocked('pufferfish', 0, 0, [])).toBe(false);
      expect(isCharacterUnlocked('pufferfish', 0, 0, ['pufferfish'])).toBe(true);
    });

    it('sakabambaspis unlocks when purchased', () => {
      expect(isCharacterUnlocked('sakabambaspis', 0, 0, [])).toBe(false);
      expect(isCharacterUnlocked('sakabambaspis', 0, 0, ['sakabambaspis'])).toBe(true);
    });
  });
});
