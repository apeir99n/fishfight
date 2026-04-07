import { describe, it, expect } from 'vitest';
import {
  getWeapon,
  getAllWeapons,
  createWeaponState,
  fireWeapon,
  updateProjectiles,
  checkProjectileHit,
  type WeaponDef,
  type WeaponState,
  type Projectile,
} from '../WeaponSystem';

describe('WeaponSystem', () => {
  describe('getWeapon', () => {
    it('returns Toy Fish weapon definition', () => {
      const w = getWeapon('toy_fish');
      expect(w).toBeDefined();
      expect(w!.id).toBe('toy_fish');
      expect(w!.name).toBe('Toy Fish');
      expect(w!.type).toBe('melee');
      expect(w!.damage).toBe(10);
      expect(w!.range).toBe(50);
      expect(w!.attackSpeed).toBeCloseTo(0.3);
      expect(w!.knockback).toBe(60);
    });

    it('returns Pufferfish Cannon weapon definition', () => {
      const w = getWeapon('pufferfish_cannon');
      expect(w).toBeDefined();
      expect(w!.id).toBe('pufferfish_cannon');
      expect(w!.name).toBe('Pufferfish Cannon');
      expect(w!.type).toBe('ranged');
      expect(w!.damage).toBe(8);
      expect(w!.projectileSpeed).toBe(400);
      expect(w!.cooldown).toBe(1);
    });

    it('returns undefined for unknown weapon', () => {
      expect(getWeapon('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllWeapons', () => {
    it('returns at least 2 weapons', () => {
      expect(getAllWeapons().length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('createWeaponState', () => {
    it('creates weapon state with no cooldown', () => {
      const state = createWeaponState('toy_fish');
      expect(state.weaponId).toBe('toy_fish');
      expect(state.cooldownRemaining).toBe(0);
      expect(state.projectiles).toEqual([]);
    });
  });

  describe('fireWeapon — melee (Toy Fish)', () => {
    it('melee weapon does not create projectiles', () => {
      let state = createWeaponState('toy_fish');
      const result = fireWeapon(state, 100, 300, true);
      expect(result.state.projectiles).toEqual([]);
    });

    it('returns hit info for melee within range', () => {
      let state = createWeaponState('toy_fish');
      const result = fireWeapon(state, 100, 300, true);
      expect(result.meleeHit).toBeDefined();
      expect(result.meleeHit!.damage).toBe(10);
      expect(result.meleeHit!.knockback).toBe(60);
      expect(result.meleeHit!.rangeX).toBe(50);
    });

    it('sets cooldown after firing', () => {
      let state = createWeaponState('toy_fish');
      const result = fireWeapon(state, 100, 300, true);
      expect(result.state.cooldownRemaining).toBeGreaterThan(0);
    });

    it('cannot fire during cooldown', () => {
      let state = createWeaponState('toy_fish');
      const first = fireWeapon(state, 100, 300, true);
      const second = fireWeapon(first.state, 100, 300, true);
      expect(second.meleeHit).toBeNull();
    });
  });

  describe('fireWeapon — ranged (Pufferfish Cannon)', () => {
    it('creates a projectile when fired', () => {
      let state = createWeaponState('pufferfish_cannon');
      const result = fireWeapon(state, 100, 300, true);
      expect(result.state.projectiles.length).toBe(1);
    });

    it('projectile has correct position and direction', () => {
      let state = createWeaponState('pufferfish_cannon');
      const result = fireWeapon(state, 100, 300, true);
      const proj = result.state.projectiles[0];
      expect(proj.x).toBe(100);
      expect(proj.y).toBe(300);
      expect(proj.velocityX).toBeGreaterThan(0); // facing right
      expect(proj.damage).toBe(8);
    });

    it('projectile goes left when facing left', () => {
      let state = createWeaponState('pufferfish_cannon');
      const result = fireWeapon(state, 100, 300, false);
      const proj = result.state.projectiles[0];
      expect(proj.velocityX).toBeLessThan(0);
    });

    it('sets cooldown after firing', () => {
      let state = createWeaponState('pufferfish_cannon');
      const result = fireWeapon(state, 100, 300, true);
      expect(result.state.cooldownRemaining).toBe(1);
    });

    it('no melee hit for ranged weapon', () => {
      let state = createWeaponState('pufferfish_cannon');
      const result = fireWeapon(state, 100, 300, true);
      expect(result.meleeHit).toBeNull();
    });
  });

  describe('updateProjectiles', () => {
    it('moves projectiles by velocity * dt', () => {
      let state = createWeaponState('pufferfish_cannon');
      const fired = fireWeapon(state, 100, 300, true);
      const updated = updateProjectiles(fired.state, 0.1, 800);
      expect(updated.projectiles[0].x).toBeCloseTo(100 + 400 * 0.1);
    });

    it('removes projectiles that leave the arena', () => {
      let state = createWeaponState('pufferfish_cannon');
      const fired = fireWeapon(state, 750, 300, true);
      // Move far enough to exit arena (width 800)
      const updated = updateProjectiles(fired.state, 2, 800);
      expect(updated.projectiles.length).toBe(0);
    });

    it('reduces cooldown over time', () => {
      let state = createWeaponState('pufferfish_cannon');
      const fired = fireWeapon(state, 100, 300, true);
      expect(fired.state.cooldownRemaining).toBe(1);
      const updated = updateProjectiles(fired.state, 0.5, 800);
      expect(updated.cooldownRemaining).toBeCloseTo(0.5);
    });

    it('cooldown does not go below zero', () => {
      let state = createWeaponState('pufferfish_cannon');
      const fired = fireWeapon(state, 100, 300, true);
      const updated = updateProjectiles(fired.state, 5, 800);
      expect(updated.cooldownRemaining).toBe(0);
    });
  });

  describe('checkProjectileHit', () => {
    it('returns true when projectile is within hit radius of target', () => {
      const proj: Projectile = { x: 200, y: 300, velocityX: 400, damage: 8, knockback: 50 };
      expect(checkProjectileHit(proj, 210, 300, 20)).toBe(true);
    });

    it('returns false when projectile is far from target', () => {
      const proj: Projectile = { x: 200, y: 300, velocityX: 400, damage: 8, knockback: 50 };
      expect(checkProjectileHit(proj, 500, 300, 20)).toBe(false);
    });

    it('considers Y distance too', () => {
      const proj: Projectile = { x: 200, y: 100, velocityX: 400, damage: 8, knockback: 50 };
      expect(checkProjectileHit(proj, 200, 300, 20)).toBe(false);
    });
  });
});
