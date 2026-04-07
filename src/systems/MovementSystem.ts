import { PHYSICS } from '../config/game.config';

const MOVE_SPEED = 200;
const JUMP_VELOCITY = -400;
const GRAVITY = PHYSICS.gravity;

export interface FighterState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isOnGround: boolean;
  facingRight: boolean;
}

export function createFighterState(x: number, y: number): FighterState {
  return {
    x,
    y,
    velocityX: 0,
    velocityY: 0,
    isOnGround: false,
    facingRight: true,
  };
}

export function moveLeft(state: FighterState): FighterState {
  return { ...state, velocityX: -MOVE_SPEED, facingRight: false };
}

export function moveRight(state: FighterState): FighterState {
  return { ...state, velocityX: MOVE_SPEED, facingRight: true };
}

export function stopHorizontal(state: FighterState): FighterState {
  return { ...state, velocityX: 0 };
}

export function jump(state: FighterState): FighterState {
  if (!state.isOnGround) return state;
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
