"use client";

import { Component } from "react";
import { t } from "@/lib/i18n";

type Pt = [number, number];
type Phase = "intro" | "ready" | "pouring" | "result";
type Stage = "base" | "blob" | "cut" | "pull" | "done";
type S3 = { stage: Stage; t0: number; fill: number; ratio: number; cutX: number; pullQ: number; b1: number; b2: number; b3: number; dev: number; spill: boolean; avg: number };
type State = { phase: Phase; level: number; grams: number; pct: number; spill: boolean; simT: number; score: number; win: boolean; resultMsg: string; sfxOn: boolean; musicOn: boolean; s3: S3 };
type Vals = Record<string, any>;

export class EspressoGame extends Component<object, State> {
  _level: number;
  _s3: S3;
  _p: number;
  _phase: Phase;
  _sfxOn: boolean;
  _musicOn: boolean;
  _raf = 0;
  _t0 = 0;
  _t = 0;
  _g = 0;
  _lastPaint = 0;
  _ctx: AudioContext | null = null;
  _sfxBus!: GainNode;
  _musBus!: GainNode;
  _noise!: AudioBuffer;
  _crackle!: AudioBuffer;
  _crackleSrc: AudioBufferSourceNode | null = null;
  _milk: { s: AudioBufferSourceNode; bp: BiquadFilterNode; g: GainNode } | null = null;
  _pour: { o1: OscillatorNode; o2: OscillatorNode; pg: GainNode; s: AudioBufferSourceNode; bp: BiquadFilterNode; wg: GainNode } | null = null;
  _steam: { s: AudioBufferSourceNode; bp: BiquadFilterNode; g: GainNode; o: OscillatorNode; og: GainNode } | null = null;
  _nextDrip = 0;
  _musicTimer = 0;
  _nextT = 0;
  _step = 0;
  tick: (now: number) => void;
  start: () => void;
  retry: () => void;
  nextLevel: () => void;
  tap: () => void;
  toggleSfx: () => void;
  toggleMusic: () => void;

  constructor(props: object) {
    super(props);
    this.state = { phase: 'intro', level: 1, grams: 0, pct: 33, spill: false, simT: 0, score: 0, win: false, resultMsg: '', sfxOn: true, musicOn: false, s3: this.fresh3() };
    this._level = 1;
    this._s3 = this.fresh3();
    this._p = 0.33;
    this._phase = 'intro';
    this._sfxOn = true;
    this._musicOn = false;
    this._raf = 0;
    this._t0 = 0;
    this._t = 0;
    this._g = 0;
    this._lastPaint = 0;
    this._ctx = null;

    this.tick = (now) => {
      if (this._level === 3) {
        this.tick3(now);
        return;
      }
      const t = Math.max(0, (now - this._t0) / 1000);
      if (this._level === 2) {
        const p = this.flow2(t);
        this._t = t;
        this._p = p;
        this.updateSteam(p, t);
        if (p >= 1) {
          this.finish(1);
          return;
        }
        if (now - this._lastPaint > 32) {
          this._lastPaint = now;
          this.setState({ pct: p * 100, simT: t * 2 });
        }
        this._raf = requestAnimationFrame(this.tick);
        return;
      }
      const g = this.flow(t);
      this._t = t;
      this._g = g;
      this.updatePour(g, t);
      if (g >= 60) {
        this.finish(60);
        return;
      }
      if (now - this._lastPaint > 32) {
        this._lastPaint = now;
        this.setState({ grams: g, simT: t * 3 });
      }
      this._raf = requestAnimationFrame(this.tick);
    };
    this.start = () => {
      this.ensureAudio();
      this.tickSound();
      if (this._musicOn) this.startMusic();
      this._phase = 'ready';
      this._s3 = this.fresh3();
      this.setState({ phase: 'ready', grams: 0, pct: 33, spill: false, simT: 0, s3: this.fresh3() });
    };
    this.retry = () => {
      this.ensureAudio();
      this.tickSound();
      this._phase = 'ready';
      this._s3 = this.fresh3();
      this.setState({ phase: 'ready', grams: 0, pct: 33, spill: false, simT: 0, s3: this.fresh3() });
    };
    this.nextLevel = () => {
      this.ensureAudio();
      this.tickSound();
      this._level = Math.min(3, this._level + 1);
      this._phase = 'intro';
      this._s3 = this.fresh3();
      this.setState({ level: this._level, phase: 'intro', grams: 0, pct: 33, spill: false, simT: 0, s3: this.fresh3() });
    };
    this.tap = () => {
      const phase = this._phase;
      if (phase === 'ready') this.pour();
      else if (phase === 'pouring') {
        if (this._level === 3) this.tap3();
        else this.finish(this._level === 2 ? this._p : this._g);
      }
    };
    this.toggleSfx = () => {
      this._sfxOn = !this._sfxOn;
      this.ensureAudio();
      if (this._sfxBus) this._sfxBus.gain.setTargetAtTime(this._sfxOn ? 0.9 : 0, this._ctx!.currentTime, 0.03);
      this.setState({ sfxOn: this._sfxOn });
    };
    this.toggleMusic = () => {
      this._musicOn = !this._musicOn;
      if (this._musicOn) {
        this.ensureAudio();
        this.startMusic();
      } else {
        this.stopMusic();
      }
      this.setState({ musicOn: this._musicOn });
    };
  }

  flow2(t: number) {
    if (t < 1.5) return 0.33 + 0.03 * (t / 1.5) * (t / 1.5);
    return 0.36 + (t - 1.5) * 0.0462;
  }

  flow(t: number) {
    if (t < 1.2) return 2 * (t / 1.2) * (t / 1.2);
    return 2 + (t - 1.2) * 4.0;
  }

  pour() {
    if (this._level === 3) {
      this.pour3();
      return;
    }
    this._phase = 'pouring';
    this._t0 = performance.now();
    this._t = 0;
    this._g = 0;
    this._lastPaint = 0;
    this.leverUpSound();
    if (this._level === 2) this.startSteam();
    else this.startPour();
    this.setState({ phase: 'pouring', grams: 0, simT: 0 });
    this._raf = requestAnimationFrame(this.tick);
  }

  finish(gIn: number) {
    if (this._phase !== 'pouring') return;
    this._phase = 'result';
    cancelAnimationFrame(this._raf);
    if (this._level === 2) {
      const pct = Math.min(100, Math.max(0, gIn * 100));
      const spill = pct >= 100;
      const win = !spill && pct >= 62 && pct <= 70;
      const score = spill ? 0 : Math.max(0, Math.round(100 - 4 * Math.abs(pct - 66)));
      const msg2 = spill
        ? t("game.milkSpill")
        : win
          ? t("game.milkWin")
          : pct < 62
            ? t("game.milkShort")
            : t("game.milkOver");
      this.stopSteam();
      this.leverDownSound();
      this.stinger(win);
      this.setState({ phase: 'result', pct, spill, simT: this._t * 2, score, win, resultMsg: msg2 });
      return;
    }
    const g = Math.min(60, Math.max(0, gIn));
    const score = Math.max(0, Math.round(100 - 8 * Math.abs(g - 36)));
    const win = g >= 34 && g <= 38;
    const resultMsg = win
      ? t("game.espressoWin")
      : g < 34
        ? t("game.espressoShort")
        : t("game.espressoOver");
    this.stopPour();
    this.leverDownSound();
    this.stinger(win);
    this.setState({ phase: 'result', grams: g, simT: this._t * 3, score, win, resultMsg });
  }

  fresh3(): S3 {
    return { stage: 'base', t0: 0, fill: 0.2, ratio: 0, cutX: 200, pullQ: 0, b1: 0, b2: 0, b3: 0, dev: 0, spill: false, avg: 0 };
  }

  fill3(t: number) {
    if (t < 1.2) return 0.2 + 0.03 * (t / 1.2) * (t / 1.2);
    return 0.23 + (t - 1.2) * 0.052;
  }

  pour3() {
    const now = performance.now();
    this._phase = 'pouring';
    this._t0 = now;
    this._lastPaint = 0;
    const q = this.fresh3();
    q.t0 = now;
    this._s3 = q;
    this.leverUpSound();
    this.startMilk();
    this.setState({ phase: 'pouring', s3: Object.assign({}, q), simT: 0 });
    this._raf = requestAnimationFrame(this.tick);
  }

  next3(now: number) {
    const q = this._s3;
    if (q.stage === 'base') {
      q.b1 = Math.max(0, Math.round(100 - 4 * Math.abs(q.fill * 100 - 66)));
      q.stage = 'blob';
      q.ratio = 0;
    } else if (q.stage === 'blob') {
      q.b2 = Math.max(0, Math.round(100 - 2 * Math.abs(q.ratio * 100 - 100)));
      q.stage = 'cut';
      q.cutX = 200;
    } else if (q.stage === 'cut') {
      q.dev = Math.abs(q.cutX - 280) / 62 * 100;
      q.b3 = Math.max(0, Math.round(100 - 1.2 * q.dev));
      q.stage = 'pull';
      q.pullQ = 0;
    } else {
      return;
    }
    q.t0 = now;
    this.tickSound();
  }

  tap3() {
    if (this._phase !== 'pouring') return;
    const q = this._s3;
    if (q.stage === 'pull') return;
    this.next3(performance.now());
    this.setState({ s3: Object.assign({}, q) });
  }

  tick3(now: number) {
    if (this._phase !== 'pouring') return;
    const q = this._s3;
    const t = Math.max(0, (now - q.t0) / 1000);
    if (q.stage === 'base') {
      q.fill = this.fill3(t);
      if (q.fill >= 1) {
        q.fill = 1;
        this.finish3(true);
        return;
      }
    } else if (q.stage === 'blob') {
      q.ratio = t / 6;
      if (q.ratio >= 1.5) {
        q.ratio = 1.5;
        this.next3(now);
      }
    } else if (q.stage === 'cut') {
      q.cutX = 280 - 80 * Math.cos(2 * Math.PI * t / 6);
      if (t >= 12) this.next3(now);
    } else if (q.stage === 'pull') {
      q.pullQ = Math.min(1, t / 1.6);
      if (q.pullQ >= 1) {
        this.finish3(false);
        return;
      }
    }
    this.updateMilk(q);
    if (now - this._lastPaint > 32) {
      this._lastPaint = now;
      this.setState({ s3: Object.assign({}, q), simT: (now - this._t0) / 1000 });
    }
    this._raf = requestAnimationFrame(this.tick);
  }

  finish3(spill: boolean) {
    if (this._phase !== 'pouring') return;
    this._phase = 'result';
    cancelAnimationFrame(this._raf);
    const q = this._s3;
    let score = 0;
    let msg = t("game.pourSpill");
    if (!spill) {
      score = Math.round((q.b1 + q.b2 + q.b3) / 3);
      msg = score >= 85
        ? t("game.heartWin")
        : score >= 70
          ? t("game.heartClose")
          : t("game.heartBlob");
    }
    const win = !spill && score >= 70;
    q.stage = 'done';
    q.spill = spill;
    q.avg = score;
    this.stopMilk();
    this.leverDownSound();
    this.stinger(win);
    this.setState({ phase: 'result', s3: Object.assign({}, q), score, win, resultMsg: msg, simT: (performance.now() - this._t0) / 1000 });
  }

  startMilk() {
    try {
      if (!this._ctx) return;
      const ctx = this._ctx!;
      const t = ctx.currentTime;
      const s = ctx.createBufferSource();
      s.buffer = this._noise;
      s.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 600;
      bp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.2);
      s.connect(bp);
      bp.connect(g);
      g.connect(this._sfxBus);
      s.start(t);
      this._milk = { s, bp, g };
    } catch (e) {
      this._milk = null;
    }
  }

  updateMilk(q: S3) {
    try {
      const m = this._milk;
      if (!m || !this._ctx) return;
      const now = this._ctx.currentTime;
      const f = q.stage === 'base' ? 500 + (q.fill - 0.2) * 900 : q.stage === 'blob' ? 950 : q.stage === 'cut' ? 1150 : 1300;
      const gain = q.stage === 'base' ? 0.09 : q.stage === 'blob' ? 0.06 : 0.04;
      m.bp.frequency.setTargetAtTime(f, now, 0.08);
      m.g.gain.setTargetAtTime(gain, now, 0.1);
    } catch (e) {
    }
  }

  stopMilk() {
    try {
      const m = this._milk;
      if (!m || !this._ctx) return;
      this._milk = null;
      const now = this._ctx.currentTime;
      m.g.gain.cancelScheduledValues(now);
      m.g.gain.setTargetAtTime(0, now, 0.05);
      m.s.stop(now + 0.3);
    } catch (e) {
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this._raf);
    this.stopMusic();
    try {
      if (this._ctx) this._ctx.close();
    } catch (e) {
    }
  }

  ensureAudio() {
    try {
      if (!this._ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return false;
        const ctx = new AC();
        this._ctx = ctx;
        this._sfxBus = ctx.createGain();
        this._sfxBus.gain.value = this._sfxOn ? 0.9 : 0;
        this._sfxBus.connect(ctx.destination);
        const warm = ctx.createBiquadFilter();
        warm.type = 'lowpass';
        warm.frequency.value = 5200;
        this._musBus = ctx.createGain();
        this._musBus.gain.value = 0;
        this._musBus.connect(warm);
        warm.connect(ctx.destination);
        const n = ctx.sampleRate * 2;
        this._noise = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = this._noise.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const m = ctx.sampleRate * 4;
        this._crackle = ctx.createBuffer(1, m, ctx.sampleRate);
        const c = this._crackle.getChannelData(0);
        for (let i = 0; i < m; i++) c[i] = Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.01;
      }
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return true;
    } catch (e) {
      this._ctx = null;
      return false;
    }
  }

  canSfx() {
    return !!this._ctx && this._sfxOn;
  }

  env(g: GainNode, t: number, attack: number, peak: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  thump(bus: AudioNode, t: number, f0: number, f1: number, dur: number, peak: number) {
    const ctx = this._ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, 0.004, peak, dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  click(bus: AudioNode, t: number, freq: number, dur: number, peak: number) {
    const ctx = this._ctx!;
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.buffer = this._noise;
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 3;
    this.env(g, t, 0.002, peak, dur);
    s.connect(f);
    f.connect(g);
    g.connect(bus);
    s.start(t, Math.random(), dur + 0.05);
  }

  blip(bus: AudioNode, t: number, freq: number, peak: number, dur: number) {
    const ctx = this._ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.92, t + dur);
    this.env(g, t, 0.003, peak, dur);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  tickSound() {
    try {
      if (!this.canSfx()) return;
      const t = this._ctx!.currentTime;
      this.blip(this._sfxBus, t, 880, 0.12, 0.06);
    } catch (e) {
    }
  }

  leverUpSound() {
    try {
      if (!this.canSfx()) return;
      const t = this._ctx!.currentTime;
      this.thump(this._sfxBus, t, 150, 60, 0.14, 0.55);
      this.click(this._sfxBus, t, 2600, 0.03, 0.35);
      this.click(this._sfxBus, t + 0.05, 1400, 0.04, 0.2);
    } catch (e) {
    }
  }

  leverDownSound() {
    try {
      if (!this.canSfx()) return;
      const t = this._ctx!.currentTime;
      this.thump(this._sfxBus, t, 110, 42, 0.18, 0.6);
      this.click(this._sfxBus, t, 1800, 0.03, 0.3);
    } catch (e) {
    }
  }

  startPour() {
    try {
      if (!this._ctx) return;
      const ctx = this._ctx!;
      const t = ctx.currentTime;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 300;
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(0.0001, t);
      pg.gain.linearRampToValueAtTime(0.07, t + 0.25);
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      o1.frequency.value = 52;
      o2.frequency.value = 104;
      o2.detune.value = 4;
      o1.connect(lp);
      o2.connect(lp);
      lp.connect(pg);
      pg.connect(this._sfxBus);
      o1.start(t);
      o2.start(t);
      const s = ctx.createBufferSource();
      s.buffer = this._noise;
      s.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 800;
      bp.Q.value = 0.9;
      const wg = ctx.createGain();
      wg.gain.value = 0.0001;
      s.connect(bp);
      bp.connect(wg);
      wg.connect(this._sfxBus);
      s.start(t);
      this._pour = { o1, o2, pg, s, bp, wg };
      this._nextDrip = t + 0.15;
    } catch (e) {
      this._pour = null;
    }
  }

  updatePour(g: number, t: number) {
    try {
      const p = this._pour;
      if (!p || !this._ctx) return;
      const now = this._ctx.currentTime;
      p.bp.frequency.setTargetAtTime(700 + Math.min(1, g / 60) * 1700, now, 0.08);
      p.wg.gain.setTargetAtTime(t < 1.2 ? 0.0001 : 0.11, now, 0.15);
      if (t < 1.5 && now >= this._nextDrip && this.canSfx()) {
        this.blip(this._sfxBus, now, 600 + Math.random() * 500, 0.09, 0.07);
        this._nextDrip = now + 0.18 + Math.random() * 0.3;
      }
    } catch (e) {
    }
  }

  startSteam() {
    try {
      if (!this._ctx) return;
      const ctx = this._ctx!;
      const t = ctx.currentTime;
      const s = ctx.createBufferSource();
      s.buffer = this._noise;
      s.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      bp.Q.value = 0.7;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.12);
      s.connect(bp);
      bp.connect(hp);
      hp.connect(g);
      g.connect(this._sfxBus);
      s.start(t);
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 70;
      og.gain.value = 0.04;
      o.connect(og);
      og.connect(this._sfxBus);
      o.start(t);
      this._steam = { s, bp, g, o, og };
    } catch (e) {
      this._steam = null;
    }
  }

  updateSteam(p: number, t: number) {
    try {
      const st = this._steam;
      if (!st || !this._ctx) return;
      const now = this._ctx.currentTime;
      st.bp.frequency.setTargetAtTime(1500 + Math.max(0, p - 0.33) / 0.67 * 2600, now, 0.08);
      st.g.gain.setTargetAtTime(0.15 + 0.03 * Math.sin(t * 6), now, 0.05);
      st.o.frequency.setTargetAtTime(65 + (p - 0.33) * 60, now, 0.1);
    } catch (e) {
    }
  }

  stopSteam() {
    try {
      const st = this._steam;
      if (!st || !this._ctx) return;
      this._steam = null;
      const now = this._ctx.currentTime;
      st.g.gain.cancelScheduledValues(now);
      st.g.gain.setTargetAtTime(0, now, 0.06);
      st.og.gain.setTargetAtTime(0, now, 0.06);
      st.s.stop(now + 0.4);
      st.o.stop(now + 0.4);
    } catch (e) {
    }
  }

  stopPour() {
    try {
      const p = this._pour;
      if (!p || !this._ctx) return;
      this._pour = null;
      const now = this._ctx.currentTime;
      p.pg.gain.setTargetAtTime(0, now, 0.05);
      p.wg.gain.setTargetAtTime(0, now, 0.05);
      p.o1.stop(now + 0.3);
      p.o2.stop(now + 0.3);
      p.s.stop(now + 0.3);
      if (this.canSfx()) {
        this.blip(this._sfxBus, now + 0.2, 760, 0.08, 0.07);
        this.blip(this._sfxBus, now + 0.5, 700, 0.06, 0.07);
      }
    } catch (e) {
    }
  }

  stinger(win: boolean) {
    try {
      if (!this.canSfx()) return;
      const ctx = this._ctx!;
      const t = ctx.currentTime + 0.3;
      if (win) {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const tt = t + i * 0.09;
          this.blip(this._sfxBus, tt, f, 0.16, 0.35);
          this.blip(this._sfxBus, tt, f * 2, 0.04, 0.25);
        });
      } else {
        const o = ctx.createOscillator();
        const lp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(247, t);
        o.frequency.exponentialRampToValueAtTime(110, t + 0.55);
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        this.env(g, t, 0.02, 0.25, 0.55);
        o.connect(lp);
        lp.connect(g);
        g.connect(this._sfxBus);
        o.start(t);
        o.stop(t + 0.7);
      }
    } catch (e) {
    }
  }

  startMusic() {
    try {
      if (!this._ctx || this._musicTimer) return;
      const ctx = this._ctx!;
      const now = ctx.currentTime;
      this._nextT = now + 0.15;
      this._step = 0;
      this._musBus.gain.cancelScheduledValues(now);
      this._musBus.gain.setTargetAtTime(0.55, now, 0.7);
      const cs = ctx.createBufferSource();
      cs.buffer = this._crackle;
      cs.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1500;
      const cg = ctx.createGain();
      cg.gain.value = 0.05;
      cs.connect(hp);
      hp.connect(cg);
      cg.connect(this._musBus);
      cs.start(now);
      this._crackleSrc = cs;
      this._musicTimer = window.setInterval(() => this.pumpMusic(), 250);
      this.pumpMusic();
    } catch (e) {
      this._musicTimer = 0;
    }
  }

  stopMusic() {
    try {
      if (this._musicTimer) {
        clearInterval(this._musicTimer);
        this._musicTimer = 0;
      }
      if (this._ctx && this._musBus) {
        const now = this._ctx.currentTime;
        this._musBus.gain.cancelScheduledValues(now);
        this._musBus.gain.setTargetAtTime(0, now, 0.25);
        if (this._crackleSrc) this._crackleSrc.stop(now + 1.2);
        this._crackleSrc = null;
      }
    } catch (e) {
    }
  }

  pumpMusic() {
    try {
      const ctx = this._ctx!;
      if (!ctx) return;
      const stepDur = 60 / 72 / 2;
      while (this._nextT < ctx.currentTime + 1.5) {
        const swing = this._step % 2 === 1 ? 0.045 : 0;
        this.musicStep(this._step, this._nextT + swing);
        this._nextT += stepDur;
        this._step = (this._step + 1) % 32;
      }
    } catch (e) {
    }
  }

  midi(m: number) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  keys(t: number, m: number, dur: number, vel: number) {
    const ctx = this._ctx!;
    const f = this.midi(m);
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'triangle';
    o2.type = 'sine';
    o1.frequency.value = f;
    o2.frequency.value = f * 2;
    o1.detune.value = (Math.random() - 0.5) * 14;
    o2.detune.value = (Math.random() - 0.5) * 14;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    this.env(g, t, 0.012, vel, dur);
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    lp.connect(g);
    g.connect(this._musBus);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
  }

  bassNote(t: number, m: number, dur: number, vel: number) {
    const ctx = this._ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = this.midi(m);
    this.env(g, t, 0.01, vel, dur);
    o.connect(g);
    g.connect(this._musBus);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  noiseHit(t: number, freq: number, type: BiquadFilterType, dur: number, vel: number) {
    const ctx = this._ctx!;
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.buffer = this._noise;
    f.type = type;
    f.frequency.value = freq;
    this.env(g, t, 0.002, vel, dur);
    s.connect(f);
    f.connect(g);
    g.connect(this._musBus);
    s.start(t, Math.random(), dur + 0.05);
  }

  musicStep(step: number, t: number) {
    const bar = Math.floor(step / 8);
    const s = step % 8;
    const CH = [
      [50, 53, 57, 60, 64],
      [55, 59, 62, 65, 69],
      [48, 52, 55, 59, 62],
      [57, 60, 64, 67, 71],
    ];
    const ROOT = [38, 43, 48, 45];
    const chord = CH[bar];
    if (s === 0) chord.forEach((m, i) => this.keys(t + i * 0.012, m, 1.9, 0.045));
    if (s === 5) chord.slice(2).forEach((m, i) => this.keys(t + i * 0.01, m, 0.6, 0.028));
    if (s === 0) this.bassNote(t, ROOT[bar], 0.95, 0.22);
    if (s === 6) this.bassNote(t, ROOT[bar], 0.4, 0.14);
    if (s === 0 || s === 5) this.thump(this._musBus, t, 125, 45, 0.18, s === 0 ? 0.5 : 0.32);
    if (s === 4) this.noiseHit(t, 1800, 'bandpass', 0.1, 0.2);
    this.noiseHit(t, 7000, 'highpass', 0.03, (s % 2 === 0 ? 0.05 : 0.03) * (0.7 + Math.random() * 0.6));
    if ((s === 2 || s === 6) && Math.random() < 0.35) {
      const PENT = [62, 65, 67, 69, 72, 74];
      this.keys(t, PENT[Math.floor(Math.random() * PENT.length)] + 12, 0.45, 0.03);
    }
  }

  renderVals1(): Vals {
    const s = this.state;
    const phase = s.phase;
    const g = s.grams;
    const TOP = 240, BOT = 284, HT = 36, HB = 26;
    const chalf = (y: number) => HT - (HT - HB) * (y - TOP) / (BOT - TOP);
    const f = Math.min(1, g / 36 * 0.6);
    const liqY = BOT - f * (BOT - TOP);

    const intro = phase === 'intro';
    const ready = phase === 'ready';
    const pouring = phase === 'pouring';
    const result = phase === 'result';
    const sad = result && !s.win;
    const happy = result && s.win;

    const endX = 286;
    const endY = pouring ? 122 : 206;
    const S = 1.3, CATX = 140;
    const px = (endX - 6 - CATX) / S + 92;
    const py = (endY + 3 - 358) / S + 358;
    const qx = (114 + px) / 2;
    const qy = (238 + py) / 2 + (pouring ? -10 : 6);

    const pdx = pouring ? 3 : 2;
    const pdy = pouring ? 2 : 1;

    const sx = 270, sy = 378;
    const ex = 285, ey = endY + 24;
    const cx = 232, cy = (sy + ey) / 2;
    const ang = Math.atan2(ey - cy, ex - cx);
    const h1x = ex - 15 * Math.cos(ang - 0.5), h1y = ey - 15 * Math.sin(ang - 0.5);
    const h2x = ex - 15 * Math.cos(ang + 0.5), h2y = ey - 15 * Math.sin(ang + 0.5);

    const show = (b: boolean) => (b ? 'inline' : 'none');
    const n1 = (x: number) => Number(x).toFixed(1);
    const guide = ready || pouring;

    return {
      blurPx: intro || result ? 7 : 0,
      tap: this.tap,
      start: this.start,
      retry: this.retry,
      toggleSfx: this.toggleSfx,
      toggleMusic: this.toggleMusic,
      sceneDisabled: !(ready || pouring),
      sceneLabel: ready ? t("game.scene1Ready") : pouring ? t("game.scene1Pour") : '',
      showIntro: intro,
      showResult: result,
      score: s.score,
      resultMsg: s.resultMsg,
      gramsText: n1(g) + ' g',
      timeText: Math.round(s.simT) + ' s',
      ratioText: '1 : ' + n1(g / 18),
      hintText: ready ? t("game.hint1Ready") : pouring ? t("game.hint1Pour") : '',
      liveText: result ? t("game.liveScore", { score: s.score, message: s.resultMsg }) : '',
      arrowDisp: guide ? 'block' : 'none',
      bubbleDisp: guide ? 'flex' : 'none',
      bubbleText: pouring ? t("game.bubble1Pour") : t("game.bubble1Ready"),
      arrowD: 'M' + sx + ' ' + sy + ' Q' + cx + ' ' + n1(cy) + ' ' + ex + ' ' + ey
        + ' M' + ex + ' ' + ey + ' L' + n1(h1x) + ' ' + n1(h1y)
        + ' M' + ex + ' ' + ey + ' L' + n1(h2x) + ' ' + n1(h2y),
      ringY: endY,
      sfxPressed: s.sfxOn,
      musicPressed: s.musicOn,
      sfxLabel: s.sfxOn ? t("game.sfxMute") : t("game.sfxUnmute"),
      musicLabel: s.musicOn ? t("game.musicOff") : t("game.musicOn"),
      sfxOnDisp: show(s.sfxOn),
      sfxOffDisp: show(!s.sfxOn),
      musicOnDisp: show(s.musicOn),
      musicOffDisp: show(!s.musicOn),
      needleX: pouring ? 355 : 343,
      needleY: pouring ? 86 : 126,
      leverX: endX,
      leverY: endY,
      armD: 'M114 238 Q' + n1(qx) + ' ' + n1(qy) + ' ' + n1(px) + ' ' + n1(py),
      pawX: n1(px),
      pawY: n1(py),
      liqDisp: show(g > 0.3),
      liqY: n1(liqY),
      cremaRx: n1(chalf(liqY) - 2),
      streamDisp: show(pouring),
      dropDisp: show(result),
      spillDisp: show(result && g >= 46),
      lookDisp: show(!result),
      sadDisp: show(sad),
      happyDisp: show(happy),
      starsDisp: show(happy),
      pupLx: 197 + pdx,
      pupRx: 231 + pdx,
      pupY: 340 + pdy,
    };
  }

  rot(x: number, y: number): [number, number] {
    const t = 6 * Math.PI / 180;
    const dx = (x - 305) * 1.4;
    const dy = (y - 386) * 1.4;
    return [305 + dx * Math.cos(t) - dy * Math.sin(t), 386 + dx * Math.sin(t) + dy * Math.cos(t)];
  }

  chord(ys: number) {
    const hit = (p: Pt, q: Pt) => p[0] + (ys - p[1]) / (q[1] - p[1]) * (q[0] - p[0]);
    return [hit(this.rot(249, 300), this.rot(265, 386)), hit(this.rot(361, 300), this.rot(345, 386))];
  }

  levelY(p: number) {
    return this.rot(305, 386 - p * 86)[1];
  }

  foamRow(cx: number, cy: number, hw: number, n: number, seed: number) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = cx - hw + 2 * hw * t;
      const r = 8.5 + 3.5 * Math.sin(i * 2.1 + seed);
      const y = cy - 4 * Math.sin(Math.PI * t) - 3 * Math.cos(i * 1.7 + seed);
      d += 'M' + (x - r).toFixed(1) + ' ' + y.toFixed(1) + ' a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (2 * r).toFixed(1) + ' 0 a' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 0 ' + (-2 * r).toFixed(1) + ' 0 ';
    }
    return d;
  }

  vals2() {
    const s = this.state;
    const on = s.phase === 'pouring';
    const result = s.phase === 'result';
    const spill = result && s.spill;
    const pc = Math.min(1, s.pct / 100);
    const ys = this.levelY(pc);
    const ch = this.chord(ys);
    const cx = (ch[0] + ch[1]) / 2;
    const hw = (ch[1] - ch[0]) / 2;
    const ry = Math.max(5, hw * 0.19);
    const f1 = (x: number) => x.toFixed(1);
    const speed = 2 + 8 * Math.max(0, pc - 0.33) / 0.67;
    const ph = on ? s.simT * speed : 0;

    let whirl = '';
    if (on) {
      const baseLimit = this.levelY(0.04);
      [[16, 36], [32, 28]].forEach((pair) => {
        const y = ys + pair[0];
        if (y > baseLimit) return;
        const c2 = this.chord(y);
        const c = (c2[0] + c2[1]) / 2;
        whirl += 'M' + f1(c - pair[1]) + ' ' + f1(y) + ' Q' + f1(c) + ' ' + f1(y + 10 * Math.sin(ph)) + ' ' + f1(c + pair[1]) + ' ' + f1(y - 4) + ' ';
      });
    }
    let surf = '';
    if (on && pc < 0.5) {
      const k = ry * 0.9 * Math.sin(ph);
      surf = 'M' + f1(cx - hw * 0.5) + ' ' + f1(ys) + ' Q' + f1(cx) + ' ' + f1(ys - k) + ' ' + f1(cx + hw * 0.5) + ' ' + f1(ys) + ' Q' + f1(cx) + ' ' + f1(ys + k) + ' ' + f1(cx - hw * 0.2) + ' ' + f1(ys);
    }
    let foam = '';
    if (pc >= 0.5 || spill) {
      const seed = 2 + (on ? s.simT * 0.9 : 0);
      foam = this.foamRow(cx, ys - 2, hw - 8, 6, seed);
      if (pc > 0.62 || spill) foam += this.foamRow(cx, ys - 14, hw - 18, 4, seed + 3);
    }
    let steam = '';
    if (on) {
      [302, 328, 352].forEach((x, k) => {
        const yy = ys - 6 - 6 * k;
        const dx = -9 + 4 * Math.sin(s.simT * 5 + k);
        steam += 'M' + x + ' ' + f1(yy) + ' q' + f1(dx) + ' -12 0 -22 t0 -22 ';
      });
    }
    return {
      milkY: f1(ys),
      wandCutY: f1(ys + 1),
      surfCx: f1(cx),
      surfCy: f1(ys),
      surfRx: f1(hw - 2),
      surfRy: f1(ry),
      whirlD: whirl,
      surfD: surf,
      foamD: foam,
      steamD: steam,
      needle2X: on ? 404 : 370,
      needle2Y: on ? 150 : 190,
      lever2X: 474,
      lever2Y: on ? 190 : 264,
      spillDisp2: spill ? 'inline' : 'none',
      stars2Disp: result && s.win && !s.spill ? 'inline' : 'none',
    };
  }

  mixHex(a: string, b: string, k: number) {
    const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
  }

  polyD(pts: Pt[]) {
    return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z';
  }

  blobPts(r: number): Pt[] {
    const o: Pt[] = [];
    for (let k = 0; k < 64; k++) {
      const a = Math.PI / 2 + 2 * Math.PI * k / 64;
      o.push([280 + r * Math.cos(a), 178 + r * Math.sin(a)]);
    }
    return o;
  }

  heartPts(sz: number, d: number): Pt[] {
    const SEG = [
      [[0, 0.9], [-1, 0.2], [-1.1, -0.7], [-0.5, -0.8]],
      [[-0.5, -0.8], [-0.2, -0.85], [0, -0.6], [0, -0.45]],
      [[0, -0.45], [0, -0.6], [0.2, -0.85], [0.5, -0.8]],
      [[0.5, -0.8], [1.1, -0.7], [1, 0.2], [0, 0.9]],
    ];
    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const left = cl(1 + 0.9 * d, 0.6, 1.4);
    const right = cl(1 - 0.9 * d, 0.6, 1.4);
    const rot = cl(20 * d, -20, 20) * Math.PI / 180;
    const o: Pt[] = [];
    SEG.forEach((sg) => {
      for (let j = 0; j < 16; j++) {
        const t = j / 16;
        const u = 1 - t;
        let x = u * u * u * sg[0][0] + 3 * u * u * t * sg[1][0] + 3 * u * t * t * sg[2][0] + t * t * t * sg[3][0];
        const y0 = u * u * u * sg[0][1] + 3 * u * u * t * sg[1][1] + 3 * u * t * t * sg[2][1] + t * t * t * sg[3][1];
        x *= x < 0 ? left : right;
        const px = x * sz;
        const py = y0 * sz;
        o.push([280 + 20 * d + px * Math.cos(rot) - py * Math.sin(rot), 178 + px * Math.sin(rot) + py * Math.cos(rot)]);
      }
    });
    return o;
  }

  smudgePts(r: number, d: number): Pt[] {
    const o: Pt[] = [];
    for (let k = 0; k < 64; k++) {
      const a = Math.PI / 2 + 2 * Math.PI * k / 64;
      const rr = r * (1 + 0.16 * Math.sin(3 * a + 1) + 0.08 * Math.sin(5 * a));
      o.push([280 + 10 * d + rr * Math.cos(a) * 1.18, 182 + rr * Math.sin(a) * 0.8]);
    }
    return o;
  }

  taperedArm(p0: Pt, pc: Pt, p1: Pt, w0: number, w1: number) {
    const n = 22;
    const L: Pt[] = [];
    const R: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * pc[0] + t * t * p1[0];
      const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * pc[1] + t * t * p1[1];
      const dx = 2 * (1 - t) * (pc[0] - p0[0]) + 2 * t * (p1[0] - pc[0]);
      const dy = 2 * (1 - t) * (pc[1] - p0[1]) + 2 * t * (p1[1] - pc[1]);
      const len = Math.hypot(dx, dy) || 1;
      const w = (w0 + (w1 - w0) * t) / 2;
      L.push([x - dy / len * w, y + dx / len * w]);
      R.push([x + dy / len * w, y - dx / len * w]);
    }
    return this.polyD(L.concat(R.reverse()));
  }

  vals3() {
    const s = this.state;
    const q = s.s3;
    const CX = 280, CY = 178, JX = 108, JY = 332, JR = 58;
    const f1 = (x: number) => Number(x).toFixed(1);
    const result = s.phase === 'result';
    const stage = s.phase === 'ready' ? 'ready' : q.stage;
    const fill = Math.min(1, q.fill);
    const rho = q.ratio;
    const k = Math.min(0.8, 0.55 * Math.max(0, fill - 0.2) / 0.46);
    const rr = 62 * rho;

    let px = CX, py = CY + 6;
    if (stage === 'cut') px = q.cutX;
    if (stage === 'pull') py = CY + rr * (0.9 - 1.8 * q.pullQ);
    const vx = px - JX, vy = py - JY;
    const vl = Math.hypot(vx, vy) || 1;
    const dx = vx / vl, dy = vy / vl;
    const nx = -dy, ny = dx;
    const Sx = JX + dx * (JR + 24), Sy = JY + dy * (JR + 24);
    const Hx = JX - dx * (JR + 14), Hy = JY - dy * (JR + 14);
    const Wx = JX - dx * (JR + 30), Wy = JY - dy * (JR + 30);
    const Ax = JX + dx * (JR - 8), Ay = JY + dy * (JR - 8);
    const pt = (x: number, y: number) => f1(x) + ' ' + f1(y);
    const spout = 'M' + pt(Ax + nx * 17, Ay + ny * 17) + ' L' + pt(Sx + nx * 7, Sy + ny * 7)
      + ' L' + pt(Sx - nx * 7, Sy - ny * 7) + ' L' + pt(Ax - nx * 17, Ay - ny * 17) + ' Z';
    const toes = 'M' + pt(Wx + 4, Wy - 8) + ' L' + pt(Wx + 14, Wy - 8) + ' M' + pt(Wx + 4, Wy) + ' L' + pt(Wx + 14, Wy)
      + ' M' + pt(Wx + 4, Wy + 8) + ' L' + pt(Wx + 14, Wy + 8);

    let shapeD = '';
    if (stage === 'blob' || stage === 'cut') {
      shapeD = this.polyD(this.blobPts(Math.max(1, rr)));
    } else if (stage === 'pull' || stage === 'done') {
      const dd = (q.cutX - CX) / 62;
      const avg = Math.round((q.b1 + q.b2 + q.b3) / 3);
      const target = avg >= 70 ? this.heartPts(58 * rho, dd) : this.smudgePts(rr * 0.9, dd);
      const e = stage === 'done' ? 1 : q.pullQ * q.pullQ * (3 - 2 * q.pullQ);
      const from = this.blobPts(Math.max(1, rr));
      shapeD = this.polyD(from.map((p, i) => [p[0] + (target[i][0] - p[0]) * e, p[1] + (target[i][1] - p[1]) * e]));
    }
    const pulling = stage === 'pull';
    const streaming = s.phase === 'pouring' && stage !== 'ready' && stage !== 'done';
    const w1 = stage === 'base' ? 16 : stage === 'blob' ? 11 : 8;
    const w2 = stage === 'base' ? 9 : stage === 'blob' ? 5 : 3;
    const cutting = stage === 'cut';

    return {
      cofR: f1(q.spill ? 112 : 70 + 42 * fill),
      cofColor: this.mixHex('#3D2825', '#F0AE86', k),
      baseRingDisp: (stage === 'ready' || stage === 'base') ? 'inline' : 'none',
      blobRingDisp: stage === 'blob' ? 'inline' : 'none',
      spillDisp3: result && q.spill ? 'inline' : 'none',
      shapeDisp: shapeD && !q.spill ? 'inline' : 'none',
      shapeD: shapeD,
      lineD: pulling ? 'M' + pt(CX, CY + rr * 0.9) + ' L' + pt(px, py) : '',
      cutDisp: cutting ? 'inline' : 'none',
      cutLineD: cutting ? 'M' + pt(q.cutX, CY - 82) + ' L' + pt(q.cutX, CY + 82) : '',
      cutArrowD: cutting ? 'M' + pt(q.cutX - 10, CY - 108) + ' L' + pt(q.cutX + 10, CY - 108) + ' L' + pt(q.cutX, CY - 88) + ' Z' : '',
      spoutD: spout,
      jugDeg: f1(Math.atan2(dy, dx) * 180 / Math.PI),
      hX: f1(Hx),
      hY: f1(Hy),
      armD3: this.taperedArm([-16, 476], [6, 436], [Wx + 4, Wy + 6], 74, 26),
      pawX3: f1(Wx),
      pawY3: f1(Wy),
      toesD: toes,
      streamDisp3: streaming ? 'inline' : 'none',
      streamD3: 'M' + pt(Sx, Sy) + ' L' + pt(px, py),
      streamW1: w1,
      streamW2: w2,
      landX: f1(px),
      landY: f1(py),
      landR: stage === 'base' ? 9 : stage === 'blob' ? 6 : 4,
      stars3Disp: result && s.win ? 'inline' : 'none',
    };
  }

  renderVals(): Vals {
    const v = this.renderVals1();
    const s = this.state;
    const L2 = s.level === 2;
    const L3 = s.level === 3;
    const result = s.phase === 'result';
    const ready = s.phase === 'ready';
    const pouring = s.phase === 'pouring';
    const next = result && s.win && s.level < 3;
    Object.assign(v, this.vals2(), this.vals3(), {
      nextLevel: this.nextLevel,
      lv1Disp: s.level === 1 ? 'block' : 'none',
      lv2Disp: L2 ? 'block' : 'none',
      lv3Disp: L3 ? 'block' : 'none',
      nextLabel: t("game.nextLevel", { level: s.level + 1 }),
      nextDisp: next ? 'inline-block' : 'none',
      resultDir: next ? 'column' : 'row',
      ovBox: L2 ? '90 135 400 314' : '0 0 560 440',
      ringX: 286,
      introLabel: t("game.introLabel"),
      introTitle: t("game.l1.title"),
      introK1: t("game.kDose"),
      introV1: t("game.l1.dose"),
      introK2: t("game.kGoal"),
      introV2: t("game.l1.goal"),
      introK3: t("game.kHow"),
      introV3: t("game.l1.how"),
      introK4: t("game.kWin"),
      introV4: t("game.l1.win"),
      introBtn: t("game.l1.btn"),
    });
    if (L2) {
      const ey = pouring ? 190 : 264;
      const sx = 395, sy = 372, ex = 468, ey2 = ey + 26;
      const cx = 392, cy = (sy + ey2) / 2;
      const ang = Math.atan2(ey2 - cy, ex - cx);
      const h1x = ex - 15 * Math.cos(ang - 0.5), h1y = ey2 - 15 * Math.sin(ang - 0.5);
      const h2x = ex - 15 * Math.cos(ang + 0.5), h2y = ey2 - 15 * Math.sin(ang + 0.5);
      const n1 = (x: number) => Number(x).toFixed(1);
      Object.assign(v, {
        sceneLabel: ready ? t("game.l2.scene.ready") : pouring ? t("game.l2.scene.pour") : '',
        hintText: ready ? t("game.l2.hint.ready") : pouring ? t("game.l2.hint.pour") : '',
        bubbleText: pouring ? t("game.l2.bubble.pour") : t("game.l2.bubble.ready"),
        gramsText: Math.round(s.pct) + ' %',
        ratioText: t("game.target66"),
        ringX: 474,
        ringY: ey,
        arrowD: 'M' + sx + ' ' + sy + ' Q' + cx + ' ' + n1(cy) + ' ' + ex + ' ' + n1(ey2)
          + ' M' + ex + ' ' + n1(ey2) + ' L' + n1(h1x) + ' ' + n1(h1y)
          + ' M' + ex + ' ' + n1(ey2) + ' L' + n1(h2x) + ' ' + n1(h2y),
        introLabel: t("game.l2.label"),
        introTitle: t("game.l2.title"),
        introK1: t("game.kGoal"),
        introV1: t("game.l2.goal"),
        introK2: t("game.kHow"),
        introV2: t("game.l2.how"),
        introK3: t("game.kCareful"),
        introV3: t("game.l2.careful"),
        introK4: t("game.kWin"),
        introV4: t("game.l2.win"),
        introBtn: t("game.l2.title"),
      });
    }
    if (L3) {
      const q = s.s3;
      const st = ready || s.phase === 'intro' ? 'ready' : q.stage;
      const guide = ready || (pouring && st !== 'pull');
      const rx = st === 'cut' ? q.cutX : 280;
      const ry = 178;
      const sx = 330, sy = 392, ex = rx + 30, ey = ry + 44;
      const cx = 372, cy = (sy + ey) / 2;
      const ang = Math.atan2(ey - cy, ex - cx);
      const h1x = ex - 15 * Math.cos(ang - 0.5), h1y = ey - 15 * Math.sin(ang - 0.5);
      const h2x = ex - 15 * Math.cos(ang + 0.5), h2y = ey - 15 * Math.sin(ang + 0.5);
      const n1 = (x: number) => Number(x).toFixed(1);
      const dev = Math.round(Math.abs(q.cutX - 280) / 62 * 100);
      const hints = {
        ready: t("game.l3.hint.ready"),
        base: t("game.l3.hint.base"),
        blob: t("game.l3.hint.blob"),
        cut: t("game.l3.hint.cut"),
        pull: t("game.l3.hint.pull"),
        done: '',
      };
      const bubbles = {
        ready: t("game.l3.bubble.ready"),
        base: t("game.l3.bubble.base"),
        blob: t("game.l3.bubble.blob"),
        cut: t("game.l3.bubble.cut"),
        pull: '',
        done: '',
      };
      const labels = {
        ready: t("game.l3.scene.ready"),
        base: t("game.l3.scene.base"),
        blob: t("game.l3.scene.blob"),
        cut: t("game.l3.scene.cut"),
        pull: '',
        done: '',
      };
      let g = Math.round(Math.min(1, q.fill) * 100) + ' %';
      let r = t("game.target66");
      if (st === 'blob') {
        g = Math.round(q.ratio * 100) + ' %';
        r = t("game.target100");
      } else if (st === 'cut') {
        g = dev + ' %';
        r = t("game.targetDeviation");
      } else if (st === 'pull') {
        g = '...';
        r = t("game.drawing");
      } else if (st === 'done') {
        r = q.spill ? t("game.spill") : t("game.done");
      }
      Object.assign(v, {
        sceneLabel: labels[st],
        hintText: hints[st],
        bubbleText: bubbles[st],
        arrowDisp: guide ? 'block' : 'none',
        bubbleDisp: guide ? 'flex' : 'none',
        gramsText: g,
        timeText: Math.round(s.simT) + ' s',
        ratioText: r,
        ringX: rx,
        ringY: ry,
        arrowD: 'M' + sx + ' ' + sy + ' Q' + cx + ' ' + n1(cy) + ' ' + n1(ex) + ' ' + ey
          + ' M' + n1(ex) + ' ' + ey + ' L' + n1(h1x) + ' ' + n1(h1y)
          + ' M' + n1(ex) + ' ' + ey + ' L' + n1(h2x) + ' ' + n1(h2y),
        introLabel: t("game.l3.label"),
        introTitle: t("game.l3.title"),
        introK1: t("game.kGoal"),
        introV1: t("game.l3.goal"),
        introK2: t("game.kHow"),
        introV2: t("game.l3.how"),
        introK3: t("game.kAfter"),
        introV3: t("game.l3.after"),
        introK4: t("game.kWin"),
        introV4: t("game.l3.win"),
        introBtn: t("game.l3.btn"),
      });
    }
    return v;
  }

  render() {
    const v = this.renderVals();
    return (
      <div style={{ width: "100%", maxWidth: "640px", margin: "0 auto", fontFamily: "var(--font-roboto-mono), monospace", color: "#3D2825" }}>
        <div style={{ background: "#F3EFDF", borderRadius: "28px", padding: "18px 18px 22px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", background: "#3D2825", borderRadius: "16px", padding: "10px 18px", boxSizing: "border-box" }}><div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "700", fontSize: "26px", color: "#F0AE86" }}>{v.gramsText}</div><div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "15px", color: "#FFFFF0" }}>{v.timeText}</div><div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "16px", color: "#FFFFF0" }}>{v.ratioText}</div></div>
          <div className="flex flex-col justify-center max-sm:min-h-[470px]" style={{ position: "relative", overflow: "hidden", borderRadius: "20px" }}>
            <div style={{ filter: `blur(${v.blurPx}px)` }}><div style={{ display: v.lv1Disp }}><svg viewBox="0 0 560 440" width="100%" role="img" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }} aria-label={t("game.alt1")}><defs><filter id="wob" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" /></filter><clipPath id="cupclip"><path d="M319 240 L391 240 L381 284 Q355 292 329 284 Z" /></clipPath><clipPath id="torsoclip"><ellipse cx="92" cy="286" rx="42" ry="66" /></clipPath></defs><g filter="url(#wob)" stroke="#3D2825" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round"><path d="M0 352 L560 352 L560 440 L0 440 Z" fill="#FFFFF0" /><path d="M0 352 L560 352" fill="none" /><path d="M0 418 L560 418" fill="none" strokeWidth="3" /><rect x="256" y="304" width="198" height="46" rx="6" fill="#A48DC7" /><polygon points="460,60 484,34 484,236 460,262" fill="#A48DC7" /><rect x="250" y="60" width="210" height="202" rx="14" fill="#B9A5D6" /><polygon points="250,60 460,60 484,34 274,34" fill="#B9A5D6" /><polygon points="260,262 460,262 436,292 236,292" fill="#FFFFF0" /><path d="M260 277 L444 277" fill="none" strokeWidth="2.6" strokeDasharray="3 9" /><rect x="236" y="292" width="200" height="12" rx="3" fill="#B9A5D6" /><circle cx="355" cy="106" r="28" fill="#FFFFF0" /><path d={`M355 106 L${v.needleX} ${v.needleY}`} fill="none" strokeWidth="3.6" /><circle cx="355" cy="106" r="3.6" fill="#3D2825" strokeWidth="2" /><rect x="320" y="140" width="70" height="48" rx="8" fill="#3D2825" /><rect x="337" y="188" width="36" height="18" rx="4" fill="#FFFFF0" strokeWidth="3.6" /><path d="M373 198 L409 216" fill="none" strokeWidth="8" /><path d="M355 206 L355 218" fill="none" strokeWidth="5" /><rect x="309" y="280" width="92" height="10" rx="5" fill="#F3EFDF" strokeWidth="3.4" /><path d="M319 240 L391 240 L381 284 Q355 292 329 284 Z" fill="#FFFFF0" /><g style={{ display: v.liqDisp }}><g clipPath="url(#cupclip)" stroke="none"><rect x="305" y={v.liqY} width="100" height="60" fill="#3D2825" /></g></g><path d="M319 240 L391 240 L381 284 Q355 292 329 284 Z" fill="none" /><path d="M389 250 Q409 250 409 263 Q409 277 385 275" fill="none" strokeWidth="4" /><ellipse cx="355" cy="240" rx="36" ry="8" fill="none" /><ellipse style={{ display: v.liqDisp }} cx="355" cy={v.liqY} rx={v.cremaRx} ry="5.5" fill="#F0AE86" stroke="none" /><path d="M301 258 L325.1 258 M384.9 258 L409 258" fill="none" stroke="#F0AE86" strokeWidth="4.6" /><path style={{ display: v.streamDisp }} d={`M355 218 Q353 230 355 240 L355 ${v.liqY}`} fill="none" strokeWidth="5.6" /><g style={{ display: v.dropDisp }}><path d="M355 222 Q351 228 355 232 Q359 228 355 222 Z" fill="#3D2825" strokeWidth="2.4" /></g><g style={{ display: v.spillDisp }}><path d="M393 244 Q400 258 393 270" fill="none" strokeWidth="4" /><path d="M421 280 Q416 287 421 291 Q426 287 421 280 Z" fill="#3D2825" strokeWidth="2.4" /></g><path d={`M320 164 L${v.leverX} ${v.leverY}`} fill="none" strokeWidth="7" /><circle cx={v.leverX} cy={v.leverY} r="9" fill="#FFFFF0" /><g transform="translate(140 358) scale(1.3) translate(-92 -358)" strokeWidth="3.4"><path d="M58 336 Q20 328 26 288 Q30 266 50 272" fill="none" stroke="#3D2825" strokeWidth="15" /><path d="M58 336 Q20 328 26 288 Q30 266 50 272" fill="none" stroke="#8B8791" strokeWidth="8" /><ellipse cx="92" cy="286" rx="42" ry="66" fill="#8B8791" /><g clipPath="url(#torsoclip)" stroke="none"><ellipse cx="92" cy="300" rx="32" ry="68" fill="#FFFFF0" /></g><ellipse cx="92" cy="286" rx="42" ry="66" fill="none" /><path d="M70 244 Q56 274 62 304" fill="none" stroke="#3D2825" strokeWidth="21" /><path d="M70 244 Q56 274 62 304" fill="none" stroke="#8B8791" strokeWidth="14" /><circle cx="62" cy="306" r="10" fill="#FFFFF0" /><path d={v.armD} fill="none" stroke="#3D2825" strokeWidth="21" /><path d={v.armD} fill="none" stroke="#8B8791" strokeWidth="14" /><ellipse cx="74" cy="358" rx="17" ry="8" fill="#FFFFF0" /><ellipse cx="112" cy="358" rx="17" ry="8" fill="#FFFFF0" /><g transform="translate(-122 -162)"><path d="M174 350 L178 290 L214 314 L250 290 L254 350 Q254 380 214 380 Q174 380 174 350 Z" fill="#8B8791" /><g stroke="none"><path d="M214 316 Q206 330 198 346 Q190 362 200 372 Q214 381 228 372 Q238 362 230 346 Q222 330 214 316 Z" fill="#FFFFF0" /><path d="M184 303 L185 320 L198 314 Z" fill="#F0AE86" /><path d="M244 303 L243 320 L230 314 Z" fill="#F0AE86" /></g><g style={{ display: v.lookDisp }}><circle cx="197" cy="340" r="9.5" fill="#B8B456" stroke="#3D2825" strokeWidth="2.4" /><circle cx="231" cy="340" r="9.5" fill="#B8B456" stroke="#3D2825" strokeWidth="2.4" /><ellipse cx={v.pupLx} cy={v.pupY} rx="2.6" ry="6" fill="#3D2825" /><ellipse cx={v.pupRx} cy={v.pupY} rx="2.6" ry="6" fill="#3D2825" /><path d="M209 351 L219 351 L214 357 Z" fill="#F0AE86" /><path d="M214 357 L214 361 M214 361 Q208 366 203 362 M214 361 Q220 366 225 362" fill="none" stroke="#3D2825" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></g><g style={{ display: v.sadDisp }}><circle cx="197" cy="341" r="9.5" fill="#B8B456" stroke="#3D2825" strokeWidth="2.4" /><ellipse cx="199" cy="344" rx="2.6" ry="6" fill="#3D2825" /><circle cx="231" cy="341" r="9.5" fill="#B8B456" stroke="#3D2825" strokeWidth="2.4" /><ellipse cx="233" cy="344" rx="2.6" ry="6" fill="#3D2825" /><path d="M186 329 L204 322 M224 322 L242 329" fill="none" stroke="#3D2825" strokeWidth="3" strokeLinecap="round" /><path d="M209 352 L219 352 L214 358 Z" fill="#F0AE86" /><path d="M205 368 Q214 359 223 368" fill="none" stroke="#3D2825" strokeWidth="2.6" strokeLinecap="round" /><path d="M188 352 Q183 360 188 364 Q193 360 188 352 Z" fill="#B9A5D6" stroke="#3D2825" strokeWidth="1.8" /></g><g style={{ display: v.happyDisp }}><path d="M188 344 Q197 330 206 344 M222 344 Q231 330 240 344" fill="none" stroke="#3D2825" strokeWidth="3.6" strokeLinecap="round" /><path d="M209 351 L219 351 L214 357 Z" fill="#F0AE86" /><path d="M202 359 Q214 376 226 359 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><ellipse cx="188" cy="356" rx="7" ry="3.6" fill="#F0AE86" opacity="0.8" /><ellipse cx="240" cy="356" rx="7" ry="3.6" fill="#F0AE86" opacity="0.8" /></g><path d="M186 358 L160 352 M186 364 L161 368 M242 358 L268 352 M242 364 L267 368" fill="none" stroke="#3D2825" strokeWidth="1.8" strokeLinecap="round" /></g><circle cx={v.pawX} cy={v.pawY} r="11" fill="#FFFFF0" /></g></g><g style={{ display: v.starsDisp }}><path d="M235 71 Q235 80 244 80 Q235 80 235 89 Q235 80 226 80 Q235 80 235 71 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><path d="M440 162 Q440 170 448 170 Q440 170 440 178 Q440 170 432 170 Q440 170 440 162 Z" fill="#B9A5D6" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><path d="M30 111 Q30 120 39 120 Q30 120 30 129 Q30 120 21 120 Q30 120 30 111 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /></g><text x="262" y="268" fontSize="20" fill="#3D2825" stroke="none" transform="rotate(-6 262 268)" style={{ fontFamily: "var(--font-gochi), cursive" }}>36 g</text></svg></div><div style={{ display: v.lv2Disp }}><svg viewBox="90 135 400 314" width="100%" role="img" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }} aria-label={t("game.alt2")}><defs><filter id="wob2" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="9" result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" /></filter><clipPath id="jugclip2"><path d="M249 300 L265 386 Q305 397 345 386 L361 300 Z" transform="translate(305.0 386.0) rotate(6.0) scale(1.4) translate(-305.0 -386.0)" /></clipPath><clipPath id="wandclip2"><rect x="0" y="0" width="600" height={v.wandCutY} /></clipPath></defs><g filter="url(#wob2)" stroke="#3D2825" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round"><path d="M0 418 L560 418 L560 440 L0 440 Z" fill="#FFFFF0" /><path d="M0 432 L560 432" fill="none" strokeWidth="3" /><polygon points="520,20 544,-4 544,296 520,320" fill="#A48DC7" /><rect x="250" y="20" width="270" height="300" rx="14" fill="#B9A5D6" /><rect x="236" y="320" width="300" height="14" rx="3" fill="#B9A5D6" /><circle cx="385" cy="172" r="26" fill="#FFFFF0" /><path d={`M385 172 L${v.needle2X} ${v.needle2Y}`} fill="none" strokeWidth="3.6" /><circle cx="385" cy="172" r="3.6" fill="#3D2825" strokeWidth="2" /><circle cx="450" cy="230" r="22" fill="#FFFFF0" /><path d={`M450 230 L${v.lever2X} ${v.lever2Y}`} fill="none" strokeWidth="7" /><circle cx={v.lever2X} cy={v.lever2Y} r="9" fill="#FFFFF0" /><text x="404" y="296" fontSize="20" fill="#3D2825" stroke="none" transform="rotate(-5 404 296)" style={{ fontFamily: "var(--font-gochi), cursive" }}>{t("game.steamLabel")}</text><rect x="288" y="196" width="34" height="22" rx="6" fill="#3D2825" /><g clipPath="url(#jugclip2)" stroke="none"><rect x="200" y={v.milkY} width="200" height="140" fill="#FFFFF0" /></g><g transform="translate(305.0 386.0) rotate(6.0) scale(1.4) translate(-305.0 -386.0)" strokeWidth="3.2"><path d="M249 300 L265 386 Q305 397 345 386 L361 300" fill="none" /><path d="M252 318 Q212 312 220 346 Q226 374 264 368" fill="none" /><ellipse cx="305" cy="300.0" rx="56" ry="11" fill="none" /></g><path d={v.whirlD} fill="none" strokeWidth="2.8" /><ellipse cx={v.surfCx} cy={v.surfCy} rx={v.surfRx} ry={v.surfRy} fill="#FFFFF0" /><path d={v.surfD} fill="none" strokeWidth="2.8" /><g clipPath="url(#wandclip2)"><path d="M305 208 L305 252 Q305 266 312 276 L322 372" fill="none" stroke="#3D2825" strokeWidth="16" /><path d="M305 208 L305 252 Q305 266 312 276 L322 372" fill="none" stroke="#B9A5D6" strokeWidth="8" /></g><path d={v.steamD} fill="none" strokeWidth="3.4" /><path d={v.foamD} fill="#FFFFF0" /><g style={{ display: v.spillDisp2 }}><path d="M266.2 242.5 a5.1 5.1 0 1 0 10.3 0 a5.1 5.1 0 1 0 -10.3 0 M275.7 239.0 a11.1 11.1 0 1 0 22.1 0 a11.1 11.1 0 1 0 -22.1 0 M292.9 242.2 a9.3 9.3 0 1 0 18.6 0 a9.3 9.3 0 1 0 -18.6 0 M312.4 242.6 a5.2 5.2 0 1 0 10.3 0 a5.2 5.2 0 1 0 -10.3 0 M321.9 238.5 a11.1 11.1 0 1 0 22.2 0 a11.1 11.1 0 1 0 -22.2 0 M339.2 240.0 a9.2 9.2 0 1 0 18.4 0 a9.2 9.2 0 1 0 -18.4 0 M358.7 246.0 a5.2 5.2 0 1 0 10.4 0 a5.2 5.2 0 1 0 -10.4 0 M278.8 229.8 a9.9 9.9 0 1 0 19.9 0 a9.9 9.9 0 1 0 -19.9 0 M298.2 225.9 a5.0 5.0 0 1 0 10.0 0 a5.0 5.0 0 1 0 -10.0 0 M307.0 221.3 a10.6 10.6 0 1 0 21.1 0 a10.6 10.6 0 1 0 -21.1 0 M322.1 224.9 a9.9 9.9 0 1 0 19.8 0 a9.9 9.9 0 1 0 -19.8 0 M341.4 230.0 a5.0 5.0 0 1 0 10.1 0 a5.0 5.0 0 1 0 -10.1 0 " fill="#FFFFF0" /><path d="M400.0 262.3 Q420.0 330 408.0 364" fill="none" strokeWidth="9" /><path d="M400.0 262.3 Q420.0 330 408.0 364" fill="none" stroke="#FFFFF0" strokeWidth="3.4" /><path d="M238.3 268.3 Q226.3 330 232.3 352" fill="none" strokeWidth="9" /><path d="M238.3 268.3 Q226.3 330 232.3 352" fill="none" stroke="#FFFFF0" strokeWidth="3.4" /><path d="M404.0 372 L404.0 408" fill="none" strokeWidth="5" /><ellipse cx="404.0" cy="424" rx="54" ry="7" fill="#FFFFF0" /><path d="M288 244 q-9 -12 0 -22 t0 -22 M322 244 q-9 -12 0 -22 t0 -22 M352 244 q-9 -12 0 -22 t0 -22" fill="none" strokeWidth="3.4" /></g><path d="M223.5 307.0 L247.5 307.0 M381.9 307.0 L405.9 307.0" fill="none" stroke="#F0AE86" strokeWidth="4.6" /><path d="M97.5 494.7 L103.1 486.9 L108.6 479.0 L114.0 471.3 L119.4 463.6 L124.7 455.9 L129.9 448.3 L135.0 440.7 L140.1 433.2 L145.1 425.7 L150.0 418.3 L154.9 410.9 L159.7 403.6 L164.4 396.3 L169.0 389.1 L173.6 381.9 L178.1 374.8 L182.5 367.7 L186.9 360.7 L191.2 353.7 L195.4 346.8 L199.5 339.9 L203.6 333.0 L183.2 316.8 L177.5 322.2 L171.7 327.7 L165.9 333.2 L160.0 338.7 L154.0 344.3 L148.0 349.9 L141.9 355.5 L135.7 361.2 L129.5 366.9 L123.2 372.7 L116.8 378.5 L110.4 384.4 L103.9 390.3 L97.3 396.2 L90.7 402.2 L84.0 408.2 L77.2 414.3 L70.4 420.4 L63.5 426.6 L56.6 432.8 L49.6 439.0 L42.5 445.3 Z" fill="#8B8791" /><ellipse cx="190.4" cy="316.9" rx="19" ry="16" fill="#FFFFF0" /><path d="M184.4 300.9 L184.4 311.9 M196.4 300.9 L196.4 311.9" fill="none" strokeWidth="2.8" /></g><g style={{ display: v.stars2Disp }}><path d="M120 221 Q120 230 129 230 Q120 230 120 239 Q120 230 111 230 Q120 230 120 221 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><path d="M300 142 Q300 150 308 150 Q300 150 300 158 Q300 150 292 150 Q300 150 300 142 Z" fill="#B9A5D6" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><path d="M180 166 Q180 175 189 175 Q180 175 180 184 Q180 175 171 175 Q180 175 180 166 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /></g></svg></div><div style={{ display: v.lv3Disp }}><svg viewBox="0 0 560 440" width="100%" role="img" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }} aria-label={t("game.alt3")}><defs><filter id="wob3" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="12" result="t" /><feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" /></filter></defs><g filter="url(#wob3)" stroke="#3D2825" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="280" cy="178" r="168" fill="#B9A5D6" /><circle cx="280" cy="178" r="148" fill="none" stroke="#A48DC7" strokeWidth="3" /><path d="M404 148 Q474 138 470 178 Q466 218 404 208" fill="none" strokeWidth="18" /><path d="M404 148 Q474 138 470 178 Q466 218 404 208" fill="none" stroke="#FFFFF0" strokeWidth="9" /><circle cx="280" cy="178" r="130" fill="#FFFFF0" /><circle cx="280" cy="178" r="112" fill="#FFFFF0" strokeWidth="3" /><circle cx="280" cy="178" r={v.cofR} fill={v.cofColor} stroke="none" /><circle style={{ display: v.baseRingDisp }} cx="280" cy="178" r="97.7" fill="none" stroke="#F0AE86" strokeWidth="4.6" strokeDasharray="3 10" /><circle style={{ display: v.blobRingDisp }} cx="280" cy="178" r="62" fill="none" stroke="#F0AE86" strokeWidth="4.6" strokeDasharray="3 10" /><g style={{ display: v.spillDisp3 }}><path d="M345.2 320.0 C343.8 330.4 333.8 340.3 326.9 348.3 C320.0 356.3 313.4 362.7 303.6 368.1 C293.9 373.4 278.0 383.3 268.4 380.4 C258.8 377.5 251.8 360.6 245.9 350.6 C240.1 340.5 233.7 330.5 233.3 320.0 C233.0 309.5 236.9 294.9 243.8 287.9 C250.6 280.8 263.8 281.7 274.3 277.7 C284.7 273.7 296.1 262.4 306.3 263.7 C316.5 265.0 328.7 276.3 335.2 285.7 C341.7 295.1 346.6 309.6 345.2 320.0 Z" fill="#FFFFF0" strokeWidth="4" /><path d="M231.9 290.0 C232.6 295.8 224.1 302.5 219.8 308.8 C215.5 315.0 212.2 325.6 206.2 327.6 C200.2 329.7 189.5 324.8 183.9 321.2 C178.2 317.6 176.7 311.1 172.1 305.9 C167.5 300.7 157.2 295.9 156.4 290.0 C155.6 284.1 163.0 276.3 167.4 270.7 C171.8 265.0 176.5 259.0 182.9 256.0 C189.4 252.9 200.7 249.4 206.2 252.4 C211.7 255.4 211.7 267.8 215.9 274.1 C220.2 280.3 231.3 284.2 231.9 290.0 Z" fill="#FFFFF0" strokeWidth="4" /><path d="M404.4 278.0 C404.7 282.8 399.8 288.3 396.6 293.0 C393.4 297.6 389.8 305.0 385.2 306.2 C380.5 307.3 374.4 301.6 368.9 299.8 C363.4 298.0 356.5 299.0 352.1 295.4 C347.7 291.7 342.2 283.4 342.8 278.0 C343.4 272.6 351.7 267.9 355.7 263.3 C359.7 258.6 362.2 251.6 366.9 249.9 C371.6 248.3 379.3 251.0 384.0 253.4 C388.7 255.8 391.8 260.0 395.2 264.1 C398.6 268.2 404.2 273.2 404.4 278.0 Z" fill="#FFFFF0" strokeWidth="4" /><circle cx="280" cy="178" r="110" fill="none" stroke="#FFFFF0" strokeWidth="9" /><circle cx="280" cy="178" r="104" fill="none" strokeWidth="3" strokeDasharray="2 12" /></g><path style={{ display: v.shapeDisp }} d={v.shapeD} fill="#FFFFF0" strokeWidth="3" /><path d={v.lineD} fill="none" stroke={v.cofColor} strokeWidth="2.6" /><g style={{ display: v.cutDisp }}><path d={v.cutLineD} fill="none" stroke="#F0AE86" strokeWidth="5" strokeDasharray="3 9" /><path d={v.cutArrowD} fill="#F0AE86" strokeWidth="3" /><path d="M272 178 L288 178 M280 170 L280 186" fill="none" strokeWidth="3" /></g><path d={v.spoutD} fill="#F3EFDF" /><g transform={`rotate(${v.jugDeg} ${v.hX} ${v.hY})`}><ellipse cx={v.hX} cy={v.hY} rx="24" ry="15" fill="none" strokeWidth="15" /><ellipse cx={v.hX} cy={v.hY} rx="24" ry="15" fill="none" stroke="#F3EFDF" strokeWidth="6" /></g><circle cx="108" cy="332" r="58" fill="#F3EFDF" /><circle cx="108" cy="332" r="45" fill="#FFFFF0" strokeWidth="3" /><path d={v.armD3} fill="#8B8791" /><g transform={`rotate(${v.jugDeg} ${v.pawX3} ${v.pawY3})`}><ellipse cx={v.pawX3} cy={v.pawY3} rx="19" ry="16" fill="#FFFFF0" /><path d={v.toesD} fill="none" strokeWidth="2.8" /></g><g style={{ display: v.streamDisp3 }}><path d={v.streamD3} fill="none" strokeWidth={v.streamW1} /><path d={v.streamD3} fill="none" stroke="#FFFFF0" strokeWidth={v.streamW2} /><circle cx={v.landX} cy={v.landY} r={v.landR} fill="#FFFFF0" strokeWidth="3" /></g></g><g style={{ display: v.stars3Disp }}><path d="M70 81 Q70 90 79 90 Q70 90 70 99 Q70 90 61 90 Q70 90 70 81 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><path d="M490 252 Q490 260 498 260 Q490 260 490 268 Q490 260 482 260 Q490 260 490 252 Z" fill="#B9A5D6" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /><path d="M500 91 Q500 100 509 100 Q500 100 500 109 Q500 100 491 100 Q500 100 500 91 Z" fill="#F0AE86" stroke="#3D2825" strokeWidth="2.4" strokeLinejoin="round" /></g></svg></div></div>
            <button type="button" onClick={v.tap} disabled={v.sceneDisabled} aria-label={v.sceneLabel} style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", width: "100%", height: "100%", padding: "0", border: "0", background: "transparent", cursor: "pointer" }}></button>
            <svg viewBox={v.ovBox} width="100%" aria-hidden="true" style={{ position: "absolute", top: "50%", left: "0", transform: "translateY(-50%)", pointerEvents: "none", display: v.arrowDisp }}><circle cx={v.ringX} cy={v.ringY} r="16" fill="none" stroke="#F0AE86" strokeWidth="5"><animate attributeName="r" values="14;30;14" dur="1.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0.15;1" dur="1.4s" repeatCount="indefinite" /></circle><g className="mnudge" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={v.arrowD} stroke="#3D2825" strokeWidth="11" /><path d={v.arrowD} stroke="#F0AE86" strokeWidth="5" /></g></svg><div style={{ position: "absolute", left: "10px", right: "116px", bottom: "10px", display: v.bubbleDisp, justifyContent: "center", pointerEvents: "none" }}><div style={{ background: "#F0AE86", color: "#3D2825", border: "3px solid #3D2825", borderRadius: "22px", padding: "4px 16px", textAlign: "center", lineHeight: "1.15", fontFamily: "var(--font-gochi), cursive", fontSize: "22px" }}>{v.bubbleText}</div></div>
            {v.showIntro && (<div className="p-4 max-sm:px-2 max-sm:pb-16" style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}><div style={{ background: "rgba(255,255,240,0.92)", border: "3px solid #3D2825", borderRadius: "28px", padding: "clamp(14px, 4vw, 22px) clamp(16px, 5vw, 30px)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px", maxWidth: "420px" }}><div style={{ fontFamily: "var(--font-gochi), cursive", fontSize: "22px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3D2825" }}>{v.introLabel}</div><div style={{ fontFamily: "var(--font-bagel), sans-serif", fontSize: "clamp(28px, 8vw, 40px)", lineHeight: "1.1", color: "#3D2825" }}>{v.introTitle}</div><div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "clamp(13px, 3.6vw, 15px)", lineHeight: "1.5", color: "#3D2825", textAlign: "left", display: "flex", flexDirection: "column", gap: "6px" }}><div><b>{v.introK1}</b> {v.introV1}</div><div><b>{v.introK2}</b> {v.introV2}</div><div><b>{v.introK3}</b> {v.introV3}</div><div><b>{v.introK4}</b> {v.introV4}</div></div><button type="button" onClick={v.start} style={{ minHeight: "48px", padding: "0 24px", border: "0", borderRadius: "999px", background: "#F0AE86", color: "#3D2825", cursor: "pointer", fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "700", fontSize: "15px", marginTop: "6px" }}>{v.introBtn}</button></div></div>)}
            {v.showResult && (<div className="p-4 max-sm:px-2 max-sm:pb-16" style={{ position: "absolute", top: "0", left: "0", right: "0", bottom: "0", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}><div style={{ background: "rgba(255,255,240,0.92)", border: "3px solid #3D2825", borderRadius: "28px", padding: "clamp(14px, 4vw, 22px) clamp(16px, 5vw, 30px)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px", maxWidth: "420px" }}><div style={{ fontFamily: "var(--font-gochi), cursive", fontSize: "22px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3D2825" }}>{t("game.yourScore")}</div><div style={{ display: "flex", alignItems: "baseline", gap: "6px", color: "#3D2825" }}><span style={{ fontFamily: "var(--font-bagel), sans-serif", fontSize: "clamp(56px, 16vw, 84px)", lineHeight: "1" }}>{v.score}</span><span style={{ fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "700", fontSize: "22px" }}>/ 100</span></div><div style={{ fontFamily: "var(--font-roboto-mono), monospace", fontSize: "16px", lineHeight: "1.5", color: "#3D2825" }}>{v.resultMsg}</div><div style={{ display: "flex", flexDirection: v.resultDir, flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "6px" }}><div style={{ display: "flex", justifyContent: "center", gap: "8px" }}><button type="button" onClick={v.retry} style={{ minHeight: "48px", padding: "0 24px", border: "0", borderRadius: "999px", background: "#3D2825", color: "#FFFFF0", cursor: "pointer", fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "700", fontSize: "15px" }}>{t("game.retry")}</button><button type="button" onClick={v.nextLevel} style={{ minHeight: "48px", padding: "0 24px", border: "0", borderRadius: "999px", background: "#B9A5D6", color: "#3D2825", cursor: "pointer", fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "700", fontSize: "15px", display: v.nextDisp }}>{v.nextLabel}</button></div><a href="/#carta" style={{ display: "inline-flex", alignItems: "center", minHeight: "48px", padding: "0 24px", boxSizing: "border-box", borderRadius: "999px", background: "#F0AE86", color: "#3D2825", textDecoration: "none", fontFamily: "var(--font-roboto-mono), monospace", fontWeight: "700", fontSize: "15px" }}>{t("game.viewMenu")}</a></div></div></div>)}
            <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", gap: "8px" }}><button type="button" onClick={v.toggleSfx} aria-pressed={v.sfxPressed} aria-label={v.sfxLabel} style={{ width: "44px", height: "44px", padding: "0", border: "3px solid #3D2825", borderRadius: "50%", background: "#FFFFF0", color: "#3D2825", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g style={{ display: v.sfxOnDisp }}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></g><g style={{ display: v.sfxOffDisp }}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9l5 6M21 9l-5 6" /></g></svg></button><button type="button" onClick={v.toggleMusic} aria-pressed={v.musicPressed} aria-label={v.musicLabel} style={{ width: "44px", height: "44px", padding: "0", border: "3px solid #3D2825", borderRadius: "50%", background: "#FFFFF0", color: "#3D2825", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><g style={{ display: v.musicOnDisp }}><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></g><g style={{ display: v.musicOffDisp }}><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /><path d="M3 3l18 18" /></g></svg></button></div>
          </div>
          <div style={{ fontSize: "16px", lineHeight: "1.5", minHeight: "48px" }}>{v.hintText}</div>
          <div aria-live="polite" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{v.liveText}</div>
        </div>
      </div>
    );
  }
}
