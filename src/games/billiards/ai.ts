import { CONFIG, PHYSICS as P } from './config';
import { PoolPhysics, SimBall, PhysEvent, speedToTravel } from './physics';
import { canPlaceCueBall, distToSegment, findFreeSpot } from './geometry';
import { GameState, Remaining, ShotOutcome, legalTargets, resolveShot } from './rules';
import { BallGroup, Spin, Vec, groupOf } from './types';

// Computer opponent. It lists every pot it can see geometrically, then runs each
// through the real physics engine (with a few power/spin variations) and keeps
// the shot that pots a ball and leaves the best next shot. Difficulty only
// changes how accurately the chosen shot is executed.

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface AiShot {
  angle: number;
  power: number;               // 0..1
  spin: Spin;
  calledPocket: number | null;
  place?: Vec;                 // where to put the cue ball (ball in hand)
}

const R = CONFIG.BALL_R;
const AIM_ERROR_DEG: Record<Difficulty, number> = { easy: 2.2, normal: 0.85, hard: 0.3 };
const POWER_ERROR: Record<Difficulty, number> = { easy: 0.12, normal: 0.06, hard: 0.02 };
const SPINS: Spin[] = [{ top: 0, side: 0 }, { top: 0.5, side: 0 }, { top: -0.55, side: 0 }];
const POWER_SCALES = [1, 1.3];

interface PotLine {
  target: SimBall;
  pocket: number;
  angle: number;
  power: number;
  cutDeg: number;
  d1: number;
  d2: number;
}

interface Tried {
  shot: AiShot;
  score: number;
}

export function remainingOn(phys: PoolPhysics): Remaining {
  const r: Remaining = { solid: 0, stripe: 0 };
  for (const b of phys.balls) {
    if (!b.onTable) continue;
    const g = groupOf(b.num);
    if (g === 'solid' || g === 'stripe') r[g]++;
  }
  return r;
}

export function planShot(phys: PoolPhysics, state: GameState, difficulty: Difficulty): AiShot {
  const before = remainingOn(phys);
  let place: Vec | undefined;
  let table = phys;

  if (state.isBreak) return planBreak(phys, difficulty);

  if (state.ballInHand !== 'none') {
    place = choosePlacement(phys, state, before, state.ballInHand === 'kitchen');
    table = phys.clone();
    table.cue.x = place.x;
    table.cue.y = place.y;
    table.cue.onTable = true;
  }

  const best = bestPot(table, state, before) ?? bestSafety(table, state, before) ?? fallback(table, state, before);
  return { ...applyError(best, difficulty), place };
}

// ---------- Break ----------

function planBreak(phys: PoolPhysics, difficulty: Difficulty): AiShot {
  const g = phys.table;
  const others = phys.balls.filter(b => b.onTable && b.num !== 0);
  const y = g.cy + (Math.random() - 0.5) * 120;
  const place = findFreeSpot(g.headX - 6, y, (x, yy) => canPlaceCueBall(x, yy, others, true));
  const apex = others.reduce((a, b) => (b.x < a.x ? b : a));
  const angle = Math.atan2(apex.y - place.y, apex.x - place.x);
  return {
    ...applyError({ angle, power: 1, spin: { top: 0, side: 0 }, calledPocket: null }, difficulty),
    place,
  };
}

// ---------- Potting ----------

function pathClear(phys: PoolPhysics, ax: number, ay: number, bx: number, by: number, ignore: SimBall[]): boolean {
  for (const b of phys.balls) {
    if (!b.onTable || ignore.includes(b)) continue;
    if (distToSegment(b.x, b.y, ax, ay, bx, by) < R * 2 - 0.5) return false;
  }
  return true;
}

// Every straight pot the cue ball can see, with a power estimate.
function potLines(phys: PoolPhysics, targets: BallGroup[]): PotLine[] {
  const cue = phys.cue;
  const g = phys.table;
  const out: PotLine[] = [];
  if (!cue.onTable) return out;

  for (const t of phys.balls) {
    if (!t.onTable || t === cue || !targets.includes(groupOf(t.num))) continue;
    g.pockets.forEach((p, pi) => {
      const ux0 = p.aimX - t.x;
      const uy0 = p.aimY - t.y;
      const d2 = Math.hypot(ux0, uy0);
      if (d2 < 1) return;
      const ux = ux0 / d2;
      const uy = uy0 / d2;
      // Side pockets only accept balls coming in fairly square.
      if (p.kind === 'side' && uy * Math.sign(p.y - g.cy) < 0.45) return;

      const gx = t.x - ux * R * 2;
      const gy = t.y - uy * R * 2;
      if (gx < g.left + R - 1 || gx > g.right - R + 1 || gy < g.top + R - 1 || gy > g.bottom - R + 1) return;

      const vx = gx - cue.x;
      const vy = gy - cue.y;
      const d1 = Math.hypot(vx, vy);
      if (d1 < 1) return;
      const cosCut = (vx * ux + vy * uy) / d1;
      if (cosCut < 0.2) return;
      if (!pathClear(phys, cue.x, cue.y, gx, gy, [cue, t])) return;
      if (!pathClear(phys, t.x, t.y, p.aimX, p.aimY, [cue, t])) return;

      const objSpeed = speedToTravel(d2 + 30, 1.2);
      const impact = objSpeed / ((cosCut * (1 + P.BALL_RESTITUTION)) / 2);
      const v0 = speedToTravel(d1, impact);
      out.push({
        target: t,
        pocket: pi,
        angle: Math.atan2(vy, vx),
        power: clamp(v0 / P.MAX_SPEED, 0.08, 1),
        cutDeg: (Math.acos(Math.min(1, cosCut)) * 180) / Math.PI,
        d1,
        d2,
      });
    });
  }
  return out;
}

function lineScore(l: PotLine): number {
  return 300 - l.cutDeg * 3 - (l.d1 + l.d2) / 15;
}

function simulate(phys: PoolPhysics, shot: AiShot, state: GameState, before: Remaining): { out: ShotOutcome; sim: PoolPhysics } {
  const sim = phys.clone();
  const events: PhysEvent[] = [];
  sim.strike(shot.angle, shot.power * P.MAX_SPEED, shot.spin);
  sim.runToRest(1500, events);
  const potted = events.flatMap(e => (e.kind === 'pocket' ? [{ num: e.ball.num, pocket: e.pocket }] : []));
  const out = resolveShot(state, { firstContact: sim.firstContact, potted, calledPocket: shot.calledPocket }, before);
  return { out, sim };
}

// How good is the position the cue ball was left in?
function leaveScore(sim: PoolPhysics, out: ShotOutcome): number {
  const next = out.state;
  const targets = legalTargets(next, remainingOn(sim));
  const lines = potLines(sim, targets);
  const easy = lines.filter(l => l.cutDeg < 55).length;
  return Math.min(easy, 3) * 60 + (lines.length === 0 ? -80 : 0);
}

function bestPot(phys: PoolPhysics, state: GameState, before: Remaining): AiShot | null {
  const targets = legalTargets(state, before);
  const lines = potLines(phys, targets).sort((a, b) => lineScore(b) - lineScore(a)).slice(0, 12);
  const tried: Tried[] = [];

  for (const line of lines) {
    const calledPocket = groupOf(line.target.num) === 'eight' ? line.pocket : null;
    for (const spin of SPINS) {
      for (const scale of POWER_SCALES) {
        const shot: AiShot = { angle: line.angle, power: clamp(line.power * scale, 0.08, 1), spin, calledPocket };
        const { out, sim } = simulate(phys, shot, state, before);
        if (out.won) return shot;
        if (out.foul || out.lossReason || !out.keepsTurn) continue;
        tried.push({ shot, score: lineScore(line) + leaveScore(sim, out) });
      }
    }
  }
  if (tried.length === 0) return null;

  // Prefer shots that still work when the aim is slightly off.
  tried.sort((a, b) => b.score - a.score);
  const wobble = (0.6 * Math.PI) / 180;
  for (const t of tried.slice(0, 4)) {
    for (const d of [-wobble, wobble]) {
      const { out } = simulate(phys, { ...t.shot, angle: t.shot.angle + d }, state, before);
      if (out.keepsTurn && !out.foul && !out.lossReason) t.score += 120;
    }
  }
  tried.sort((a, b) => b.score - a.score);
  return tried[0].shot;
}

// ---------- Safety / fallback ----------

function bestSafety(phys: PoolPhysics, state: GameState, before: Remaining): AiShot | null {
  const targets = legalTargets(state, before);
  const cue = phys.cue;
  let best: Tried | null = null;

  for (const t of phys.balls) {
    if (!t.onTable || t === cue || !targets.includes(groupOf(t.num))) continue;
    const base = Math.atan2(t.y - cue.y, t.x - cue.x);
    const dist = Math.hypot(t.x - cue.x, t.y - cue.y);
    const half = Math.asin(Math.min(1, (R * 1.6) / Math.max(dist, R * 2)));
    for (const off of [0, -half, half]) {
      for (const power of [0.22, 0.38]) {
        const shot: AiShot = { angle: base + off, power, spin: { top: 0, side: 0 }, calledPocket: null };
        const { out, sim } = simulate(phys, shot, state, before);
        if (out.foul || out.lossReason) continue;
        // Hide the cue ball from the opponent's easy pots.
        let score = out.keepsTurn ? 400 : 0;
        if (!out.keepsTurn) score -= potLines(sim, legalTargets(out.state, remainingOn(sim))).length * 40;
        score += Math.random() * 5;
        if (!best || score > best.score) best = { shot, score };
      }
    }
  }
  return best?.shot ?? null;
}

function fallback(phys: PoolPhysics, state: GameState, before: Remaining): AiShot {
  const targets = legalTargets(state, before);
  const cue = phys.cue;
  let nearest: SimBall | null = null;
  let bestD = Infinity;
  for (const b of phys.balls) {
    if (!b.onTable || b === cue || !targets.includes(groupOf(b.num))) continue;
    const d = Math.hypot(b.x - cue.x, b.y - cue.y);
    if (d < bestD) {
      bestD = d;
      nearest = b;
    }
  }
  const angle = nearest ? Math.atan2(nearest.y - cue.y, nearest.x - cue.x) : Math.random() * Math.PI * 2;
  return { angle, power: 0.5, spin: { top: 0, side: 0 }, calledPocket: null };
}

// ---------- Ball in hand ----------

function choosePlacement(phys: PoolPhysics, state: GameState, before: Remaining, kitchen: boolean): Vec {
  const g = phys.table;
  const others = phys.balls.filter(b => b.onTable && b.num !== 0);
  const targets = legalTargets(state, before);
  const spots: Vec[] = [];

  // Straight-in spots behind each pottable ball, plus a scatter of random ones.
  for (const t of others) {
    if (!targets.includes(groupOf(t.num))) continue;
    for (const p of g.pockets) {
      const d = Math.hypot(p.aimX - t.x, p.aimY - t.y);
      const ux = (p.aimX - t.x) / d;
      const uy = (p.aimY - t.y) / d;
      for (const back of [80, 140, 210]) {
        spots.push({ x: t.x - ux * (R * 2 + back), y: t.y - uy * (R * 2 + back) });
      }
    }
  }
  for (let i = 0; i < 30; i++) {
    spots.push({
      x: g.left + Math.random() * (g.right - g.left),
      y: g.top + Math.random() * (g.bottom - g.top),
    });
  }

  const probe = phys.clone();
  probe.cue.onTable = true;
  let best: Vec | null = null;
  let bestScore = -Infinity;
  for (const s of spots) {
    if (!canPlaceCueBall(s.x, s.y, others, kitchen)) continue;
    probe.cue.x = s.x;
    probe.cue.y = s.y;
    const lines = potLines(probe, targets);
    const score = lines.length ? Math.max(...lines.map(lineScore)) + Math.min(lines.length, 4) * 5 : -1000;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best ?? findFreeSpot(g.headX, g.cy, (x, y) => canPlaceCueBall(x, y, others, kitchen));
}

// ---------- Helpers ----------

function applyError(shot: AiShot, difficulty: Difficulty): AiShot {
  const aimErr = (AIM_ERROR_DEG[difficulty] * Math.PI) / 180;
  return {
    ...shot,
    angle: shot.angle + gaussian() * aimErr,
    power: clamp(shot.power * (1 + gaussian() * POWER_ERROR[difficulty]), 0.05, 1),
  };
}

function gaussian(): number {
  // Box–Muller, clipped so a bad roll is never absurd.
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), -2.5, 2.5);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
