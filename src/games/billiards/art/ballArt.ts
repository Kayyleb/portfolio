import Phaser from 'phaser';
import { CONFIG, FONT } from '../config';
import { BALL_COLORS, groupOf } from '../types';

// Balls are drawn per-pixel as lit spheres. Each ball carries a 3D orientation,
// so as it rolls the number spot and stripe genuinely turn over — the detail
// that makes rolling balls read as rolling.

export const BALL_TEX_SCALE = 2; // drawn at 2x, displayed at 0.5 for smooth edges

const R = CONFIG.BALL_R;
const SPOT_COS = 0.8;                       // angular size of the number spot
const SPOT_SIN = Math.sqrt(1 - SPOT_COS * SPOT_COS);
const SPOT_EDGE = 0.025;
const STRIPE_HALF = 0.5;
const CREAM: [number, number, number] = [246, 242, 230];
const INK: [number, number, number] = [22, 22, 22];

interface PixelTable {
  count: number;
  idx: Int32Array;
  nx: Float32Array;
  ny: Float32Array;
  nz: Float32Array;
  shade: Float32Array;
  spec: Float32Array;
  alpha: Float32Array;
}

// Texture side length for a given resolution scale.
function texSize(scale: number): number {
  return (R + 1) * 2 * scale;
}

// Resolution of the number glyph, enough to stay sharp on big icons.
function glyphRes(scale: number): number {
  return Math.max(48, Math.round(24 * scale));
}

const pixelTables = new Map<number, PixelTable>();

// Per-pixel sphere normals and lighting never change, so compute them once per size.
function pixelTable(scale: number): PixelTable {
  const cached = pixelTables.get(scale);
  if (cached) return cached;
  const SIZE = texSize(scale);
  const RP = R * scale;
  const c = SIZE / 2;
  const L = norm(-0.5, -0.62, 0.6);
  const H = norm(L[0], L[1], L[2] + 1);
  const list: number[][] = [];
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const x = (px + 0.5 - c) / RP;
      const y = (py + 0.5 - c) / RP;
      const d = Math.sqrt(x * x + y * y);
      const alpha = clamp01((1 - d) * RP + 0.5);
      if (alpha <= 0) continue;
      const k = d > 1 ? 1 / d : 1;
      const nx = x * k;
      const ny = y * k;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const shade = Math.min(1.08, (0.3 + 0.8 * diff) * (0.86 + 0.14 * nz));
      const s = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
      const spec = Math.pow(s, 70) * 0.95 + Math.pow(s, 9) * 0.1;
      list.push([py * SIZE + px, nx, ny, nz, shade, spec, alpha]);
    }
  }
  const n = list.length;
  const pixels: PixelTable = {
    count: n,
    idx: Int32Array.from(list, p => p[0]),
    nx: Float32Array.from(list, p => p[1]),
    ny: Float32Array.from(list, p => p[2]),
    nz: Float32Array.from(list, p => p[3]),
    shade: Float32Array.from(list, p => p[4]),
    spec: Float32Array.from(list, p => p[5]),
    alpha: Float32Array.from(list, p => p[6]),
  };
  pixelTables.set(scale, pixels);
  return pixels;
}

const glyphs = new Map<string, Float32Array>();

// Ink coverage of the number, in spot-local coordinates (GLYPH x GLYPH).
function glyph(num: number, GLYPH: number): Float32Array {
  const cacheKey = `${num}@${GLYPH}`;
  const cached = glyphs.get(cacheKey);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = GLYPH;
  canvas.height = GLYPH;
  const ctx = canvas.getContext('2d')!;
  const text = String(num);
  let size = GLYPH * 0.66;
  ctx.font = `800 ${size}px ${FONT.family}`;
  const w = ctx.measureText(text).width;
  if (w > GLYPH * 0.78) size *= (GLYPH * 0.78) / w;
  ctx.font = `800 ${size}px ${FONT.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText(text, GLYPH / 2, GLYPH / 2 + size * 0.06);
  const data = ctx.getImageData(0, 0, GLYPH, GLYPH).data;
  const ink = new Float32Array(GLYPH * GLYPH);
  for (let i = 0; i < ink.length; i++) ink[i] = data[i * 4 + 3] / 255;
  glyphs.set(cacheKey, ink);
  return ink;
}

export class BallSkin {
  readonly key: string;
  private tex: Phaser.Textures.CanvasTexture;
  private image: ImageData;
  // Rotation taking ball-local coordinates to view coordinates (row-major 3x3).
  // View space: x right, y down, z toward the viewer.
  private m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  private dirty = true;
  private rolls = 0;
  private readonly base: [number, number, number];
  private readonly striped: boolean;
  private readonly ink: Float32Array | null;
  private readonly glyphN: number;

  constructor(
    scene: Phaser.Scene,
    readonly num: number,
    key = `ball_${num}`,
    jitter = true,
    private readonly scale = BALL_TEX_SCALE,
  ) {
    this.key = key;
    const size = texSize(scale);
    const existing = scene.textures.exists(key) ? scene.textures.get(key) : null;
    this.tex = (existing as Phaser.Textures.CanvasTexture | null) ?? scene.textures.createCanvas(key, size, size)!;
    this.image = this.tex.context.createImageData(size, size);

    const color = BALL_COLORS[num];
    this.base = [(color >> 16) & 255, (color >> 8) & 255, color & 255];
    this.striped = groupOf(num) === 'stripe';
    this.glyphN = glyphRes(scale);
    this.ink = num === 0 ? null : glyph(num, this.glyphN);

    if (jitter) {
      // Racked balls sit roughly number-up, but not robotically so.
      this.rotate(0, 0, 1, (Math.random() - 0.5) * 1.2);
      const a = Math.random() * Math.PI * 2;
      this.rotate(Math.cos(a), Math.sin(a), 0, Math.random() * 0.35);
    }
    this.render();
  }

  // Roll the ball along the table by (dx, dy) px.
  roll(dx: number, dy: number): void {
    const d = Math.hypot(dx, dy);
    if (d < 1e-4) return;
    this.rotate(-dy / d, dx / d, 0, d / R);
  }

  render(): void {
    if (!this.dirty) return;
    this.dirty = false;
    const px = pixelTable(this.scale);
    const m = this.m;
    const out = this.image.data;
    const [br, bg, bb] = this.base;
    const ink = this.ink;
    const GLYPH = this.glyphN;
    const cue = this.num === 0;

    for (let i = 0; i < px.count; i++) {
      const nx = px.nx[i];
      const ny = px.ny[i];
      const nz = px.nz[i];
      // View normal → ball-local point (transpose of m).
      const lx = m[0] * nx + m[3] * ny + m[6] * nz;
      const ly = m[1] * nx + m[4] * ny + m[7] * nz;
      const lz = m[2] * nx + m[5] * ny + m[8] * nz;

      let r: number, g: number, b: number;
      if (cue || (this.striped && Math.abs(ly) > STRIPE_HALF)) {
        r = CREAM[0]; g = CREAM[1]; b = CREAM[2];
      } else {
        r = br; g = bg; b = bb;
      }

      if (ink) {
        const az = Math.abs(lz);
        if (az > SPOT_COS - SPOT_EDGE) {
          const u = (lz > 0 ? lx : -lx) / SPOT_SIN;
          const v = ly / SPOT_SIN;
          const gi = Math.min(GLYPH - 1, Math.max(0, ((u * 0.5 + 0.5) * GLYPH) | 0));
          const gj = Math.min(GLYPH - 1, Math.max(0, ((v * 0.5 + 0.5) * GLYPH) | 0));
          const k = ink[gj * GLYPH + gi];
          const sr = CREAM[0] + (INK[0] - CREAM[0]) * k;
          const sg = CREAM[1] + (INK[1] - CREAM[1]) * k;
          const sb = CREAM[2] + (INK[2] - CREAM[2]) * k;
          const t = clamp01((az - (SPOT_COS - SPOT_EDGE)) / SPOT_EDGE);
          r += (sr - r) * t;
          g += (sg - g) * t;
          b += (sb - b) * t;
        }
      }

      const shade = px.shade[i];
      const spec = px.spec[i] * 255;
      const o = px.idx[i] * 4;
      out[o] = r * shade + spec;
      out[o + 1] = g * shade + spec;
      out[o + 2] = b * shade + spec;
      out[o + 3] = px.alpha[i] * 255;
    }
    this.tex.context.putImageData(this.image, 0, 0);
    this.tex.refresh();
  }

  // Left-multiply the orientation by a rotation of `angle` about unit axis (kx, ky, kz).
  private rotate(kx: number, ky: number, kz: number, angle: number): void {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const q = [
      c + t * kx * kx, t * kx * ky - s * kz, t * kx * kz + s * ky,
      t * kx * ky + s * kz, c + t * ky * ky, t * ky * kz - s * kx,
      t * kx * kz - s * ky, t * ky * kz + s * kx, c + t * kz * kz,
    ];
    const m = this.m;
    const r = new Array<number>(9);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        r[row * 3 + col] = q[row * 3] * m[col] + q[row * 3 + 1] * m[3 + col] + q[row * 3 + 2] * m[6 + col];
      }
    }
    this.m = r;
    if (++this.rolls % 30 === 0) this.orthonormalize();
    this.dirty = true;
  }

  // Keep floating-point drift from skewing the ball over a long game.
  private orthonormalize(): void {
    const m = this.m;
    const a = norm(m[0], m[1], m[2]);
    let b = [m[3], m[4], m[5]];
    const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    b = norm(b[0] - d * a[0], b[1] - d * a[1], b[2] - d * a[2]);
    const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    this.m = [...a, ...b, ...c];
  }
}

// Static, number-up ball for the HUD trays and pocket chute.
// `scale` is the texture resolution; the default matches the in-game balls.
export function ballIconKey(scene: Phaser.Scene, num: number, scale = BALL_TEX_SCALE): string {
  const key = scale === BALL_TEX_SCALE ? `ball_icon_${num}` : `ball_icon_${num}@${scale}`;
  if (!scene.textures.exists(key)) new BallSkin(scene, num, key, false, scale);
  return key;
}

// Display scale that shows a `ballIconKey(scene, n, texScale)` image at `diameter` px.
export function iconScaleFor(diameter: number, texScale: number): number {
  return diameter / ((CONFIG.BALL_R + 1) * 2 * texScale);
}

export function ensureShadowTexture(scene: Phaser.Scene): string {
  const key = 'ball_shadow';
  if (scene.textures.exists(key)) return key;
  const size = 64;
  const tex = scene.textures.createCanvas(key, size, size)!;
  const ctx = tex.context;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

function norm(x: number, y: number, z: number): [number, number, number] {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
