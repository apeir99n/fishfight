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
  // Example entry — replace/extend with real codes when you have them:
  // { code: 'FISHLORD', reward: { type: 'skin', id: 'parasite' }, description: 'Parasite skin unlocked!' },
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
