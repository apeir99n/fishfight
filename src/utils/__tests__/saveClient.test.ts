import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, persistSave, clearSave } from '../saveClient';
import { createPlayerSave } from '../../systems/EconomySystem';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

describe('saveClient (localStorage)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    (globalThis as any).localStorage = localStorageMock;
  });

  describe('loadSave', () => {
    it('returns null when no save exists', () => {
      expect(loadSave()).toBeNull();
    });

    it('returns the save after persistSave was called', () => {
      const s = createPlayerSave();
      s.coins = 123;
      s.equippedCharacter = 'carp';
      persistSave(s);
      const loaded = loadSave();
      expect(loaded).not.toBeNull();
      expect(loaded!.coins).toBe(123);
      expect(loaded!.equippedCharacter).toBe('carp');
    });

    it('returns null and does not throw on corrupt JSON', () => {
      localStorageMock.setItem('fishfight.save', '{not valid json');
      expect(loadSave()).toBeNull();
    });
  });

  describe('persistSave', () => {
    it('writes synchronously (latest save wins)', () => {
      const a = createPlayerSave(); a.coins = 1;
      const b = createPlayerSave(); b.coins = 2;
      persistSave(a);
      persistSave(b);
      expect(loadSave()!.coins).toBe(2);
    });
  });

  describe('clearSave', () => {
    it('removes the save so loadSave returns null', () => {
      persistSave(createPlayerSave());
      expect(loadSave()).not.toBeNull();
      clearSave();
      expect(loadSave()).toBeNull();
    });
  });
});
