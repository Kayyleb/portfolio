import Phaser from 'phaser';
import { CONFIG, COLORS, TABLE } from '../config';
import { TABLE_GEOM } from '../geometry';

// Background and table are painted once onto full-screen canvases, so their
// coordinates line up 1:1 with the game world.

export function ensureBackgroundTexture(scene: Phaser.Scene): string {
  const key = 'tex_bg';
  if (scene.textures.exists(key)) return key;
  const { W, H } = CONFIG;
  const tex = scene.textures.createCanvas(key, W, H)!;
  const ctx = tex.context;

  const grad = ctx.createRadialGradient(W / 2, H * 0.55, 80, W / 2, H * 0.55, W * 0.75);
  grad.addColorStop(0, COLORS.bgCenter);
  grad.addColorStop(1, COLORS.bgEdge);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Faint diagonal weave so large dark areas don't look flat.
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = -H; x < W; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }

  // Overhead lamp glow on the table.
  const lamp = ctx.createRadialGradient(TABLE.CX, TABLE.CY, 50, TABLE.CX, TABLE.CY, 760);
  lamp.addColorStop(0, 'rgba(160,210,255,0.16)');
  lamp.addColorStop(1, 'rgba(160,210,255,0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, W, H);

  tex.refresh();
  return key;
}

export function ensureTableTexture(scene: Phaser.Scene): string {
  const key = 'tex_table';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, CONFIG.W, CONFIG.H)!;
  const ctx = tex.context;
  const g = TABLE_GEOM;
  const D = TABLE.CUSHION;
  const RAIL = TABLE.RAIL;
  const ox = g.left - D - RAIL;
  const oy = g.top - D - RAIL;
  const ow = g.right - g.left + 2 * (D + RAIL);
  const oh = g.bottom - g.top + 2 * (D + RAIL);
  const corner = 38;

  // Drop shadow under the whole table.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#000';
  roundRect(ctx, ox, oy, ow, oh, corner);
  ctx.fill();
  ctx.restore();

  // Wooden rails.
  const wood = ctx.createLinearGradient(0, oy, 0, oy + oh);
  wood.addColorStop(0, COLORS.woodLight);
  wood.addColorStop(0.5, COLORS.woodMid);
  wood.addColorStop(1, COLORS.woodDark);
  ctx.fillStyle = wood;
  roundRect(ctx, ox, oy, ow, oh, corner);
  ctx.fill();
  drawGrain(ctx, ox, oy, ow, oh, corner, g.left - D, g.top - D, g.right + D, g.bottom + D);

  // Lacquer gloss and bevels.
  const gloss = ctx.createLinearGradient(0, oy, 0, oy + RAIL);
  gloss.addColorStop(0, 'rgba(255,230,200,0.22)');
  gloss.addColorStop(1, 'rgba(255,230,200,0)');
  ctx.fillStyle = gloss;
  roundRect(ctx, ox, oy, ow, oh, corner);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,220,180,0.28)';
  roundRect(ctx, ox + 2, oy + 2, ow - 4, oh - 4, corner - 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, ox, oy, ow, oh, corner);
  ctx.stroke();

  // Leather pocket caps on the rail.
  for (const p of g.pockets) {
    const r = p.holeR + 11;
    const leather = ctx.createRadialGradient(p.x, p.y - r * 0.3, r * 0.2, p.x, p.y, r);
    leather.addColorStop(0, '#4a3020');
    leather.addColorStop(1, '#170c06');
    ctx.fillStyle = leather;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Felt (extends under the cushions so the pocket throats are felt too).
  const fx = g.left - D;
  const fy = g.top - D;
  const fw = g.right - g.left + 2 * D;
  const fh = g.bottom - g.top + 2 * D;
  const felt = ctx.createRadialGradient(g.cx, g.cy, 40, g.cx, g.cy, fw * 0.62);
  felt.addColorStop(0, COLORS.feltCenter);
  felt.addColorStop(0.6, COLORS.feltMid);
  felt.addColorStop(1, COLORS.feltEdge);
  ctx.fillStyle = felt;
  ctx.fillRect(fx, fy, fw, fh);
  addNoise(ctx, fx, fy, fw, fh, 14);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(fx, fy, fw, fh);

  // Markings: head string, head spot and foot spot.
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.headX, g.top);
  ctx.lineTo(g.headX, g.bottom);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (const x of [g.headX, g.footX]) {
    ctx.beginPath();
    ctx.arc(x, g.cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pocket holes.
  for (const p of g.pockets) {
    const hole = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.holeR + 3);
    hole.addColorStop(0, '#000');
    hole.addColorStop(0.72, '#020202');
    hole.addColorStop(0.9, 'rgba(0,0,0,0.9)');
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.holeR + 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cushions: rubber body, shadow cast onto the felt, nose highlight, dark jaw faces.
  for (const poly of g.cushions) {
    const [j1, n1, n2, j2] = poly;
    const nx = n2.y - n1.y;
    const ny = -(n2.x - n1.x);
    const len = Math.hypot(nx, ny) || 1;
    // Normal pointing into the playfield.
    let ix = nx / len;
    let iy = ny / len;
    if ((g.cx - n1.x) * ix + (g.cy - n1.y) * iy < 0) {
      ix = -ix;
      iy = -iy;
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(n1.x + ix * 3.5, n1.y + iy * 3.5);
    ctx.lineTo(n2.x + ix * 3.5, n2.y + iy * 3.5);
    ctx.stroke();

    const rubber = ctx.createLinearGradient(n1.x - ix * D, n1.y - iy * D, n1.x, n1.y);
    rubber.addColorStop(0, COLORS.cushionDark);
    rubber.addColorStop(1, COLORS.cushion);
    ctx.fillStyle = rubber;
    ctx.beginPath();
    ctx.moveTo(j1.x, j1.y);
    ctx.lineTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.lineTo(j2.x, j2.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.moveTo(j1.x, j1.y);
    ctx.lineTo(n1.x, n1.y);
    ctx.moveTo(n2.x, n2.y);
    ctx.lineTo(j2.x, j2.y);
    ctx.stroke();
  }

  // Mother-of-pearl diamonds on the rails.
  const railMid = D + RAIL / 2;
  const pw = g.right - g.left;
  const ph = g.bottom - g.top;
  for (const k of [1, 2, 3, 5, 6, 7]) {
    const x = g.left + (pw * k) / 8;
    diamond(ctx, x, g.top - railMid, false);
    diamond(ctx, x, g.bottom + railMid, false);
  }
  for (const k of [1, 2, 3]) {
    const y = g.top + (ph * k) / 4;
    diamond(ctx, g.left - railMid, y, true);
    diamond(ctx, g.right + railMid, y, true);
  }

  tex.refresh();
  return key;
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number, ow: number, oh: number, corner: number,
  ix0: number, iy0: number, ix1: number, iy1: number,
): void {
  ctx.save();
  roundRect(ctx, ox, oy, ow, oh, corner);
  ctx.clip();
  ctx.lineWidth = 1;
  // Long rails: horizontal grain.
  for (const [y0, y1] of [[oy, iy0], [iy1, oy + oh]]) {
    for (let i = 0; i < 70; i++) {
      const y = y0 + Math.random() * (y1 - y0);
      ctx.strokeStyle = Math.random() < 0.6 ? `rgba(20,8,2,${0.08 + Math.random() * 0.12})` : `rgba(255,210,160,${0.03 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(ox, y);
      const amp = 1 + Math.random() * 3;
      for (let x = ox; x <= ox + ow; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * amp);
      ctx.stroke();
    }
  }
  // Short rails: vertical grain.
  for (const [x0, x1] of [[ox, ix0], [ix1, ox + ow]]) {
    for (let i = 0; i < 40; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      ctx.strokeStyle = Math.random() < 0.6 ? `rgba(20,8,2,${0.08 + Math.random() * 0.12})` : `rgba(255,210,160,${0.03 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(x, iy0);
      const amp = 1 + Math.random() * 3;
      for (let y = iy0; y <= iy1; y += 40) ctx.lineTo(x + Math.sin(y * 0.012 + i) * amp, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, vertical: boolean): void {
  const a = vertical ? 5 : 8;
  const b = vertical ? 8 : 5;
  const grad = ctx.createLinearGradient(x - a, y - b, x + a, y + b);
  grad.addColorStop(0, '#fffaf0');
  grad.addColorStop(1, '#c8b48c');
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - a, y);
  ctx.lineTo(x, y - b);
  ctx.lineTo(x + a, y);
  ctx.lineTo(x, y + b);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function addNoise(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, amount: number): void {
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, x, y);
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
