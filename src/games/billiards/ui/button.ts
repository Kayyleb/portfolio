import Phaser from 'phaser';
import { FONT } from '../config';
import { sfx } from '../sound';

export interface ButtonOptions {
  width: number;
  height: number;
  label: string;
  color?: number;
  fontSize?: number;
  onClick: () => void;
}

// Glossy pill button with hover/press feedback.
export function createButton(scene: Phaser.Scene, x: number, y: number, opts: ButtonOptions): Phaser.GameObjects.Container {
  const { width: w, height: h } = opts;
  const color = opts.color ?? 0x2f9e44;
  const g = scene.add.graphics();
  const draw = (hover: boolean) => {
    g.clear();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, h / 2);
    g.fillStyle(shade(color, -0.35), 1);
    g.fillRoundedRect(-w / 2, -h / 2 + 3, w, h, h / 2);
    g.fillStyle(hover ? shade(color, 0.15) : color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h - 3, (h - 3) / 2);
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(-w / 2 + 8, -h / 2 + 3, w - 16, h / 2 - 5, (h / 2 - 5) / 2);
  };
  draw(false);

  const text = scene.add.text(0, -2, opts.label, {
    fontFamily: FONT.family,
    fontSize: `${opts.fontSize ?? 24}px`,
    fontStyle: '800',
    color: '#ffffff',
    stroke: '#00000055',
    strokeThickness: 3,
    resolution: 2,
  }).setOrigin(0.5);

  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  const btn = scene.add.container(x, y, [g, text, zone]);
  let pressed = false;

  zone.on('pointerover', () => {
    draw(true);
    scene.tweens.add({ targets: btn, scale: 1.04, duration: 100 });
  });
  zone.on('pointerout', () => {
    pressed = false;
    draw(false);
    scene.tweens.add({ targets: btn, scale: 1, duration: 100 });
  });
  zone.on('pointerdown', () => {
    pressed = true;
    sfx.unlock();
    btn.setScale(0.96);
  });
  zone.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
    btn.setScale(1.04);
    sfx.click();
    opts.onClick();
  });
  return btn;
}

// Small round icon button (menu, sound).
export function createIconButton(
  scene: Phaser.Scene, x: number, y: number, label: string, onClick: (btn: Phaser.GameObjects.Text) => void,
): Phaser.GameObjects.Container {
  const r = 22;
  const g = scene.add.graphics();
  const draw = (hover: boolean) => {
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(0, 3, r);
    g.fillStyle(hover ? 0x1d4f80 : 0x123a63, 1);
    g.fillCircle(0, 0, r);
    g.lineStyle(2, 0x3f7fb8, 1);
    g.strokeCircle(0, 0, r);
  };
  draw(false);
  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT.family, fontSize: '20px', fontStyle: '800', color: '#ffffff', resolution: 2,
  }).setOrigin(0.5);
  const zone = scene.add.zone(0, 0, r * 2, r * 2).setInteractive({ useHandCursor: true });
  zone.on('pointerover', () => draw(true));
  zone.on('pointerout', () => draw(false));
  zone.on('pointerup', () => {
    sfx.unlock();
    sfx.click();
    onClick(text);
  });
  return scene.add.container(x, y, [g, text, zone]);
}

// Lighten (amt > 0) or darken (amt < 0) a 0xRRGGBB colour.
export function shade(color: number, amt: number): number {
  const ch = (shift: number) => {
    const c = (color >> shift) & 255;
    const v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.round(Math.max(0, Math.min(255, v)));
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
