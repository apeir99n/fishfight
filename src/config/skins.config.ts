export type SkinRarity = 'common' | 'rare' | 'legendary';

export interface SkinDef {
  id: string;
  name: string;
  price: number;
  color: number;         // tint/overlay color for rendering
  rarity: SkinRarity;
  description: string;
}

const SKINS: SkinDef[] = [
  {
    id: 'cap',
    name: 'Cap',
    price: 0,
    color: 0xff4444,
    rarity: 'common',
    description: 'A sporty red cap',
  },
  {
    id: 'frying_pan_hat',
    name: 'Frying Pan Hat',
    price: 0,
    color: 0x888888,
    rarity: 'common',
    description: 'A frying pan worn as a hat',
  },
  {
    id: 'carp_tshirt',
    name: 'Carp T-shirt',
    price: 0,
    color: 0xff8800,
    rarity: 'common',
    description: 'A tiny shirt with a carp on it',
  },
  {
    id: 'carrot_mouth',
    name: 'Carrot Mouth',
    price: 0,
    color: 0xff6600,
    rarity: 'rare',
    description: 'A carrot sticking out of the mouth',
  },
  {
    id: 'fish_sword',
    name: 'Fish Sword',
    price: 0,
    color: 0xccccff,
    rarity: 'rare',
    description: 'A tiny sword strapped to the back',
  },
  {
    id: 'parasite',
    name: 'Parasite',
    price: 0,
    color: 0x220022,
    rarity: 'legendary',
    description: 'A facehugger parasite — transforms mid-fight!',
  },
];

export function getSkin(id: string): SkinDef | undefined {
  return SKINS.find(s => s.id === id);
}

export function getAllSkins(): SkinDef[] {
  return [...SKINS];
}
