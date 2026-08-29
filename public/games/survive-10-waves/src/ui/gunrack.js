import { CFG } from '../config/index.js';
import { state } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as loadout from '../weapons/loadout.js';
import * as swaptip from './swaptip.js';
import * as rackcoach from './rackcoach.js';
import { cue } from './buttons.js';

// The guns you carry, in the places they are drawn: the strip on the HUD, which
// only reports, and the racks on the pause and upgrade screens, where a gun is
// picked up, moved and switched off.
const el = {
  gunlist: document.getElementById('gunlist'),
  gunrack: document.getElementById('gunrack'),
  modrack: document.getElementById('modrack'),
  gunTip: document.getElementById('gun-tip'),
};

const racks = [];
let held = -1;
let hovered = null;
// The rack is arranged on screens that can be left by reloading the page, so
// whoever owns the save is told when it moved.
let onEdit = () => {};

export function onRackEdit(fn) { onEdit = fn; }

function buildRack(container, live) {
  if (!container) return;
  const cells = loadout.list().map((_, slot) => {
    const cell = document.createElement('div');
    cell.className = 'gun-slot';
    cell.innerHTML = `<span class="k">${slot + 1}</span>`
                   + '<svg class="gico" viewBox="0 0 24 24"></svg>';
    if (live) wireSlot(cell, slot);
    container.appendChild(cell);
    return cell;
  });
  racks.push({ box: container, cells, live });
}

let ghost = null;

function showGhost(gun, x, y) {
  if (!ghost) {
    ghost = document.createElement('div');
    ghost.id = 'gun-ghost';
    ghost.innerHTML = '<svg class="gico" viewBox="0 0 24 24"></svg>';
    document.body.appendChild(ghost);
    addEventListener('mousemove', (e) => moveGhost(e.clientX, e.clientY));
    addEventListener('mousedown', (e) => {
      // Put down outside the rack: still the gun leaving your hands.
      if (held >= 0 && !e.target.closest('.gun-slot')) {
        held = -1;
        hideGhost();
        cue('uiClick', CFG.ui.synth.click);
      }
    });
  }
  ghost.querySelector('.gico').innerHTML = CFG.guns[gun].icon;
  ghost.style.display = 'flex';
  moveGhost(x, y);
}

function moveGhost(x, y) {
  if (!ghost || held < 0) return;
  ghost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
}

function hideGhost() {
  if (ghost) ghost.style.display = 'none';
}

function wireSlot(cell, slot) {
  const at = { slot, cell };
  cell.addEventListener('mouseenter', () => { hovered = at; drawTip(at); });
  cell.addEventListener('mouseleave', () => { hovered = null; el.gunTip.style.display = 'none'; });

  cell.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (held < 0) {
      const gun = loadout.gunAt(slot);
      if (gun !== null) { held = slot; showGhost(gun, e.clientX, e.clientY); }
    } else {
      if (loadout.move(held, slot)) { onEdit(); rackcoach.learn(); }
      held = -1;
      hideGhost();
    }
    drawTip(at);
  });

  // The one rack answer the delegated click cannot give: a right click either
  // switches a gun off or is refused, and those are different sounds.
  cell.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const gun = loadout.gunAt(slot);
    if (gun !== null && !loadout.toggle(gun)) {
      cue('uiDeny', CFG.ui.synth.deny);
      flashTip('THE LAST GUN CANNOT BE SWITCHED OFF');
    } else {
      cue('uiClick', CFG.ui.synth.click);
      onEdit();
      drawTip(at);
    }
  });
}

function paintRack(cells, guns, selected) {
  const slots = loadout.list();
  for (let s = 0; s < cells.length; s++) {
    const cell = cells[s];
    const gun = slots[s];
    const spec = gun === null ? null : guns[gun];
    cell.classList.toggle('empty', gun === null);
    cell.classList.toggle('on', gun === selected);
    cell.classList.toggle('off', gun !== null && loadout.disabled(gun));
    cell.classList.toggle('held', s === held);

    const want = spec ? spec.icon : '';
    if (cell.dataset.icon !== want) {
      cell.dataset.icon = want;
      cell.querySelector('.gico').innerHTML = want;
    }
  }
}

let shownRev = -1;
let shownSel = -1;
let shownHeld = -2;

export function syncGuns(guns, selected) {
  if (!el.gunlist || !el.gunrack) return;
  if (!racks.length) {
    buildRack(el.gunlist, false);
    buildRack(el.gunrack, true);
    buildRack(el.modrack, true);
  }

  // Called every frame in every mode, and a repaint is 32 class toggles.
  const rev = loadout.revision();
  if (rev === shownRev && selected === shownSel && held === shownHeld) return;
  shownRev = rev;
  shownSel = selected;
  shownHeld = held;

  for (const rack of racks) {
    if (rack.live) rack.box.classList.toggle('moving', held >= 0);
    paintRack(rack.cells, guns, selected);
  }
  swaptip.sync();
}

// The bench's own rack, for whoever has something to say about one of its slots.
export function benchCell(slot) {
  const rack = racks.find((r) => r.box === el.modrack);
  return rack ? rack.cells[slot] : null;
}

export function endRackEdit() {
  rackcoach.clear();
  held = -1;
  hovered = null;
  hideGhost();
  if (el.gunTip) el.gunTip.style.display = 'none';
}

const stat = (label, value) => `<div class="tip-stat">${label}<span>${value}</span></div>`;

function drawTip(at) {
  const { slot } = at;
  const gun = loadout.gunAt(slot);

  // Paused, the rack is for rearranging, not for reading: hovering says nothing,
  // and a gun in hand gets the one line that says where it can go.
  if (state.mode === 'paused') {
    if (held < 0) { el.gunTip.style.display = 'none'; return; }
    el.gunTip.innerHTML =
      `<div class="tip-name">${gun === null ? 'EMPTY SLOT' : CFG.guns[gun].name}</div>`
      + '<div class="tip-hint">CLICK TO PLACE HERE</div>';
    placeTip(at);
    return;
  }

  if (gun === null) {
    if (held < 0) { el.gunTip.style.display = 'none'; return; }
    el.gunTip.innerHTML = '<div class="tip-name">EMPTY SLOT</div>'
                        + '<div class="tip-hint">CLICK TO PLACE HERE</div>';
    placeTip(at);
    return;
  }
  const g = CFG.guns[gun];
  const pellets = g.pellets ? modules.gunPellets(g) : 1;
  const dps = modules.gunDamage(g) * pellets * modules.gunFireRate(g);

  let rows = stat('DAMAGE', Math.round(modules.gunDamage(g)) + (g.pellets ? ` x${pellets}` : ''))
           + stat('RATE', `${modules.gunFireRate(g).toFixed(1)}/s`)
           + stat('BURST DPS', Math.round(dps))
           + stat('CHARGES', Math.round(modules.gunCharges(g)))
           + stat('RECOVERY', `${modules.gunRecovery(g).toFixed(1)}/s`);
  if (g.range) rows += stat('RANGE', `${g.range}m`);

  const offNow = loadout.disabled(gun);
  el.gunTip.innerHTML =
    `<div class="tip-name">${g.name}</div>`
    + `<div class="tip-desc">${g.desc || ''}</div>${rows}`
    + `<div class="tip-hint">${held >= 0 ? 'CLICK A SLOT TO PLACE'
        : `CLICK TO MOVE · RIGHT CLICK TO ${offNow ? 'ENABLE' : 'DISABLE'}`}</div>`;

  placeTip(at);
}

// Beside the slot the pointer is actually in, whichever rack that is.
function placeTip({ cell }) {
  const r = cell.getBoundingClientRect();
  el.gunTip.style.display = 'block';
  const w = el.gunTip.offsetWidth, h = el.gunTip.offsetHeight;
  const left = r.left + r.width / 2 - w / 2;
  const below = r.bottom + 12;
  const top = below + h + 8 > innerHeight ? r.top - 12 - h : below;
  el.gunTip.style.left = `${Math.max(8, Math.min(left, innerWidth - w - 8))}px`;
  el.gunTip.style.top = `${Math.max(8, top)}px`;
}

let tipFlash = 0;
function flashTip(msg) {
  el.gunTip.innerHTML = `<div class="tip-name">${msg}</div>`;
  el.gunTip.style.display = 'block';
  tipFlash = 1.4;
}

export function updateTip(dt) {
  if (tipFlash <= 0) return;
  tipFlash -= dt;
  if (tipFlash <= 0) {
    if (hovered) drawTip(hovered);
    else el.gunTip.style.display = 'none';
  }
}

export function hideTip() {
  if (el.gunTip) el.gunTip.style.display = 'none';
}
