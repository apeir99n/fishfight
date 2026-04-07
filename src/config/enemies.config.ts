export interface EnemyAttack {
  name: string;
  damage: number;
  knockback: number;
  speed: number;       // attack duration in seconds
  range: number;       // px
  type: 'melee' | 'ranged';
  projectileSpeed?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  type: 'fish' | 'human' | 'boss';
  hp: number;
  color: number;
  scale: number;
  aiLevelBonus: number; // added to base AI level
  attacks: EnemyAttack[];
}

const ENEMIES: EnemyDef[] = [
  {
    id: 'fisherman',
    name: 'Fisherman',
    type: 'human',
    hp: 120,
    color: 0x8B6914,
    scale: 4,
    aiLevelBonus: 0,
    attacks: [
      { name: 'Rod Swing', damage: 9, knockback: 60, speed: 0.5, range: 70, type: 'melee' },
      { name: 'Hook Throw', damage: 6, knockback: 40, speed: 0.6, range: 200, type: 'ranged', projectileSpeed: 300 },
    ],
  },
  {
    id: 'diver',
    name: 'Diver',
    type: 'human',
    hp: 115,
    color: 0x2266aa,
    scale: 4,
    aiLevelBonus: 0,
    attacks: [
      { name: 'Harpoon Thrust', damage: 11, knockback: 70, speed: 0.7, range: 80, type: 'melee' },
      { name: 'Net Throw', damage: 4, knockback: 25, speed: 0.5, range: 180, type: 'ranged', projectileSpeed: 250 },
    ],
  },
  {
    id: 'sushi_master',
    name: 'Sushi Master',
    type: 'human',
    hp: 130,
    color: 0xcc2222,
    scale: 4,
    aiLevelBonus: 1,
    attacks: [
      { name: 'Knife Slash', damage: 10, knockback: 55, speed: 0.35, range: 60, type: 'melee' },
      { name: 'Cleaver Chop', damage: 15, knockback: 90, speed: 0.8, range: 70, type: 'melee' },
    ],
  },
  {
    id: 'mega_fish',
    name: 'Mega-Fish',
    type: 'boss',
    hp: 200,
    color: 0x336699,
    scale: 5,
    aiLevelBonus: 1,
    attacks: [
      { name: 'Tail Slam', damage: 13, knockback: 80, speed: 0.6, range: 90, type: 'melee' },
      { name: 'Bite', damage: 16, knockback: 65, speed: 0.5, range: 60, type: 'melee' },
      { name: 'Ink Spit', damage: 7, knockback: 45, speed: 0.4, range: 250, type: 'ranged', projectileSpeed: 350 },
      { name: 'Body Slam', damage: 18, knockback: 110, speed: 0.9, range: 100, type: 'melee' },
    ],
  },
  {
    id: 'chef',
    name: 'The Chef',
    type: 'boss',
    hp: 350,
    color: 0xeeeeee,
    scale: 5,
    aiLevelBonus: 1,
    attacks: [
      { name: 'Knife Slash', damage: 12, knockback: 55, speed: 0.3, range: 65, type: 'melee' },
      { name: 'Pan Smash', damage: 16, knockback: 90, speed: 0.7, range: 75, type: 'melee' },
      { name: 'Pan Throw', damage: 11, knockback: 70, speed: 0.5, range: 220, type: 'ranged', projectileSpeed: 350 },
      { name: 'Boiling Oil', damage: 9, knockback: 40, speed: 0.4, range: 180, type: 'ranged', projectileSpeed: 280 },
      { name: 'Cleaver Slam', damage: 20, knockback: 120, speed: 0.9, range: 80, type: 'melee' },
    ],
  },
];

export function getEnemy(id: string): EnemyDef | undefined {
  return ENEMIES.find(e => e.id === id);
}

export function getAllEnemies(): EnemyDef[] {
  return [...ENEMIES];
}

export function getHumanEnemies(): EnemyDef[] {
  return ENEMIES.filter(e => e.type === 'human');
}

export function getBossPhase(currentHp: number, maxHp: number, totalPhases: number = 2): number {
  const hpRatio = currentHp / maxHp;
  if (totalPhases === 3) {
    if (hpRatio > 0.6) return 1;
    if (hpRatio > 0.3) return 2;
    return 3;
  }
  return hpRatio > 0.3 ? 1 : 2;
}
