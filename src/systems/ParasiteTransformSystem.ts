const TRANSFORM_DURATION = 1.0; // seconds for detachment animation

export interface ParasiteState {
  active: boolean;
  transformed: boolean;
  transforming: boolean;
  transformTimer: number;
  dragonFishActive: boolean;
}

export function createParasiteState(hasParasiteSkin: boolean): ParasiteState {
  return {
    active: hasParasiteSkin,
    transformed: false,
    transforming: false,
    transformTimer: 0,
    dragonFishActive: false,
  };
}

export function shouldTransform(state: ParasiteState, currentHp: number, maxHp: number): boolean {
  if (!state.active) return false;
  if (state.transformed) return false;
  if (state.transforming) return false;
  return currentHp / maxHp < 0.5;
}

export function updateParasite(state: ParasiteState, dt: number, triggerTransform: boolean): ParasiteState {
  if (!state.active) return state;

  // Start transformation
  if (triggerTransform && !state.transformed && !state.transforming) {
    return {
      ...state,
      transforming: true,
      transformTimer: TRANSFORM_DURATION,
    };
  }

  // Transforming — count down animation
  if (state.transforming) {
    const remaining = state.transformTimer - dt;
    if (remaining <= 0) {
      return {
        ...state,
        transforming: false,
        transformTimer: 0,
        transformed: true,
        dragonFishActive: true,
      };
    }
    return { ...state, transformTimer: remaining };
  }

  return state;
}
