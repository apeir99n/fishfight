import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchSave, pushSave, getOrCreatePlayerId } from '../saveClient';
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

describe('saveClient', () => {
  beforeEach(() => {
    localStorageMock.clear();
    (globalThis as any).localStorage = localStorageMock;
  });

  describe('getOrCreatePlayerId', () => {
    it('creates and persists a new id on first call', () => {
      const id = getOrCreatePlayerId();
      expect(id).toMatch(/^p_[a-z0-9]+$/);
      expect(localStorageMock.getItem('fishfight.playerId')).toBe(id);
    });

    it('returns the same id on subsequent calls', () => {
      const id1 = getOrCreatePlayerId();
      const id2 = getOrCreatePlayerId();
      expect(id1).toBe(id2);
    });
  });

  describe('fetchSave', () => {
    it('returns save from server on 200', async () => {
      const save = createPlayerSave();
      save.coins = 42;
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: true, status: 200, json: async () => save,
      });
      const result = await fetchSave('p_x');
      expect(result?.coins).toBe(42);
    });

    it('returns null on 404', async () => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({
        ok: false, status: 404, json: async () => ({}),
      });
      expect(await fetchSave('p_x')).toBeNull();
    });

    it('returns null on network error (offline-safe)', async () => {
      (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('fail'));
      expect(await fetchSave('p_x')).toBeNull();
    });
  });

  describe('pushSave', () => {
    it('POSTs the save as JSON', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      (globalThis as any).fetch = fetchMock;
      const save = createPlayerSave();
      await pushSave('p_abc', save);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain('/save/p_abc');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body).equippedCharacter).toBe('tuna');
    });

    it('swallows network errors (offline-safe)', async () => {
      (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(pushSave('p_x', createPlayerSave())).resolves.toBeUndefined();
    });
  });
});
