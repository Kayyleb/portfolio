import Phaser from 'phaser';

// A tapered two-piece cue: wrapped butt, ebony forearm with maple points,
// silver joint, maple shaft, ivory ferrule and a chalked blue tip.
// Drawn at 2x and displayed at half scale. The tip is at the right edge.

export const CUE_LENGTH = 560;
export const CUE_TEX_SCALE = 2;
const BUTT_H = 15;
const TIP_H = 7;

export function ensureCueTexture(scene: Phaser.Scene): string {
  const key = 'tex_cue';
  if (scene.textures.exists(key)) return key;
  const s = CUE_TEX_SCALE;
  const L = CUE_LENGTH * s;
  const H = BUTT_H * s + 4;
  const tex = scene.textures.createCanvas(key, L, H)!;
  const ctx = tex.context;
  const mid = H / 2;
  const half = (x: number) => ((BUTT_H + (TIP_H - BUTT_H) * (x / L)) * s) / 2;

  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(0, mid - half(0));
    ctx.lineTo(L, mid - half(L));
    ctx.lineTo(L, mid + half(L));
    ctx.lineTo(0, mid + half(0));
    ctx.closePath();
  };

  ctx.save();
  outline();
  ctx.clip();

  const band = (from: number, to: number, fill: string | CanvasGradient) => {
    ctx.fillStyle = fill;
    ctx.fillRect(from * L, 0, (to - from) * L + 1, H);
  };

  band(0, 0.025, '#0d0d0d');
  band(0.025, 0.3, '#1c1c1f');
  // Linen wrap texture.
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0.025 * L; x < 0.3 * L; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 6, H);
    ctx.stroke();
  }
  band(0.3, 0.31, '#c9a24a');
  band(0.31, 0.52, '#2b160b');
  // Maple points inlaid into the forearm.
  ctx.fillStyle = '#e2bf82';
  for (const off of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(0.31 * L, mid + off * half(0.31 * L) * 2.4);
    ctx.lineTo(0.49 * L, mid + off * 2);
    ctx.lineTo(0.31 * L, mid + off * half(0.31 * L) * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  const joint = ctx.createLinearGradient(0, 0, 0, H);
  joint.addColorStop(0, '#f2f2f2');
  joint.addColorStop(0.5, '#9a9a9a');
  joint.addColorStop(1, '#5a5a5a');
  band(0.52, 0.535, joint);
  const maple = ctx.createLinearGradient(0.535 * L, 0, L, 0);
  maple.addColorStop(0, '#d9ae6c');
  maple.addColorStop(1, '#f3dcae');
  band(0.535, 0.975, maple);
  band(0.975, 0.992, '#f6f2e8');
  band(0.992, 1, '#3f7fe0');

  // Cylindrical shading.
  const shade = ctx.createLinearGradient(0, mid - BUTT_H * s * 0.5, 0, mid + BUTT_H * s * 0.5);
  shade.addColorStop(0, 'rgba(0,0,0,0.3)');
  shade.addColorStop(0.3, 'rgba(255,255,255,0.35)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  shade.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, L, H);
  ctx.restore();

  outline();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  tex.refresh();
  return key;
}
