import { CONFIG } from './config';
import { TableGeom, closestPointOnSegment } from './geometry';
import type { SimBall } from './physics';

// Aim-line prediction: sweeps the cue ball along the aim direction and reports
// the first thing it touches, plus where the balls head afterwards.

export interface AimPrediction {
  // Cue ball centre at the moment of contact (the "ghost ball").
  endX: number;
  endY: number;
  kind: 'ball' | 'cushion' | 'pocket' | 'none';
  target?: SimBall;
  // Object ball direction and how much of the cue's speed it takes (cos of cut).
  objDirX?: number;
  objDirY?: number;
  objShare?: number;
  // Cue ball's post-contact tangent line, scaled by sin of the cut.
  cueDirX?: number;
  cueDirY?: number;
  cueShare?: number;
  // Bounce direction off a cushion.
  bounceX?: number;
  bounceY?: number;
}

const R = CONFIG.BALL_R;
const EPS = 0.001;

// Distance along the ray (o + t*d, |d| = 1) to the first entry into a circle.
function rayCircle(ox: number, oy: number, dx: number, dy: number, cx: number, cy: number, r: number): number | null {
  const lx = ox - cx;
  const ly = oy - cy;
  const b = lx * dx + ly * dy;
  const c = lx * lx + ly * ly - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > EPS ? t : null;
}

function raySegment(
  ox: number, oy: number, dx: number, dy: number,
  ax: number, ay: number, bx: number, by: number,
): number | null {
  const ex = bx - ax;
  const ey = by - ay;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((ax - ox) * ey - (ay - oy) * ex) / denom;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / denom;
  if (t > EPS && u >= 0 && u <= 1) return t;
  return null;
}

// Ray against a segment fattened by r (a capsule): two offset edges plus end caps.
function rayCapsule(
  ox: number, oy: number, dx: number, dy: number,
  ax: number, ay: number, bx: number, by: number, r: number,
): number | null {
  const len = Math.hypot(bx - ax, by - ay) || 1;
  const nx = (-(by - ay) / len) * r;
  const ny = ((bx - ax) / len) * r;
  let best: number | null = null;
  const consider = (t: number | null) => {
    if (t !== null && (best === null || t < best)) best = t;
  };
  consider(raySegment(ox, oy, dx, dy, ax + nx, ay + ny, bx + nx, by + ny));
  consider(raySegment(ox, oy, dx, dy, ax - nx, ay - ny, bx - nx, by - ny));
  consider(rayCircle(ox, oy, dx, dy, ax, ay, r));
  consider(rayCircle(ox, oy, dx, dy, bx, by, r));
  return best;
}

export function predictAim(table: TableGeom, cue: SimBall, balls: SimBall[], angle: number): AimPrediction {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const ox = cue.x;
  const oy = cue.y;

  let bestT = 4000;
  let kind: AimPrediction['kind'] = 'none';
  let target: SimBall | undefined;
  let segIndex = -1;

  for (const b of balls) {
    if (!b.onTable || b === cue) continue;
    const t = rayCircle(ox, oy, dx, dy, b.x, b.y, R * 2);
    if (t !== null && t < bestT) {
      bestT = t;
      kind = 'ball';
      target = b;
    }
  }
  for (let i = 0; i < table.segments.length; i++) {
    const s = table.segments[i];
    const t = rayCapsule(ox, oy, dx, dy, s.ax, s.ay, s.bx, s.by, R);
    if (t !== null && t < bestT) {
      bestT = t;
      kind = 'cushion';
      target = undefined;
      segIndex = i;
    }
  }
  for (const p of table.pockets) {
    const t = rayCircle(ox, oy, dx, dy, p.x, p.y, p.captureR);
    if (t !== null && t < bestT) {
      bestT = t;
      kind = 'pocket';
      target = undefined;
    }
  }

  const endX = ox + dx * bestT;
  const endY = oy + dy * bestT;
  const pred: AimPrediction = { endX, endY, kind, target };

  if (kind === 'ball' && target) {
    const ux = (target.x - endX) / (R * 2);
    const uy = (target.y - endY) / (R * 2);
    const share = Math.max(0, dx * ux + dy * uy);
    pred.objDirX = ux;
    pred.objDirY = uy;
    pred.objShare = share;
    // Cue ball leaves along the tangent: its velocity minus the part handed over.
    const tx = dx - share * ux;
    const ty = dy - share * uy;
    const tLen = Math.hypot(tx, ty);
    if (tLen > 0.0001) {
      pred.cueDirX = tx / tLen;
      pred.cueDirY = ty / tLen;
      pred.cueShare = tLen;
    } else {
      pred.cueShare = 0;
    }
  } else if (kind === 'cushion' && segIndex >= 0) {
    const c = closestPointOnSegment(table.segments[segIndex], endX, endY);
    const len = Math.hypot(endX - c.x, endY - c.y) || 1;
    const nx = (endX - c.x) / len;
    const ny = (endY - c.y) / len;
    const dot = dx * nx + dy * ny;
    pred.bounceX = dx - 2 * dot * nx;
    pred.bounceY = dy - 2 * dot * ny;
  }

  return pred;
}
