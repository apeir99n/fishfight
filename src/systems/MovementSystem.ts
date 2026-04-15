import { PHYSICS } from '../config/game.config';

const MOVE_SPEED = 100;
const JUMP_VELOCITY = -400;
const GRAVITY = PHYSICS.gravity;

export interface FighterState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isOnGround: boolean;
  facingRight: boolean;
  hitstunTimer: number;
}

export function createFighterState(x: number, y: number): FighterState {
  return {
    x,
    y,
    velocityX: 0,
    velocityY: 0,
    isOnGround: false,
    facingRight: true,
    hitstunTimer: 0,
  };
}

export function isInHitstun(state: FighterState): boolean {
  return state.hitstunTimer > 0;
}

export function applyHitstun(state: FighterState, vx: number, vy: number, duration: number): FighterState {
  return {
    ...state,
    velocityX: vx,
    velocityY: vy,
    hitstunTimer: duration,
    isOnGround: false,
  };
}

export function updateHitstun(state: FighterState, dt: number): FighterState {
  if (state.hitstunTimer <= 0) return state;
  return { ...state, hitstunTimer: Math.max(0, state.hitstunTimer - dt) };
}

export function moveLeft(state: FighterState, speedMultiplier = 1): FighterState {
  if (isInHitstun(state)) return state;
  return { ...state, velocityX: -MOVE_SPEED * speedMultiplier, facingRight: false };
}

export function moveRight(state: FighterState, speedMultiplier = 1): FighterState {
  if (isInHitstun(state)) return state;
  return { ...state, velocityX: MOVE_SPEED * speedMultiplier, facingRight: true };
}

export function stopHorizontal(state: FighterState): FighterState {
  if (isInHitstun(state)) return state;
  return { ...state, velocityX: 0 };
}

export function jump(state: FighterState): FighterState {
  if (!state.isOnGround || isInHitstun(state)) return state;
  return { ...state, velocityY: JUMP_VELOCITY, isOnGround: false };
}

export function applyGravity(state: FighterState, dt: number): FighterState {
  if (state.isOnGround) return state;
  return { ...state, velocityY: state.velocityY + GRAVITY * dt };
}

export function applyFloorCollision(state: FighterState, floorY: number): FighterState {
  if (state.y >= floorY) {
    return { ...state, y: floorY, velocityY: 0, isOnGround: true };
  }
  return state;
}
