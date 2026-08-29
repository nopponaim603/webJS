import { CFG } from '../config/index.js';
import { track } from '../core/loading.js';
import { volume } from './volume.js';

const raw = {};
const buffers = {};
const decoding = {};
const lastAt = {};
// One limiter a sample: the player's arc and the drone's are different sounds
// and must not gag each other.
const lastZap = {};
const cascades = {};

const levelOf = (name) => {
  const def = (CFG.sfx || {})[name];
  return def && def.gain !== undefined ? def.gain : 0.5;
};

for (const [name, def] of Object.entries(CFG.sfx || {})) {
  const url = def.url;
  raw[name] = track(url, fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .catch((e) => { console.warn(`sfx "${name}" failed to load from ${url} — using the synth fallback`, e); return null; }));
}

// The ceiling is a backstop, not the mixer: what actually keeps the pool sane
// is `maxVoices` a sample, so a burst of coins can only ever crowd out coins.
const MAX_VOICES = 48;

const LOOP_MARGIN = 0.03;

// A voice taken away mid-wave is a click, so it is ramped out over a frame or
// two rather than cut.
const STEAL_FADE = 0.03;

const stopVoice = (voice, now) => {
  try {
    voice.g.gain.cancelScheduledValues(now);
    voice.g.gain.setValueAtTime(voice.g.gain.value, now);
    voice.g.gain.linearRampToValueAtTime(0, now + STEAL_FADE);
    voice.src.stop(now + STEAL_FADE);
  } catch { return false; }
  return true;
};

// A one-shot long enough to be held out of the voice list still has to be
// stoppable, so it is wrapped in the same shape a sustained voice wears.
const longVoice = (bus, src, g) => {
  let live = true;
  return {
    src,
    get alive() { return live; },
    set() {},
    stop(fade = 0.12) {
      if (!live) return;
      live = false;
      const now = bus.ctx.currentTime;
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + fade);
        src.stop(now + fade);
      } catch { /* already ended */ }
    },
  };
};

// `reach` is the camera's zoom: distances are measured in screens, not metres,
// so pulling the view out does not push what you can see out of earshot.
export const listener = { x: 0, z: 0, reach: 1 };

export const audio = {
  ctx: null,
  bus: null,
  // The player's own level, sitting past the compressor so turning the effects
  // down never changes how they duck each other.
  master: null,
  // Music sits beside the effects rather than behind them: the compressor is
  // there so gunfire cannot clip, and putting a full-scale track through it
  // would duck the music on every shot.
  musicBus: null,
  voices: [],
  // Held voices are not in `voices` — the whole point of them is that a burst
  // of gunfire cannot evict one — so they are kept here as well, or nothing
  // could stop them when the fight they belong to stops.
  held: [],
  resume() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = volume.sfx;
      this.master.connect(this.ctx.destination);
    }
    if (!this.bus) {
      this.bus = this.ctx.createGain();
      const comp = this.ctx.createDynamicsCompressor();
      this.bus.connect(comp).connect(this.master);
    }
    if (!this.musicBus) {
      this.musicBus = this.ctx.createGain();
      this.musicBus.connect(this.ctx.destination);
    }
    for (const name of Object.keys(raw)) this.decode(name);
  },
  // One context for the whole game: a second one would need its own gesture to
  // start, would not share this clock, and browsers only allow a handful.
  musicRig() {
    this.resume();
    return this.ctx && this.musicBus ? { ac: this.ctx, gain: this.musicBus } : null;
  },
  async decode(name) {
    if (decoding[name] || buffers[name] || !this.ctx) return;
    decoding[name] = true;
    const ab = await raw[name];
    if (!ab) return;
    try {
      buffers[name] = await this.ctx.decodeAudioData(ab.slice(0));
    } catch (e) {
      console.warn(`sfx "${name}" failed to decode — using the synth fallback`, e);
    }
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  // Many of one sample asked for at once — a pile of coins taken in a single
  // frame — laid out on the audio clock so they arrive as a run rather than a
  // chord. Returns the delay to play at, or null when the run has already been
  // scheduled `lead` ahead and the caller should stay quiet.
  cascade(key, gap, lead) {
    const now = this.now();
    const at = Math.max((cascades[key] || 0) + gap, now);
    if (at - now >= lead) return null;
    cascades[key] = at;
    return at - now;
  },
  // Oldest first, but never a voice that has not opened its mouth yet: a chime
  // scheduled a fifth of a second out would be stopped before it ever sounded.
  steal(now, pred = () => true) {
    let i = this.voices.findIndex((v) => pred(v) && v.at <= now);
    if (i < 0) i = this.voices.findIndex(pred);
    if (i < 0) return false;
    stopVoice(this.voices[i], now);
    this.voices.splice(i, 1);
    return true;
  },
  play(name, { gain = levelOf(name), gainScale = 1, rate = 1, pan = 0, force = false, delay = 0 } = {}) {
    const buf = buffers[name];
    if (!buf || !this.ctx || this.ctx.state !== 'running') return false;

    const def = CFG.sfx[name] || {};
    const gap = def.minGap;

    const key = def.gapKey || name;
    const now = this.ctx.currentTime;
    if (gap && !force) {
      if (now - (lastAt[key] || -1e9) < gap) return true;
    }
    lastAt[key] = now;

    // `hold` keeps a long one-shot out of the voice list, like sustain(): the
    // list is evicted oldest-first, so anything still playing seconds later is
    // always the next to be cut, and the pad assembly alone spends fifty voices.
    const hold = def.hold;
    if (!hold) {
      // Counted over what is sounding, not what is booked: a cascade holds a
      // second of chimes scheduled ahead, and a cap that counted those would
      // have every new pickup cut the one about to ring.
      const cap = def.maxVoices;
      if (cap) {
        const sounding = (v) => v.key === key && v.at <= now;
        let n = 0;
        for (const v of this.voices) if (sounding(v)) n += 1;
        while (n >= cap && this.steal(now, sounding)) n -= 1;
      }
      while (this.voices.length >= MAX_VOICES && this.steal(now));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain * gainScale;
    let tail = g;
    if (pan && this.ctx.createStereoPanner) {
      const sp = this.ctx.createStereoPanner();
      sp.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(sp);
      tail = sp;
    }
    src.connect(g);
    tail.connect(this.bus);
    src.onended = () => {
      const i = this.voices.findIndex((v) => v.src === src);
      if (i >= 0) this.voices.splice(i, 1);
      const h = this.held.findIndex((v) => v.src === src);
      if (h >= 0) this.held.splice(h, 1);
    };

    const at = delay > 0 ? now + delay : now;
    src.start(at);
    if (hold) this.held.push(longVoice(this, src, g));
    else this.voices.push({ src, g, key, at });
    return true;
  },
  playAt(name, x, z, opts = {}) {
    const F = CFG.sfxFalloff;
    const d = Math.hypot(x - listener.x, z - listener.z) / listener.reach;
    const t = Math.min(1, Math.max(0, (d - F.ref) / (F.max - F.ref)));
    const att = (1 - t) * (1 - t);

    if (att < 0.02) return true;
    const pan = Math.max(-1, Math.min(1, (x - listener.x) / (F.panWidth * listener.reach)))
      * F.pan;
    return this.play(name, { ...opts, gainScale: (opts.gainScale ?? 1) * att, pan });
  },
  // A voice the caller holds and rides for as long as the thing making it lasts.
  // Kept out of the voice list on purpose: a burst of gunfire must not be able
  // to evict a sound that something is still doing. A `seamless` file was cut to
  // run round on itself, so the whole of it is the loop, held off the very ends
  // to keep the decoder's own padding out of the join; everything else starts
  // partway in, past the sample's own fade-in.
  sustain(name, { gain = levelOf(name), rate = 1 } = {}) {
    const buf = buffers[name];
    if (!buf || !this.ctx || this.ctx.state !== 'running') return null;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const seam = (CFG.sfx[name] || {}).seamless;
    src.loopStart = seam ? LOOP_MARGIN : buf.duration * 0.4;
    src.loopEnd = buf.duration - (seam ? LOOP_MARGIN : 0);
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(this.bus);
    src.start();
    let live = true;
    const voice = {
      get alive() { return live; },
      set(level, speed, ease = 0.05) {
        if (!live) return;
        g.gain.setTargetAtTime(level * gain, ctx.currentTime, ease);
        src.playbackRate.setTargetAtTime(speed, ctx.currentTime, ease);
      },
      // Ramped rather than cut even when the caller asks for nothing: a loud
      // voice dropped mid-wave is a click, and a hundredth of a second is not a
      // fade anybody hears. `delay` holds the level where it is first, so a
      // voice can be let go on a sweep and taken away while still at full.
      // All of it is scheduled on the audio clock, so a caller that stops
      // running its own timers cannot leave the voice playing.
      stop(fade = 0.2, delay = 0) {
        if (!live) return;
        live = false;
        const at = audio.held.indexOf(voice);
        if (at >= 0) audio.held.splice(at, 1);
        const now = ctx.currentTime;
        const held = g.gain.value;
        const from = now + delay;
        const end = from + Math.max(0.01, fade);
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(held, now);
        g.gain.setValueAtTime(held, from);
        g.gain.linearRampToValueAtTime(0, end);
        src.stop(end);
      },
    };
    this.held.push(voice);
    return voice;
  },
  // Everything the fight was making, stopped. Called when the game leaves the
  // frame it was running in: a held loop and a two-second one-shot both outlive
  // the moment they belong to, and a paused game that is still roaring is the
  // pause not working. The bus itself stays open, so the menu you paused into
  // can still click.
  hush() {
    if (!this.ctx) return;
    for (const voice of this.held.slice()) voice.stop(0.08);
    this.held.length = 0;
    const now = this.ctx.currentTime;
    for (const voice of this.voices.splice(0)) stopVoice(voice, now);
  },
  blip({ freq = 440, type = 'square', dur = 0.08, gain = 0.08, slide = 0 }) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },
  // One oscillator kept alive and ramped, because a charge is a sound that
  // holds and climbs rather than a series of hits.
  whine(freq, gain) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (!this._whine) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      g.gain.value = 0;
      osc.connect(g).connect(this.master);
      osc.start();
      this._whine = { osc, g };
    }
    const t = this.ctx.currentTime;
    this._whine.osc.frequency.setTargetAtTime(Math.max(30, freq), t, 0.04);
    this._whine.g.gain.setTargetAtTime(gain, t, 0.04);
  },
  whineOff() {
    if (!this._whine || !this.ctx) return;
    this._whine.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  },
  noise({ dur = 0.18, gain = 0.12, freq = 900 }) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  },
  shoot(name = 'shoot') {
    if (this.play(name, { rate: 0.94 + Math.random() * 0.12 })) return;
    if (name === 'shotgun') this.noise({ dur: 0.26, gain: 0.12, freq: 420 });
    else this.blip({ freq: 620, type: 'square', dur: 0.07, gain: 0.05, slide: -420 });
  },
  hit() {
    if (this.play('hit', { rate: 0.9 + Math.random() * 0.2 })) return;
    this.blip({ freq: 260, type: 'sawtooth', dur: 0.05, gain: 0.04, slide: -120 });
  },
  kill() {
    if (this.play('kill', { rate: 0.92 + Math.random() * 0.16 })) return;
    this.noise({ dur: 0.22, gain: 0.1, freq: 500 });
  },
  bugAttack() {
    this.play('bugAttack', { rate: 0.88 + Math.random() * 0.24 });
  },
  // What the bite took as a share of full health, not the number it took: a
  // player who has bought health up is not owed the heavy cry for a scratch.
  hurt(share = 0) {
    if (share > CFG.player.heavyHurtShare) {
      if (this.play('hurtHeavy', { rate: 0.96 + Math.random() * 0.08 })) return;
    } else {
      const n = 1 + ((Math.random() * 4) | 0);
      if (this.play(`hurt${n}`, { rate: 0.92 + Math.random() * 0.16 })) return;
    }
    this.blip({ freq: 150, type: 'sawtooth', dur: 0.22, gain: 0.11, slide: -90 });
  },
  dash() {
    if (this.play('dash', { rate: 0.95 + Math.random() * 0.1 })) return;
    this.blip({ freq: 300, type: 'triangle', dur: 0.16, gain: 0.06, slide: 500 });
  },
  wave() {
    if (this.play('wave')) return;
    this.blip({ freq: 400, type: 'triangle', dur: 0.4, gain: 0.08, slide: 400 });
  },
  dry() {
    if (this.play('dry', { rate: 0.94 + Math.random() * 0.12 })) return;
    this.blip({ freq: 150, type: 'square', dur: 0.05, gain: 0.05 });
  },
  launch() {
    if (this.play('launch', { rate: 0.95 + Math.random() * 0.1 })) return;
    this.blip({ freq: 180, type: 'triangle', dur: 0.14, gain: 0.09, slide: -90 });
  },
  explode() {
    if (this.play('explode', { rate: 0.92 + Math.random() * 0.16 })) return;
    this.noise({ dur: 0.4, gain: 0.16, freq: 260 });
  },
  zap(name = 'zap') {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (now - (lastZap[name] ?? -1) < 0.035) return;
    lastZap[name] = now;
    if (this.play(name, { rate: 0.9 + Math.random() * 0.35 })) return;
    this.blip({ freq: 1400 + Math.random() * 700, type: 'square',
                dur: 0.05, gain: 0.045, slide: -900 });
  },
};

volume.watch((v) => { if (audio.master) audio.master.gain.value = v.sfx; });
