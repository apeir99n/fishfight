import { describe, it, expect } from 'vitest';
import { getArena, getAllArenas, getArenaForFight, type ArenaDef } from '../arenas.config';

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

    it('returns Fish Market arena', () => {
      const arena = getArena('market');
      expect(arena).toBeDefined();
      expect(arena!.id).toBe('market');
      expect(arena!.name).toBe('Fish Market');
      expect(arena!.layers.length).toBeGreaterThan(0);
    });

    it('returns Ship arena', () => {
      const arena = getArena('ship');
      expect(arena).toBeDefined();
      expect(arena!.id).toBe('ship');
      expect(arena!.name).toBe('Ship');
      expect(arena!.layers.length).toBeGreaterThan(0);
    });

    it('returns Restaurant arena', () => {
      const arena = getArena('restaurant');
      expect(arena).toBeDefined();
      expect(arena!.id).toBe('restaurant');
      expect(arena!.name).toBe('Restaurant');
      expect(arena!.layers.length).toBeGreaterThan(0);
    });

    it('all arenas have distinct background colors', () => {
      const all = getAllArenas();
      const colors = all.map(a => a.bgColor);
      expect(new Set(colors).size).toBe(colors.length);
    });

    it('returns undefined for unknown arena', () => {
      expect(getArena('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllArenas', () => {
    it('returns exactly 4 arenas', () => {
      expect(getAllArenas().length).toBe(4);
    });

    it('each arena has visual layers', () => {
      for (const arena of getAllArenas()) {
        expect(arena.layers.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getArenaForFight', () => {
    it('fights 1-3 are on Sea', () => {
      expect(getArenaForFight(1)).toBe('sea');
      expect(getArenaForFight(2)).toBe('sea');
      expect(getArenaForFight(3)).toBe('sea');
    });

    it('fights 4-5 are at Fish Market', () => {
      expect(getArenaForFight(4)).toBe('market');
      expect(getArenaForFight(5)).toBe('market');
    });

    it('fights 6-7 are on Ship', () => {
      expect(getArenaForFight(6)).toBe('ship');
      expect(getArenaForFight(7)).toBe('ship');
    });

    it('fights 8-10 are at Restaurant', () => {
      expect(getArenaForFight(8)).toBe('restaurant');
      expect(getArenaForFight(9)).toBe('restaurant');
      expect(getArenaForFight(10)).toBe('restaurant');
    });
  });
});
