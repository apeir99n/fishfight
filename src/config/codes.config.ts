// Redeemable codes that unlock skins or characters.
// Populate this list with your chosen codes + rewards.

export type CodeRewardType = 'skin' | 'character';

export interface CodeDef {
  code: string;              // case-insensitive, compared after trim+upper
  reward: {
    type: CodeRewardType;
    id: string;              // skin id or character id
  };
  description?: string;      // shown on successful redeem
}

const CODES: CodeDef[] = [
  {
    code: 'FSHAMZN',
    reward: { type: 'character', id: 'secretfish' },
    description: 'Secret Fish unlocked!',
  },
  {
    code: 'OGFLAPPY',
    reward: { type: 'character', id: 'flappyflounder' },
    description: 'Flappy Flounder unlocked!',
  },
  {
    code: 'POISON',
    reward: { type: 'character', id: 'fugu' },
    description: 'Fugu unlocked!',
  },
  {
    code: 'BRAZIL',
    reward: { type: 'character', id: 'piranagh' },
    description: 'Piranagh unlocked!',
  },
  {
    code: 'ADA',
    reward: { type: 'character', id: 'apriamagold' },
    description: 'Apriama Gold unlocked!',
  },
  {
    code: 'TEMU',
    reward: { type: 'character', id: 'sokeyesalmon' },
    description: 'Sockeye Salmon unlocked!',
  },
  {
    code: 'FOSIL',
    reward: { type: 'character', id: 'pteraspis' },
    description: 'Pteraspis unlocked!',
  },
  {
    code: 'KUZEYS',
    reward: { type: 'character', id: 'apriamagreen' },
    description: 'Apriama Green unlocked!',
  },
  {
    code: 'LARRY',
    reward: { type: 'character', id: 'lobster' },
    description: 'Lobster unlocked!',
  },
  {
    code: 'ADMIN',
    reward: { type: 'character', id: 'astraspis' },
    description: 'Astraspis unlocked!',
  },
];

function normalize(raw: string): string {
  return raw.trim().toUpperCase();
}

export function findCode(input: string): CodeDef | undefined {
  const key = normalize(input);
  return CODES.find(c => normalize(c.code) === key);
}

export function getAllCodes(): CodeDef[] {
  return [...CODES];
}
