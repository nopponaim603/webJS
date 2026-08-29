import { CFG } from '../config/index.js';
import { audio } from '../engine/audio.js';
import { music } from '../engine/music.js';
import { onOptions, onEscape } from '../engine/input.js';
import * as store from '../core/store.js';

const KEY = 'survive10.mix';
let panel = null, open = false;

const defaults = {
  sfx: Object.fromEntries(Object.entries(CFG.sfx || {}).map(([k, v]) => [k, v.gain])),
  music: CFG.music.play,
};

function save() {
  store.save(KEY, {
    sfx: Object.fromEntries(Object.entries(CFG.sfx).map(([k, v]) => [k, v.gain])),
    music: CFG.music.play,
  });
}

function load() {
  const data = store.load(KEY);
  if (!data) return;
  for (const [k, v] of Object.entries(data.sfx || {})) {
    if (CFG.sfx[k] && typeof v === 'number') CFG.sfx[k].gain = v;
  }
  if (typeof data.music === 'number') CFG.music.play = data.music;
}

function exportText() {
  const w = Math.max(...Object.keys(CFG.sfx).map((k) => k.length));
  const lines = Object.entries(CFG.sfx).map(([k, v]) => {
    const peak = (v.url.endsWith('.wav') ? 0.974 : 0.84) * v.gain;
    const rel = peak / (0.62 * CFG.music.play || 1);
    return `    ${(k + ':').padEnd(w + 1)} { url: '${v.url}', gain: ${v.gain.toFixed(2)} },`
         + `  // ${rel.toFixed(2)}x music`;
  });
  return `sfx: {\n${lines.join('\n')}\n  },\n\n`
       + `music: { play: ${CFG.music.play.toFixed(2)}, `
       + `fadeRate: ${CFG.music.fadeRate} },`;
}

function row(label, value, min, max, onInput, onAudition) {
  const r = document.createElement('div');
  r.className = 'mix-row';
  r.innerHTML = `<span class="mix-name">${label}</span>`
    + `<input type="range" min="${min}" max="${max}" step="0.01" value="${value}">`
    + `<span class="mix-val">${value.toFixed(2)}</span>`
    + (onAudition ? '<button class="mix-play" title="preview">▶</button>' : '<span class="mix-pad"></span>');
  const [input, val] = [r.querySelector('input'), r.querySelector('.mix-val')];
  input.oninput = () => {
    const v = parseFloat(input.value);
    val.textContent = v.toFixed(2);
    onInput(v);
    save();
    refreshExport();
  };
  if (onAudition) r.querySelector('.mix-play').onclick = onAudition;
  return { el: r, set: (v) => { input.value = v; val.textContent = v.toFixed(2); } };
}

let out = null;
const rows = [];

function refreshExport() { if (out) out.textContent = exportText(); }

function build() {
  panel = document.createElement('div');
  panel.id = 'mixer';
  panel.innerHTML = '<h3>SOUND MIXER</h3>'
    + '<div class="mix-hint">Adjust while playing — changes apply to the next sound. '
    + 'Saved in this browser. Press O or Esc to close.</div>';

  const body = document.createElement('div');
  panel.appendChild(body);

  const mus = row('music', CFG.music.play, 0, 1, (v) => {
    CFG.music.play = v;
    music.target = v;
  }, null);
  body.appendChild(mus.el);
  rows.push({ set: () => mus.set(CFG.music.play) });

  const sep = document.createElement('div');
  sep.className = 'mix-sep';
  body.appendChild(sep);

  for (const [name, def] of Object.entries(CFG.sfx)) {
    const r = row(name, def.gain, 0, 1,
      (v) => { CFG.sfx[name].gain = v; },
      () => audio.play(name, { force: true }));
    body.appendChild(r.el);
    rows.push({ set: () => r.set(CFG.sfx[name].gain) });
  }

  const bar = document.createElement('div');
  bar.className = 'mix-bar';
  const copy = document.createElement('button');
  copy.textContent = 'copy config';
  copy.onclick = async () => {
    try { await navigator.clipboard.writeText(exportText()); copy.textContent = 'copied'; }
    catch { copy.textContent = 'select the text below'; }
    setTimeout(() => { copy.textContent = 'copy config'; }, 1400);
  };
  const reset = document.createElement('button');
  reset.textContent = 'restore defaults';
  reset.onclick = () => {
    for (const [k, v] of Object.entries(defaults.sfx)) CFG.sfx[k].gain = v;
    CFG.music.play = defaults.music;
    music.target = CFG.music.play;
    store.forget(KEY);
    for (const r of rows) r.set();
    refreshExport();
  };
  bar.append(copy, reset);
  panel.appendChild(bar);

  out = document.createElement('pre');
  out.id = 'mix-out';
  panel.appendChild(out);
  refreshExport();

  document.getElementById('ui').appendChild(panel);
}

function toggle(force) {
  if (!panel) build();
  open = force !== undefined ? force : !open;
  panel.classList.toggle('shown', open);

  document.body.classList.toggle('mixer-open',
    !!document.querySelector('#mixer.shown, #debugmenu.shown'));
  if (open) for (const r of rows) r.set();
}

export function init() {
  load();
  onOptions(() => toggle());
  onEscape(() => (open ? (toggle(false), true) : false));
}
