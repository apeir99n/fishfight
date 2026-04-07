export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;

export const PHYSICS = {
  gravity: 800,
  floorY: 400,
  arenaLeft: 0,
  arenaRight: 800,
  arenaTop: -100,
};

export const COMBAT = {
  lightAttack: { damage: 5, knockback: 50, speed: 0.25 },
  heavyAttack: { damage: 15, knockback: 120, speed: 0.65 },
  specialAttack: { damage: 10, knockback: 80, speed: 0.4 },
  blockDamageReduction: 0.35,
  maxHP: 120,
  // knockback = baseKnockback * (1 + (maxHP - currentHP) / maxHP)
};

export const ECONOMY = {
  baseCoinsPerFight: 10,
  coinsIncrement: 1,
};

export const AI_LEVELS = {
  1: { reactionTime: 1000, aggression: 0.15, blockChance: 0.03, attackFrequency: 0.2 },
  5: { reactionTime: 500, aggression: 0.4, blockChance: 0.15, attackFrequency: 0.5 },
  10: { reactionTime: 180, aggression: 0.75, blockChance: 0.35, attackFrequency: 0.75 },
};
