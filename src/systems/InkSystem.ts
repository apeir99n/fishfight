const INK_ACTIVE_DURATION = 0.8;  // ink cloud lingers for 0.8s
const INK_STUN_DURATION = 5;     // enemy frozen for 5s
const INK_COOLDOWN = 12;         // 12s between uses
const INK_RANGE = 130;           // px range of ink blast

export interface InkState {
  enabled: boolean;
  active: boolean;
  activeTimer: number;
  cooldownTimer: number;
  stunDuration: number;
  range: number;
}

export function createInkState(enabled: boolean): InkState {
  return {
    enabled,
    active: false,
    activeTimer: 0,
    cooldownTimer: 0,
    stunDuration: INK_STUN_DURATION,
    range: INK_RANGE,
  };
}

export function triggerInk(state: InkState): InkState {
  if (!state.enabled) return state;
  if (state.active) return state;
  if (state.cooldownTimer > 0) return state;
  return {
    ...state,
    active: true,
    activeTimer: INK_ACTIVE_DURATION,
  };
}

export function updateInk(state: InkState, dt: number): InkState {
  if (!state.enabled) return state;

  if (state.active) {
    const remaining = state.activeTimer - dt;
    if (remaining <= 0) {
      const leftover = -remaining;
      return {
        ...state,
        active: false,
        activeTimer: 0,
        cooldownTimer: Math.max(0, INK_COOLDOWN - leftover),
      };
    }
    return { ...state, activeTimer: remaining };
  }

  if (state.cooldownTimer > 0) {
    return { ...state, cooldownTimer: Math.max(0, state.cooldownTimer - dt) };
  }

  return state;
}

export function isInkActive(state: InkState): boolean {
  return state.active;
}

export function isInkOnCooldown(state: InkState): boolean {
  return state.cooldownTimer > 0;
}
