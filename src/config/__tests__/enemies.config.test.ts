import { describe, it, expect } from 'vitest';
import {
  getEnemy,
  getAllEnemies,
  getHumanEnemies,
  type EnemyDef,
} from '../enemies.config';

describe('Enemies Config', () => {
  describe('getEnemy', () => {
    it('returns Fisherman enemy definition', () => {
      const e = getEnemy('fisherman');
      expect(e).toBeDefined();
      expect(e!.id).toBe('fisherman');
      expect(e!.name).toBe('Fisherman');
      expect(e!.type).toBe('human');
      expect(e!.hp).toBeGreaterThan(100); // humans are tougher
      expect(e!.attacks.length).toBeGreaterThanOrEqual(2);
      expect(e!.scale).toBeGreaterThan(3); // larger than fish
    });

    it('returns Diver enemy definition', () => {
      const e = getEnemy('diver');
      expect(e).toBeDefined();
      expect(e!.id).toBe('diver');
      expect(e!.name).toBe('Diver');
      expect(e!.type).toBe('human');
      expect(e!.attacks.length).toBeGreaterThanOrEqual(2);
    });

    it('returns Sushi Master enemy definition', () => {
      const e = getEnemy('sushi_master');
      expect(e).toBeDefined();
      expect(e!.id).toBe('sushi_master');
      expect(e!.name).toBe('Sushi Master');
      expect(e!.type).toBe('human');
      expect(e!.hp).toBeGreaterThan(100);
      expect(e!.attacks.length).toBeGreaterThanOrEqual(2);
    });

    it('returns undefined for unknown enemy', () => {
      expect(getEnemy('nonexistent')).toBeUndefined();
    });
  });

  describe('enemy attacks', () => {
    it('Fisherman has rod swing and hook throw', () => {
      const e = getEnemy('fisherman')!;
      const names = e.attacks.map(a => a.name);
      expect(names).toContain('Rod Swing');
      expect(names).toContain('Hook Throw');
    });

    it('Diver has harpoon thrust and net throw', () => {
      const e = getEnemy('diver')!;
      const names = e.attacks.map(a => a.name);
      expect(names).toContain('Harpoon Thrust');
      expect(names).toContain('Net Throw');
    });

    it('Sushi Master has knife slash and cleaver chop', () => {
      const e = getEnemy('sushi_master')!;
      const names = e.attacks.map(a => a.name);
      expect(names).toContain('Knife Slash');
      expect(names).toContain('Cleaver Chop');
    });

    it('each attack has damage and knockback', () => {
      for (const enemy of getAllEnemies()) {
        for (const atk of enemy.attacks) {
          expect(atk.damage).toBeGreaterThan(0);
          expect(atk.knockback).toBeGreaterThan(0);
          expect(atk.speed).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('getAllEnemies', () => {
    it('returns at least 3 enemies', () => {
      expect(getAllEnemies().length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getHumanEnemies', () => {
    it('returns only human type enemies', () => {
      const humans = getHumanEnemies();
      expect(humans.length).toBe(3);
      expect(humans.every(e => e.type === 'human')).toBe(true);
    });
  });
});
