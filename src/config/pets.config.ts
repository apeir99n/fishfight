export interface PetEffect {
  type: 'none' | 'speed_boost' | 'flight' | 'auto_shoot';
  multiplier?: number;    // for speed_boost
  maxDuration?: number;   // seconds, for flight
  damage?: number;        // for auto_shoot
  interval?: number;      // seconds between shots, for auto_shoot
}

export interface PetUnlockCondition {
  type: 'arena' | 'boss_clear';
  arenaId?: string;
  bossId?: string;
}

export interface PetDef {
  id: string;
  name: string;
  effect: PetEffect;
  color: number;
  unlockCondition: PetUnlockCondition;
}

const PETS: PetDef[] = [
  {
    id: 'clownfish',
    name: 'Clownfish',
    effect: { type: 'none' },
    color: 0xff6622,
    unlockCondition: { type: 'arena', arenaId: 'sea' },
  },
  {
    id: 'walking_fish',
    name: 'Walking Fish',
    effect: { type: 'speed_boost', multiplier: 2 },
    color: 0x88cc44,
    unlockCondition: { type: 'arena', arenaId: 'fish_market' },
  },
  {
    id: 'flying_fish',
    name: 'Flying Fish',
    effect: { type: 'flight', maxDuration: 60 },
    color: 0x44aaff,
    unlockCondition: { type: 'arena', arenaId: 'ship' },
  },
  {
    id: 'sniper_fish',
    name: 'Sniper Fish',
    effect: { type: 'auto_shoot', damage: 5, interval: 2 },
    color: 0xcc2222,
    unlockCondition: { type: 'boss_clear', bossId: 'chef' },
  },
];

export interface UnlockProgress {
  arenasPlayed: string[];
  bossesDefeated: string[];
}

export function getPet(id: string): PetDef | undefined {
  return PETS.find(p => p.id === id);
}

export function getAllPets(): PetDef[] {
  return [...PETS];
}

export function isPetUnlocked(petId: string, progress: UnlockProgress): boolean {
  const pet = getPet(petId);
  if (!pet) return false;

  if (pet.unlockCondition.type === 'arena') {
    return progress.arenasPlayed.includes(pet.unlockCondition.arenaId!);
  }
  if (pet.unlockCondition.type === 'boss_clear') {
    return progress.bossesDefeated.includes(pet.unlockCondition.bossId || '');
  }
  return false;
}
