import Phaser from 'phaser';
import { COLORS } from '../config';
import { ballIconKey } from '../art/ballArt';

// Glass tube beside the table that potted balls roll down into.
export class PocketChute {
  static readonly X = 1440;
  static readonly TOP = 196;
  static readonly BOTTOM = 800;
  private static readonly PITCH = 29;

  private balls: { num: number; img: Phaser.GameObjects.Image }[] = [];

  constructor(private scene: Phaser.Scene) {
    const { X, TOP, BOTTOM } = PocketChute;
    const g = scene.add.graphics().setDepth(9);
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(X - 20, TOP + 5, 40, BOTTOM - TOP, 20);
    g.fillStyle(0x020a14, 0.9);
    g.fillRoundedRect(X - 20, TOP, 40, BOTTOM - TOP, 20);
    g.lineStyle(2, COLORS.panelEdge, 0.8);
    g.strokeRoundedRect(X - 20, TOP, 40, BOTTOM - TOP, 20);
    const shine = scene.add.graphics().setDepth(12);
    shine.fillStyle(0xffffff, 0.08);
    shine.fillRoundedRect(X - 15, TOP + 8, 8, BOTTOM - TOP - 16, 4);
  }

  add(num: number): void {
    const { X, TOP, BOTTOM, PITCH } = PocketChute;
    const img = this.scene.add.image(X, TOP + 18, ballIconKey(this.scene, num)).setScale(0.5).setDepth(11);
    const targetY = BOTTOM - 18 - this.balls.length * PITCH;
    this.balls.push({ num, img });
    this.scene.tweens.add({
      targets: img,
      y: targetY,
      angle: (targetY - TOP) * 1.5,
      duration: 350 + (targetY - TOP) * 0.9,
      ease: 'Bounce.easeOut',
    });
  }

  remove(num: number): void {
    const i = this.balls.findIndex(b => b.num === num);
    if (i < 0) return;
    this.balls[i].img.destroy();
    this.balls.splice(i, 1);
    this.balls.forEach((b, k) => {
      this.scene.tweens.add({ targets: b.img, y: PocketChute.BOTTOM - 18 - k * PocketChute.PITCH, duration: 300, ease: 'Bounce.easeOut' });
    });
  }
}
