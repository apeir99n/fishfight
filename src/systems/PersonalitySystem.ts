export type PersonalityLevel = 'kind' | 'neutral' | 'bold';
export type QuoteSituation = 'pre_fight' | 'victory' | 'defeat';

const QUOTES: Record<PersonalityLevel, Record<QuoteSituation, string[]>> = {
  kind: {
    pre_fight: [
      "Let's have a fair fight!",
      'May the best fish win!',
      "I don't want to hurt you...",
    ],
    victory: [
      'Good fight, friend!',
      'Are you okay? Sorry about that.',
      'That was fun! Let\'s do it again!',
    ],
    defeat: [
      'You fought well! I\'ll try harder.',
      'Ouch... but no hard feelings!',
      'I need more practice...',
    ],
  },
  neutral: {
    pre_fight: [
      'Here we go.',
      'Ready when you are.',
      'Let\'s get this started.',
    ],
    victory: [
      'Not bad.',
      'That went well.',
      'On to the next one.',
    ],
    defeat: [
      'I\'ll be back.',
      'Hmm, need to rethink that.',
      'Next time.',
    ],
  },
  bold: {
    pre_fight: [
      'You\'re going DOWN!',
      'Prepare to be FLOPPED!',
      'This ends NOW!',
    ],
    victory: [
      'TOO EASY!',
      'Who\'s next?!',
      'NOBODY beats this fish!',
    ],
    defeat: [
      'This isn\'t over!',
      'You got LUCKY!',
      'I\'ll DESTROY you next time!',
    ],
  },
};

export function getQuote(level: PersonalityLevel, situation: QuoteSituation): string {
  const pool = QUOTES[level][situation];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function personalityFromSlider(value: number): PersonalityLevel {
  if (value < 0.33) return 'kind';
  if (value < 0.67) return 'neutral';
  return 'bold';
}
