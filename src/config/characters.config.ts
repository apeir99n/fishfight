export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface CharacterDef {
  id: string;
  name: string;
  rarity: Rarity;
  spriteSheet: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  color: number;
  unlockCost?: number;   // coins to purchase (uncommon)
  unlockClear?: number;  // ladder clears needed (rare/legendary)
}

const CHARACTERS: CharacterDef[] = [
  {
    id: 'tuna',
    name: 'Tuna',
    rarity: 'common',
    spriteSheet: 'tuna_sheet',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 6,
    color: 0x4488ff,
  },
  {
    id: 'carp',
    name: 'Carp',
    rarity: 'common',
    spriteSheet: 'carp_sheet',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 6,
    color: 0xff8800,
  },
  {
    id: 'squid',
    name: 'Squid',
    rarity: 'uncommon',
    spriteSheet: 'squid_sheet',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 5,
    color: 0xff3333,
    unlockCost: 250,
  },
  {
    id: 'pufferfish',
    name: 'Pufferfish',
    rarity: 'rare',
    spriteSheet: 'pufferfish_sheet',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 6,
    color: 0x33cccc,
    unlockClear: 5,
  },
  {
    id: 'sakabambaspis',
    name: 'Sakabambaspis',
    rarity: 'legendary',
    spriteSheet: 'sakabambaspis_sheet',
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 6,
    color: 0xcc44ff,
    unlockClear: 10,
  },
];

export function getCharacter(id: string): CharacterDef | undefined {
  return CHARACTERS.find(c => c.id === id);
}

export function getAllCharacters(): CharacterDef[] {
  return [...CHARACTERS];
}

export function getStarterCharacters(): CharacterDef[] {
  return CHARACTERS.filter(c => c.rarity === 'common');
}

export function getUnlockableCharacters(): CharacterDef[] {
  return CHARACTERS.filter(c => c.rarity !== 'common');
}

export function isCharacterUnlocked(
  charId: string,
  ladderClears: number,
  coins: number,
  purchasedChars: string[],
): boolean {
  const char = getCharacter(charId);
  if (!char) return false;

  if (char.rarity === 'common') return true;
  if (purchasedChars.includes(charId)) return true;
  if (char.unlockClear && ladderClears >= char.unlockClear) return true;

  return false;
}
