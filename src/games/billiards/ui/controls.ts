import Phaser from 'phaser';
import { COLORS, FONT } from '../config';
import { ballIconKey } from '../art/ballArt';
import { CUE_LENGTH, CUE_TEX_SCALE, ensureCueTexture } from '../art/cueArt';
import type { Spin } from '../types';

function label(scene: Phaser.Scene, x: number, y: number, text: string): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: FONT.family, fontSize: '18px', fontStyle: '800', color: '#9fc4e8', resolution: 2,
  }).setOrigin(0.5).setDepth(10);
}

function panel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number): void {
  g.fillStyle(0x000000, 0.3);
  g.fillRoundedRect(x, y + 5, w, h, r);
  g.fillStyle(COLORS.panel, 0.95);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(2, COLORS.panelEdge, 0.8);
  g.strokeRoundedRect(x, y, w, h, r);
}

// Vertical power bar on the left: drag down to pull the cue back, release to shoot.
export class PowerBar {
  static readonly X = 120;
  static readonly TOP = 250;
  static readonly BOTTOM = 760;
  static readonly W = 50;

  private fill: Phaser.GameObjects.Graphics;
  private cue: Phaser.GameObjects.Image;
  private pct: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const { X, TOP, BOTTOM, W } = PowerBar;
    const H = BOTTOM - TOP;
    const g = scene.add.graphics().setDepth(10);
    panel(g, X - W / 2 - 10, TOP - 14, W + 20, H + 28, 20);
    g.fillStyle(0x040d18, 1);
    g.fillRoundedRect(X - W / 2, TOP, W, H, 14);
    this.fill = scene.add.graphics().setDepth(10);
    const ticks = scene.add.graphics().setDepth(10);
    ticks.lineStyle(2, 0xffffff, 0.15);
    for (let i = 1; i < 10; i++) {
      const y = TOP + (H * i) / 10;
      ticks.lineBetween(X + W / 2 - (i % 5 === 0 ? 16 : 9), y, X + W / 2 - 2, y);
    }

    const len = H * 0.66;
    this.cue = scene.add.image(X, TOP, ensureCueTexture(scene))
      .setOrigin(1, 0.5)
      .setRotation(-Math.PI / 2)
      .setScale(len / (CUE_LENGTH * CUE_TEX_SCALE))
      .setDepth(10);

    label(scene, X, TOP - 38, 'POWER');
    this.pct = label(scene, X, BOTTOM + 34, '0%');
    this.setPower(0);
  }

  // Pixels of drag that equal 100% power.
  static get travel(): number {
    return (PowerBar.BOTTOM - PowerBar.TOP) * 0.85;
  }

  contains(x: number, y: number): boolean {
    return Math.abs(x - PowerBar.X) < PowerBar.W / 2 + 30 && y > PowerBar.TOP - 50 && y < PowerBar.BOTTOM + 50;
  }

  setPower(p: number): void {
    const { X, TOP, BOTTOM, W } = PowerBar;
    const H = BOTTOM - TOP;
    const g = this.fill;
    g.clear();
    if (p > 0) {
      const h = Math.max(4, H * p);
      g.fillGradientStyle(0x3cff7a, 0x3cff7a, powerColor(p), powerColor(p), 0.9);
      g.fillRect(X - W / 2 + 4, TOP + 4, W - 8, h - 8);
    }
    this.cue.setY(TOP + 10 + p * H * 0.3);
    this.pct.setText(`${Math.round(p * 100)}%`).setColor(p > 0.85 ? '#ff6b5c' : '#9fc4e8');
  }
}

export function powerColor(p: number): number {
  // green → yellow → red
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
  const [r, g, b] = p < 0.5
    ? [lerp(60, 255, p * 2), lerp(255, 214, p * 2), lerp(122, 60, p * 2)]
    : [255, lerp(214, 70, (p - 0.5) * 2), lerp(60, 60, (p - 0.5) * 2)];
  return (r << 16) | (g << 8) | b;
}

// Cue-ball spin picker (top right): drag the red dot to where the tip strikes.
export class SpinControl {
  static readonly X = 1514;
  static readonly Y = 262;
  static readonly R = 46;

  private dot: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const { X, Y, R } = SpinControl;
    const g = scene.add.graphics().setDepth(10);
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(X, Y + 5, R + 12);
    g.fillStyle(COLORS.panel, 0.95);
    g.fillCircle(X, Y, R + 12);
    g.lineStyle(2, COLORS.panelEdge, 0.8);
    g.strokeCircle(X, Y, R + 12);
    scene.add.image(X, Y, ballIconKey(scene, 0, 4)).setDisplaySize(R * 2 + 4, R * 2 + 4).setDepth(10);
    const cross = scene.add.graphics().setDepth(10);
    cross.lineStyle(1, 0x000000, 0.18);
    cross.lineBetween(X - R, Y, X + R, Y);
    cross.lineBetween(X, Y - R, X, Y + R);
    cross.strokeCircle(X, Y, R * 0.72);
    this.dot = scene.add.graphics().setDepth(10);
    label(scene, X, Y - R - 32, 'SPIN');
    this.setSpin({ top: 0, side: 0 });
  }

  contains(x: number, y: number): boolean {
    return Math.hypot(x - SpinControl.X, y - SpinControl.Y) < SpinControl.R + 16;
  }

  spinAt(x: number, y: number): Spin {
    const k = SpinControl.R * 0.72;
    let side = (x - SpinControl.X) / k;
    let top = -(y - SpinControl.Y) / k;
    const len = Math.hypot(side, top);
    if (len > 1) {
      side /= len;
      top /= len;
    }
    return { side, top };
  }

  setSpin(s: Spin): void {
    const k = SpinControl.R * 0.72;
    const x = SpinControl.X + s.side * k;
    const y = SpinControl.Y - s.top * k;
    const g = this.dot;
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(x, y + 2, 9);
    g.fillStyle(0xe8262b, 1);
    g.fillCircle(x, y, 8);
    g.lineStyle(2, 0xffffff, 0.9);
    g.strokeCircle(x, y, 8);
  }
}

// Ridged wheel for nudging the aim by fractions of a degree.
export class FineTune {
  static readonly X = 1514;
  static readonly TOP = 380;
  static readonly BOTTOM = 760;
  static readonly W = 40;

  private ridges: Phaser.GameObjects.Graphics;
  private offset = 0;

  constructor(scene: Phaser.Scene) {
    const { X, TOP, BOTTOM, W } = FineTune;
    const g = scene.add.graphics().setDepth(10);
    panel(g, X - W / 2 - 10, TOP - 14, W + 20, BOTTOM - TOP + 28, 20);
    g.fillStyle(0x040d18, 1);
    g.fillRoundedRect(X - W / 2, TOP, W, BOTTOM - TOP, 12);
    this.ridges = scene.add.graphics().setDepth(10);
    label(scene, X, TOP - 38, 'AIM');
    label(scene, X, BOTTOM + 34, 'FINE');
    this.draw();
  }

  contains(x: number, y: number): boolean {
    return Math.abs(x - FineTune.X) < FineTune.W / 2 + 24 && y > FineTune.TOP - 20 && y < FineTune.BOTTOM + 20;
  }

  scroll(dy: number): void {
    this.offset = (((this.offset + dy) % 14) + 14) % 14;
    this.draw();
  }

  private draw(): void {
    const { X, TOP, BOTTOM, W } = FineTune;
    const H = BOTTOM - TOP;
    const g = this.ridges;
    g.clear();
    for (let y = TOP + 6 + this.offset; y < BOTTOM - 4; y += 14) {
      // Brighter in the middle, like a lit cylinder.
      const t = Math.sin((Math.PI * (y - TOP)) / H);
      g.lineStyle(4, 0x6fa8dc, 0.15 + 0.55 * t);
      g.lineBetween(X - W / 2 + 6, y, X + W / 2 - 6, y);
    }
  }
}
