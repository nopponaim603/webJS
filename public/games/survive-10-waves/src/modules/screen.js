import { CFG } from '../config/index.js';
import { state } from '../core/world.js';
import * as modules from './index.js';
import * as layout from './layout.js';
import * as radial from './radial.js';
import { tipHTML } from './tip.js';
import * as stats from './stats.js';
import * as payout from './payout.js';
import * as reveal from './reveal.js';
import * as panzoom from './panzoom.js';
import * as wavepick from './wavepick.js';
import * as sectorbar from './sectorbar.js';
import * as travel from './travel.js';
import * as sectoropen from './sectoropen.js';
import * as stale from './stale.js';
import * as spendtip from './spent.js';
import * as gunrack from '../ui/gunrack.js';
import * as gunfly from '../ui/gunfly.js';
import * as loadout from '../weapons/loadout.js';
import * as sector from '../game/sector.js';
import { audio } from '../engine/audio.js';
import { cue } from '../ui/buttons.js';
import { track, slug } from '../core/track.js';
import { touchDevice } from '../mobile/detect.js';
import { KEY, LOCK, svg } from '../ui/icons.js';
import * as fmt from '../ui/format.js';

const STUB = 0.45;
const GRID = { reach: 1200, spokes: 12 };

const el = {
  root: null, coins: null, flight: null,
  tally: null, count: null, repair: null, repairCount: null,
  repairTook: null, repairLost: null, repairDealt: null, repairNet: null,
  stats: null, statsTab: null, view: null, pan: null, grid: null, edges: null, tip: null,
  title: null, saved: null, retry: null, next: null, quit: null,
  select: null, selectFace: null, selectNew: null,
};
let savedOk = false;
let onRetry = () => {};
let onNext = () => {};
let onQuit = () => {};
let onBuy = () => {};
let onPick = () => {};
let onSector = () => {};
let onReset = () => {};

const nodes = new Map();
const MOD = new Map(modules.MODULES.map((u) => [u.id, u]));
let places = new Map();
let drawn = '';
let hovered = null;
let cursor = { x: 0, y: 0 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const started = (id) => modules.level(id) > 0;
const isNext = (node) => node.level === modules.level(node.id) + 1 && visible(node);

function visible(node) {
  if (started(node.id) || node.shown) return true;
  if (node.level !== 1) return false;
  return !node.needs.length || modules.ownsNode(node.needs[0]);
}

function fit() {
  const lo = { x: 0, y: 0 }, hi = { x: 0, y: 0 };
  for (const node of shownNodes()) {
    if (!isNext(node) && !modules.ownsNode(node.key)) continue;
    const p = places.get(node.key);
    lo.x = Math.min(lo.x, p.x); lo.y = Math.min(lo.y, p.y);
    hi.x = Math.max(hi.x, p.x); hi.y = Math.max(hi.y, p.y);
  }
  panzoom.fit(lo, hi);
}

function build() {
  el.root = document.getElementById('modules');
  el.coins = document.getElementById('mod-coins');
  el.flight = document.getElementById('mod-flight');
  el.tally = document.getElementById('mod-tally');
  el.count = document.getElementById('mod-tally-n');
  el.stats = document.getElementById('mod-stats');
  el.statsTab = document.getElementById('mod-stats-tab');
  el.view = document.getElementById('tree-view');
  el.pan = document.getElementById('tree-pan');
  el.grid = document.getElementById('tree-grid');
  el.edges = document.getElementById('tree-edges');
  el.tip = document.getElementById('mod-tip');
  el.title = document.getElementById('mod-title');
  el.saved = document.getElementById('mod-saved');
  el.retry = document.getElementById('btn-retry');
  el.next = document.getElementById('btn-next');
  el.repair = document.getElementById('mod-repair');
  el.repairTook = document.getElementById('mod-repair-took');
  el.repairLost = document.getElementById('mod-repair-lost');
  el.repairDealt = document.getElementById('mod-repair-dealt');
  el.repairCount = document.getElementById('mod-repair-n');
  el.repairNet = document.getElementById('mod-repair-net');
  el.quit = document.getElementById('btn-mod-quit');
  el.select = document.getElementById('btn-select');
  el.selectFace = el.select.querySelector('.sel-face');
  el.selectNew = document.getElementById('btn-select-new');

  el.retry.onclick = () => onRetry();
  el.next.onclick = () => onNext();
  el.quit.onclick = () => onQuit();
  el.select.onclick = () => {
    if (!earned()) return;
    wavepick.show();
    paintNew();
  };
  wavepick.init({ pick: (wave) => onPick(wave), reset: () => onReset() });
  sectorbar.init((id) => onSector(id));
  sectoropen.init({ card: sectorbar.cardOf, note: sectorbar.announce });
  travel.init({ bar: document.getElementById('mod-sectors'),
                veil: document.getElementById('travel-veil'), layer: el.flight,
                select: el.select, badge: el.selectNew });
  // Only ever seen on a narrow screen, where the stats ride over the tree
  // instead of beside it.
  el.statsTab.onclick = () => el.root.classList.toggle('stats-open');

  spendtip.init(el.coins.parentElement);

  payout.init({ purse: el.coins, layer: el.flight, tally: el.tally,
                count: el.count, repair: el.repair, repairCount: el.repairCount,
                repairTook: el.repairTook, repairLost: el.repairLost,
                repairDealt: el.repairDealt, repairNet: el.repairNet });
  reveal.init(el.root, document.getElementById('btn-payout-go'));
  // One or the other: the bench arriving for the first time is never also the
  // wave that opened a sector.
  reveal.onDone(() => { if (!travel.begin()) sectoropen.begin(); });
  el.root.addEventListener('pointerdown', () => reveal.skip(), true);
  addEventListener('keydown', () => { if (state.mode === 'modules') reveal.skip(); });

  el.grid.innerHTML = radial.gridHTML(GRID.reach, GRID.spokes);
  draw();

  panzoom.init(el.view, el.pan, {
    tap: tapAt,
    drag: () => { if (!touchDevice) { hovered = null; paintTip(); } },
    move: (x, y) => { cursor = { x, y }; if (!touchDevice) placeTip(); },
  });

  if (!touchDevice) el.view.onpointerleave = () => { hovered = null; paintTip(); };
}

const shownNodes = () => layout.NODES.filter((n) => places.has(n.key));

// A branch still waiting on its gate is not drawn at all, so the wheel spreads
// what is actually on the board over the whole circle instead of leaving a
// wedge empty. Opening a gate is a new wheel, so the board is drawn again.
const gateMark = () => layout.currentLayout()
  .map((e) => (modules.gateOpen(e.id) ? 1 : 0)).join('');

// The wire into a node, plus the stub that stands in for it while what it hangs
// off is still unbought. The gradient is named after the node it feeds, so the
// whole set can be laid down again without the names moving.
function wires(node) {
  const to = places.get(node.key);
  return node.needs.map((depKey) => {
    const from = places.get(depKey);
    if (!from) return '';
    const link = `data-to="${node.key}" data-from="${depKey}"`;
    const cut = radial.stubPath(from, to, STUB);
    const tip = radial.tipOf(cut);
    const id = `fade-${node.key.replace(':', '-')}`;

    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse"
        x1="${from.x}" y1="${from.y}" x2="${tip.x}" y2="${tip.y}">
        <stop offset="0" stop-color="#7fc4de" stop-opacity=".85" />
        <stop offset="1" stop-color="#7fc4de" stop-opacity="0" /></linearGradient>`
      + `<path class="edge" ${link} d="${radial.edgePath(from, to)}" />`
      + `<path class="stub gone" ${link} stroke="url(#${id})" d="${radial.pathOf(cut)}" />`;
  }).join('');
}

const paintEdges = () => {
  el.edges.innerHTML = shownNodes().map(wires).join('');
};

function addNode(node) {
  const u = MOD.get(node.id);
  const p = places.get(node.key);
  const n = document.createElement('button');

  n.className = node.level === 1 ? 'tnode hub' : 'tnode';
  n.dataset.key = node.key;
  n.style.left = `${p.x}px`;
  n.style.top = `${p.y}px`;
  n.style.setProperty('--i', node.level);
  if (node.level === 1) n.innerHTML = `<svg class="tico" viewBox="0 0 24 24">${u ? u.icon : ''}</svg>`;

  if (!touchDevice) {
    n.onpointerenter = () => {
      hovered = node.key;
      cue('treeHover', CFG.ui.synth.treeHover);
      paintTip();
    };
    n.onpointerleave = () => { if (hovered === node.key) { hovered = null; paintTip(); } };
  }
  n.oncontextmenu = (e) => { e.preventDefault(); buyMax(node.key); };
  el.pan.appendChild(n);
  nodes.set(node.key, n);
}

function draw() {
  drawn = gateMark();
  places = radial.compute(modules.gateOpen);
  hovered = null;
  for (const n of nodes.values()) n.remove();
  nodes.clear();

  paintEdges();
  for (const node of shownNodes()) addNode(node);
}

// The endless tail arrives one rung at a time, so the wheel is not thrown away
// to gain it: everything already on the board keeps its place and its state.
function grow() {
  if (!layout.sync()) return;
  places = radial.compute(modules.gateOpen);
  paintEdges();
  for (const [key, n] of nodes) if (!places.has(key)) { n.remove(); nodes.delete(key); }
  for (const node of shownNodes()) if (!nodes.has(node.key)) addNode(node);
}

// A finger cannot hover, so a tap on a node opens its card and the card's own
// button is what spends. Tapping the board puts the card away.
function tapAt(x, y) {
  const hit = document.elementFromPoint(x, y);
  const node = hit && hit.closest('.tnode');
  if (!node) {
    if (!hovered) return;
    hovered = null;
    paintTip();
    return;
  }

  const key = node.dataset.key;
  if (!touchDevice) { tryBuy(key); return; }
  if (hovered === key) return;
  cursor = { x, y };
  hovered = key;
  paintTip();
}

// Restarting an animation takes the class off, a reflow, and the class back on.
function replay(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Power running up the wire into the node that just came on. The dash is the
// path's own length, so the light travels the whole edge whatever its shape.
function chargeEdge(key) {
  const edge = el.edges.querySelector(`.edge[data-to="${key}"]`);
  if (!edge) return;
  edge.style.setProperty('--len', edge.getTotalLength().toFixed(1));
  replay(edge, 'charged');
  edge.addEventListener('animationend', () => edge.classList.remove('charged'),
                        { once: true });
}

function refuse(key) {
  cue('uiDeny', CFG.ui.synth.deny);
  const n = nodes.get(key);
  if (!n) return;
  replay(n, 'deny');
  // Taken off again, or the node keeps the refusal and the ready pulse it
  // suppresses never comes back.
  n.addEventListener('animationend', (e) => {
    if (!e.pseudoElement) n.classList.remove('deny');
  }, { once: true });
}

// Said once for the whole purchase, whether that was one level or ten: `key` is
// the last rung paid for, and the one the board answers on.
function spent(id, key) {
  // A gun bought at the bench is in the rack from that moment: the player is
  // standing in front of it and can place it before the wave starts.
  const arrived = loadout.sync();
  track(`module_${slug(modules.MODULES.find((u) => u.id === id).name)}`);
  cue('treeBuy', CFG.ui.synth.treeBuy);
  audio.play('coin', { rate: 1.18, force: true });
  // Before the wires light up: the level just bought may have hung the next one
  // off the wheel, and that lays the edges down again.
  grow();
  const n = nodes.get(key);
  if (n) replay(n, 'bought');
  if (n) gunfly.fly(arrived, n);
  chargeEdge(key);
  // The card climbs with the purchase rather than sitting on the rung just paid
  // for: on a finger there is no hover to move it, and the next level is what
  // the player is deciding about now.
  if (touchDevice) hovered = nextRung(id) || hovered;
  refresh();
  onBuy();
}

const nextRung = (id) => {
  const key = layout.keyOf(id, modules.level(id) + 1);
  return layout.BY_KEY.get(key) ? key : null;
};

function tryBuy(key) {
  if (!modules.canBuyNode(key)) { refuse(key); return; }
  const node = layout.BY_KEY.get(key);
  modules.buyNode(key);
  spent(node.id, key);
}

// The right button climbs the module instead of stepping it: level after level
// of the same one for as long as the purse holds out. The wheel is grown as it
// goes, since an endless module hangs its next rung only once the last is paid
// for and there would be nothing left to buy.
function buyMax(key) {
  const node = layout.BY_KEY.get(key);
  if (!node) return;

  let last = null;
  for (;;) {
    const next = layout.keyOf(node.id, modules.level(node.id) + 1);
    if (!modules.canBuyNode(next)) break;
    modules.buyNode(next);
    last = next;
    grow();
  }
  if (!last) { refuse(key); return; }
  spent(node.id, last);
}

// Above the finger on touch, since the hand covers everything below it.
function placeTip() {
  if (el.tip.classList.contains('hidden')) return;
  const w = el.tip.offsetWidth, h = el.tip.offsetHeight;
  const above = cursor.y - h - 22;
  const x = clamp(touchDevice ? cursor.x - w / 2 : cursor.x + 18, 10, innerWidth - w - 10);
  const y = touchDevice && above > 10
    ? above : clamp(cursor.y + 18, 10, innerHeight - h - 10);
  el.tip.style.transform = `translate(${x}px, ${y}px)`;
}

function paintTip() {
  const node = hovered && layout.BY_KEY.get(hovered);
  // Only what you own or could buy next: reading the stats off a level you have
  // not reached is planning with information the run has not given you.
  const open = node && visible(node) && (modules.ownsNode(node.key) || isNext(node));
  for (const [key, n] of nodes) n.classList.toggle('picked', open && key === node.key);
  if (!open) { el.tip.classList.add('hidden'); return; }

  const ready = modules.canBuyNode(node.key);
  const buy = !ready ? ''
    : touchDevice ? '<button class="t-buy">BUY</button>'
      : '<div class="t-again">RIGHT CLICK TO BUY MAX</div>';
  el.tip.innerHTML = tipHTML(node) + buy;
  const button = el.tip.querySelector('.t-buy');
  if (button) button.onclick = () => tryBuy(node.key);
  el.tip.classList.remove('hidden');
  placeTip();
}

function refresh() {
  el.coins.textContent = fmt.coins(state.coins);

  for (const node of shownNodes()) {
    const n = nodes.get(node.key);
    const owned = modules.ownsNode(node.key);
    const next = modules.nodeUnlocked(node.key) && isNext(node);
    const afford = modules.canBuyNode(node.key);
    n.classList.toggle('gone', !visible(node));
    n.classList.toggle('owned', owned);
    n.classList.toggle('afford', afford);
    n.classList.toggle('short', next && !afford);
    n.classList.toggle('locked', !owned && !next);
  }

  for (const e of el.edges.querySelectorAll('.edge, .stub')) {
    const to = layout.BY_KEY.get(e.dataset.to);
    const from = layout.BY_KEY.get(e.dataset.from);
    const open = !!to && !!from && visible(from);
    if (e.classList.contains('stub')) {
      e.classList.toggle('gone', !open || visible(to));
      continue;
    }
    e.classList.toggle('gone', !open || !visible(to));
    e.classList.toggle('done', !!to && modules.ownsNode(to.key));
    e.classList.toggle('open', !!to && !modules.ownsNode(to.key) && modules.nodeUnlocked(to.key));
  }
  paintTip();
}

// The board is the boss's key made useful, so it takes both halves of that: the
// key, and the wave it was carried out of. A key picked up on a wave that then
// went wrong opens nothing. The NEW mark lasts until the board is opened once.
// A second sector is only ever opened by earning it, and the board is the only
// way back to the first, so from then on it stays.
const earned = () => sector.openCount() > 1
  || Object.keys(state.keys).some((wave) => Number(wave) <= state.best);

// Shown either way: a button that is not there yet says nothing about what is
// coming, and where the board will sit is worth knowing before it opens.
function paintSelect() {
  const open = earned();
  el.select.disabled = !open;
  el.select.classList.toggle('locked', !open);
  el.selectFace.innerHTML = (open ? svg(KEY) : svg(LOCK))
    + `<span>${open ? 'SELECT WAVE' : 'LOCKED'}</span>`;
  paintNew();
}

function paintNew() {
  el.selectNew.classList.toggle('hidden', !earned() || !wavepick.fresh());
}

// What a wiped run wipes: the key is gone with it, so the mark that announces
// the board has to be able to come back.
export function forgetBoard() { wavepick.forget(); travel.forget(); sectoropen.forget(); }

export function init({ retry, next, buy, quit, pick, reset, sector: switchTo, fresh }) {
  build();
  stale.init(fresh);
  onRetry = retry;
  onNext = next;
  onQuit = quit || onQuit;
  onBuy = buy || onBuy;
  onPick = pick || onPick;
  onSector = switchTo || onSector;
  onReset = reset || onReset;
}

// Said only when the write went through: a full or blocked store is exactly when
// a player needs to know the line is not there.
export function markSaved(ok) {
  savedOk = ok;
  el.saved.classList.toggle('hidden', !ok);
}

function open(wave, { title, play, advance, cleared, replay = true }) {
  el.title.textContent = title;
  el.saved.classList.toggle('hidden', !savedOk);
  el.retry.textContent = play;
  el.next.textContent = `WAVE ${wave + 1}  →`;

  el.next.disabled = !advance;
  el.next.classList.toggle('locked', !advance);

  if (layout.sync() || gateMark() !== drawn) draw();

  paintSelect();
  stale.check(earned());
  sectorbar.paint(earned());
  travel.arm(earned());
  sectoropen.arm(earned());
  el.root.classList.remove('hidden');
  el.root.classList.remove('stats-open');
  el.root.classList.toggle('cleared', cleared);
  hovered = null;
  stats.paint(el.stats);
  refresh();

  fit();
  reveal.start(replay);
}

export function show(wave, cleared) {
  open(wave, {
    title: cleared ? `WAVE ${wave} CLEARED` : `WAVE ${wave} FAILED`,
    play: `RETRY WAVE ${wave}`,
    advance: cleared,
    cleared,
  });
}

// A resumed run stops here first so its coins can be spent before the wave it
// never got to play. Resumed on a cleared wave, it is the clear screen again —
// the next wave still open — without running the payout a second time.
export function resume(wave, cleared) {
  open(wave, {
    title: cleared ? `WAVE ${wave} CLEARED` : `WAVE ${wave}`,
    play: cleared ? `RETRY WAVE ${wave}` : `START WAVE ${wave}`,
    advance: cleared,
    cleared: true,
    replay: false,
  });
}

export function update(dt) {
  reveal.update(dt);
  gunfly.update(dt);
  travel.update(dt);
  sectoropen.update(dt);
}

export function hide() {
  reveal.clear();
  gunfly.clear();
  travel.clear();
  sectoropen.clear();
  wavepick.hide();
  sectorbar.quiet();
  gunrack.endRackEdit();
  el.root.classList.add('hidden');
  el.tip.classList.add('hidden');
  spendtip.hide();
}
