import { parseSections } from './sections.js';
import { initChain } from './chain.js';

export const GRID = { bpm: 80, start: 14.925, per: 4 };
export const DURATION = 359.56;
const CROSSFADE = 0.4;
const WATCH = 20;

// A copy of prompts/loops.txt, which is where the arrangement is authored and
// auditioned in markers.html. Keep the two in step.
export const SCRIPT = `--intro--
[1-4:blend]
--warmup--
8:exit:head-blend:500
12:exit
16:exit:head-blend:500
[13-24:blend]
--precombat1--
[25-28:tail-blend:500]
--combat1--
20:exit
[35-58:blend]
--rest--
38:exit:tail-blend:500
42:exit
46:exit
54:exit:head-blend:600
50:exit:head-blend:800
59:entry
[75-86:blend]
--combat2--
82:exit
[98.3-110.2:head-blend:800]
--end--
74:exit
78:exit
102.2:exit:head-blend:800
106.2:exit:head-blend:800`;

export class SpecialWave {
  constructor(opts = {}) {
    const at = opts.grid || {};
    this.url = opts.track || null;
    this.script = opts.script || SCRIPT;
    this.bpm = at.bpm || GRID.bpm;
    this.start = at.start === undefined ? GRID.start : at.start;
    this.per = at.per || GRID.per;
    this.crossfade = opts.crossfade === undefined ? CROSSFADE : opts.crossfade;
    this.onPartStart = opts.onPartStart || (() => {});
    this.onPartEnd = opts.onPartEnd || (() => {});
    this.onFinish = opts.onFinish || (() => {});
    this.onBeat = opts.onBeat || (() => {});
    this.onBar = opts.onBar || (() => {});
    this.watch = opts.watch || WATCH;
    this.level = opts.volume === undefined ? 1 : opts.volume;
    this.gear = opts.rig || null;
    this.buffer = opts.buffer || null;
    this.since = 0;
    this.spent = false;
    this.finished = new Set();
    this.plan = null;
    this.ctx = null;
    this.master = null;
    this.here = null;
    this.mark = null;
    this.timer = null;
    this.chain = initChain({
      buffer: () => this.buffer,
      plan: () => this.plan,
      parts: () => this.plan.parts.map(p => ({ ...p, done: this.finished.has(p.name) })),
      crossfade: () => this.crossfade,
      rig: () => this.rig(),
    });
  }

  rig() {
    if (this.gear) return this.gear();
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.level;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return { ac: this.ctx, gain: this.master };
  }

  async load() {
    if (this.buffer) { if (!this.plan) this.read(); return this; }
    if (!this.url) throw new Error('SpecialWave: pass a { track } url or a decoded { buffer }');
    const res = await fetch(this.url);
    if (!res.ok) throw new Error(`${this.url}: HTTP ${res.status}`);
    const bytes = await res.arrayBuffer();
    this.buffer = await this.rig().ac.decodeAudioData(bytes);
    this.read();
    return this;
  }

  read() {
    const bar = (60 / this.bpm) * this.per;
    const cut = parseSections(this.script, {
      bars: Math.ceil((this.buffer.duration - this.start) / bar),
      per: this.per,
      barStart: this.start,
      barLength: bar,
      beatLength: 60 / this.bpm,
    });
    if (cut.bad.length) {
      const first = cut.bad[0];
      throw new Error(`loop script line ${first.n}: ${first.why}`);
    }
    this.plan = cut;
  }

  play(from = 0) {
    if (!this.buffer) throw new Error('call load() first');
    this.here = null;
    this.mark = null;
    this.since = 0;
    this.last = 0;
    this.spent = false;
    if (!this.chain.start(from)) return false;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), this.watch);
    return true;
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.chain.stop();
    if (this.here) { const was = this.here; this.here = null; this.onPartEnd(was); }
  }

  // Seconds the current part has been sounding. The position inside the track
  // wraps every time the part loops; how long it has been up does not.
  sincePart() { return this.since; }

  tick() {
    const now = performance.now();
    this.since += this.last ? (now - this.last) / 1000 : 0;
    this.last = now;
    const at = this.chain.position();
    if (at >= this.buffer.duration - 0.05) { this.spent = true; this.stop(); this.onFinish(); return; }
    const name = this.partAt(at);
    if (name !== this.here) {
      if (this.here) this.onPartEnd(this.here);
      this.here = name;
      this.since = 0;
      if (name) this.onPartStart(name);
    }
    const i = this.indexAt(at);
    if (i === this.mark) return;
    this.mark = i;
    if (i < 0) return;
    const spot = this.spot(i, at);
    this.onBeat(spot);
    if (spot.beat === 1) this.onBar(spot);
  }

  indexAt(t) { return Math.floor((t - this.start) / (60 / this.bpm)); }

  spot(i, t) {
    return { index: i, bar: Math.floor(i / this.per) + 1, beat: (i % this.per) + 1, time: t };
  }

  partAt(t) {
    let cur = null;
    for (const p of this.plan.parts) if (p.t <= t + 1e-6 && (!cur || p.t > cur.t)) cur = p;
    return cur ? cur.name : null;
  }

  markDone(name) {
    if (!this.plan || !this.plan.parts.some(p => p.name === name)) {
      throw new Error(`no part called "${name}"`);
    }
    // Asking twice is asking once: the game marks a part done on every frame it
    // reads clear, and each extra call would re-arm the chain on whatever is
    // playing by then — which may already be the part after it.
    if (this.finished.has(name)) return this;
    this.finished.add(name);
    if (this.chain.playing() && this.partAt(this.chain.position()) === name) this.chain.next();
    return this;
  }

  clearDone(name) { this.finished.delete(name); return this; }

  reset() { this.finished.clear(); return this; }

  advance() { this.chain.next(); return this; }

  isDone(name) { return this.finished.has(name); }

  get parts() { return this.plan ? this.plan.parts.map(p => p.name) : []; }

  get part() { return this.here; }

  get bar() { const i = this.indexAt(this.time); return i < 0 ? 0 : Math.floor(i / this.per) + 1; }

  get beat() { const i = this.indexAt(this.time); return i < 0 ? 0 : (i % this.per) + 1; }

  get bars() {
    return this.buffer
      ? Math.ceil((this.buffer.duration - this.start) / ((60 / this.bpm) * this.per)) : 0;
  }

  get where() {
    const t = this.time;
    const i = this.indexAt(t);
    return i < 0
      ? { time: t, bar: 0, beat: 0, index: i, part: this.here }
      : { ...this.spot(i, t), part: this.here };
  }

  get time() { return this.chain.position(); }

  get playing() { return this.chain.playing(); }

  get volume() { return this.level; }

  set volume(v) {
    this.level = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.level;
  }
}
