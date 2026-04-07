export type StoryPhase = 'early' | 'companion' | 'legendary';

export interface StoryState {
  pufferfishCompanion: boolean;
  sakabambaspisUnlocked: boolean;
  phase: StoryPhase;
}

export function getStoryState(ladderClears: number): StoryState {
  if (ladderClears >= 10) {
    return {
      pufferfishCompanion: false,
      sakabambaspisUnlocked: true,
      phase: 'legendary',
    };
  }
  if (ladderClears >= 5) {
    return {
      pufferfishCompanion: true,
      sakabambaspisUnlocked: false,
      phase: 'companion',
    };
  }
  return {
    pufferfishCompanion: false,
    sakabambaspisUnlocked: false,
    phase: 'early',
  };
}

export function shouldPufferfishJoin(ladderClears: number): boolean {
  return ladderClears >= 5 && ladderClears < 10;
}

export function shouldPufferfishDepart(ladderClears: number): boolean {
  return ladderClears === 10;
}

export function shouldUnlockSakabambaspis(ladderClears: number): boolean {
  return ladderClears >= 10;
}
