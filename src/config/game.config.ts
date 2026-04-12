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
  1: { reactionTime: 600, aggression: 0.4, blockChance: 0.1, attackFrequency: 0.5 },
  5: { reactionTime: 300, aggression: 0.65, blockChance: 0.3, attackFrequency: 0.7 },
  10: { reactionTime: 100, aggression: 0.9, blockChance: 0.5, attackFrequency: 0.9 },
};
