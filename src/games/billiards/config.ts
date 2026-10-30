// Every tunable lives here — layout, physics feel, colours and timing.

export const CONFIG = {
  W: 1600,
  H: 900,
  BALL_R: 13,
  TURN_TIME: 30,      // seconds per shot before the clock fouls you
  MAX_CUE_PULL: 90,   // px the cue stick draws back at full power
} as const;

// Table geometry. The "playfield" is the area inside the cushion noses.
export const TABLE = {
  CX: 800,
  CY: 505,
  PLAY_W: 1040,
  PLAY_H: 520,
  CUSHION: 22,        // depth of the rubber cushion strip
  RAIL: 52,           // wooden rail outside the cushions
  CORNER_MOUTH: 36,   // distance from a corner to where its jaw starts
  SIDE_MOUTH: 26,     // half-width of a side pocket at the cushion nose
  SIDE_FLARE: 6,      // side jaws open up slightly toward the back
  CORNER_POCKET: { offset: 8, captureR: 22, holeR: 30 },
  SIDE_POCKET: { offset: 12, captureR: 21, holeR: 27 },
} as const;

// Speeds are px per 1/60 s frame.
export const PHYSICS = {
  SUBSTEPS: 6,              // keeps per-substep travel well under a ball radius
  MAX_SPEED: 36,            // cue ball speed at 100% power
  ROLL_DECEL: 0.025,        // constant rolling resistance
  SPEED_DRAG: 0.0075,       // speed-proportional drag
  STOP_SPEED: 0.05,
  BALL_RESTITUTION: 0.97,
  CUSHION_RESTITUTION: 0.85,
  CUSHION_GRIP: 0.04,       // tangential speed lost on a cushion hit
  SPIN_FOLLOW: 0.62,        // strength of follow / draw at full spin
  SPIN_SIDE: 0.5,           // cushion kick from side spin
  SPIN_DECAY_DIST: 1100,    // px of travel before draw/follow wears into natural roll
  NATURAL_ROLL: 0.28,       // follow a centre-ball hit picks up over distance
  SPIN_APPLY_FRAMES: 10,    // follow/draw bends in over this many frames
} as const;

export const COLORS = {
  bgCenter: '#123b66',
  bgEdge: '#040c18',
  feltCenter: '#2aa35f',
  feltMid: '#1d8048',
  feltEdge: '#0f5631',
  cushion: '#17703c',
  cushionDark: '#0d4a27',
  woodLight: '#7a4424',
  woodMid: '#552c15',
  woodDark: '#2c150a',
  accent: 0x35c4ff,
  accentCss: '#35c4ff',
  gold: 0xffc93c,
  goldCss: '#ffc93c',
  panel: 0x0c2340,
  panelEdge: 0x2a5a8c,
  good: '#6dff8a',
  bad: '#ff5c5c',
  warn: '#ffb347',
  players: [0x35c4ff, 0xff8f3c] as const,
  playersCss: ['#35c4ff', '#ff8f3c'] as const,
} as const;

// Set at boot once the web font is loaded (see components/PoolGame.tsx).
export const FONT = {
  family: '"Baloo 2", system-ui, sans-serif',
};
