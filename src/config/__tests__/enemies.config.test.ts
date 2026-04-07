import { describe, it, expect } from 'vitest';
import {
  getEnemy,
  getAllEnemies,
  getHumanEnemies,
  getBossPhase,
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
      expect(e!.hp).toBeGreaterThan(100);
      expect(e!.attacks.length).toBeGreaterThanOrEqual(2);
      expect(e!.scale).toBeGreaterThan(3);
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

    it('returns Mega-Fish boss definition', () => {
      const e = getEnemy('mega_fish');
      expect(e).toBeDefined();
      expect(e!.id).toBe('mega_fish');
      expect(e!.name).toBe('Mega-Fish');
      expect(e!.type).toBe('boss');
      expect(e!.hp).toBe(200); // 2x normal — balanced for fair fights
      expect(e!.scale).toBeGreaterThanOrEqual(5);
      expect(e!.attacks.length).toBeGreaterThanOrEqual(3);
    });

    it('returns The Chef boss definition', () => {
      const e = getEnemy('chef');
      expect(e).toBeDefined();
      expect(e!.id).toBe('chef');
      expect(e!.name).toBe('The Chef');
      expect(e!.type).toBe('boss');
      expect(e!.hp).toBe(350);
      expect(e!.scale).toBeGreaterThanOrEqual(5);
      expect(e!.attacks.length).toBeGreaterThanOrEqual(5);
    });

    it('returns undefined for unknown enemy', () => {
      expect(getEnemy('nonexistent')).toBeUndefined();
    });
  });

  describe('The Chef attacks', () => {
    it('has at least 5 unique attacks', () => {
      const e = getEnemy('chef')!;
      expect(e.attacks.length).toBeGreaterThanOrEqual(5);
      const names = e.attacks.map(a => a.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('has melee and ranged attacks', () => {
      const e = getEnemy('chef')!;
      const types = e.attacks.map(a => a.type);
      expect(types).toContain('melee');
      expect(types).toContain('ranged');
    });

    it('deals more damage than Mega-Fish', () => {
      const chef = getEnemy('chef')!;
      const mega = getEnemy('mega_fish')!;
      const chefMax = Math.max(...chef.attacks.map(a => a.damage));
      const megaMax = Math.max(...mega.attacks.map(a => a.damage));
      expect(chefMax).toBeGreaterThan(megaMax);
    });
  });

  describe('Mega-Fish attacks', () => {
    it('has at least 3 unique attacks', () => {
      const e = getEnemy('mega_fish')!;
      expect(e.attacks.length).toBeGreaterThanOrEqual(3);
      const names = e.attacks.map(a => a.name);
      expect(new Set(names).size).toBe(names.length); // all unique
    });

    it('has both melee and ranged attacks', () => {
      const e = getEnemy('mega_fish')!;
      const types = e.attacks.map(a => a.type);
      expect(types).toContain('melee');
      expect(types).toContain('ranged');
    });

    it('deals more damage than regular enemies', () => {
      const mega = getEnemy('mega_fish')!;
      const fisherman = getEnemy('fisherman')!;
      const megaMaxDmg = Math.max(...mega.attacks.map(a => a.damage));
      const fishermanMaxDmg = Math.max(...fisherman.attacks.map(a => a.damage));
      expect(megaMaxDmg).toBeGreaterThan(fishermanMaxDmg);
    });
  });

  describe('getBossPhase', () => {
    it('phase 1 (normal) when HP > 60% for 2-phase boss', () => {
      const phase = getBossPhase(200, 300, 2);
      expect(phase).toBe(1);
    });

    it('phase 2 (enrage) when HP <= 30% for 2-phase boss', () => {
      const phase = getBossPhase(90, 300, 2);
      expect(phase).toBe(2);
    });

    it('phase 1 when HP > 60% for 3-phase boss', () => {
      const phase = getBossPhase(350, 500, 3);
      expect(phase).toBe(1);
    });

    it('phase 2 when HP 30-60% for 3-phase boss', () => {
      const phase = getBossPhase(200, 500, 3);
      expect(phase).toBe(2);
    });

    it('phase 3 when HP <= 30% for 3-phase boss', () => {
      const phase = getBossPhase(100, 500, 3);
      expect(phase).toBe(3);
    });

    it('defaults to 2-phase if totalPhases not specified', () => {
      expect(getBossPhase(200, 300)).toBe(1);
      expect(getBossPhase(80, 300)).toBe(2);
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

  describe('difficulty balance', () => {
    it('boss max damage should not exceed 20% of player HP (120)', () => {
      const megaFish = getEnemy('mega_fish')!;
      const chef = getEnemy('chef')!;
      // No single boss hit should deal more than 24 dmg (20% of 120 HP)
      for (const atk of megaFish.attacks) {
        expect(atk.damage).toBeLessThanOrEqual(24);
      }
      for (const atk of chef.attacks) {
        expect(atk.damage).toBeLessThanOrEqual(24);
      }
    });

    it('human enemy max damage should not exceed 15% of player HP (120)', () => {
      for (const enemy of getHumanEnemies()) {
        for (const atk of enemy.attacks) {
          expect(atk.damage).toBeLessThanOrEqual(18);
        }
      }
    });

    it('AI level bonuses should be at most 1', () => {
      for (const enemy of getAllEnemies()) {
        expect(enemy.aiLevelBonus).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('getAllEnemies', () => {
    it('returns at least 4 enemies', () => {
      expect(getAllEnemies().length).toBeGreaterThanOrEqual(4);
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
