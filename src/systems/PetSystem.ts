import { getPet } from '../config/pets.config';

export interface PetState {
  petId: string | null;
  active: boolean;
  flightTimeRemaining: number;
  autoShootCooldown: number;
}

export function createPetState(petId: string | null): PetState {
  const pet = petId ? getPet(petId) : null;
  return {
    petId,
    active: petId !== null,
    flightTimeRemaining: pet?.effect.type === 'flight' ? (pet.effect.maxDuration ?? 60) : 0,
    autoShootCooldown: pet?.effect.type === 'auto_shoot' ? (pet.effect.interval ?? 2) : 0,
  };
}

export function applySpeedBoost(state: PetState, baseSpeed: number): number {
  if (!state.active || !state.petId) return baseSpeed;
  const pet = getPet(state.petId);
  if (!pet || pet.effect.type !== 'speed_boost') return baseSpeed;
  return baseSpeed * (pet.effect.multiplier ?? 1);
}

export function applyFlight(state: PetState): boolean {
  if (!state.active || !state.petId) return false;
  const pet = getPet(state.petId);
  if (!pet || pet.effect.type !== 'flight') return false;
  return state.flightTimeRemaining > 0;
}

export function updateFlightTimer(state: PetState, dt: number, isFlying: boolean): PetState {
  if (!state.active || !state.petId) return state;
  const pet = getPet(state.petId);
  if (!pet || pet.effect.type !== 'flight') return state;
  if (!isFlying) return state;
  return {
    ...state,
    flightTimeRemaining: Math.max(0, state.flightTimeRemaining - dt),
  };
}

export interface AutoShootResult {
  shouldFire: boolean;
  state: PetState;
  damage: number;
}

export function updateAutoShoot(state: PetState, dt: number): AutoShootResult {
  if (!state.active || !state.petId) {
    return { shouldFire: false, state, damage: 0 };
  }
  const pet = getPet(state.petId);
  if (!pet || pet.effect.type !== 'auto_shoot') {
    return { shouldFire: false, state, damage: 0 };
  }

  const newCooldown = state.autoShootCooldown - dt;
  if (newCooldown <= 0) {
    return {
      shouldFire: true,
      state: { ...state, autoShootCooldown: pet.effect.interval ?? 2 },
      damage: pet.effect.damage ?? 5,
    };
  }
  return {
    shouldFire: false,
    state: { ...state, autoShootCooldown: newCooldown },
    damage: 0,
  };
}
