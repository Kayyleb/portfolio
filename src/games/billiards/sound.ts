// Synthesised sound effects (Web Audio) — no asset files needed.
// The context is created lazily on the first user gesture, as browsers require.

const MUTE_KEY = 'web-billiards:muted';

class SoundFx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private recent: number[] = [];
  private _muted = false;

  constructor() {
    try {
      this._muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this._muted = false;
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(m: boolean): void {
    this._muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.8;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      // storage unavailable — the setting just won't persist
    }
  }

  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  // Ball-on-ball click. intensity 0..1
  ball(intensity: number): void {
    if (!this.allow()) return;
    const v = Math.min(1, intensity) ** 1.4 * 0.9;
    if (v < 0.01) return;
    this.tone('sine', 2400 + Math.random() * 900, v * 0.5, 0.05);
    this.burst(3200, 1.2, 'bandpass', v * 0.7, 0.025);
  }

  cushion(intensity: number): void {
    if (!this.allow()) return;
    const v = Math.min(1, intensity) ** 1.3 * 0.8;
    if (v < 0.01) return;
    this.burst(500, 0.8, 'lowpass', v, 0.09);
    this.tone('sine', 130, v * 0.6, 0.08);
  }

  pocket(): void {
    if (!this.allow()) return;
    this.burst(280, 0.7, 'lowpass', 0.9, 0.28);
    this.tone('sine', 95, 0.5, 0.12, 0.03);
    this.tone('sine', 70, 0.4, 0.16, 0.12);
    this.burst(2200, 2, 'bandpass', 0.25, 0.03, 0.09);
  }

  cue(power: number): void {
    if (!this.allow()) return;
    const v = 0.35 + power * 0.65;
    this.burst(1700, 1.5, 'bandpass', v, 0.035);
    this.tone('triangle', 700 + power * 300, v * 0.35, 0.04);
  }

  click(): void {
    this.tone('sine', 1250, 0.18, 0.05);
  }

  tick(): void {
    this.tone('square', 1500, 0.06, 0.03);
  }

  turn(): void {
    this.tone('sine', 660, 0.18, 0.12);
    this.tone('sine', 990, 0.16, 0.16, 0.09);
  }

  foul(): void {
    this.tone('triangle', 330, 0.3, 0.16);
    this.tone('triangle', 220, 0.3, 0.26, 0.15);
  }

  win(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, 0.3, 0.3, i * 0.11));
  }

  lose(): void {
    [392, 330, 262].forEach((f, i) => this.tone('triangle', f, 0.28, 0.3, i * 0.16));
  }

  // Cap how many collision sounds fire at once (a break triggers dozens).
  private allow(): boolean {
    if (!this.ctx || this._muted) return false;
    const now = this.ctx.currentTime;
    this.recent = this.recent.filter(t => now - t < 0.05);
    if (this.recent.length >= 6) return false;
    this.recent.push(now);
    return true;
  }

  private tone(type: OscillatorType, freq: number, vol: number, dur: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this._muted) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(freq: number, q: number, type: BiquadFilterType, vol: number, dur: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise || this._muted) return;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }
}

export const sfx = new SoundFx();
