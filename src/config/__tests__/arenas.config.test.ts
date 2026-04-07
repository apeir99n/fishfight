import { describe, it, expect } from 'vitest';
import { getArena, getAllArenas, type ArenaDef } from '../arenas.config';

describe('Arenas Config', () => {
  describe('getArena', () => {
    it('returns Sea arena definition', () => {
      const arena = getArena('sea');
      expect(arena).toBeDefined();
      expect(arena!.id).toBe('sea');
      expect(arena!.name).toBe('Sea');
      expect(arena!.bgColor).toBe('#1a3a5c');
      expect(arena!.floorColor).toBeDefined();
      expect(arena!.koZones).toBeDefined();
      expect(arena!.koZones.left).toBeLessThan(0);
      expect(arena!.koZones.right).toBeGreaterThan(800);
      expect(arena!.koZones.top).toBeLessThan(0);
    });

    it('returns undefined for unknown arena', () => {
      expect(getArena('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllArenas', () => {
    it('returns at least 1 arena', () => {
      expect(getAllArenas().length).toBeGreaterThanOrEqual(1);
    });

    it('Sea arena has visual layers', () => {
      const sea = getArena('sea')!;
      expect(sea.layers.length).toBeGreaterThan(0);
    });
  });
});
