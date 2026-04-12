export enum AIAction {
  Idle = 'idle',
  MoveToward = 'move_toward',
  MoveAway = 'move_away',
  Jump = 'jump',
  LightAttack = 'light_attack',
  HeavyAttack = 'heavy_attack',
  WeaponAttack = 'weapon_attack',
  Block = 'block',
}

export interface AIParams {
  reactionTime: number;  // ms between decisions
  aggression: number;    // 0-1, tendency to approach and attack
  blockChance: number;   // 0-1, chance to block when player attacks
  attackFrequency: number; // 0-1, chance to attack when in range
}

export interface AIState {
  level: number;
  reactionCooldown: number; // seconds until next decision
  lastAction: AIAction;
  params: AIParams;
}

export interface AIContext {
  aiX: number;
  aiY: number;
  playerX: number;
  playerY: number;
  aiHp: number;
  playerHp: number;
  playerIsAttacking: boolean;
  aiIsOnGround: boolean;
  distToPlayer: number;
}

// Linearly interpolate between level 1 and level 10
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getAIParams(level: number): AIParams {
  const clamped = Math.max(1, Math.min(10, level));
  const t = (clamped - 1) / 9; // 0 at level 1, 1 at level 10

  return {
    reactionTime: Math.round(lerp(200, 50, t)),
    aggression: lerp(0.8, 0.98, t),
    blockChance: lerp(0.4, 0.7, t),
    attackFrequency: lerp(0.8, 0.98, t),
  };
}

export function createAIState(level: number): AIState {
  return {
    level,
    reactionCooldown: 0,
    lastAction: AIAction.Idle,
    params: getAIParams(level),
  };
}

export function decideAction(state: AIState, ctx: AIContext): AIAction {
  const { params } = state;
  const r = Math.random();

  const inMeleeRange = ctx.distToPlayer < 80;
  const inWeaponRange = ctx.distToPlayer < 150;
  const lowHp = ctx.aiHp < 25;

  // If player is attacking, consider blocking
  if (ctx.playerIsAttacking && inMeleeRange) {
    if (r < params.blockChance) return AIAction.Block;
  }

  // Low HP — sometimes retreat
  if (lowHp && r < 0.3) {
    return AIAction.MoveAway;
  }

  // In melee range — attack or use weapon
  if (inMeleeRange) {
    if (r < params.attackFrequency) {
      const attackRoll = Math.random();
      if (attackRoll < 0.2) return AIAction.WeaponAttack;
      if (attackRoll < 0.5) return AIAction.HeavyAttack;
      return AIAction.LightAttack;
    }
    // Stay close or block or dodge
    if (r < params.blockChance + params.attackFrequency) return AIAction.Block;
    if (Math.random() < 0.4 && ctx.aiIsOnGround) return AIAction.Jump;
    return AIAction.MoveAway;
  }

  // In weapon range but not melee — shoot or rush in
  if (inWeaponRange) {
    if (r < params.attackFrequency * 0.5) return AIAction.WeaponAttack;
    if (Math.random() < 0.3 && ctx.aiIsOnGround) return AIAction.Jump;
    return AIAction.MoveToward;
  }

  // Far away — always approach, sometimes jump
  if (Math.random() < 0.2 && ctx.aiIsOnGround) return AIAction.Jump;

  return AIAction.MoveToward;
}

export function updateAI(state: AIState, dt: number): AIState {
  return {
    ...state,
    reactionCooldown: Math.max(0, state.reactionCooldown - dt),
  };
}
