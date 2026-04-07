import { describe, it, expect } from 'vitest';
import {
  getQuote,
  type PersonalityLevel,
  type QuoteSituation,
} from '../PersonalitySystem';

describe('PersonalitySystem', () => {
  describe('getQuote', () => {
    it('returns a quote for kind + pre-fight', () => {
      const q = getQuote('kind', 'pre_fight');
      expect(q).toBeTruthy();
      expect(typeof q).toBe('string');
    });

    it('returns a quote for bold + pre-fight', () => {
      const q = getQuote('bold', 'pre_fight');
      expect(q).toBeTruthy();
    });

    it('returns a quote for neutral + pre-fight', () => {
      const q = getQuote('neutral', 'pre_fight');
      expect(q).toBeTruthy();
    });

    it('returns a quote for kind + victory', () => {
      const q = getQuote('kind', 'victory');
      expect(q).toBeTruthy();
    });

    it('returns a quote for bold + victory', () => {
      const q = getQuote('bold', 'victory');
      expect(q).toBeTruthy();
    });

    it('returns a quote for kind + defeat', () => {
      const q = getQuote('kind', 'defeat');
      expect(q).toBeTruthy();
    });

    it('returns a quote for bold + defeat', () => {
      const q = getQuote('bold', 'defeat');
      expect(q).toBeTruthy();
    });

    it('kind and bold quotes are different for same situation', () => {
      // Run multiple times — at least one pair should differ
      let foundDiff = false;
      for (let i = 0; i < 20; i++) {
        const k = getQuote('kind', 'pre_fight');
        const b = getQuote('bold', 'pre_fight');
        if (k !== b) { foundDiff = true; break; }
      }
      expect(foundDiff).toBe(true);
    });

    it('covers all 3 situations x 3 levels = 9 combos', () => {
      const levels: PersonalityLevel[] = ['kind', 'neutral', 'bold'];
      const situations: QuoteSituation[] = ['pre_fight', 'victory', 'defeat'];
      for (const level of levels) {
        for (const sit of situations) {
          expect(getQuote(level, sit)).toBeTruthy();
        }
      }
    });
  });
});
