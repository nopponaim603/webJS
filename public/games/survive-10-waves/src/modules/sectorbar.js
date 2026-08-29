import { CFG, SECTORS } from '../config/index.js';
import * as sector from '../game/sector.js';
import * as sectoropen from './sectoropen.js';
import { cue } from '../ui/buttons.js';
import { LOCK, svg } from '../ui/icons.js';
import { touchDevice } from '../mobile/detect.js';
import { trackImage } from '../core/loading.js';

// Where you are standing, at the top of the bench: the ground a sector wears is
// the thing worth showing, so a tab is a card of it rather than a word.
const LOCK_ICON = svg(LOCK);

for (const s of SECTORS) if (s.shot) trackImage(s.shot);

const el = { bar: null, note: null };
const tabs = [];

let onSector = () => {};

export function quiet() {
  el.note.classList.add('hidden');
  el.note.classList.remove('shake', 'good');
}

export const cardOf = (id) => tabs[SECTORS.findIndex((s) => s.id === id)] || null;

export function announce(text) {
  el.note.textContent = text;
  el.note.classList.remove('hidden', 'shake');
  el.note.classList.add('good');
}

// A sighted sector is a card the player can read and still not enter, so the
// refusal has to say the wave that opens it rather than leave a dead button.
function refuse(s) {
  el.note.textContent = `SECTOR ${s.id} IS SEALED — CLEAR WAVE ${CFG.mission.horizon}`
    + ` IN SECTOR ${sector.prevOf(s.id)} TO OPEN IT`;
  el.note.classList.remove('hidden', 'shake', 'good');
  void el.note.offsetWidth;
  el.note.classList.add('shake');
  cue('uiDeny', CFG.ui.synth.deny);
}

// The bar and the wave board are the same privilege — travel — so they arrive
// together rather than the tabs standing there before there is anywhere to go.
export function paint(open) {
  el.bar.classList.toggle('hidden', !open);
  if (!open) quiet();

  // A sector opened on the wave just played keeps its seal until the bench
  // breaks it in front of the player.
  const held = sectoropen.pending();

  for (let i = 0; i < tabs.length; i++) {
    const id = SECTORS[i].id;
    const seen = sector.revealed(id);
    tabs[i].disabled = !seen;
    tabs[i].classList.remove('cracking', 'opening');
    tabs[i].classList.toggle('locked', !seen);
    tabs[i].classList.toggle('sealed', seen && (!sector.unlocked(id) || id === held));
    tabs[i].classList.toggle('on', id === sector.current());
  }
}

export function init(onSwitch) {
  el.bar = document.getElementById('mod-sectors');
  el.note = document.getElementById('mod-sector-note');
  onSector = onSwitch;

  for (const [i, s] of SECTORS.entries()) {
    const tab = document.createElement('button');
    tab.className = 'mod-sector';
    // Its place in the bar, for whatever wants to run down the row: the intro
    // powers the cards on one after another rather than all at once.
    tab.style.setProperty('--i', i);
    // The ground itself, under a dark layer the name can be read over. An
    // unsighted sector keeps its face covered — the stylesheet is what uncovers
    // it, and drains it again while the sector is sighted but shut.
    tab.innerHTML = `<span class="ms-face" style="background-image:url('${s.shot}')"></span>`
      + `<span class="ms-name"><b>SECTOR ${s.id}</b><i>${s.name}</i></span>`
      + LOCK_ICON
      + '<i class="ms-sweep"></i>';
    // Asked of the sector rather than left to the button's disabled flag: a
    // sealed card has to answer the click that lands on it.
    tab.onclick = () => {
      if (s.id === sector.current()) return;
      if (!sector.unlocked(s.id)) { refuse(s); return; }
      quiet();
      cue('sectorGo', CFG.ui.synth.sectorGo);
      onSector(s.id);
    };
    // A card carries its own press voice, so it is not in CFG.ui.selector and
    // has to answer the pointer itself — with the same hover every other button
    // in the game gives. An unsighted card is disabled and dispatches nothing.
    if (!touchDevice) tab.onpointerenter = () => cue('uiHover', CFG.ui.synth.hover);
    el.bar.appendChild(tab);
    tabs.push(tab);
  }
}
