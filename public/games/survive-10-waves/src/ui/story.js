import { CFG, STORY } from '../config/index.js';
import { state } from '../core/world.js';
import { clock } from '../core/time.js';
import * as sector from '../game/sector.js';
import { audio } from '../engine/audio.js';
import { music } from '../engine/music.js';
import * as credits from './credits.js';

// Sample first; the oscillator behind it is only reached if the file never
// loaded. `sound` is the CFG.story.synth entry to fall back to. The button's own
// hover and press are not here — ui/buttons.js speaks for every button.
const cue = (name, sound, opts) => audio.play(name, opts) || audio.blip(sound);

const el = { root: null, body: null, button: null };

let beat = null;
let rows = [];
let at = 0;
let cut = 0;
let wait = 0;
let tick = 0;
let done = null;

const deadCount = () => Object.values(state.deaths).reduce((n, d) => n + d, 0);

// Counted off what is already flying, so the one being handed over is the next
// after them. Spelled out while there is a word for it and numbered past that,
// which only a sixth sector would ever reach.
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];
const ordinal = (n) => ORDINALS[n] || `${n + 1}th`;

const VALUES = {
  dead: deadCount,
  nth: () => ordinal(state.drones),
  time: () => clock(state.played),
  sector: () => sector.current(),
  ground: () => sector.nameOf(),
  next: () => sector.next() || '',
  nextGround: () => sector.nameOf(sector.next()),
};

// A sector says its own version of a beat where it has one, and the shared one
// everywhere else.
const beatOf = (key) => STORY[`${sector.current()}:${key}`] || STORY[key];

// A line is a run of plain text with the filled-in figures marked out, so the
// numbers can carry their own weight while the rest types past them.
function partsOf(text) {
  return text.split(/(\{\w+\})/).filter(Boolean).map((bit) => {
    const key = bit.startsWith('{') && bit.slice(1, -1);
    return key && VALUES[key]
      ? { t: String(VALUES[key]()), hot: true }
      : { t: bit, hot: false };
  });
}

const typing = () => !!beat && at < rows.length;

// A beat is told once a run unless it asks to repeat: a screen the wave needs
// the player to have read is owed to them on every attempt, not just the first.
export const pending = (key) => {
  const beat = beatOf(key);
  return !!beat && (!!beat.repeat || !state.told[key]);
};

function build() {
  el.root = document.getElementById('story');
  el.body = document.getElementById('story-body');
  el.button = document.getElementById('btn-story');
  el.alt = document.getElementById('btn-story-alt');

  el.button.onclick = () => press(primary);
  el.alt.onclick = () => press(secondary);
  // Anywhere else fills the rest in, the way a reader already ahead of the
  // typing expects. The buttons are the only things that move the game on.
  el.root.addEventListener('pointerdown', (e) => {
    if (e.target !== el.button && e.target !== el.alt) finish();
  });
}

function addRow(label, text) {
  const row = document.createElement('div');
  row.className = 'story-line';
  const b = document.createElement('b');
  row.appendChild(b);

  const parts = partsOf(text);
  for (const p of parts) {
    p.node = document.createElement('span');
    if (p.hot) p.node.className = 'hot';
    row.appendChild(p.node);
  }
  el.body.appendChild(row);

  const length = parts.reduce((n, p) => n + p.t.length, label.length);
  return { row, b, parts, label, length };
}

function paint() {
  const r = rows[at];
  if (!r) return;
  r.b.textContent = r.label.slice(0, Math.min(cut, r.label.length));
  let left = Math.max(0, cut - r.label.length);
  for (const p of r.parts) {
    p.node.textContent = p.t.slice(0, left);
    left = Math.max(0, left - p.t.length);
  }
  r.b.classList.toggle('on', cut >= r.label.length);
  r.row.classList.add('typing');
}

function fillRow(r) {
  r.b.textContent = r.label;
  r.b.classList.add('on');
  for (const p of r.parts) p.node.textContent = p.t;
  r.row.classList.remove('typing');
}

// What a button does, and whether it leaves. A panel read off the screen keeps
// it, so there is still something to go on from once the panel is shut.
const ACTS = {
  credits: { run: credits.show, keep: true },
};

let primary = null;
let secondary = null;

// A beat with a `quiet` reading is one the music matters to, and the music is
// off: it asks rather than tells, and the first button is the one that fixes it.
// Otherwise the beat says what its own second button is, where it has one.
function buttonsOf(beat) {
  if (beat.quiet && music.muted) {
    return [{ label: beat.quiet.on, run: () => music.toggleMute() },
            { label: beat.quiet.off }];
  }
  return [{ label: beat.button || 'CONTINUE' },
          beat.alt && { label: beat.alt.label, ...ACTS[beat.alt.act] }];
}

function press(button) {
  if (typing()) { finish(); return; }
  if (button.run) button.run();
  if (!button.keep) close();
}

export function show(key, onDone) {
  if (!el.root) build();
  beat = beatOf(key);
  state.told[key] = true;
  done = onDone;

  el.body.innerHTML = '';
  rows = beat.blocks.map((b) => addRow(b.label, b.text));
  at = 0; cut = 0; wait = 0; tick = 0;

  [primary, secondary] = buttonsOf(beat);
  el.button.textContent = primary.label;
  el.alt.textContent = secondary ? secondary.label : '';
  el.alt.classList.toggle('hidden', !secondary);
  el.root.classList.remove('hidden', 'read');
  paint();
}

export function update(dt) {
  if (!typing()) return;
  const S = CFG.story;
  if (wait > 0) { wait -= dt; return; }

  const r = rows[at];
  const was = Math.floor(cut);
  cut = Math.min(r.length, cut + S.rate * dt);
  paint();

  tick += Math.floor(cut) - was;
  if (tick >= S.perKey) {
    tick = 0;
    const T = S.synth.tick;
    cue('storyType', { freq: T.freq + Math.random() * T.spread, type: 'square',
                       dur: T.dur, gain: T.gain },
        { rate: 1 + (Math.random() * 2 - 1) * S.keyDetune });
  }

  if (cut < r.length) return;
  fillRow(r);
  at += 1;
  cut = 0;
  wait = S.lineGap;
  cue('storyLine', S.synth.line);
  if (!typing()) settle();
}

function settle() {
  for (const r of rows) fillRow(r);
  el.root.classList.add('read');
}

export function finish() {
  if (!typing()) return;
  at = rows.length;
  settle();
}

function close() {
  // Taken before the handover: what `done` runs may put another beat on screen.
  const go = done;
  done = null;
  hide();
  if (go) go();
}

export function hide() {
  if (el.root) el.root.classList.add('hidden');
  beat = null;
  rows = [];
}
