export interface NGPlusScaling {
  hpMultiplier: number;
  damageMultiplier: number;
  reactionMultiplier: number;
  cycle: number;
}

export function getNewGamePlusScaling(cycle: number): NGPlusScaling {
  if (cycle <= 0) {
    return { hpMultiplier: 1, damageMultiplier: 1, reactionMultiplier: 1, cycle: 0 };
  }
  return {
    hpMultiplier: Math.pow(1.15, cycle),
    damageMultiplier: Math.pow(1.10, cycle),
    reactionMultiplier: Math.pow(0.90, cycle),
    cycle,
  };
}

const REACTION_FLOOR = 50; // minimum reaction time in ms

export function applyNGPlusToEnemy(
  baseHp: number,
  baseDamage: number,
  baseReactionTime: number,
  cycle: number,
): { hp: number; damage: number; reactionTime: number } {
  const scaling = getNewGamePlusScaling(cycle);
  return {
    hp: baseHp * scaling.hpMultiplier,
    damage: baseDamage * scaling.damageMultiplier,
    reactionTime: Math.max(REACTION_FLOOR, baseReactionTime * scaling.reactionMultiplier),
  };
}
