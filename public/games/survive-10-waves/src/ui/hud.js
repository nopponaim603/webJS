import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { state, world } from '../core/world.js';
import { camera } from '../engine/view.js';
import { music } from '../engine/music.js';
import * as modules from '../modules/index.js';
import * as energy from '../character/energy.js';
import * as drone from '../allies/drone.js';
import * as sector from '../game/sector.js';
import * as arena from '../arena/size.js';
import { CLOCK, DRONE, svg } from './icons.js';
import { clock } from '../core/time.js';
import { createArc } from './chargearc.js';
import { cue } from './buttons.js';
import { hideTip } from './gunrack.js';
import * as swaptip from './swaptip.js';
import * as effects from '../items/effects.js';
import * as fmt from './format.js';
import './controls.js';

const el = {
  hp: document.getElementById('hpfill'),
  hpbar: document.getElementById('hpbar'),
  hpnum: document.getElementById('hpnum'),
  shield: document.getElementById('shieldnum'),
  enArc: document.getElementById('en-arc'),
  arc: document.getElementById('ch-arc'),
  arcNote: document.getElementById('ch-note'),
  crosshair: document.getElementById('crosshair'),
  syms: [...document.querySelectorAll('#crosshair .sym')],
  sub: document.getElementById('substats'),
  clock: document.getElementById('wave-clock'),
  drones: document.getElementById('dronehp'),
  hurt: document.getElementById('hurt'),
  graze: document.getElementById('grazeveil'),
  banner: document.getElementById('wave-banner'),
  collapse: document.getElementById('collapse-alert'),
  menu: document.getElementById('menu'),
  story: document.getElementById('story'),
  pause: document.getElementById('pause'),
  runCard: document.getElementById('run-card'),
  runStats: document.getElementById('run-stats'),
  runDeep: document.getElementById('run-deep'),
  btnContinue: document.getElementById('btn-continue'),
  btnNew: document.getElementById('btn-new'),
  loadFill: document.querySelector('#loading-bar i'),
  loadLabel: document.getElementById('loading-label'),
  terrainLoad: document.getElementById('terrain-load'),
  terrainFill: document.getElementById('tl-fill'),
  terrainLabel: document.getElementById('tl-label'),
};

let bannerTimer = 0;

// Built once: this is read every tick, and re-parsing the glyph a second is a
// price paid for nothing.
if (el.clock) el.clock.innerHTML = svg(CLOCK) + '<span></span>';
const clockText = el.clock?.lastElementChild;
let shownClock = '';

// Fixed in the stylesheet, so measuring per frame forced a layout for a
// constant. A zero came from measuring it hidden, and is not kept.
let arcWidth = 0;
addEventListener('resize', () => { arcWidth = 0; });

function arcCircumference() {
  if (!arcWidth && el.arc) arcWidth = el.arc.getBoundingClientRect().width;
  return 0.8 * Math.PI * ((arcWidth || 124) * 0.42) || 131;
}

const syncArc = el.arc ? createArc(el.arc, arcCircumference) : null;
const syncTank = el.enArc
  ? createArc(el.enArc, arcCircumference, { whole: false }) : null;

const _at = new THREE.Vector3();

// Placed after the camera has moved and before the frame is drawn, never
// alongside the readouts: those run early in the tick, and a ring projected
// through last frame's camera swims around a player who is walking.
export function placeRing() {
  if (!el.arc || !world.player) return;
  const p = world.player.pos;
  _at.set(p.x, p.y, p.z).project(camera);
  if (_at.z > 1) return;

  const sx = (_at.x * 0.5 + 0.5) * innerWidth;
  const sy = (-_at.y * 0.5 + 0.5) * innerHeight + CFG.crosshair.chargeDrop;
  const move = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
  el.arc.style.transform = move;
  el.arcNote.style.transform = move;
  // The tank closes the ring the charge arc opens, so it rides the same point:
  // two halves of one circle drawn by two files is one circle that drifts.
  if (el.enArc) el.enArc.style.transform = move;
}



let shownScale = -1;

export function syncGun({ gun, fill, max, show, dry, pulse, warn, wind, note, hint }) {
  if (!syncArc) return;
  syncArc(fill, max, { show, wind, warn });

  if (el.crosshair) {
    if (el.crosshair.dataset.sym !== gun.crosshair) el.crosshair.dataset.sym = gun.crosshair;
    el.crosshair.classList.toggle('dry', !!dry);

    const scale = 1 + CFG.crosshair.firePulseAmp * (pulse || 0);
    if (Math.abs(scale - shownScale) > 0.004) {
      shownScale = scale;
      const t = scale > 1.001 ? `scale(${scale.toFixed(3)})` : '';
      for (const symEl of el.syms) symEl.style.transform = t;
    }
  }

  // Rebuilt only when the pair changes: this runs every frame, and the note is
  // two nodes now rather than a string.
  const want = note && `${note}|${hint || ''}`;
  if (want && el.arcNote.dataset.said !== want) {
    el.arcNote.dataset.said = want;
    el.arcNote.textContent = note;
    if (hint) el.arcNote.appendChild(Object.assign(document.createElement('span'),
                                                   { className: 'ch-hint', innerHTML: hint }));
  }
  el.arcNote.classList.toggle('show', !!note);
  el.arcNote.classList.toggle('learned', swaptip.known());
}


// The tank closes the top of the ring the charge arc draws along the bottom,
// counted in dashes rather than in units: the segments are what a dash costs of
// it, so the same glance answers both "how much is left" and "how many dashes
// is that". A full tank is nothing to say, so it is not said — the same silence
// the charge arc keeps.
export function syncEnergy() {
  const p = world.player;
  if (!syncTank || !p) return;

  const max = modules.energyMax();
  const per = modules.hasDash() ? modules.dashCost() : max;
  const share = energy.share(p);
  const surge = effects.unlimitedEnergy(p);

  el.enArc.classList.toggle('surge', surge);
  syncTank(p.energy.left / per, max / per, { show: surge || share < 0.999 });
}

const droneRows = [];

const barColour = (share) => (share > 0.55 ? '#4ade80' : share > 0.25 ? '#facc15' : '#ef4444');

export function syncDrones() {
  const live = drone.list();
  el.drones.classList.toggle('hidden', !live.length);

  while (droneRows.length < live.length) {
    const row = document.createElement('div');
    row.className = 'drone-row';
    row.innerHTML = `${svg(DRONE, 'dico')}<div class="dbar"><i></i></div>`;
    el.drones.appendChild(row);
    droneRows.push(row);
  }

  for (let i = 0; i < droneRows.length; i++) {
    const row = droneRows[i];
    row.style.display = i < live.length ? '' : 'none';
    if (i >= live.length) continue;
    const share = Math.max(0, live[i].hp) / live[i].hpMax;
    const fill = row.lastElementChild.firstElementChild;
    fill.style.width = `${(share * 100).toFixed(1)}%`;
    fill.style.background = barColour(share);
  }
}

// Nought at the health a run starts on, one at the health the bar is as wide as
// the screen for. A bar that ran straight off the number would be at the edge of
// the screen by the first thousand and have nothing left to say for the four
// after it.
function growth(max) {
  const B = CFG.hpBar;
  const base = CFG.player.maxHealth;
  const over = (max - base) / (B.full - base);
  return Math.pow(Math.max(0, Math.min(1, over)), B.curve);
}

export function sync(health) {
  const max = modules.maxHealth();
  const pct = Math.max(0, health) / max;

  el.hpbar.style.setProperty('--hp-grow', growth(max).toFixed(3));
  el.hp.style.width = (pct * 100) + '%';
  el.hp.style.background = barColour(pct);
  // A bar that is filling itself says so: the run in the fill is the only sign
  // the regeneration is still going once the numbers stop being watched.
  el.hpbar.classList.toggle('mending', effects.healing(world.player));

  // The same augur level that puts numbers over the bugs puts them on your own
  // bar. Below it the HUD stays as it was: a bar, and how full it is.
  const reads = modules.sees('count');
  const soak = modules.damageSoak();

  el.hpnum.classList.toggle('hidden', !reads);
  el.hpnum.textContent = `${Math.max(0, Math.ceil(health))} / ${Math.round(max)}`;

  el.shield.classList.toggle('hidden', !reads || soak <= 0);
  el.shield.textContent = `SHIELD ${(soak * 100).toFixed(0)}%`;


  // Every sector fields the same wave numbers, so the number alone says nothing.
  el.sub.textContent = `SECTOR ${sector.current()} · WAVE ${state.wave}`;

  const spent = clock(state.waveTime);
  if (clockText && spent !== shownClock) {
    shownClock = spent;
    clockText.textContent = spent;
  }
  el.clock.classList.toggle('closing', arena.sinking());
}

// The ground going is the one thing a wave says that the wave banner is the
// wrong voice for. Restarted by hand rather than by the class alone: it has to
// play again on a later wave, and an animation already finished does not.
export function collapseAlert(on) {
  el.collapse.style.setProperty('--beat', `${CFG.arena.collapse.beat}s`);
  el.collapse.classList.add('hidden');
  if (!on) return;
  void el.collapse.offsetWidth;
  el.collapse.classList.remove('hidden');
}

// Held banners stay until something takes them down: a cleared wave is a state
// the player is in, not an announcement that has been and gone.
export function banner(text, hold = false) {
  el.banner.textContent = text;
  el.banner.classList.add('show');
  bannerTimer = hold ? Infinity : 1.6;
}

export function clearBanner() {
  bannerTimer = 0;
  el.banner.classList.remove('show');
}

export function updateBanner(dt) {
  if (bannerTimer <= 0) return;
  bannerTimer -= dt;
  if (bannerTimer <= 0) el.banner.classList.remove('show');
}

let hurtFade = 0;

// One timer restarted per hit, or the first of a burst clears the last's flash.
export function flashHurt(amount) {
  el.hurt.style.opacity = Math.min(0.95, 0.35 + amount / 25);
  clearTimeout(hurtFade);
  hurtFade = setTimeout(() => { el.hurt.style.opacity = 0; }, 140);
}

let grazeFade = 0;

// Restarted per graze rather than queued: two near misses in a breath are one
// pulse held, never two that fight each other's timer.
export function flashGraze() {
  const V = CFG.graze.veil;
  el.graze.style.opacity = V.alpha;
  clearTimeout(grazeFade);
  grazeFade = setTimeout(() => { el.graze.style.opacity = 0; }, V.ms);
}

export function extractPrompt(on, progress = 0) {
  const box = document.getElementById('extract');
  if (!box) return;
  box.classList.toggle('hidden', !on);
  if (!on) return;
  document.getElementById('ex-fill').style.width = `${(progress * 100).toFixed(1)}%`;
  box.classList.toggle('charging', progress > 0.001);
  box.querySelector('.ex-label').textContent =
    progress > 0.001 ? 'HOLD POSITION' : 'STAND ON THE PAD TO EXTRACT';
}

// One list, not two: an overlay named in the show list and forgotten in the hide
// list is an overlay nothing ever takes off the screen.
const OVERLAYS = ['menu', 'pause', 'story'];

export function showOverlay(name) {
  for (const k of OVERLAYS) el[k].classList.toggle('hidden', k !== name);
  if (name === 'pause') music.showNow();
  hideTip();
}

export function hideOverlays() {
  for (const k of OVERLAYS) el[k].classList.add('hidden');
}

let armed = false;

export function onButtons({ resume, quit, play, erase, music }) {
  const cont = document.getElementById('btn-continue');
  const fresh = document.getElementById('btn-new');

  document.getElementById('btn-resume').onclick = resume;
  document.getElementById('btn-quit').onclick = quit;
  document.getElementById('btn-music').onclick = music;
  cont.onclick = () => play();

  // Wiping a run is one click away from the button you press every session, and
  // it now takes every sector, its drones and its unlocks with it, so it asks
  // once. Any other menu click puts the safety back on.
  fresh.onclick = () => {
    if (!el.runCard.classList.contains('hidden') && !armed) {
      armed = true;
      fresh.textContent = 'ERASE ALL SECTORS?';
      fresh.classList.add('warn');
      return;
    }
    erase();
  };
  cont.addEventListener('mouseenter', disarm);
}

function disarm() {
  if (!armed) return;
  armed = false;
  const fresh = document.getElementById('btn-new');
  fresh.textContent = 'NEW GAME';
  fresh.classList.remove('warn');
}

export function showRun(run) {
  disarm();
  el.runCard.classList.toggle('hidden', !run);
  el.btnContinue.classList.toggle('hidden', !run);
  el.btnNew.textContent = run ? 'NEW GAME' : 'START';
  el.btnNew.classList.toggle('ghost', !!run);
  if (!run) return;
  el.runStats.innerHTML = `SECTOR <b>${sector.current()}</b><span>·</span>`
    + `WAVE <b>${run.wave}</b><span>·</span>`
    + `<b>${run.kills}</b> KILLS<span>·</span><b>${fmt.coins(run.coins)}</b> COINS`;

  const deep = run.best > CFG.mission.horizon;
  el.runDeep.classList.toggle('hidden', !deep);
  if (deep) el.runDeep.textContent = `DEEPEST · WAVE ${run.best}`;
}

export function showTerrainLoad() {
  terrainProgress(0, 'LOADING TERRAIN');
  el.terrainLoad.classList.remove('hidden');
}

export function terrainProgress(t, label) {
  el.terrainFill.style.width = `${Math.round(t * 100)}%`;
  if (label) el.terrainLabel.textContent = label;
}

export function hideTerrainLoad() {
  el.terrainLoad.classList.add('hidden');
}

export function loadProgress(t) {
  el.loadFill.style.width = `${Math.round(t * 100)}%`;
  el.loadLabel.textContent = `LOADING ${Math.round(t * 100)}%`;
}

export function loadReady() {
  el.loadFill.style.width = '100%';
  el.menu.classList.add('ready');
}
