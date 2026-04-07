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
