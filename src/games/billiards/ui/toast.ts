import Phaser from 'phaser';
import { COLORS, FONT, TABLE } from '../config';

export type ToastTone = 'info' | 'good' | 'bad' | 'gold';

const TONE: Record<ToastTone, { css: string; hex: number }> = {
  info: { css: '#ffffff', hex: COLORS.accent },
  good: { css: COLORS.good, hex: 0x3fdc6a },
  bad: { css: COLORS.bad, hex: 0xff4d4d },
  gold: { css: COLORS.goldCss, hex: COLORS.gold },
};

// Big centred banner for fouls, group assignment, turn changes, etc.
export class Toasts {
  private current: Phaser.GameObjects.Container | null = null;

  constructor(private scene: Phaser.Scene) {}

  show(title: string, subtitle = '', tone: ToastTone = 'info', duration = 1700): void {
    const scene = this.scene;
    this.current?.destroy();

    const t = TONE[tone];
    const titleText = scene.add.text(0, subtitle ? -16 : 0, title, {
      fontFamily: FONT.family, fontSize: '42px', fontStyle: '800', color: t.css,
      stroke: '#000000', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5);
    const subText = scene.add.text(0, 26, subtitle, {
      fontFamily: FONT.family, fontSize: '22px', fontStyle: '600', color: '#e6f1ff', resolution: 2,
    }).setOrigin(0.5);

    const w = Math.max(titleText.width, subText.width) + 80;
    const h = subtitle ? 110 : 76;
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 22);
    g.fillStyle(0x071a30, 0.92);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    g.lineStyle(3, t.hex, 0.9);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);

    const box = scene.add.container(TABLE.CX, TABLE.CY - 30, [g, titleText, subtitle ? subText : null].filter(Boolean) as Phaser.GameObjects.GameObject[]);
    if (!subtitle) subText.destroy();
    box.setDepth(40).setScale(0.6).setAlpha(0);
    this.current = box;

    scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    scene.tweens.add({
      targets: box,
      alpha: 0,
      y: box.y - 16,
      delay: duration,
      duration: 260,
      onComplete: () => {
        if (this.current === box) this.current = null;
        box.destroy();
      },
    });
  }
}
