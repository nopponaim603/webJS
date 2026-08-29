import { CFG, TRACKS, MENU_TRACK, WAVE_TRACKS, OFF_SHUFFLE } from '../config/index.js';
import * as store from '../core/store.js';
import { audio } from './audio.js';
import { volume } from './volume.js';

const MUTE_KEY = 'survive10.music.muted';
const loadMuted = () => !!store.load(MUTE_KEY);

const BOX = 'survive10.music.v1';

// The HTTP cache lets a track go stale after ten minutes and then wants to
// revalidate it, which is a request that cannot be made with the network gone.
// Cache Storage keeps no such clock, so a warmed track is held there and played
// from a blob. Falling back to the plain URL is what happens when there is no
// Cache Storage to open, and is also what plays before the warm has reached a
// track — so the first play is never made to wait on a promise and lose the
// gesture it is riding.
async function keep(url) {
  const href = encodeURI(url);
  try {
    const box = await caches.open(BOX);
    if (!(await box.match(href))) await box.add(href);
    const res = await box.match(href);
    if (res) return URL.createObjectURL(await res.blob());
  } catch { /* no store to keep it in, so the HTTP cache is all there is */ }
  await fetch(href).then((res) => res.arrayBuffer());
  return null;
}

export const music = {
  ceded: false,
  el: document.getElementById('bgm'),
  target: 0,
  muted: loadMuted(),
  started: false,
  queue: [],
  current: null,
  fails: 0,
  warmed: false,
  // What has to be playing, when it is not the shuffle's turn to decide, and the
  // hand-over waiting on the current track to fade out.
  pinned: null,
  swap: null,
  handed: null,
  ready: new Set(),
  held: new Map(),
  pending: new Map(),
  shuffle() {
    const q = TRACKS.filter((t) => !OFF_SHUFFLE.includes(t));
    for (let i = q.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [q[i], q[j]] = [q[j], q[i]];
    }
    if (q.length > 1 && q[0] === this.current) [q[0], q[q.length - 1]] = [q[q.length - 1], q[0]];
    this.queue = q;
  },
  // A loop is the room it plays in rather than a track anyone picked, so it is
  // the one thing that goes on without being announced.
  play(url, loop = false) {
    // The element's own default is full volume, so the first track of a session
    // would come in at the top of the fade rather than the bottom of it.
    if (!this.started) this.el.volume = 0;
    this.current = url;
    this.el.loop = loop;
    this.el.src = this.held.get(url) || encodeURI(url);
    this.el.play()
      .then(() => { this.started = true; this.fails = 0; if (!loop) this.announce(); this.warm(); })
      .catch(() => { this.started = false; });
  },
  next() {
    if (!this.queue.length) this.shuffle();
    this.play(this.queue.shift());
  },
  // The deck is handed over rather than cut: whatever is up fades out first, and
  // the volume the mode asked for is what it comes back to. A null url is the
  // shuffle taking its turn again.
  handOver(url) {
    if (!this.started || this.el.volume < 0.02) { this.take(url); return; }
    this.swap = { url };
  },
  take(url) {
    if (url) this.play(url, !!(this.pinned && this.pinned.loop));
    else this.next();
  },
  pin(url, loop = false) {
    this.pinned = { url, loop };
    this.handOver(url);
  },
  unpin() {
    if (!this.pinned) return;
    this.pinned = null;
    this.handOver(null);
  },
  // Called as each wave really begins: the wave either owns a track or hands the
  // deck back to the shuffle.
  forWave(n) {
    if (this.ceded) return;
    if (WAVE_TRACKS[n]) this.pin(WAVE_TRACKS[n]);
    else this.unpin();
  },
  menu() {
    this.pin(MENU_TRACK, true);
    this.target = CFG.music.menu;
    this.resume();
  },
  // The whole file has to come down for the track to be playable with the
  // network gone. A track that will not come down is dealt with when it tries
  // to play.
  fetchWhole(url) {
    if (this.ready.has(url)) return Promise.resolve();
    if (this.pending.has(url)) return this.pending.get(url);
    const done = keep(url)
      .then((src) => { if (src) this.held.set(url, src); this.ready.add(url); })
      .catch(() => {})
      .finally(() => this.pending.delete(url));
    this.pending.set(url, done);
    return done;
  },
  // Fixes the running order at boot so the track fetched first is the one that
  // will play first. Nothing waits on it: a track that has not landed plays
  // from its URL instead.
  preload() {
    if (!CFG.music.preload) return null;
    this.shuffle();
    return this.pinned ? this.pinned.url : this.queue[0];
  },
  // Every remaining track, in the order it will play, one at a time. The tracks
  // off the shuffle come last: nothing waits on them, but a wave that owns its
  // music should not have to stop and fetch it.
  async warm() {
    if (this.warmed || !CFG.music.preload) return;
    this.warmed = true;
    const rest = [...this.queue, MENU_TRACK, ...Object.values(WAVE_TRACKS)];
    for (const url of rest.filter((t) => !this.ready.has(t))) await this.fetchWhole(url);
  },
  titleOf(url) {
    return url.replace(/^music\//, '').replace(/\.[^.]+$/, '').replace('_ ', ': ');
  },
  get playing() {
    if (this.muted) return '';
    const url = this.ceded ? this.handed : (this.started ? this.current : null);
    return url ? this.titleOf(url) : '';
  },
  showNow() {
    const el = document.getElementById('pause-track');
    if (el) el.textContent = this.playing ? `♪ ${this.playing}` : '';
  },
  announce() {
    this.showNow();
    const el = document.getElementById('nowplaying');
    el.textContent = '♪ ' + this.titleOf(this.current);
    el.classList.add('show');
    clearTimeout(this._toast);
    this._toast = setTimeout(() => el.classList.remove('show'), 4000);
  },
  start() {
    if (this.started) return;
    this.take(this.pinned ? this.pinned.url : null);
  },
  resume() {
    if (this.ceded) return;
    if (this.started && this.el.paused) this.el.play().catch(() => {});
  },
  // A wave that brings its own track takes the deck outright. The element is
  // stopped rather than faded to nothing: left running it would reach its end,
  // and the `ended` handler would start a shuffle track underneath.
  takeOver(url) {
    this.handed = url || null;
    if (this.ceded) return;
    this.unpin();
    this.pause();
    this.swap = null;
    this.target = 0;
    this.ceded = true;
  },
  release() { this.ceded = false; this.handed = null; },
  pause() { if (!this.el.paused) this.el.pause(); },
  toggleMute() {
    this.muted = !this.muted;
    store.save(MUTE_KEY, this.muted);
    this.showMute();
  },
  showMute() {
    const ind = document.getElementById('mute-ind');
    if (ind) {
      ind.style.opacity = this.muted ? '1' : '';
      ind.textContent = this.muted ? 'M music muted' : 'M mute music';
    }
    const btn = document.getElementById('btn-music');
    if (btn) {
      btn.textContent = this.muted ? 'MUSIC OFF' : 'MUSIC ON';
      btn.classList.toggle('off', this.muted);
    }
    this.showNow();
  },
  update(dt) {
    const want = (this.muted || this.swap) ? 0 : this.target * volume.music;
    const v = this.el.volume + (want - this.el.volume) * (1 - Math.exp(-CFG.music.fadeRate * dt));
    this.el.volume = Math.min(1, Math.max(0, v));

    // A track playing through Web Audio rides the same mute and the same slider
    // as the element does, and comes up and down on the same ramp — a fifth
    // louder, being scored to the wave rather than played behind it.
    const bus = audio.musicBus;
    if (bus) {
      const level = this.muted ? 0 : CFG.music.play * CFG.music.specialLift * volume.music;
      const at = bus.gain.value + (level - bus.gain.value) * (1 - Math.exp(-CFG.music.fadeRate * dt));
      bus.gain.value = Math.min(1, Math.max(0, at));
    }

    if (!this.swap || this.el.volume >= 0.02) return;
    const { url } = this.swap;
    this.swap = null;
    this.take(url);
  },
};

music.showMute();
// A track that owned the deck only owns it once: when it runs out the shuffle
// picks up, rather than the wave's own music coming round again.
music.el.addEventListener('ended', () => { music.pinned = null; music.next(); });

// Autoplay is refused until the page has been touched, so the menu loop takes
// the first gesture the page is given, wherever it lands.
const wake = () => { if (!music.started && music.pinned) music.start(); };
addEventListener('pointerdown', wake, true);
addEventListener('keydown', wake, true);
music.el.addEventListener('error', () => {
  if (!music.current) return;
  console.warn('music: failed to play', music.current);
  if (++music.fails >= TRACKS.length) { console.warn('music: all tracks failed'); return; }
  music.next();
});
