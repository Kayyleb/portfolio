import Phaser from 'phaser';
import { CONFIG, COLORS, FONT } from '../config';
import type { Difficulty } from '../ai';
import { ballIconKey, iconScaleFor } from '../art/ballArt';
import { ensureBackgroundTexture } from '../art/tableArt';
import { createButton, createIconButton, shade } from '../ui/button';
import { sfx } from '../sound';

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    const { W, H } = CONFIG;
    const cx = W / 2;
    this.add.image(0, 0, ensureBackgroundTexture(this)).setOrigin(0);
    this.floatingBalls();

    // Logo: the 8 ball standing in for the "8".
    const eight = this.add.image(cx - 150, 205, ballIconKey(this, 8, 9)).setScale(iconScaleFor(246, 9));
    this.tweens.add({ targets: eight, y: 195, angle: 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(cx - 70, 205, 'BALL', {
      fontFamily: FONT.family, fontSize: '128px', fontStyle: '800', color: '#ffffff',
      stroke: '#0a2a4a', strokeThickness: 12, resolution: 2,
    }).setOrigin(0, 0.5).setShadow(0, 8, '#00000088', 0, true, true);
    this.add.text(cx, 300, 'W E B   B I L L I A R D S', {
      fontFamily: FONT.family, fontSize: '26px', fontStyle: '700', color: COLORS.accentCss, resolution: 2,
    }).setOrigin(0.5);

    let difficulty: Difficulty = (this.registry.get('difficulty') as Difficulty | undefined) ?? 'normal';
    const start = (mode: 'cpu' | 'local') => {
      this.registry.set('difficulty', difficulty);
      this.scene.start('GameScene', { mode, difficulty });
    };

    createButton(this, cx, 410, { width: 460, height: 84, label: 'PLAY VS COMPUTER', fontSize: 30, color: 0x2f9e44, onClick: () => start('cpu') });

    // Difficulty chips.
    const chips: { d: Difficulty; g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text }[] = [];
    const drawChips = () => {
      for (const c of chips) {
        const on = c.d === difficulty;
        c.g.clear();
        c.g.fillStyle(on ? 0x35c4ff : 0x0c2340, on ? 1 : 0.9);
        c.g.fillRoundedRect(-62, -20, 124, 40, 20);
        c.g.lineStyle(2, on ? 0xffffff : COLORS.panelEdge, on ? 0.9 : 0.8);
        c.g.strokeRoundedRect(-62, -20, 124, 40, 20);
        c.t.setColor(on ? '#04263f' : '#9fc4e8');
      }
    };
    DIFFICULTIES.forEach((d, i) => {
      const x = cx - 140 + i * 140;
      const g = this.add.graphics();
      const t = this.add.text(0, -1, d.toUpperCase(), {
        fontFamily: FONT.family, fontSize: '18px', fontStyle: '800', color: '#9fc4e8', resolution: 2,
      }).setOrigin(0.5);
      const zone = this.add.zone(0, 0, 124, 40).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        sfx.unlock();
        sfx.click();
        difficulty = d;
        drawChips();
      });
      this.add.container(x, 486, [g, t, zone]);
      chips.push({ d, g, t });
    });
    drawChips();

    createButton(this, cx, 580, { width: 460, height: 84, label: '2 PLAYERS · ONE SCREEN', fontSize: 28, color: 0x1f6fd1, onClick: () => start('local') });

    // How to play.
    const hw = 920;
    const hh = 168;
    const hy = 700;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(cx - hw / 2, hy + 5, hw, hh, 24);
    g.fillStyle(COLORS.panel, 0.92);
    g.fillRoundedRect(cx - hw / 2, hy, hw, hh, 24);
    g.lineStyle(2, COLORS.panelEdge, 0.8);
    g.strokeRoundedRect(cx - hw / 2, hy, hw, hh, 24);
    this.add.text(cx, hy + 26, 'HOW TO PLAY', {
      fontFamily: FONT.family, fontSize: '20px', fontStyle: '800', color: COLORS.goldCss, resolution: 2,
    }).setOrigin(0.5);
    const tips = [
      ['Aim', 'drag on the table · mouse wheel, ← → or the AIM wheel to fine-tune'],
      ['Shoot', 'drag the POWER bar down and let go · or hold Space'],
      ['Spin', 'move the red dot on the cue ball for follow, draw and side'],
      ['Ball in hand', 'drag the cue ball · on the 8, tap the pocket you’re calling'],
    ];
    tips.forEach(([k, v], i) => {
      const y = hy + 58 + i * 26;
      this.add.text(cx - 300, y, k, {
        fontFamily: FONT.family, fontSize: '18px', fontStyle: '800', color: '#ffffff', resolution: 2,
      }).setOrigin(1, 0.5);
      this.add.text(cx - 284, y, v, {
        fontFamily: FONT.family, fontSize: '18px', fontStyle: '500', color: '#b9d3ee', resolution: 2,
      }).setOrigin(0, 0.5);
    });

    createIconButton(this, W - 50, H - 46, sfx.muted ? '×' : '♪', t => {
      sfx.setMuted(!sfx.muted);
      t.setText(sfx.muted ? '×' : '♪');
    });

    this.input.once('pointerdown', () => sfx.unlock());
  }

  // A few balls drifting slowly around the edges for some life.
  private floatingBalls(): void {
    const { W, H } = CONFIG;
    const nums = [1, 9, 3, 12, 5, 14, 7, 10, 2, 13];
    nums.forEach((n, i) => {
      const left = i % 2 === 0;
      const x = left ? 60 + Math.random() * 300 : W - 60 - Math.random() * 300;
      const y = 80 + Math.random() * (H - 160);
      const img = this.add.image(x, y, ballIconKey(this, n)).setScale(0.9 + Math.random() * 0.8).setAlpha(0.22);
      img.setTint(shade(0xffffff, -0.1));
      this.tweens.add({
        targets: img,
        x: x + (Math.random() - 0.5) * 120,
        y: y + (Math.random() - 0.5) * 120,
        angle: (Math.random() - 0.5) * 120,
        duration: 4000 + Math.random() * 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }
}
