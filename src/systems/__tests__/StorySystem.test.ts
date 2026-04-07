import { describe, it, expect } from 'vitest';
import {
  getStoryState,
  shouldPufferfishJoin,
  shouldPufferfishDepart,
  shouldUnlockSakabambaspis,
  type StoryState,
} from '../StorySystem';

describe('StorySystem', () => {
  describe('getStoryState', () => {
    it('returns inactive state at 0 clears', () => {
      const state = getStoryState(0);
      expect(state.pufferfishCompanion).toBe(false);
      expect(state.sakabambaspisUnlocked).toBe(false);
      expect(state.phase).toBe('early');
    });

    it('returns early state at 4 clears', () => {
      const state = getStoryState(4);
      expect(state.pufferfishCompanion).toBe(false);
      expect(state.phase).toBe('early');
    });

    it('pufferfish companion active at 5 clears', () => {
      const state = getStoryState(5);
      expect(state.pufferfishCompanion).toBe(true);
      expect(state.phase).toBe('companion');
    });

    it('pufferfish companion active at 9 clears', () => {
      const state = getStoryState(9);
      expect(state.pufferfishCompanion).toBe(true);
      expect(state.phase).toBe('companion');
    });

    it('pufferfish departs and sakabambaspis unlocks at 10 clears', () => {
      const state = getStoryState(10);
      expect(state.pufferfishCompanion).toBe(false);
      expect(state.sakabambaspisUnlocked).toBe(true);
      expect(state.phase).toBe('legendary');
    });

    it('sakabambaspis stays unlocked beyond 10 clears', () => {
      const state = getStoryState(15);
      expect(state.sakabambaspisUnlocked).toBe(true);
      expect(state.pufferfishCompanion).toBe(false);
      expect(state.phase).toBe('legendary');
    });
  });

  describe('shouldPufferfishJoin', () => {
    it('returns true at exactly 5 clears', () => {
      expect(shouldPufferfishJoin(5)).toBe(true);
    });

    it('returns false below 5', () => {
      expect(shouldPufferfishJoin(4)).toBe(false);
    });

    it('returns false at 10+ (departed)', () => {
      expect(shouldPufferfishJoin(10)).toBe(false);
    });
  });

  describe('shouldPufferfishDepart', () => {
    it('returns true at exactly 10 clears', () => {
      expect(shouldPufferfishDepart(10)).toBe(true);
    });

    it('returns false below 10', () => {
      expect(shouldPufferfishDepart(9)).toBe(false);
    });
  });

  describe('shouldUnlockSakabambaspis', () => {
    it('returns true at exactly 10 clears', () => {
      expect(shouldUnlockSakabambaspis(10)).toBe(true);
    });

    it('returns false below 10', () => {
      expect(shouldUnlockSakabambaspis(9)).toBe(false);
    });

    it('returns true above 10', () => {
      expect(shouldUnlockSakabambaspis(11)).toBe(true);
    });
  });
});
