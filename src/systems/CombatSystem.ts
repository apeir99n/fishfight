import { COMBAT } from '../config/game.config';

export enum AttackType {
  Light = 'light',
  Heavy = 'heavy',
  Special = 'special',
}

const ATTACK_DURATIONS: Record<AttackType, number> = {
  [AttackType.Light]: 0.25,
  [AttackType.Heavy]: 0.65,
  [AttackType.Special]: 0.4,
};

const ATTACK_DAMAGE: Record<AttackType, number> = {
  [AttackType.Light]: COMBAT.lightAttack.damage,
  [AttackType.Heavy]: COMBAT.heavyAttack.damage,
  [AttackType.Special]: COMBAT.specialAttack.damage,
};

const ATTACK_KNOCKBACK: Record<AttackType, number> = {
  [AttackType.Light]: COMBAT.lightAttack.knockback,
  [AttackType.Heavy]: COMBAT.heavyAttack.knockback,
  [AttackType.Special]: COMBAT.specialAttack.knockback,
};

export interface CombatState {
  hp: number;
  maxHp: number;
  isAttacking: boolean;
  isBlocking: boolean;
  currentAttack: AttackType | null;
  attackTimer: number;
  isKO: boolean;
  /**
   * True once the current swing has already landed on a target. Prevents
   * the same attack from registering multiple hits across the frames it
   * spends inside the active hit window. Cleared on every startAttack().
   */
  hasHit: boolean;
}

export function createCombatState(): CombatState {
  return {
    hp: COMBAT.maxHP,
    maxHp: COMBAT.maxHP,
    isAttacking: false,
    isBlocking: false,
    currentAttack: null,
    attackTimer: 0,
    isKO: false,
    hasHit: false,
  };
}

export function startAttack(state: CombatState, attack: AttackType): CombatState {
  if (state.isAttacking || state.isBlocking) return state;
  return {
    ...state,
    isAttacking: true,
    currentAttack: attack,
    attackTimer: ATTACK_DURATIONS[attack],
    hasHit: false,
  };
}

export function registerHit(state: CombatState): CombatState {
  if (state.hasHit) return state;
  return { ...state, hasHit: true };
}

export function updateAttack(state: CombatState, dt: number): CombatState {
  if (!state.isAttacking) return state;
  const remaining = state.attackTimer - dt;
  if (remaining <= 0) {
    return { ...state, isAttacking: false, currentAttack: null, attackTimer: 0 };
  }
  return { ...state, attackTimer: remaining };
}

export function applyBlock(state: CombatState, blocking: boolean): CombatState {
  if (blocking && state.isAttacking) return state;
  return { ...state, isBlocking: blocking };
}

export function calculateDamage(attack: AttackType, isBlocking: boolean): number {
  const base = ATTACK_DAMAGE[attack];
  return isBlocking ? base * COMBAT.blockDamageReduction : base;
}

export function calculateKnockback(attack: AttackType, currentHp: number, maxHp: number): number {
  const base = ATTACK_KNOCKBACK[attack];
  return base * (1 + (maxHp - currentHp) / maxHp);
}

export function applyDamage(state: CombatState, damage: number): CombatState {
  return { ...state, hp: Math.max(0, state.hp - damage) };
}

export function checkKO(
  y: number,
  x: number,
  arenaLeft: number,
  arenaRight: number,
  arenaTop: number,
): boolean {
  return x < arenaLeft || x > arenaRight || y < arenaTop;
}
