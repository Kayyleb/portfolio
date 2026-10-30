import { CONFIG, PHYSICS as P } from './config';
import { TableGeom, closestPointOnSegment } from './geometry';
import type { Spin } from './types';

// A small, deterministic pool physics engine: equal-mass elastic ball collisions,
// cushions as line segments, rolling resistance and cue-ball spin. Being
// deterministic and cheap lets the AI simulate candidate shots before taking one.

export interface SimBall {
  num: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onTable: boolean;
}

export type PhysEvent =
  | { kind: 'ball'; a: SimBall; b: SimBall; speed: number }
  | { kind: 'cushion'; ball: SimBall; speed: number }
  | { kind: 'pocket'; ball: SimBall; pocket: number };

const R = CONFIG.BALL_R;

export class PoolPhysics {
  readonly balls: SimBall[];
  readonly cue: SimBall;
  firstContact: number | null = null;   // number of the first ball the cue ball touched

  private spin: Spin = { top: 0, side: 0 };
  private spinUsed = true;
  private cueTravel = 0;
  private sideLeft = 0;
  private pending = { x: 0, y: 0, frames: 0 }; // follow/draw being bent in

  constructor(readonly table: TableGeom, balls: SimBall[]) {
    this.balls = balls;
    const cue = balls.find(b => b.num === 0);
    if (!cue) throw new Error('PoolPhysics needs a cue ball (num 0)');
    this.cue = cue;
  }

  clone(): PoolPhysics {
    const copy = new PoolPhysics(this.table, this.balls.map(b => ({ ...b })));
    copy.firstContact = this.firstContact;
    copy.spin = { ...this.spin };
    copy.spinUsed = this.spinUsed;
    copy.cueTravel = this.cueTravel;
    copy.sideLeft = this.sideLeft;
    copy.pending = { ...this.pending };
    return copy;
  }

  ball(num: number): SimBall | undefined {
    return this.balls.find(b => b.num === num);
  }

  strike(angle: number, speed: number, spin: Spin): void {
    this.cue.vx = Math.cos(angle) * speed;
    this.cue.vy = Math.sin(angle) * speed;
    this.spin = { ...spin };
    this.spinUsed = false;
    this.cueTravel = 0;
    this.sideLeft = spin.side;
    this.pending.frames = 0;
    this.firstContact = null;
  }

  isMoving(): boolean {
    if (this.pending.frames > 0) return true;
    for (const b of this.balls) {
      if (b.onTable && (b.vx !== 0 || b.vy !== 0)) return true;
    }
    return false;
  }

  // Advance one 1/60 s frame. Events are appended to `out` if given.
  step(out?: PhysEvent[]): void {
    const h = 1 / P.SUBSTEPS;
    for (let s = 0; s < P.SUBSTEPS; s++) {
      this.applySpinBend(h);
      this.integrate(h);
      this.collideBalls(out);
      this.collideCushions(out);
      this.capturePockets(out);
    }
  }

  // Runs until everything stops (or maxFrames). Handy for the AI.
  runToRest(maxFrames = 1200, out?: PhysEvent[]): void {
    for (let f = 0; f < maxFrames && this.isMoving(); f++) this.step(out);
  }

  private applySpinBend(h: number): void {
    const p = this.pending;
    if (p.frames <= 0) return;
    if (!this.cue.onTable) {
      p.frames = 0;
      return;
    }
    this.cue.vx += p.x * h;
    this.cue.vy += p.y * h;
    p.frames -= h;
  }

  private integrate(h: number): void {
    for (const b of this.balls) {
      if (!b.onTable || (b.vx === 0 && b.vy === 0)) continue;
      const sp = Math.hypot(b.vx, b.vy);
      const next = sp - (P.ROLL_DECEL + P.SPEED_DRAG * sp) * h;
      if (next < P.STOP_SPEED) {
        b.vx = 0;
        b.vy = 0;
        continue;
      }
      const k = next / sp;
      b.vx *= k;
      b.vy *= k;
      b.x += b.vx * h;
      b.y += b.vy * h;
      if (b === this.cue && !this.spinUsed) this.cueTravel += next * h;
    }
  }

  private collideBalls(out?: PhysEvent[]): void {
    const balls = this.balls;
    const minD = R * 2;
    const minD2 = minD * minD;
    const e = P.BALL_RESTITUTION;
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.onTable) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.onTable) continue;
        if (a.vx === 0 && a.vy === 0 && b.vx === 0 && b.vy === 0) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minD2 || d2 === 0) continue;

        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const push = (minD - d) / 2;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;

        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel <= 0) continue;

        const cuePre = a === this.cue ? { x: a.vx, y: a.vy } : b === this.cue ? { x: b.vx, y: b.vy } : null;
        const jImp = (rel * (1 + e)) / 2;
        a.vx -= jImp * nx;
        a.vy -= jImp * ny;
        b.vx += jImp * nx;
        b.vy += jImp * ny;
        out?.push({ kind: 'ball', a, b, speed: rel });

        if (cuePre) {
          const other = a === this.cue ? b : a;
          if (this.firstContact === null) this.firstContact = other.num;
          if (!this.spinUsed) this.startSpinBend(cuePre.x, cuePre.y, nx, ny);
        }
      }
    }
  }

  // Follow / draw: after the first hit, push the cue ball along its original line.
  // Draw wears off with distance into natural roll, like a real cue ball.
  private startSpinBend(pvx: number, pvy: number, nx: number, ny: number): void {
    this.spinUsed = true;
    const sp = Math.hypot(pvx, pvy);
    if (sp < 0.01) return;
    const dx = pvx / sp;
    const dy = pvy / sp;
    const fullness = Math.abs(dx * nx + dy * ny);
    const decay = Math.exp(-this.cueTravel / P.SPIN_DECAY_DIST);
    const top = this.spin.top * decay + P.NATURAL_ROLL * (1 - decay);
    const total = top * P.SPIN_FOLLOW * sp * fullness;
    const frames = P.SPIN_APPLY_FRAMES;
    this.pending = { x: (dx * total) / frames, y: (dy * total) / frames, frames };
  }

  private collideCushions(out?: PhysEvent[]): void {
    const e = P.CUSHION_RESTITUTION;
    for (const b of this.balls) {
      if (!b.onTable || (b.vx === 0 && b.vy === 0)) continue;
      for (const seg of this.table.segments) {
        const c = closestPointOnSegment(seg, b.x, b.y);
        const dx = b.x - c.x;
        const dy = b.y - c.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= R * R) continue;
        const d = Math.sqrt(d2) || 0.0001;
        const nx = dx / d;
        const ny = dy / d;
        b.x = c.x + nx * R;
        b.y = c.y + ny * R;

        const vn = b.vx * nx + b.vy * ny;
        if (vn >= 0) continue;
        const preX = b.vx;
        const preY = b.vy;
        b.vx -= (1 + e) * vn * nx;
        b.vy -= (1 + e) * vn * ny;

        const tx = -ny;
        const ty = nx;
        const vt = b.vx * tx + b.vy * ty;
        b.vx -= vt * P.CUSHION_GRIP * tx;
        b.vy -= vt * P.CUSHION_GRIP * ty;

        // Side spin: the cue ball kicks off the cushion toward the english side.
        if (b === this.cue && this.sideLeft !== 0) {
          const sp = Math.hypot(preX, preY);
          const rightX = -preY / sp;
          const rightY = preX / sp;
          const along = rightX * tx + rightY * ty;
          const kick = this.sideLeft * P.SPIN_SIDE * -vn * along;
          b.vx += tx * kick;
          b.vy += ty * kick;
          this.sideLeft *= 0.5;
          if (Math.abs(this.sideLeft) < 0.05) this.sideLeft = 0;
        }
        out?.push({ kind: 'cushion', ball: b, speed: -vn });
      }
    }
  }

  private capturePockets(out?: PhysEvent[]): void {
    const g = this.table;
    const slack = g.right - g.left; // only used to find the nearest pocket
    for (const b of this.balls) {
      if (!b.onTable) continue;
      let dropped = -1;
      for (let i = 0; i < g.pockets.length; i++) {
        const p = g.pockets[i];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        if (dx * dx + dy * dy < p.captureR * p.captureR) {
          dropped = i;
          break;
        }
      }
      // Failsafe: anything that slipped behind the cushions went down the nearest hole.
      if (dropped < 0) {
        const D = R * 2;
        if (b.x < g.left - D || b.x > g.right + D || b.y < g.top - D || b.y > g.bottom + D) {
          let best = slack * 10;
          g.pockets.forEach((p, i) => {
            const dist = Math.hypot(b.x - p.x, b.y - p.y);
            if (dist < best) {
              best = dist;
              dropped = i;
            }
          });
        }
      }
      if (dropped >= 0) {
        b.onTable = false;
        b.vx = 0;
        b.vy = 0;
        out?.push({ kind: 'pocket', ball: b, pocket: dropped });
      }
    }
  }
}

// Initial speed needed for a ball to roll `dist` px and still have `endSpeed` left.
export function speedToTravel(dist: number, endSpeed: number): number {
  let v = Math.max(endSpeed, P.STOP_SPEED);
  let covered = 0;
  for (let i = 0; i < 2000 && covered < dist; i++) {
    v = (v + P.ROLL_DECEL) / (1 - P.SPEED_DRAG);
    covered += v;
  }
  return v;
}
