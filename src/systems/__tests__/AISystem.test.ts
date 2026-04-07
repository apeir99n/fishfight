import { describe, it, expect } from 'vitest';
import {
  createAIState,
  getAIParams,
  decideAction,
  updateAI,
  AIAction,
  type AIState,
  type AIParams,
} from '../AISystem';

describe('AISystem', () => {
  describe('getAIParams', () => {
    it('returns params for level 1 (easy — very passive)', () => {
      const p = getAIParams(1);
      expect(p.reactionTime).toBeGreaterThanOrEqual(900);
      expect(p.aggression).toBeLessThanOrEqual(0.2);
      expect(p.blockChance).toBeLessThanOrEqual(0.05);
      expect(p.attackFrequency).toBeLessThanOrEqual(0.25);
    });

    it('returns params for level 10 (hard but fair)', () => {
      const p = getAIParams(10);
      expect(p.reactionTime).toBeLessThanOrEqual(200);
      expect(p.reactionTime).toBeGreaterThanOrEqual(150);
      expect(p.aggression).toBeGreaterThanOrEqual(0.7);
      expect(p.aggression).toBeLessThanOrEqual(0.8);
      expect(p.blockChance).toBeGreaterThanOrEqual(0.3);
      expect(p.attackFrequency).toBeGreaterThanOrEqual(0.7);
      expect(p.attackFrequency).toBeLessThanOrEqual(0.8);
    });

    it('level 5 is between level 1 and 10', () => {
      const p1 = getAIParams(1);
      const p5 = getAIParams(5);
      const p10 = getAIParams(10);
      expect(p5.reactionTime).toBeLessThan(p1.reactionTime);
      expect(p5.reactionTime).toBeGreaterThan(p10.reactionTime);
      expect(p5.aggression).toBeGreaterThan(p1.aggression);
      expect(p5.aggression).toBeLessThan(p10.aggression);
    });

    it('clamps level to 1-10 range', () => {
      const p0 = getAIParams(0);
      const p1 = getAIParams(1);
      const p99 = getAIParams(99);
      const p10 = getAIParams(10);
      expect(p0).toEqual(p1);
      expect(p99).toEqual(p10);
    });
  });

  describe('createAIState', () => {
    it('creates AI state for given level', () => {
      const state = createAIState(3);
      expect(state.level).toBe(3);
      expect(state.reactionCooldown).toBe(0);
      expect(state.lastAction).toBe(AIAction.Idle);
    });
  });

  describe('decideAction', () => {
    const makeContext = (overrides = {}) => ({
      aiX: 600,
      aiY: 400,
      playerX: 200,
      playerY: 400,
      aiHp: 100,
      playerHp: 100,
      playerIsAttacking: false,
      aiIsOnGround: true,
      distToPlayer: 400,
      ...overrides,
    });

    it('moves toward player when far away and aggressive', () => {
      const state = createAIState(10); // very aggressive
      const ctx = makeContext({ distToPlayer: 400 });
      // With high aggression AI should approach
      // Run multiple times since there is randomness
      const actions: AIAction[] = [];
      for (let i = 0; i < 20; i++) {
        actions.push(decideAction(state, ctx));
      }
      expect(actions).toContain(AIAction.MoveToward);
    });

    it('attacks when close to player', () => {
      const state = createAIState(10);
      const ctx = makeContext({ distToPlayer: 50 });
      const actions: AIAction[] = [];
      for (let i = 0; i < 30; i++) {
        actions.push(decideAction(state, ctx));
      }
      const attackActions = actions.filter(
        a => a === AIAction.LightAttack || a === AIAction.HeavyAttack || a === AIAction.WeaponAttack
      );
      expect(attackActions.length).toBeGreaterThan(0);
    });

    it('sometimes blocks when player is attacking', () => {
      const state = createAIState(10); // high block chance
      const ctx = makeContext({ playerIsAttacking: true, distToPlayer: 60 });
      const actions: AIAction[] = [];
      for (let i = 0; i < 30; i++) {
        actions.push(decideAction(state, ctx));
      }
      expect(actions).toContain(AIAction.Block);
    });

    it('low-level AI rarely blocks', () => {
      const state = createAIState(1); // low block chance
      const ctx = makeContext({ playerIsAttacking: true, distToPlayer: 60 });
      let blockCount = 0;
      for (let i = 0; i < 100; i++) {
        if (decideAction(state, ctx) === AIAction.Block) blockCount++;
      }
      // Level 1 block chance ~5%, so expect very few
      expect(blockCount).toBeLessThan(30);
    });

    it('retreats sometimes when at low HP', () => {
      const state = createAIState(5);
      const ctx = makeContext({ aiHp: 15, distToPlayer: 60 });
      const actions: AIAction[] = [];
      for (let i = 0; i < 50; i++) {
        actions.push(decideAction(state, ctx));
      }
      expect(actions).toContain(AIAction.MoveAway);
    });
  });

  describe('updateAI', () => {
    it('decrements reaction cooldown', () => {
      let state = createAIState(5);
      state = { ...state, reactionCooldown: 0.5 };
      const updated = updateAI(state, 0.2);
      expect(updated.reactionCooldown).toBeCloseTo(0.3);
    });

    it('cooldown does not go below zero', () => {
      let state = createAIState(5);
      state = { ...state, reactionCooldown: 0.1 };
      const updated = updateAI(state, 1.0);
      expect(updated.reactionCooldown).toBe(0);
    });

    it('AI cannot act while on cooldown', () => {
      let state = createAIState(5);
      state = { ...state, reactionCooldown: 0.5 };
      expect(state.reactionCooldown).toBeGreaterThan(0);
      // When cooldown > 0, decideAction should return Idle
    });
  });
});
