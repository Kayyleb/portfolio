import { CONFIG, TABLE as T } from './config';
import type { Vec } from './types';

// Pure table geometry, shared by physics, aiming, the AI and rendering.

export interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface Pocket {
  x: number;          // hole centre
  y: number;
  captureR: number;   // a ball whose centre gets this close drops
  holeR: number;      // drawn radius
  kind: 'corner' | 'side';
  aimX: number;       // point an object ball should roll through to drop
  aimY: number;
}

export interface TableGeom {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
  headX: number;      // head string — cue ball goes behind it for the break
  footX: number;      // foot spot — apex of the rack
  segments: Segment[];
  cushions: Vec[][];  // rubber polygons (jaw, nose, nose, jaw)
  pockets: Pocket[];
}

function buildTable(): TableGeom {
  const cx = T.CX;
  const cy = T.CY;
  const left = cx - T.PLAY_W / 2;
  const right = cx + T.PLAY_W / 2;
  const top = cy - T.PLAY_H / 2;
  const bottom = cy + T.PLAY_H / 2;
  const D = T.CUSHION;
  const CM = T.CORNER_MOUTH;
  const SM = T.SIDE_MOUTH;
  const SF = T.SIDE_FLARE;

  // Each cushion runs jaw → nose → nose → jaw. Corner jaws are cut at 45° so the
  // corner throat is a straight channel along the diagonal.
  const cushions: Vec[][] = [
    [{ x: left + CM - D, y: top - D }, { x: left + CM, y: top }, { x: cx - SM, y: top }, { x: cx - SM - SF, y: top - D }],
    [{ x: cx + SM + SF, y: top - D }, { x: cx + SM, y: top }, { x: right - CM, y: top }, { x: right - CM + D, y: top - D }],
    [{ x: left + CM - D, y: bottom + D }, { x: left + CM, y: bottom }, { x: cx - SM, y: bottom }, { x: cx - SM - SF, y: bottom + D }],
    [{ x: cx + SM + SF, y: bottom + D }, { x: cx + SM, y: bottom }, { x: right - CM, y: bottom }, { x: right - CM + D, y: bottom + D }],
    [{ x: left - D, y: top + CM - D }, { x: left, y: top + CM }, { x: left, y: bottom - CM }, { x: left - D, y: bottom - CM + D }],
    [{ x: right + D, y: top + CM - D }, { x: right, y: top + CM }, { x: right, y: bottom - CM }, { x: right + D, y: bottom - CM + D }],
  ];

  const segments: Segment[] = [];
  for (const poly of cushions) {
    for (let i = 0; i < poly.length - 1; i++) {
      segments.push({ ax: poly[i].x, ay: poly[i].y, bx: poly[i + 1].x, by: poly[i + 1].y });
    }
  }

  const c = T.CORNER_POCKET;
  const s = T.SIDE_POCKET;
  const corner = (sx: number, sy: number): Pocket => ({
    x: (sx < 0 ? left : right) + sx * c.offset,
    y: (sy < 0 ? top : bottom) + sy * c.offset,
    captureR: c.captureR,
    holeR: c.holeR,
    kind: 'corner',
    aimX: (sx < 0 ? left : right) - sx * 4,
    aimY: (sy < 0 ? top : bottom) - sy * 4,
  });
  const side = (sy: number): Pocket => ({
    x: cx,
    y: (sy < 0 ? top : bottom) + sy * s.offset,
    captureR: s.captureR,
    holeR: s.holeR,
    kind: 'side',
    aimX: cx,
    aimY: (sy < 0 ? top : bottom) + sy * 2,
  });

  return {
    left, right, top, bottom, cx, cy,
    headX: left + T.PLAY_W / 4,
    footX: right - T.PLAY_W / 4,
    segments,
    cushions,
    // Order: top-left, top-middle, top-right, bottom-left, bottom-middle, bottom-right
    pockets: [corner(-1, -1), side(-1), corner(1, -1), corner(-1, 1), side(1), corner(1, 1)],
  };
}

export const TABLE_GEOM: TableGeom = buildTable();

// Can the cue ball be put down at (x, y)? `others` are the centres of balls on the table.
export function canPlaceCueBall(x: number, y: number, others: Vec[], kitchenOnly: boolean): boolean {
  const g = TABLE_GEOM;
  const R = CONFIG.BALL_R;
  const m = R + 1;
  if (x < g.left + m || x > g.right - m || y < g.top + m || y > g.bottom - m) return false;
  if (kitchenOnly && x > g.headX) return false;
  for (const o of others) {
    const dx = o.x - x;
    const dy = o.y - y;
    if (dx * dx + dy * dy < (R * 2 + 1) ** 2) return false;
  }
  for (const p of g.pockets) {
    const dx = p.x - x;
    const dy = p.y - y;
    if (dx * dx + dy * dy < (p.captureR + R + 2) ** 2) return false;
  }
  return true;
}

// Nearest spot to (x, y) that passes `ok`, searching outward in rings.
export function findFreeSpot(x: number, y: number, ok: (x: number, y: number) => boolean): Vec {
  if (ok(x, y)) return { x, y };
  const step = CONFIG.BALL_R;
  for (let ring = 1; ring < 60; ring++) {
    const r = ring * step;
    const n = Math.max(8, Math.round((2 * Math.PI * r) / step));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (ok(px, py)) return { x: px, y: py };
    }
  }
  return { x, y };
}

export function closestPointOnSegment(s: Segment, px: number, py: number): Vec {
  const ex = s.bx - s.ax;
  const ey = s.by - s.ay;
  const len2 = ex * ex + ey * ey;
  let t = len2 > 0 ? ((px - s.ax) * ex + (py - s.ay) * ey) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return { x: s.ax + ex * t, y: s.ay + ey * t };
}

// Distance from point P to segment AB.
export function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const c = closestPointOnSegment({ ax, ay, bx, by }, px, py);
  return Math.hypot(px - c.x, py - c.y);
}
