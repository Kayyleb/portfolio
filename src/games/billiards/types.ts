export type BallGroup = 'cue' | 'solid' | 'stripe' | 'eight';

export interface Vec {
  x: number;
  y: number;
}

// Where the cue tip strikes the cue ball, each axis -1..1.
// top > 0 = follow, top < 0 = draw; side > 0 = right english.
export interface Spin {
  top: number;
  side: number;
}

export function groupOf(num: number): BallGroup {
  if (num === 0) return 'cue';
  if (num === 8) return 'eight';
  return num < 8 ? 'solid' : 'stripe';
}

export const BALL_COLORS: Record<number, number> = {
  0: 0xf6f2e6,
  1: 0xf7c518, 9: 0xf7c518,
  2: 0x1d4fc4, 10: 0x1d4fc4,
  3: 0xe0262b, 11: 0xe0262b,
  4: 0x6a2d9c, 12: 0x6a2d9c,
  5: 0xf47a1b, 13: 0xf47a1b,
  6: 0x149049, 14: 0x149049,
  7: 0x8e1d26, 15: 0x8e1d26,
  8: 0x151515,
};
