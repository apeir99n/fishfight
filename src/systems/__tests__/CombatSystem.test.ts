import { describe, it, expect } from 'vitest';
import {
  createCombatState,
  startAttack,
  updateAttack,
  applyBlock,
  calculateDamage,
  calculateKnockback,
  applyDamage,
  checkKO,
  registerHit,
  AttackType,
  type CombatState,
} from '../CombatSystem';

describe('CombatSystem', () => {
  describe('createCombatState', () => {
    it('creates a combat state with full HP', () => {
      const state = createCombatState();
      expect(state.hp).toBe(200);
      expect(state.maxHp).toBe(200);
      expect(state.isAttacking).toBe(false);
      expect(state.isBlocking).toBe(false);
      expect(state.currentAttack).toBeNull();
      expect(state.attackTimer).toBe(0);
      expect(state.isKO).toBe(false);
    });
  });

  describe('startAttack', () => {
    it('starts a light attack', () => {
      const state = createCombatState();
      const result = startAttack(state, AttackType.Light);
      expect(result.isAttacking).toBe(true);
      expect(result.currentAttack).toBe(AttackType.Light);
      expect(result.attackTimer).toBeGreaterThan(0);
    });

    it('starts a heavy attack with longer duration', () => {
      const light = startAttack(createCombatState(), AttackType.Light);
      const heavy = startAttack(createCombatState(), AttackType.Heavy);
      expect(heavy.attackTimer).toBeGreaterThan(light.attackTimer);
    });

    it('starts a special attack', () => {
      const state = createCombatState();
      const result = startAttack(state, AttackType.Special);
      expect(result.isAttacking).toBe(true);
      expect(result.currentAttack).toBe(AttackType.Special);
    });

    it('cannot start attack while already attacking', () => {
      const state = startAttack(createCombatState(), AttackType.Light);
      const result = startAttack(state, AttackType.Heavy);
      expect(result.currentAttack).toBe(AttackType.Light); // unchanged
    });

    it('cannot attack while blocking', () => {
      let state = createCombatState();
      state = applyBlock(state, true);
      const result = startAttack(state, AttackType.Light);
      expect(result.isAttacking).toBe(false);
    });
  });

  describe('updateAttack', () => {
    it('counts down attack timer', () => {
      const state = startAttack(createCombatState(), AttackType.Light);
      const initial = state.attackTimer;
      const result = updateAttack(state, 0.1);
      expect(result.attackTimer).toBeLessThan(initial);
    });

    it('ends attack when timer reaches zero', () => {
      let state = startAttack(createCombatState(), AttackType.Light);
      // Tick enough to finish
      state = updateAttack(state, 10);
      expect(state.isAttacking).toBe(false);
      expect(state.currentAttack).toBeNull();
      expect(state.attackTimer).toBe(0);
    });
  });

  describe('applyBlock', () => {
    it('activates blocking', () => {
      const state = createCombatState();
      const result = applyBlock(state, true);
      expect(result.isBlocking).toBe(true);
    });

    it('deactivates blocking', () => {
      let state = createCombatState();
      state = applyBlock(state, true);
      const result = applyBlock(state, false);
      expect(result.isBlocking).toBe(false);
    });

    it('cannot block while attacking', () => {
      const state = startAttack(createCombatState(), AttackType.Light);
      const result = applyBlock(state, true);
      expect(result.isBlocking).toBe(false);
    });
  });

  describe('calculateDamage', () => {
    it('light attack does low damage', () => {
      const dmg = calculateDamage(AttackType.Light, false);
      expect(dmg).toBe(5);
    });

    it('heavy attack does high damage', () => {
      const dmg = calculateDamage(AttackType.Heavy, false);
      expect(dmg).toBe(15);
    });

    it('special attack does medium damage', () => {
      const dmg = calculateDamage(AttackType.Special, false);
      expect(dmg).toBe(10);
    });

    it('blocking reduces damage by 65%', () => {
      const normal = calculateDamage(AttackType.Heavy, false);
      const blocked = calculateDamage(AttackType.Heavy, true);
      expect(blocked).toBe(normal * 0.35);
    });
  });

  describe('calculateKnockback', () => {
    it('knockback is base amount at full HP', () => {
      const kb = calculateKnockback(AttackType.Light, 100, 100);
      expect(kb).toBe(50); // base knockback for light
    });

    it('knockback doubles at zero HP', () => {
      const kb = calculateKnockback(AttackType.Light, 0, 100);
      expect(kb).toBe(100); // 50 * (1 + (100-0)/100) = 50 * 2
    });

    it('knockback scales proportionally with damage taken', () => {
      const kbFull = calculateKnockback(AttackType.Heavy, 100, 100);
      const kbHalf = calculateKnockback(AttackType.Heavy, 50, 100);
      const kbLow = calculateKnockback(AttackType.Heavy, 20, 100);
      expect(kbHalf).toBeGreaterThan(kbFull);
      expect(kbLow).toBeGreaterThan(kbHalf);
    });

    it('heavy attack has more base knockback than light', () => {
      const kbLight = calculateKnockback(AttackType.Light, 100, 100);
      const kbHeavy = calculateKnockback(AttackType.Heavy, 100, 100);
      expect(kbHeavy).toBeGreaterThan(kbLight);
    });
  });

  describe('applyDamage', () => {
    it('reduces HP by damage amount', () => {
      const state = createCombatState();
      const result = applyDamage(state, 20);
      expect(result.hp).toBe(180); // 200 - 20
    });

    it('HP does not go below zero', () => {
      const state = createCombatState();
      const result = applyDamage(state, 999);
      expect(result.hp).toBe(0);
    });
  });

  describe('checkKO', () => {
    it('no KO when fighter is within arena bounds', () => {
      expect(checkKO(400, 200, 0, 800, -100)).toBe(false);
    });

    it('KO when fighter exits right side', () => {
      expect(checkKO(400, 850, 0, 800, -100)).toBe(true);
    });

    it('KO when fighter exits left side', () => {
      expect(checkKO(400, -50, 0, 800, -100)).toBe(true);
    });

    it('KO when fighter exits top', () => {
      expect(checkKO(-150, 400, 0, 800, -100)).toBe(true);
    });

    it('no KO at exactly the boundary', () => {
      expect(checkKO(400, 800, 0, 800, -100)).toBe(false);
    });
  });

  describe('hit registration (one hit per swing)', () => {
    it('createCombatState starts with hasHit false', () => {
      const state = createCombatState();
      expect(state.hasHit).toBe(false);
    });

    it('startAttack resets hasHit to false', () => {
      // Simulate a state where the previous swing already registered its hit
      // and has since finished (isAttacking=false).
      const stale: CombatState = {
        ...createCombatState(),
        hasHit: true,
      };
      const result = startAttack(stale, AttackType.Light);
      expect(result.isAttacking).toBe(true);
      expect(result.hasHit).toBe(false);
    });

    it('registerHit marks the current swing as connected', () => {
      let state = startAttack(createCombatState(), AttackType.Heavy);
      expect(state.hasHit).toBe(false);
      state = registerHit(state);
      expect(state.hasHit).toBe(true);
    });

    it('registerHit is idempotent across repeated calls in one swing', () => {
      let state = startAttack(createCombatState(), AttackType.Heavy);
      state = registerHit(state);
      state = registerHit(state);
      state = registerHit(state);
      expect(state.hasHit).toBe(true);
    });

    it('a fresh attack after a connected swing has hasHit=false again', () => {
      let state = startAttack(createCombatState(), AttackType.Light);
      state = registerHit(state);
      // Finish the current swing.
      state = updateAttack(state, 10);
      expect(state.isAttacking).toBe(false);
      // Next swing must be a clean slate.
      state = startAttack(state, AttackType.Heavy);
      expect(state.hasHit).toBe(false);
    });
  });

  describe('integration: combat flow', () => {
    it('full attack-damage-knockback cycle', () => {
      let attacker = createCombatState();
      let defender = createCombatState();

      // Attacker starts light attack
      attacker = startAttack(attacker, AttackType.Light);
      expect(attacker.isAttacking).toBe(true);

      // Attack hits — calculate damage and knockback
      const damage = calculateDamage(AttackType.Light, defender.isBlocking);
      defender = applyDamage(defender, damage);
      expect(defender.hp).toBe(195); // 200 - 5

      const kb = calculateKnockback(AttackType.Light, defender.hp, defender.maxHp);
      expect(kb).toBeGreaterThan(50); // slightly more than base since HP < max
    });

    it('blocking reduces incoming damage', () => {
      let defender = createCombatState();
      defender = applyBlock(defender, true);

      const damage = calculateDamage(AttackType.Heavy, defender.isBlocking);
      defender = applyDamage(defender, damage);
      expect(defender.hp).toBe(194.75); // 200 - 15*0.35
    });

    it('low HP fighter gets knocked out of arena', () => {
      let defender = createCombatState();
      // Take lots of damage
      defender = applyDamage(defender, 190);
      expect(defender.hp).toBe(10); // 200 - 190

      // At 10 HP, knockback for heavy = 120 * (1 + (200-10)/200) = 120 * 1.95 ≈ 234
      const kb = calculateKnockback(AttackType.Heavy, defender.hp, defender.maxHp);
      expect(kb).toBeGreaterThan(200);
    });
  });
});
