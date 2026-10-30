import Phaser from 'phaser';
import { CONFIG, COLORS, FONT } from '../config';
import { ballIconKey, iconScaleFor } from '../art/ballArt';
import { createButton } from './button';

export interface GameOverOptions {
  title: string;
  subtitle: string;
  celebrate: boolean;
  onRematch: () => void;
  onMenu: () => void;
}

// End-of-game panel with rematch / menu buttons.
export function showGameOver(scene: Phaser.Scene, opts: GameOverOptions): void {
  const { W, H } = CONFIG;
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x000814, 0.7).setDepth(50).setAlpha(0).setInteractive();
  scene.tweens.add({ targets: dim, alpha: 1, duration: 300 });

  const pw = 640;
  const ph = 380;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillRoundedRect(-pw / 2, -ph / 2 + 10, pw, ph, 30);
  g.fillStyle(0x0c2a4c, 1);
  g.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 30);
  g.fillStyle(0x16406e, 1);
  g.fillRoundedRect(-pw / 2, -ph / 2, pw, 120, { tl: 30, tr: 30, bl: 0, br: 0 });
  g.lineStyle(3, opts.celebrate ? COLORS.gold : COLORS.panelEdge, 1);
  g.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 30);

  const badge = scene.add.image(0, -ph / 2, ballIconKey(scene, 8, 5)).setScale(iconScaleFor(134, 5));
  const title = scene.add.text(0, -ph / 2 + 78, opts.title, {
    fontFamily: FONT.family, fontSize: '56px', fontStyle: '800',
    color: opts.celebrate ? COLORS.goldCss : '#ffffff', stroke: '#000000', strokeThickness: 6, resolution: 2,
  }).setOrigin(0.5);
  const sub = scene.add.text(0, -10, opts.subtitle, {
    fontFamily: FONT.family, fontSize: '24px', fontStyle: '600', color: '#cfe3ff',
    align: 'center', wordWrap: { width: pw - 80 }, resolution: 2,
  }).setOrigin(0.5);

  const rematch = createButton(scene, -150, 110, { width: 250, height: 68, label: 'PLAY AGAIN', color: 0x2f9e44, onClick: opts.onRematch });
  const menu = createButton(scene, 150, 110, { width: 250, height: 68, label: 'MAIN MENU', color: 0x1f6fd1, onClick: opts.onMenu });

  const box = scene.add.container(W / 2, H / 2, [g, badge, title, sub, rematch, menu]).setDepth(51).setScale(0.7).setAlpha(0);
  scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 380, ease: 'Back.easeOut', delay: 150 });
  scene.tweens.add({ targets: badge, angle: 360, duration: 900, ease: 'Cubic.easeOut', delay: 300 });

  if (opts.celebrate) confetti(scene);
}

function confetti(scene: Phaser.Scene): void {
  const { W, H } = CONFIG;
  const colors = [0xffc93c, 0x35c4ff, 0xff5c8a, 0x6dff8a, 0xffffff, 0xff8f3c];
  for (let i = 0; i < 110; i++) {
    const piece = scene.add.rectangle(
      W / 2 + (Math.random() - 0.5) * 300, H / 2 - 120,
      6 + Math.random() * 8, 10 + Math.random() * 10,
      colors[i % colors.length],
    ).setDepth(52).setAngle(Math.random() * 360);
    scene.tweens.add({
      targets: piece,
      x: piece.x + (Math.random() - 0.5) * W * 0.9,
      y: H + 40,
      angle: piece.angle + (Math.random() - 0.5) * 900,
      duration: 1600 + Math.random() * 1600,
      delay: Math.random() * 400,
      ease: 'Quad.easeIn',
      onComplete: () => piece.destroy(),
    });
  }
}
