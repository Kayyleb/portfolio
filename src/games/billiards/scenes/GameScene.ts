import Phaser from 'phaser';
import { CONFIG, PHYSICS, TABLE } from '../config';
import { Pocket, TABLE_GEOM, canPlaceCueBall, findFreeSpot } from '../geometry';
import { PhysEvent, PoolPhysics, SimBall } from '../physics';
import { predictAim } from '../predict';
import { AiShot, Difficulty, planShot, remainingOn } from '../ai';
import {
  GameState, PlayerIndex, Potted, Remaining, ShotOutcome,
  isOnEight, legalTargets, newGame, resolveShot, resolveTimeout,
} from '../rules';
import { Spin, Vec, groupOf } from '../types';
import { BALL_TEX_SCALE, BallSkin, ballIconKey, ensureShadowTexture } from '../art/ballArt';
import { ensureBackgroundTexture, ensureTableTexture } from '../art/tableArt';
import { CUE_TEX_SCALE, ensureCueTexture } from '../art/cueArt';
import { Hud, PlayerInfo } from '../ui/hud';
import { FineTune, PowerBar, SpinControl } from '../ui/controls';
import { PocketChute } from '../ui/chute';
import { Toasts } from '../ui/toast';
import { showGameOver } from '../ui/overlay';
import { createIconButton } from '../ui/button';
import { sfx } from '../sound';

export interface GameSceneData {
  mode: 'cpu' | 'local';
  difficulty: Difficulty;
}

type Phase = 'aim' | 'strike' | 'roll' | 'wait' | 'ai' | 'over';
type Drag = 'aim' | 'power' | 'spin' | 'fine' | 'cue' | null;

const R = CONFIG.BALL_R;
const FRAME_MS = 1000 / 60;
const NO_SPIN: Spin = { top: 0, side: 0 };

// Sprite + shadow + rolling skin for one ball.
class BallView {
  readonly sprite: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Image;
  private readonly skin: BallSkin;
  private lastX: number;
  private lastY: number;
  private sinking = false;

  constructor(private scene: Phaser.Scene, b: SimBall) {
    this.skin = new BallSkin(scene, b.num);
    this.shadow = scene.add.image(b.x + 3, b.y + 5, ensureShadowTexture(scene))
      .setDisplaySize(R * 2.6, R * 2.6).setDepth(3);
    this.sprite = scene.add.image(b.x, b.y, this.skin.key).setScale(1 / BALL_TEX_SCALE).setDepth(4);
    this.lastX = b.x;
    this.lastY = b.y;
  }

  sync(b: SimBall): void {
    if (this.sinking || !b.onTable) return;
    const dx = b.x - this.lastX;
    const dy = b.y - this.lastY;
    if (dx !== 0 || dy !== 0) {
      this.skin.roll(dx, dy);
      this.lastX = b.x;
      this.lastY = b.y;
    }
    this.skin.render();
    this.sprite.setPosition(b.x, b.y);
    this.shadow.setPosition(b.x + 3, b.y + 5);
  }

  place(x: number, y: number): void {
    this.sinking = false;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setVisible(true).setAlpha(1).setScale(1 / BALL_TEX_SCALE).setPosition(x, y);
    this.shadow.setVisible(true).setPosition(x + 3, y + 5);
    this.lastX = x;
    this.lastY = y;
  }

  // Drop into a pocket: slide to the hole centre, shrink and fade.
  sink(p: Pocket, onDone: () => void): void {
    this.sinking = true;
    this.shadow.setVisible(false);
    this.scene.tweens.add({
      targets: this.sprite,
      x: p.x,
      y: p.y,
      scale: (1 / BALL_TEX_SCALE) * 0.65,
      alpha: 0,
      duration: 190,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.sprite.setVisible(false);
        onDone();
      },
    });
  }
}

export class GameScene extends Phaser.Scene {
  private mode: GameSceneData['mode'] = 'cpu';
  private difficulty: Difficulty = 'normal';
  private players!: [PlayerInfo, PlayerInfo];

  private phys!: PoolPhysics;
  private views = new Map<number, BallView>();
  private state!: GameState;
  private phase: Phase = 'wait';
  private drag: Drag = null;

  private aimAngle = 0;
  private power = 0;
  private spin: Spin = { ...NO_SPIN };
  private calledPocket: number | null = null;
  private potted: Potted[] = [];
  private timeLeft: number = CONFIG.TURN_TIME;
  private lastTickSecond = -1;
  private accumulator = 0;
  private dragStartY = 0;
  private lastFineY = 0;
  private cueHome: Vec = { x: 0, y: 0 };
  private cueAnim = { pull: 0 };
  private spaceCharging = false;

  private hud!: Hud;
  private powerBar!: PowerBar;
  private spinCtl!: SpinControl;
  private fine!: FineTune;
  private chute!: PocketChute;
  private toasts!: Toasts;
  private guide!: Phaser.GameObjects.Graphics;
  private markers!: Phaser.GameObjects.Graphics;
  private cueSprite!: Phaser.GameObjects.Image;
  private cueShadow!: Phaser.GameObjects.Image;
  private callMarker!: Phaser.GameObjects.Image;
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('GameScene');
  }

  create(data: Partial<GameSceneData>): void {
    this.mode = data?.mode ?? 'cpu';
    this.difficulty = data?.difficulty ?? 'normal';
    this.players = this.mode === 'cpu'
      ? [{ name: 'You', isAi: false, badge: 'YOU' }, { name: 'Computer', isAi: true, badge: 'CPU' }]
      : [{ name: 'Player 1', isAi: false, badge: 'P1' }, { name: 'Player 2', isAi: false, badge: 'P2' }];

    // scene.restart() reuses this instance, so reset everything.
    this.views = new Map();
    this.phase = 'wait';
    this.drag = null;
    this.power = 0;
    this.spin = { ...NO_SPIN };
    this.calledPocket = null;
    this.potted = [];
    this.accumulator = 0;
    this.cueAnim = { pull: 0 };
    this.spaceCharging = false;

    this.add.image(0, 0, ensureBackgroundTexture(this)).setOrigin(0).setDepth(0);
    this.add.image(0, 0, ensureTableTexture(this)).setOrigin(0).setDepth(1);
    this.markers = this.add.graphics().setDepth(2);

    this.phys = new PoolPhysics(TABLE_GEOM, this.rackBalls());
    for (const b of this.phys.balls) this.views.set(b.num, new BallView(this, b));

    this.guide = this.add.graphics().setDepth(6);
    const cueKey = ensureCueTexture(this);
    this.cueShadow = this.add.image(0, 0, cueKey).setOrigin(1, 0.5).setScale(1 / CUE_TEX_SCALE)
      .setTint(0x000000).setAlpha(0.3).setDepth(7);
    this.cueSprite = this.add.image(0, 0, cueKey).setOrigin(1, 0.5).setScale(1 / CUE_TEX_SCALE).setDepth(8);
    this.callMarker = this.add.image(0, 0, ballIconKey(this, 8)).setScale(0.55).setDepth(5).setVisible(false);

    this.hud = new Hud(this, this.players);
    this.powerBar = new PowerBar(this);
    this.spinCtl = new SpinControl(this);
    this.fine = new FineTune(this);
    this.chute = new PocketChute(this);
    this.toasts = new Toasts(this);

    createIconButton(this, 60, 852, '≡', () => this.scene.start('MenuScene')).setDepth(10);
    createIconButton(this, 116, 852, sfx.muted ? '×' : '♪', t => {
      sfx.setMuted(!sfx.muted);
      t.setText(sfx.muted ? '×' : '♪');
    }).setDepth(10);

    this.setupInput();

    this.state = newGame(0);
    this.startTurn();
    this.toasts.show('BREAK!', this.mode === 'cpu' ? 'You break first' : `${this.players[0].name} breaks`, 'gold', 1400);
  }

  // ---------------------------------------------------------------- setup

  // Standard 8-ball rack: 8 in the middle, a solid and a stripe in the back corners.
  private rackBalls(): SimBall[] {
    const g = TABLE_GEOM;
    const solids = shuffle([1, 2, 3, 4, 5, 6, 7]);
    const stripes = shuffle([9, 10, 11, 12, 13, 14, 15]);
    const slots: number[] = new Array(15);
    slots[4] = 8;
    const [c1, c2] = Math.random() < 0.5 ? [solids.pop()!, stripes.pop()!] : [stripes.pop()!, solids.pop()!];
    slots[10] = c1;
    slots[14] = c2;
    const rest = shuffle([...solids, ...stripes]);
    for (let i = 0; i < 15; i++) if (slots[i] === undefined) slots[i] = rest.pop()!;

    const gap = 0.2;
    const dx = R * 2 * Math.sin(Math.PI / 3) + gap;
    const dy = R * 2 + gap;
    const balls: SimBall[] = [{ num: 0, x: g.headX - 4, y: g.cy, vx: 0, vy: 0, onTable: true }];
    let k = 0;
    for (let row = 0; row < 5; row++) {
      for (let c = 0; c <= row; c++) {
        balls.push({ num: slots[k++], x: g.footX + row * dx, y: g.cy + (c - row / 2) * dy, vx: 0, vy: 0, onTable: true });
      }
    }
    return balls;
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.keys = {
      left: kb.addKey('LEFT'),
      right: kb.addKey('RIGHT'),
      shift: kb.addKey('SHIFT'),
    };
    kb.addCapture('SPACE');
    kb.on('keydown-SPACE', () => {
      if (this.canAct() && this.drag === null && this.phys.cue.onTable) this.spaceCharging = true;
    });
    kb.on('keyup-SPACE', () => {
      if (!this.spaceCharging) return;
      this.spaceCharging = false;
      this.shoot();
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      sfx.unlock();
      if (over.length > 0 || !this.canAct()) return;
      const { x, y } = p;
      if (this.powerBar.contains(x, y)) {
        if (!this.phys.cue.onTable) return;
        this.drag = 'power';
        this.dragStartY = y;
        return;
      }
      if (this.spinCtl.contains(x, y)) {
        this.drag = 'spin';
        this.setSpin(this.spinCtl.spinAt(x, y));
        return;
      }
      if (this.fine.contains(x, y)) {
        this.drag = 'fine';
        this.lastFineY = y;
        return;
      }
      const cue = this.phys.cue;
      if (this.state.ballInHand !== 'none' && Math.hypot(x - cue.x, y - cue.y) < R * 2.4) {
        this.drag = 'cue';
        this.cueHome = { x: cue.x, y: cue.y };
        return;
      }
      if (this.needsCall()) {
        const i = this.pocketNear(x, y);
        if (i >= 0) {
          this.calledPocket = i;
          sfx.click();
          this.updateStatus();
          return;
        }
      }
      if (this.onTableArea(x, y)) {
        this.drag = 'aim';
        this.aimAt(x, y);
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const { x, y } = p;
      switch (this.drag) {
        case 'power':
          this.setPower(Phaser.Math.Clamp((y - this.dragStartY) / PowerBar.travel, 0, 1));
          break;
        case 'spin':
          this.setSpin(this.spinCtl.spinAt(x, y));
          break;
        case 'fine':
          this.aimAngle += (y - this.lastFineY) * 0.0015;
          this.fine.scroll(y - this.lastFineY);
          this.lastFineY = y;
          break;
        case 'cue': {
          const g = TABLE_GEOM;
          const cx = Phaser.Math.Clamp(x, g.left + R, g.right - R);
          const cy = Phaser.Math.Clamp(y, g.top + R, g.bottom - R);
          const view = this.views.get(0)!;
          view.place(cx, cy);
          if (this.validCueSpot(cx, cy)) view.sprite.clearTint();
          else view.sprite.setTint(0xff6666);
          break;
        }
        case 'aim':
          this.aimAt(x, y);
          break;
      }
    });

    const release = () => {
      const was = this.drag;
      this.drag = null;
      if (was === 'power') {
        this.shoot();
      } else if (was === 'cue') {
        const view = this.views.get(0)!;
        const { x, y } = view.sprite;
        view.sprite.clearTint();
        const cue = this.phys.cue;
        if (this.validCueSpot(x, y)) {
          cue.x = x;
          cue.y = y;
        } else {
          view.place(this.cueHome.x, this.cueHome.y);
        }
      }
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      if (!this.canAct()) return;
      this.aimAngle += dy * (this.keys.shift.isDown ? 0.00004 : 0.0002);
      this.fine.scroll(dy * 0.05);
    });
  }

  // ---------------------------------------------------------------- turn flow

  private startTurn(): void {
    const s = this.state;
    this.phase = 'aim';
    this.drag = null;
    this.spaceCharging = false;
    this.setPower(0);
    this.setSpin({ ...NO_SPIN });
    this.calledPocket = null;
    this.timeLeft = CONFIG.TURN_TIME;
    this.lastTickSecond = -1;
    this.cueAnim.pull = 0;
    this.cueSprite.setAlpha(1).setVisible(true);
    this.cueShadow.setAlpha(0.3).setVisible(true);

    const cue = this.phys.cue;
    if (s.ballInHand !== 'none' && (!cue.onTable || !this.validCueSpot(cue.x, cue.y))) {
      const g = TABLE_GEOM;
      const spot = findFreeSpot(s.ballInHand === 'kitchen' ? g.headX - 4 : g.headX, g.cy, (x, y) => this.validCueSpot(x, y));
      cue.x = spot.x;
      cue.y = spot.y;
      cue.vx = 0;
      cue.vy = 0;
      cue.onTable = true;
      this.views.get(0)!.place(spot.x, spot.y);
    }

    this.aimAngle = this.defaultAim();
    this.hud.setTurn(s.turn);
    this.refreshTrays();
    this.updateStatus();

    if (this.players[s.turn].isAi) this.beginAiTurn();
  }

  private shoot(): void {
    if (this.phase !== 'aim' && this.phase !== 'ai') return;
    const power = this.power;
    if (power < 0.02 || !this.phys.cue.onTable) {
      this.setPower(0);
      return;
    }
    if (this.needsCall() && this.calledPocket === null) {
      this.setPower(0);
      this.toasts.show('Call your pocket', 'Tap the pocket you will sink the 8 in', 'gold');
      return;
    }

    this.phase = 'strike';
    this.drag = null;
    this.hud.setTimer(this.state.turn, null);
    this.cueAnim.pull = power * CONFIG.MAX_CUE_PULL;
    this.tweens.add({
      targets: this.cueAnim,
      pull: -3,
      duration: 70 + (1 - power) * 90,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.potted = [];
        this.phys.strike(this.aimAngle, power * PHYSICS.MAX_SPEED, this.spin);
        sfx.cue(power);
        this.phase = 'roll';
        this.tweens.add({ targets: [this.cueSprite, this.cueShadow], alpha: 0, duration: 260, delay: 140 });
        this.tweens.addCounter({
          from: power, to: 0, duration: 300,
          onUpdate: tw => this.powerBar.setPower(tw.getValue() ?? 0),
        });
      },
    });
  }

  private endShot(): void {
    this.phase = 'wait';
    const shooter = this.state.turn;
    const before: Remaining = remainingOn(this.phys);
    for (const p of this.potted) {
      const g = groupOf(p.num);
      if (g === 'solid' || g === 'stripe') before[g]++;
    }
    const out = resolveShot(this.state, {
      firstContact: this.phys.firstContact,
      potted: this.potted,
      calledPocket: this.calledPocket,
    }, before);
    this.applyOutcome(out, shooter);
  }

  private applyOutcome(out: ShotOutcome, shooter: PlayerIndex): void {
    this.state = out.state;

    if (out.respotEight) this.respotEight();

    if (out.state.winner !== null) {
      this.gameOver(out, shooter);
      return;
    }

    const next = out.state.turn;
    if (out.foul) {
      sfx.foul();
      this.toasts.show('FOUL!', `${out.foul} — ${this.possessive(next)} ball in hand`, 'bad', 2000);
    } else if (out.assigned) {
      sfx.turn();
      const who = this.mode === 'cpu' && shooter === 0 ? 'You are' : `${this.players[shooter].name} is`;
      this.toasts.show(out.assigned === 'solid' ? 'SOLIDS' : 'STRIPES', `${who} ${out.assigned === 'solid' ? 'solids (1–7)' : 'stripes (9–15)'}`, 'gold');
    } else if (out.respotEight) {
      this.toasts.show('8 re-spotted', 'The 8 went down on the break', 'info');
    } else if (next !== shooter) {
      sfx.turn();
      this.toasts.show(this.turnLabel(next), '', 'info', 1000);
    }

    this.time.delayedCall(350, () => this.startTurn());
  }

  private respotEight(): void {
    const b8 = this.phys.ball(8);
    if (!b8) return;
    const g = TABLE_GEOM;
    const others = this.phys.balls.filter(b => b.onTable && b !== b8);
    const spot = findFreeSpot(g.footX, g.cy, (x, y) =>
      x > g.left + R && x < g.right - R && y > g.top + R && y < g.bottom - R &&
      others.every(o => Math.hypot(o.x - x, o.y - y) >= R * 2 + 1));
    b8.x = spot.x;
    b8.y = spot.y;
    b8.onTable = true;
    this.views.get(8)!.place(spot.x, spot.y);
    this.chute.remove(8);
  }

  private gameOver(out: ShotOutcome, shooter: PlayerIndex): void {
    this.phase = 'over';
    const winner = out.state.winner!;
    const humanWon = this.mode === 'local' || winner === 0;
    const title = this.mode === 'cpu' ? (winner === 0 ? 'YOU WIN!' : 'YOU LOSE') : `${this.players[winner].name.toUpperCase()} WINS!`;
    const shooterName = this.mode === 'cpu' && shooter === 0 ? 'You' : this.players[shooter].name;
    const subtitle = out.won
      ? `${shooterName} sank the 8 ball in the called pocket.`
      : `${shooterName}: ${out.lossReason}.`;
    if (humanWon) sfx.win();
    else sfx.lose();
    this.hud.setStatus(title);
    this.time.delayedCall(700, () => showGameOver(this, {
      title,
      subtitle,
      celebrate: humanWon,
      onRematch: () => this.scene.restart({ mode: this.mode, difficulty: this.difficulty }),
      onMenu: () => this.scene.start('MenuScene'),
    }));
  }

  private onTimeout(): void {
    if (this.drag === 'cue') this.views.get(0)!.place(this.cueHome.x, this.cueHome.y);
    this.drag = null;
    this.spaceCharging = false;
    this.phase = 'wait';
    this.applyOutcome(resolveTimeout(this.state), this.state.turn);
  }

  // ---------------------------------------------------------------- computer

  private beginAiTurn(): void {
    this.phase = 'ai';
    this.hud.setStatus(`${this.players[this.state.turn].name} is thinking…`);
    this.time.delayedCall(700, () => {
      if (this.phase !== 'ai') return;
      this.runAiShot(planShot(this.phys, this.state, this.difficulty));
    });
  }

  // Animate the computer's shot like a person: place the ball, swing the cue
  // around, pull back, strike.
  private runAiShot(shot: AiShot): void {
    const aim = () => {
      const target = this.aimAngle + Phaser.Math.Angle.Wrap(shot.angle - this.aimAngle);
      this.tweens.add({
        targets: this,
        aimAngle: target,
        duration: 500 + Math.random() * 400,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.setSpin(shot.spin);
          this.calledPocket = shot.calledPocket;
          this.updateStatus();
          this.tweens.addCounter({
            from: 0, to: shot.power, duration: 550, delay: 250, ease: 'Sine.easeOut',
            onUpdate: tw => this.setPower(tw.getValue() ?? 0),
            onComplete: () => this.time.delayedCall(180, () => this.shoot()),
          });
        },
      });
    };

    if (!shot.place) {
      aim();
      return;
    }
    const cue = this.phys.cue;
    const view = this.views.get(0)!;
    const from = { x: cue.x, y: cue.y };
    cue.onTable = false;
    this.tweens.addCounter({
      from: 0, to: 1, duration: 450, ease: 'Sine.easeInOut',
      onUpdate: tw => {
        const t = tw.getValue() ?? 0;
        view.place(from.x + (shot.place!.x - from.x) * t, from.y + (shot.place!.y - from.y) * t);
      },
      onComplete: () => {
        cue.x = shot.place!.x;
        cue.y = shot.place!.y;
        cue.onTable = true;
        view.place(cue.x, cue.y);
        aim();
      },
    });
  }

  // ---------------------------------------------------------------- frame loop

  update(_time: number, delta: number): void {
    this.accumulator = Math.min(this.accumulator + delta, 100);
    const events: PhysEvent[] = [];
    while (this.accumulator >= FRAME_MS) {
      this.phys.step(events);
      this.accumulator -= FRAME_MS;
    }
    if (events.length) this.handleEvents(events);
    for (const b of this.phys.balls) {
      if (b.num === 0 && (this.drag === 'cue' || !b.onTable)) continue;
      this.views.get(b.num)!.sync(b);
    }

    if (this.phase === 'roll' && !this.phys.isMoving()) this.endShot();

    if (this.canAct()) {
      const fine = this.keys.shift.isDown ? 0.0008 : 0.006;
      if (this.keys.left.isDown) this.aimAngle -= fine;
      if (this.keys.right.isDown) this.aimAngle += fine;
      if (this.spaceCharging) this.setPower(Math.min(1, this.power + delta / 1300));

      this.timeLeft -= delta / 1000;
      this.hud.setTimer(this.state.turn, Math.max(0, this.timeLeft / CONFIG.TURN_TIME));
      const sec = Math.ceil(this.timeLeft);
      if (sec <= 5 && sec !== this.lastTickSecond && sec > 0) {
        this.lastTickSecond = sec;
        sfx.tick();
      }
      if (this.timeLeft <= 0) this.onTimeout();
    }

    this.drawCueAndGuide();
    this.drawMarkers();
  }

  private handleEvents(events: PhysEvent[]): void {
    for (const e of events) {
      if (e.kind === 'ball') sfx.ball(e.speed / 18);
      else if (e.kind === 'cushion') sfx.cushion(e.speed / 22);
      else {
        sfx.pocket();
        const num = e.ball.num;
        this.potted.push({ num, pocket: e.pocket });
        this.views.get(num)!.sink(TABLE_GEOM.pockets[e.pocket], () => {
          if (num !== 0) this.chute.add(num);
        });
        this.refreshTrays();
      }
    }
  }

  // ---------------------------------------------------------------- drawing

  private drawCueAndGuide(): void {
    const g = this.guide;
    g.clear();
    const cue = this.phys.cue;
    const aiming = this.phase === 'aim' || this.phase === 'ai' || this.phase === 'strike';
    if (!aiming || !cue.onTable || this.drag === 'cue') {
      if (this.phase !== 'roll') {
        this.cueSprite.setVisible(false);
        this.cueShadow.setVisible(false);
      }
      return;
    }

    const dx = Math.cos(this.aimAngle);
    const dy = Math.sin(this.aimAngle);
    const pull = this.phase === 'strike' ? this.cueAnim.pull : this.power * CONFIG.MAX_CUE_PULL;
    const tip = R + 4 + pull;
    this.cueSprite.setVisible(true).setPosition(cue.x - dx * tip, cue.y - dy * tip).setRotation(this.aimAngle);
    this.cueShadow.setVisible(true).setPosition(cue.x - dx * tip + 8, cue.y - dy * tip + 12).setRotation(this.aimAngle);

    // The computer's aim line stays hidden — you only see its cue.
    if (this.phase !== 'aim') return;

    const pred = predictAim(TABLE_GEOM, cue, this.phys.balls, this.aimAngle);
    const ghostDist = Math.hypot(pred.endX - cue.x, pred.endY - cue.y);
    if (ghostDist > R * 2) {
      g.lineStyle(2, 0xffffff, 0.85);
      g.lineBetween(cue.x + dx * R, cue.y + dy * R, pred.endX - dx * R, pred.endY - dy * R);
    }

    if (pred.kind === 'ball' && pred.target) {
      const legal = legalTargets(this.state, remainingOn(this.phys)).includes(groupOf(pred.target.num));
      if (!legal) {
        g.lineStyle(3, 0xff4d4d, 0.95);
        g.strokeCircle(pred.endX, pred.endY, R);
        const k = R * 0.55;
        g.lineBetween(pred.endX - k, pred.endY - k, pred.endX + k, pred.endY + k);
        g.lineBetween(pred.endX - k, pred.endY + k, pred.endX + k, pred.endY - k);
        return;
      }
      g.lineStyle(2, 0xffffff, 0.95);
      g.strokeCircle(pred.endX, pred.endY, R);
      const t = pred.target;
      const ox = pred.objDirX!;
      const oy = pred.objDirY!;
      // Stop the object line where that ball would first touch something.
      const ahead = predictAim(TABLE_GEOM, t, this.phys.balls.filter(b => b.num !== 0), Math.atan2(oy, ox));
      const room = Math.hypot(ahead.endX - t.x, ahead.endY - t.y) - R;
      const objLen = Math.max(0, Math.min(30 + 170 * (pred.objShare ?? 0), room));
      g.lineStyle(3, 0xffffff, 0.9);
      g.lineBetween(t.x + ox * R, t.y + oy * R, t.x + ox * (R + objLen), t.y + oy * (R + objLen));
      if (pred.cueDirX !== undefined && (pred.cueShare ?? 0) > 0.05) {
        const cueLen = 20 + 110 * pred.cueShare!;
        g.lineStyle(2, 0xffffff, 0.5);
        g.lineBetween(pred.endX, pred.endY, pred.endX + pred.cueDirX * cueLen, pred.endY + pred.cueDirY! * cueLen);
      }
    } else {
      g.lineStyle(2, 0xffffff, 0.75);
      g.strokeCircle(pred.endX, pred.endY, R);
      if (pred.kind === 'cushion' && pred.bounceX !== undefined) {
        g.lineStyle(2, 0xffffff, 0.4);
        g.lineBetween(pred.endX, pred.endY, pred.endX + pred.bounceX * 60, pred.endY + pred.bounceY! * 60);
      }
    }
  }

  private drawMarkers(): void {
    const m = this.markers;
    m.clear();
    this.callMarker.setVisible(false);
    if (this.phase !== 'aim' && this.phase !== 'ai') return;
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 220);
    const g = TABLE_GEOM;

    // Ball in hand: kitchen shading and a ring on the cue ball.
    if (this.state.ballInHand !== 'none' && this.phase === 'aim') {
      if (this.state.ballInHand === 'kitchen') {
        m.fillStyle(0xffffff, 0.05);
        m.fillRect(g.left, g.top, g.headX - g.left, g.bottom - g.top);
        m.lineStyle(2, 0xffffff, 0.25 + 0.2 * pulse);
        m.lineBetween(g.headX, g.top, g.headX, g.bottom);
      }
      const v = this.views.get(0)!.sprite;
      m.lineStyle(2, 0xffffff, 0.5 + 0.4 * pulse);
      m.strokeCircle(v.x, v.y, R + 6 + pulse * 3);
      const a = R + 14 + pulse * 3;
      m.fillStyle(0xffffff, 0.75);
      for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const tx = v.x + ux * a;
        const ty = v.y + uy * a;
        m.fillTriangle(tx + ux * 6, ty + uy * 6, tx - uy * 5, ty + ux * 5, tx + uy * 5, ty - ux * 5);
      }
    }

    // Calling the 8: pulse every pocket, mark the chosen one.
    if (this.needsCall()) {
      g.pockets.forEach((p, i) => {
        if (i === this.calledPocket) {
          m.lineStyle(4, 0xffc93c, 1);
          m.strokeCircle(p.x, p.y, p.holeR + 4);
          this.callMarker.setPosition(p.x, p.y).setVisible(true);
        } else if (this.phase === 'aim') {
          m.lineStyle(3, 0xffffff, 0.25 + 0.5 * pulse);
          m.strokeCircle(p.x, p.y, p.holeR + 2 + pulse * 3);
        }
      });
    }
  }

  // ---------------------------------------------------------------- helpers

  private canAct(): boolean {
    return this.phase === 'aim' && !this.players[this.state.turn].isAi;
  }

  private needsCall(): boolean {
    return !this.state.isBreak && isOnEight(this.state, this.state.turn, remainingOn(this.phys));
  }

  private setPower(p: number): void {
    this.power = p;
    this.powerBar.setPower(p);
  }

  private setSpin(s: Spin): void {
    this.spin = { ...s };
    this.spinCtl.setSpin(s);
  }

  private aimAt(x: number, y: number): void {
    const cue = this.phys.cue;
    if (Math.hypot(x - cue.x, y - cue.y) > 4) this.aimAngle = Math.atan2(y - cue.y, x - cue.x);
  }

  private validCueSpot(x: number, y: number): boolean {
    const others = this.phys.balls.filter(b => b.onTable && b.num !== 0);
    return canPlaceCueBall(x, y, others, this.state.ballInHand === 'kitchen');
  }

  private onTableArea(x: number, y: number): boolean {
    const g = TABLE_GEOM;
    const pad = TABLE.CUSHION + TABLE.RAIL;
    return x > g.left - pad && x < g.right + pad && y > g.top - pad && y < g.bottom + pad;
  }

  private pocketNear(x: number, y: number): number {
    return TABLE_GEOM.pockets.findIndex(p => Math.hypot(p.x - x, p.y - y) < p.holeR + 18);
  }

  // Point at the rack on the break, otherwise at the nearest legal ball.
  private defaultAim(): number {
    const cue = this.phys.cue;
    const targets = legalTargets(this.state, remainingOn(this.phys));
    let best: SimBall | null = null;
    let bestD = Infinity;
    for (const b of this.phys.balls) {
      if (!b.onTable || b.num === 0 || !targets.includes(groupOf(b.num))) continue;
      const d = this.state.isBreak ? b.x : Math.hypot(b.x - cue.x, b.y - cue.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best ? Math.atan2(best.y - cue.y, best.x - cue.x) : this.aimAngle;
  }

  private refreshTrays(): void {
    const onTable = new Set(this.phys.balls.filter(b => b.onTable).map(b => b.num));
    this.hud.setGroups(this.state.groups, onTable);
  }

  private updateStatus(): void {
    const s = this.state;
    if (this.players[s.turn].isAi) {
      this.hud.setStatus(this.needsCall() ? `${this.players[s.turn].name} is on the 8` : `${this.players[s.turn].name}'s shot`);
      return;
    }
    if (s.isBreak) this.hud.setStatus('Break! Pull the power bar down to shoot');
    else if (this.needsCall()) this.hud.setStatus(this.calledPocket === null ? 'On the 8 — tap a pocket to call it' : '8 ball called — take your shot', '#ffc93c');
    else if (s.ballInHand !== 'none') this.hud.setStatus('Ball in hand — drag the cue ball anywhere');
    else this.hud.setStatus(this.turnLabel(s.turn));
  }

  private turnLabel(i: PlayerIndex): string {
    return this.mode === 'cpu' && i === 0 ? 'Your turn' : `${this.players[i].name}'s turn`;
  }

  private possessive(i: PlayerIndex): string {
    return this.mode === 'cpu' && i === 0 ? 'your' : `${this.players[i].name}'s`;
  }
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
