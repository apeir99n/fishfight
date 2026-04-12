const POISON_ACTIVE_DURATION = 0.5; // cloud lingers for 0.5s
const POISON_STUN_DURATION = 2;    // enemy stunned for 2s
const POISON_COOLDOWN = 8;         // 8s between uses
const POISON_RANGE = 120;          // px range of poison cloud

export interface PoisonState {
  enabled: boolean;
  active: boolean;
  activeTimer: number;
  cooldownTimer: number;
  stunDuration: number;
  range: number;
}

export function createPoisonState(enabled: boolean): PoisonState {
  return {
    enabled,
    active: false,
    activeTimer: 0,
    cooldownTimer: 0,
    stunDuration: POISON_STUN_DURATION,
    range: POISON_RANGE,
  };
}

export function triggerPoison(state: PoisonState): PoisonState {
  if (!state.enabled) return state;
  if (state.active) return state;
  if (state.cooldownTimer > 0) return state;
  return {
    ...state,
    active: true,
    activeTimer: POISON_ACTIVE_DURATION,
  };
}

export function updatePoison(state: PoisonState, dt: number): PoisonState {
  if (!state.enabled) return state;

  if (state.active) {
    const remaining = state.activeTimer - dt;
    if (remaining <= 0) {
      const leftover = -remaining;
      return {
        ...state,
        active: false,
        activeTimer: 0,
        cooldownTimer: Math.max(0, POISON_COOLDOWN - leftover),
      };
    }
    return { ...state, activeTimer: remaining };
  }

  if (state.cooldownTimer > 0) {
    return { ...state, cooldownTimer: Math.max(0, state.cooldownTimer - dt) };
  }

  return state;
}

export function isPoisonActive(state: PoisonState): boolean {
  return state.active;
}

export function isPoisonOnCooldown(state: PoisonState): boolean {
  return state.cooldownTimer > 0;
}
