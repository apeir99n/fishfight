import { describe, it, expect } from 'vitest';
import {
  createFighterState,
  moveLeft,
  moveRight,
  jump,
  applyGravity,
  applyFloorCollision,
  applyHitstun,
  updateHitstun,
  isInHitstun,
  type FighterState,
} from '../MovementSystem';

describe('MovementSystem', () => {
  describe('createFighterState', () => {
    it('creates a fighter at given position', () => {
      const state = createFighterState(100, 300);
      expect(state.x).toBe(100);
      expect(state.y).toBe(300);
      expect(state.velocityX).toBe(0);
      expect(state.velocityY).toBe(0);
      expect(state.isOnGround).toBe(false);
      expect(state.facingRight).toBe(true);
    });
  });

  describe('moveLeft', () => {
    it('sets negative horizontal velocity and faces left', () => {
      const state = createFighterState(100, 300);
      const result = moveLeft(state);
      expect(result.velocityX).toBeLessThan(0);
      expect(result.facingRight).toBe(false);
    });
  });

  describe('moveRight', () => {
    it('sets positive horizontal velocity and faces right', () => {
      const state = createFighterState(100, 300);
      const result = moveRight(state);
      expect(result.velocityX).toBeGreaterThan(0);
      expect(result.facingRight).toBe(true);
    });
  });

  describe('jump', () => {
    it('applies upward velocity when on ground', () => {
      const state = createFighterState(100, 300);
      state.isOnGround = true;
      const result = jump(state);
      expect(result.velocityY).toBeLessThan(0);
      expect(result.isOnGround).toBe(false);
    });

    it('does NOT allow double jump (no jump when airborne)', () => {
      const state = createFighterState(100, 300);
      state.isOnGround = false;
      state.velocityY = -100;
      const result = jump(state);
      expect(result.velocityY).toBe(-100); // unchanged
    });
  });

  describe('applyGravity', () => {
    it('increases downward velocity over time', () => {
      const state = createFighterState(100, 200);
      state.velocityY = 0;
      const dt = 1 / 60;
      const result = applyGravity(state, dt);
      expect(result.velocityY).toBeGreaterThan(0);
    });

    it('does not apply gravity when on ground', () => {
      const state = createFighterState(100, 400);
      state.isOnGround = true;
      state.velocityY = 0;
      const dt = 1 / 60;
      const result = applyGravity(state, dt);
      expect(result.velocityY).toBe(0);
    });
  });

  describe('applyFloorCollision', () => {
    it('stops fighter at floor and sets isOnGround', () => {
      const floorY = 400;
      const state = createFighterState(100, 410); // below floor
      state.velocityY = 100;
      const result = applyFloorCollision(state, floorY);
      expect(result.y).toBe(floorY);
      expect(result.velocityY).toBe(0);
      expect(result.isOnGround).toBe(true);
    });

    it('does not affect fighter above floor', () => {
      const floorY = 400;
      const state = createFighterState(100, 300);
      state.velocityY = 50;
      const result = applyFloorCollision(state, floorY);
      expect(result.y).toBe(300);
      expect(result.velocityY).toBe(50);
      expect(result.isOnGround).toBe(false);
    });
  });

  describe('hitstun', () => {
    it('applyHitstun sets hitstun timer and knockback velocity', () => {
      let state = createFighterState(400, 400);
      state.isOnGround = true;
      state = applyHitstun(state, 300, -100, 0.3);
      expect(state.hitstunTimer).toBeCloseTo(0.3);
      expect(state.velocityX).toBe(300);
      expect(state.velocityY).toBe(-100);
      expect(state.isOnGround).toBe(false);
    });

    it('isInHitstun returns true during hitstun', () => {
      let state = createFighterState(400, 400);
      state = applyHitstun(state, 300, -100, 0.3);
      expect(isInHitstun(state)).toBe(true);
    });

    it('isInHitstun returns false when no hitstun', () => {
      const state = createFighterState(400, 400);
      expect(isInHitstun(state)).toBe(false);
    });

    it('movement input is ignored during hitstun', () => {
      let state = createFighterState(400, 400);
      state = applyHitstun(state, 300, -100, 0.3);
      const moved = moveLeft(state);
      // velocityX should NOT change to move speed — hitstun overrides
      expect(moved.velocityX).toBe(300);
    });

    it('jump is ignored during hitstun', () => {
      let state = createFighterState(400, 400);
      state.isOnGround = true;
      state = applyHitstun(state, 300, -100, 0.3);
      const jumped = jump(state);
      expect(jumped.velocityY).toBe(-100); // unchanged
    });

    it('updateHitstun decrements timer', () => {
      let state = createFighterState(400, 400);
      state = applyHitstun(state, 300, -100, 0.3);
      state = updateHitstun(state, 0.1);
      expect(state.hitstunTimer).toBeCloseTo(0.2);
      expect(isInHitstun(state)).toBe(true);
    });

    it('hitstun ends when timer reaches 0', () => {
      let state = createFighterState(400, 400);
      state = applyHitstun(state, 300, -100, 0.3);
      state = updateHitstun(state, 0.5);
      expect(state.hitstunTimer).toBe(0);
      expect(isInHitstun(state)).toBe(false);
    });

    it('fighter carries momentum during hitstun and can exit arena', () => {
      let state = createFighterState(750, 400);
      state.isOnGround = true;
      // Heavy knockback to the right
      state = applyHitstun(state, 600, -80, 0.4);

      // Simulate a few frames
      const dt = 1 / 60;
      for (let i = 0; i < 30; i++) {
        state = updateHitstun(state, dt);
        state = applyGravity(state, dt);
        state.x += state.velocityX * dt;
        state.y += state.velocityY * dt;
      }

      // Should have moved significantly past 800
      expect(state.x).toBeGreaterThan(850);
    });
  });

  describe('integration: full movement tick', () => {
    it('fighter falls from air and lands on floor', () => {
      let state = createFighterState(100, 200);
      const floorY = 400;
      const dt = 1 / 60;

      // Simulate 120 frames (2 seconds) — should land
      for (let i = 0; i < 120; i++) {
        state = applyGravity(state, dt);
        state.y += state.velocityY * dt;
        state = applyFloorCollision(state, floorY);
      }

      expect(state.y).toBe(floorY);
      expect(state.isOnGround).toBe(true);
      expect(state.velocityY).toBe(0);
    });

    it('fighter jumps and returns to ground', () => {
      let state = createFighterState(100, 400);
      state.isOnGround = true;
      const floorY = 400;
      const dt = 1 / 60;

      // Jump
      state = jump(state);
      expect(state.velocityY).toBeLessThan(0);

      // Simulate until landing
      for (let i = 0; i < 120; i++) {
        state = applyGravity(state, dt);
        state.y += state.velocityY * dt;
        state = applyFloorCollision(state, floorY);
        if (state.isOnGround) break;
      }

      expect(state.isOnGround).toBe(true);
      expect(state.y).toBe(floorY);
    });
  });
});
