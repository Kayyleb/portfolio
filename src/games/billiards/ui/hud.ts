import Phaser from 'phaser';
import { CONFIG, COLORS, FONT } from '../config';
import { ballIconKey, iconScaleFor } from '../art/ballArt';
import type { Group, PlayerIndex } from '../rules';

export interface PlayerInfo {
  name: string;
  isAi: boolean;
  badge: string;   // short text shown in the avatar
}

const PANEL_W = 520;
const PANEL_H = 104;
const PANEL_Y = 14;
const AVATAR_R = 38;
const SLOT = 32;
const ICON_SCALE = 0.44;

const SOLIDS = [1, 2, 3, 4, 5, 6, 7];
const STRIPES = [9, 10, 11, 12, 13, 14, 15];

// One player's card: avatar with shot-clock ring, name and ball tray.
class PlayerCard {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private ring: Phaser.GameObjects.Graphics;
  private avatar: Phaser.GameObjects.Container;
  private slots: Phaser.GameObjects.Image[] = [];
  private slotBg: Phaser.GameObjects.Graphics;
  private eightGlow: Phaser.GameObjects.Graphics;
  private groupText: Phaser.GameObjects.Text;
  private readonly ax: number;
  private readonly ay = PANEL_Y + PANEL_H / 2;
  private readonly bgX: number;
  private readonly color: number;

  constructor(private scene: Phaser.Scene, index: PlayerIndex, info: PlayerInfo) {
    const left = index === 0;
    const px = left ? 24 : CONFIG.W - 24 - PANEL_W;
    this.bgX = px;
    this.color = COLORS.players[index];
    this.ax = left ? px + 56 : px + PANEL_W - 56;

    this.bg = scene.add.graphics();
    this.ring = scene.add.graphics();

    const av = scene.add.graphics();
    av.fillStyle(0x000000, 0.35);
    av.fillCircle(0, 3, AVATAR_R);
    av.fillStyle(this.color, 1);
    av.fillCircle(0, 0, AVATAR_R);
    av.fillStyle(0xffffff, 0.18);
    av.fillCircle(-8, -10, AVATAR_R * 0.6);
    av.lineStyle(3, 0xffffff, 0.85);
    av.strokeCircle(0, 0, AVATAR_R);
    const initial = scene.add.text(0, 1, info.badge, {
      fontFamily: FONT.family, fontSize: info.badge.length > 2 ? '24px' : '30px', fontStyle: '800', color: '#ffffff',
      stroke: '#00000066', strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5);
    this.avatar = scene.add.container(this.ax, this.ay, [av, initial]);

    const nameX = left ? this.ax + 58 : this.ax - 58;
    const name = scene.add.text(nameX, PANEL_Y + 12, info.name, {
      fontFamily: FONT.family, fontSize: '28px', fontStyle: '800', color: '#ffffff', resolution: 2,
    }).setOrigin(left ? 0 : 1, 0);
    this.groupText = scene.add.text(left ? nameX + name.width + 12 : nameX - name.width - 12, PANEL_Y + 22, '', {
      fontFamily: FONT.family, fontSize: '18px', fontStyle: '700', color: '#9fc4e8', resolution: 2,
    }).setOrigin(left ? 0 : 1, 0);

    this.slotBg = scene.add.graphics();
    this.eightGlow = scene.add.graphics();
    const trayY = PANEL_Y + 74;
    for (let i = 0; i < 8; i++) {
      const x = left ? nameX + 14 + i * SLOT : nameX - 14 - i * SLOT;
      this.slotBg.fillStyle(0x000000, 0.4);
      this.slotBg.fillCircle(x, trayY, 13);
      this.slotBg.lineStyle(1, 0xffffff, 0.12);
      this.slotBg.strokeCircle(x, trayY, 13);
      this.slots.push(scene.add.image(x, trayY, ballIconKey(scene, 8)).setScale(ICON_SCALE).setVisible(false));
    }

    this.container = scene.add.container(0, 0, [
      this.bg, this.ring, this.avatar, name, this.groupText, this.slotBg, this.eightGlow, ...this.slots,
    ]).setDepth(10);
    this.drawBg(px, false);
  }

  private drawBg(px: number, active: boolean): void {
    const g = this.bg;
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(px, PANEL_Y + 5, PANEL_W, PANEL_H, 22);
    g.fillStyle(active ? 0x113a66 : COLORS.panel, 0.95);
    g.fillRoundedRect(px, PANEL_Y, PANEL_W, PANEL_H, 22);
    g.lineStyle(active ? 3 : 2, active ? this.color : COLORS.panelEdge, active ? 1 : 0.6);
    g.strokeRoundedRect(px, PANEL_Y, PANEL_W, PANEL_H, 22);
  }

  setActive(active: boolean): void {
    this.drawBg(this.bgX, active);
    this.container.setAlpha(active ? 1 : 0.6);
    this.scene.tweens.killTweensOf(this.avatar);
    this.avatar.setScale(1);
    if (active) {
      this.scene.tweens.add({ targets: this.avatar, scale: 1.08, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      this.setTimer(null);
    }
  }

  // frac = shot clock remaining (1 → 0), or null to hide.
  setTimer(frac: number | null): void {
    const g = this.ring;
    g.clear();
    if (frac === null) return;
    const r = AVATAR_R + 7;
    g.lineStyle(7, 0x000000, 0.45);
    g.strokeCircle(this.ax, this.ay, r);
    const color = frac > 0.5 ? 0x4dff88 : frac > 0.25 ? 0xffd23c : 0xff4d4d;
    g.lineStyle(7, color, 1);
    g.beginPath();
    g.arc(this.ax, this.ay, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, false);
    g.strokePath();
  }

  setTray(group: Group | null, onTable: Set<number>): void {
    const nums = group === 'solid' ? SOLIDS : group === 'stripe' ? STRIPES : null;
    this.groupText.setText(group === null ? '' : group === 'solid' ? 'SOLIDS' : 'STRIPES');
    let cleared = nums !== null;
    for (let i = 0; i < 7; i++) {
      const img = this.slots[i];
      if (!nums) {
        img.setVisible(false);
        continue;
      }
      const n = nums[i];
      img.setTexture(ballIconKey(this.scene, n)).setVisible(onTable.has(n));
      if (onTable.has(n)) cleared = false;
    }
    // The 8 slot lights up once the group is cleared.
    const eight = this.slots[7];
    eight.setTexture(ballIconKey(this.scene, 8)).setVisible(nums !== null).setAlpha(cleared ? 1 : 0.3);
    this.eightGlow.clear();
    if (cleared) {
      this.eightGlow.lineStyle(3, COLORS.gold, 1);
      this.eightGlow.strokeCircle(eight.x, eight.y, 15);
    }
  }
}

export class Hud {
  private cards: PlayerCard[];
  private status: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, players: [PlayerInfo, PlayerInfo]) {
    this.cards = [new PlayerCard(scene, 0, players[0]), new PlayerCard(scene, 1, players[1])];

    const cx = CONFIG.W / 2;
    scene.add.image(cx - 58, 50, ballIconKey(scene, 8, 3)).setScale(iconScaleFor(62, 3)).setDepth(10);
    scene.add.text(cx - 32, 50, 'BALL', {
      fontFamily: FONT.family, fontSize: '40px', fontStyle: '800', color: '#ffffff',
      stroke: '#0a2a4a', strokeThickness: 6, resolution: 2,
    }).setOrigin(0, 0.5).setDepth(10);
    this.status = scene.add.text(cx, 104, '', {
      fontFamily: FONT.family, fontSize: '20px', fontStyle: '700', color: COLORS.accentCss, resolution: 2,
    }).setOrigin(0.5).setDepth(10);
  }

  setTurn(turn: PlayerIndex): void {
    this.cards[0].setActive(turn === 0);
    this.cards[1].setActive(turn === 1);
  }

  setTimer(turn: PlayerIndex, frac: number | null): void {
    this.cards[turn].setTimer(frac);
  }

  setGroups(groups: [Group | null, Group | null], onTable: Set<number>): void {
    this.cards[0].setTray(groups[0], onTable);
    this.cards[1].setTray(groups[1], onTable);
  }

  setStatus(text: string, color: string = COLORS.accentCss): void {
    this.status.setText(text).setColor(color);
  }
}
