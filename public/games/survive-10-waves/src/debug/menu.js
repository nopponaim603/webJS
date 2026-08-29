import * as THREE from 'three';
import { CFG, BUG_TYPES } from '../config/index.js';
import { world, state } from '../core/world.js';
import * as bugs from '../bug/roster.js';
import { quotaOf, purseBefore, levelNow, bossesAt } from '../game/waveplan.js';
import * as firing from '../weapons/firing.js';
import { onDebug, onEscape } from '../engine/input.js';
import { sun, SUN_DEFAULT } from '../engine/view.js';
import { forget } from './draw.js';
import * as modules from '../modules/index.js';
import * as walls from '../arena/walls.js';
import * as debugdraw from './draw.js';
import * as arena from '../arena/size.js';
import * as themes from '../arena/themes/index.js';
import { apply as applyTheme } from '../arena/themes/swap.js';
import * as dummies from './dummies.js';
import * as rigdemo from './rigdemo.js';
import * as drone from '../allies/drone.js';
import * as evolve from '../bug/evolve.js';
import * as slam from '../bug/slam.js';
import * as spill from '../bug/spill.js';
import * as spit from '../bug/spit.js';
import * as smallslam from '../bug/smallslam.js';
import * as hurl from '../bug/hurl.js';
import * as toss from '../bug/toss.js';
import * as rush from '../bug/rush.js';
import * as extraction from '../game/extraction.js';
import * as waves from '../game/waves.js';
import * as fmt from '../ui/format.js';
import * as drops from '../items/drops.js';
import * as ruler from './ruler.js';
import * as specialpanel from './special.js';
import { ITEMS } from '../items/catalog.js';

let panel = null, open = false, count = 1, dist = 12, spawnLevel = 0;
let breachCount = 5, breachScale = 1;
const dbgPoolAt = 14;
// Far enough ahead to see the thing land, near enough to step onto it.
const dbgItemAt = 4;

const wallPainters = [];

const _p = new THREE.Vector3();

// The nearest live bug that can do it, or a fresh one dropped at ring distance
// when there is none: the button always ends in an attack to watch.
function attacker(can) {
  const able = world.bugs.filter((b) => can(b.type) && !b.dummy);
  const near = (b) => Math.hypot(b.pos.x - world.player.pos.x, b.pos.z - world.player.pos.z);
  if (able.length) return able.reduce((a, b) => (near(b) < near(a) ? b : a));

  const type = BUG_TYPES.find(can);
  if (!type) return null;
  spawnAt(type, 1);
  return world.bugs[world.bugs.length - 1];
}

function spawnAt(type, n, from = dist) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = from * (0.9 + Math.random() * 0.2);
    _p.set(world.player.pos.x + Math.cos(a) * r, 0, world.player.pos.z + Math.sin(a) * r);

    const lim = arena.radius() - 2;
    const d = Math.hypot(_p.x, _p.z);
    if (d > lim) { _p.x *= lim / d; _p.z *= lim / d; }
    bugs.spawn(type, _p, spawnLevel || levelNow());
  }
}

function button(label, onClick, title) {
  const b = document.createElement('button');
  b.textContent = label;
  if (title) b.title = title;
  b.onclick = onClick;
  return b;
}

function toggle(label, get, set, title) {
  const b = button(label, () => { set(!get()); b.classList.toggle('on', get()); }, title);
  b.classList.toggle('on', get());
  return b;
}

function section(title) {
  const h = document.createElement('div');
  h.className = 'dbg-sec';
  h.textContent = title;
  panel.appendChild(h);
}

function row(label, ...kids) {
  const r = document.createElement('div');
  r.className = 'dbg-row';
  if (label) {
    r.appendChild(Object.assign(document.createElement('span'),
      { className: 'dbg-lbl', textContent: label }));
  }
  r.append(...kids.filter(Boolean));
  panel.appendChild(r);
  return r;
}

function slider(label, min, max, step, value, onInput, fmt = (v) => v) {
  const lab = document.createElement('label');
  lab.innerHTML = `<span>${label} <b>${fmt(value)}</b></span>`
    + `<input type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;
  const input = lab.querySelector('input');
  input.oninput = () => {
    const v = parseFloat(input.value);
    lab.querySelector('b').textContent = fmt(v);
    onInput(v);
  };
  panel.appendChild(lab);
  return lab;
}

function build() {
  panel = document.createElement('div');
  panel.id = 'debugmenu';
  panel.innerHTML = '<h3>DEBUG</h3>'
    + '<div class="mix-hint">Backquote or Esc to close.</div>';

  // Thrown before anything is drawn, so the switches read as on when they appear.
  // build() runs on the first open and never again, so this is once a session:
  // reopening the panel later leaves whatever the developer set since.
  world.debug.autoHeal = true;
  world.debug.noSpawn = true;

  section('BUGS');
  const spawnRow = row(null);
  for (const t of BUG_TYPES) {
    spawnRow.appendChild(button(t.key, () => spawnAt(t, count),
      `hp ${t.hp} · speed ${t.speed} · dmg ${t.damage}` + (t.ranged ? ' · ranged' : '')));
  }

  // Never onto an attack already running: the two own the same frame, and one
  // started under the other just freezes it half-reared.
  const idle = (bug) => bug && !bug.slam && !bug.jab && !bug.hurl && !bug.toss
    && !bug.rush && !bug.spill && !bug.douse;
  row('boss attacks',
    button('slam', () => {
      const bug = attacker((t) => t.slam);
      if (idle(bug)) slam.begin(bug);
    }, 'rear up and bring it down where it stands'),
    ...['bossrush', 'acidrush'].map((kind) => button(kind === 'acidrush' ? 'acid rush' : 'rush', () => {
      const bug = attacker((t) => [].concat(t.charge || []).includes(kind));
      if (idle(bug)) {
        _p.set(world.player.pos.x - bug.pos.x, 0, world.player.pos.z - bug.pos.z).normalize();
        bug.charging = kind;
        rush.begin(bug, CFG[kind], _p);
      }
    }, kind === 'acidrush'
      ? 'the same charge, wetting the ground it crosses'
      : 'lower its head and run you down, walls and all')),
    ...['cross', 'pincer', 'rings', 'rays'].map((kind) => button(`slam ${kind}`, () => {
      const bug = attacker((t) => t.slam);
      if (idle(bug)) slam.begin(bug, kind);
    }, `the same slam, with the ${kind} figure thrown under it`)),
    button('small slam', () => {
      const bug = attacker((t) => t.smallSlam);
      if (idle(bug)) smallslam.begin(bug);
    }, 'head and front legs only, and two holes torn open by the landing'),
    button('acid pool', () => {
      const S = CFG.spill;
      const p = world.player;
      // `burn` in the config is a share of the thrower's bite, not a damage:
      // priced here off the boss's own, the same as a real spill prices it.
      const boss = BUG_TYPES.find((t) => t.key === 'boss');
      _p.set(p.pos.x + p.aim.x * dbgPoolAt, 0, p.pos.z + p.aim.z * dbgPoolAt);
      spit.lob({ x: p.pos.x, y: 8, z: p.pos.z }, _p,
               { grow: S.grow * 2, blobs: 3, tick: S.tick, flight: [0.9, 0],
                 beads: S.beads, burn: Math.max(1, Math.round(boss.damage * S.burn)),
                 life: 60, warn: true, rate: 0.5 });
    }, 'one oversized pool thrown out in front of you, to walk around'),
    button('boomerang', () => {
      const bug = attacker((t) => t.hurl);
      if (idle(bug)) hurl.begin(bug);
    }, 'throw a bone that comes after you until it is stopped'),
    button('bombers', () => {
      const bug = attacker((t) => t.toss);
      if (idle(bug)) toss.begin(bug);
    }, 'throw live bombers that go off where they land'),
    button('acid spill', () => {
      const bug = attacker((t) => t.spill);
      if (idle(bug)) spill.begin(bug);
    }, 'empty itself over the arena for a few seconds'),
    button('acid small', () => {
      const bug = attacker((t) => t.smallSpill);
      if (idle(bug)) spill.begin(bug, spill.SMALL);
    }, 'a tight ring of small pools round the player'),
  );

  row('boss health',
    button('down to 20%', () => {
      attacker((t) => t.kit);
      for (const bug of world.bugs) {
        const want = (bug.hpMax || 0) * 0.2;
        if (bug.type.kit && bug.hp > want) bugs.damage(bug, bug.hp - want, bug.pos);
      }
    }, 'hurt every boss on the field down to a fifth of its health, where it rages'),
  );

  const countRow = row('count');
  const countBtns = [];
  for (const n of [1, 5, 10, 25]) {
    const b = button(String(n), () => {
      count = n;
      for (const o of countBtns) o.classList.toggle('on', o === b);
    });
    b.classList.toggle('on', n === count);
    countBtns.push(b);
    countRow.appendChild(b);
  }

  const levelIn = document.createElement('input');
  levelIn.type = 'number';
  levelIn.min = '0';
  levelIn.className = 'dbg-num';
  levelIn.value = '0';

  const levelNote = Object.assign(document.createElement('span'), { className: 'dbg-lbl' });
  levelNote.style.whiteSpace = 'nowrap';

  const paintLevel = () => {
    const asked = Math.max(0, Math.round(+levelIn.value) || 0);
    spawnLevel = Math.min(evolve.maxLevel(), asked);
    levelNote.textContent = spawnLevel
      ? `hatched at level ${spawnLevel}`
      : `level ${levelNow()}, whatever this wave fields`;
  };
  const aimLevel = (n) => { levelIn.value = String(Math.max(0, n)); paintLevel(); };

  levelIn.oninput = paintLevel;
  row('level',
    button('−', () => aimLevel(Math.round(+levelIn.value) - 1)),
    levelIn,
    button('+', () => aimLevel(Math.round(+levelIn.value) + 1)),
    button('now', () => aimLevel(0), 'back to whatever the current wave spawns'),
    levelNote,
  );
  paintLevel();

  slider('ring distance', 3, 34, 1, dist, (v) => { dist = v; });

  // The buttons above drop bugs in finished. This is the whole arrival: warning
  // mark, rumble, the bursts, and the group clawing out over the window.
  row('breach',
    button('somewhere', () => waves.breach(breachCount, null, breachScale),
      'a hole where a wave would put one: clear of you, clear of walls'),
    button('on me', () => waves.breach(breachCount, world.player.pos, breachScale),
      'under your feet, to watch the sequence up close'),
  );

  const breachNote = Object.assign(document.createElement('span'), { className: 'dbg-lbl' });
  breachNote.style.whiteSpace = 'nowrap';
  const paintBreach = () => {
    const base = CFG.spawn.breach * Math.sqrt(breachCount / CFG.spawn.group.first);
    breachNote.textContent = `hole radius ${(base * breachScale).toFixed(1)}u`
      + `, a wave would use ${base.toFixed(1)}u`;
  };

  slider('breach bugs', 1, 1000, 1, breachCount,
         (v) => { breachCount = v; paintBreach(); });
  // The radius a wave picks is derived from the group. This scales it, so the
  // hole can be widened without changing how many come out of it.
  slider('breach size', 0.3, 4, 0.1, breachScale,
         (v) => { breachScale = v; paintBreach(); }, (v) => `${v.toFixed(1)}x`);
  row(null, breachNote);
  paintBreach();

  row(null,
    button('kill all', () => {
      for (const bug of world.bugs.slice()) {
        bugs.damage(bug, 1e9, bug.pos);
        bugs.kill(bug);
      }
    }, 'damage them to death, with all the effects'),
    button('remove all', () => bugs.clear(), 'delete instantly, no death animation'),
    toggle('acid hitbox', () => world.debug.acidBoxes,
           (v) => { world.debug.acidBoxes = v; },
           'paint every patch of ground an acid pool would burn you on, in red'),
    toggle('graze zone', () => world.debug.grazeZones,
           (v) => { world.debug.grazeZones = v; },
           'every live attack painted twice: red where it would hurt, green where'
           + ' standing still pays the Nerve module'),
    toggle('freeze', () => world.debug.freezeBugs, (v) => { world.debug.freezeBugs = v; }),
    toggle('no spawn', () => world.debug.noSpawn, (v) => { world.debug.noSpawn = v; }),
  );

  section('DRONE');
  row(null,
    ...[1, 2, 4].map((n) => button(`+${n}`, () => {
      // Given a place in the flight, so one put up here is written into the
      // wave's books like any other: its health carries, and breaking it costs
      // the repair the screen charges for.
      for (let i = 0; i < n; i++) drone.add(false, state.drones++);
    }, 'a machine that keeps your shoulder, shoots what it can reach, and stays off ground something has claimed')),
    button('dummy', () => drone.add(true),
      'a machine that hovers where you stand and does nothing: somewhere to watch '
      + 'what the field does about a drone, jumps included'),
    button('clear', () => drone.clear()),
  );

  section('ITEMS');
  // Dropped for real, not previewed: walking onto one raises the same card a
  // wave does, with the same USE and DISCARD behind it.
  row('drop',
    ...ITEMS.map((item) => button(item.name, () => {
      const p = world.player;
      _p.set(p.pos.x + p.aim.x * dbgItemAt, 0, p.pos.z + p.aim.z * dbgItemAt);
      drops.drop(_p, item);
    }, item.blurb)),
    button('clear', () => drops.clear(),
           'take back what is lying about, and re-roll the wave budget'),
  );

  section('RULER');
  const rulerNote = Object.assign(document.createElement('span'), { className: 'dbg-lbl' });
  row('measure',
    toggle('on', () => ruler.isArmed(), (on) => ruler.arm(on),
           'click the ground twice — the first click plants the tape, the second '
           + 'lets it go. The panel can be shut while you measure'),
    button('clear', () => ruler.reset()),
    rulerNote,
  );
  panel.__paintRuler = () => { rulerNote.textContent = ruler.readout(); };

  section('DUMMIES');
  row('pillars',
    ...[3, 6, 12].map((n) => button(String(n), () => dummies.spawn(n),
      'a block of unkillable pillars to shoot at, with a live damage meter')),
    button('clear', () => dummies.clear()),
    button('reset dps', () => dummies.resetMeter(), 'start the damage meter over'),
  );

  section('EXTRACTION');
  // The pad ends the wave when it fills, the same as it does in a run: spawning
  // one here is the whole flow, not a preview of the model.
  row(null,
    button('spawn pad', () => extraction.show(world.player.pos),
           'raise it where you stand — stand on it and it extracts for real'),
    button('spawn at ring', () => {
      const a = Math.random() * Math.PI * 2;
      _p.set(world.player.pos.x + Math.cos(a) * dist, 0,
             world.player.pos.z + Math.sin(a) * dist);
      const lim = arena.radius() - 4;
      const d = Math.hypot(_p.x, _p.z);
      if (d > lim) { _p.x *= lim / d; _p.z *= lim / d; }
      extraction.show(_p);
    }, 'raise it `ring distance` away, to check the pointer that finds it'),
    button('retract', () => extraction.hide(), 'shut the doors and take it apart'),
    button('remove', () => extraction.hideNow(), 'gone at once, no animation'),
  );

  section('DEPLOYABLE');
  row(null,
    button('deploy tower', () => rigdemo.spawn(),
           'assemble the contract demo watchtower beside you'),
    button('retract', () => rigdemo.retract(), 'take it apart, top down'),
    button('destroy', () => rigdemo.destroy(), 'break it into parts that fall to the ground'),
    button('remove', () => rigdemo.remove(), 'gone at once, no animation'),
  );
  slider('tower speed', 0.25, 3, 0.25, 1.5, (v) => rigdemo.setSpeed(v), (v) => `${v}x`);

  section('WAVE');

  const target = document.createElement('input');
  target.type = 'number';
  target.min = '1';
  target.className = 'dbg-num';
  target.value = String(state.wave);

  const note = Object.assign(document.createElement('div'), { className: 'dbg-note' });
  const wanted = () => Math.max(1, Math.round(+target.value) || 1);

  const paintWave = () => {
    const w = wanted();
    const fresh = BUG_TYPES.filter((t) => t.minWave === w).map((t) => t.key);
    note.textContent = `wave ${w} · ${quotaOf(w)} bugs · arena ${arena.radiusFor(w)}`
      + ` · ${BUG_TYPES.filter((t) => w >= t.minWave).length} types`
      + (bossesAt(w) ? ' · boss, no time limit' : '')
      + (fresh.length ? ` · new: ${fresh.join(', ')}` : '');
  };
  const aim = (n) => { target.value = String(Math.max(1, n)); paintWave(); };
  const go = (n) => { aim(n); world.hooks.startWave(wanted()); paintWave(); };

  target.oninput = paintWave;
  target.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(wanted()); } };

  row('jump to',
    button('−', () => aim(wanted() - 1)),
    target,
    button('+', () => aim(wanted() + 1)),
    button('GO', () => go(wanted()), 'start this wave now: arena resized, bugs cleared, healed'),
  );

  const firstRow = row('first at');
  for (const t of BUG_TYPES) {
    firstRow.appendChild(button(`${t.key} ${t.minWave}`, () => go(t.minWave),
      `${t.key} first appears on wave ${t.minWave}`));
  }

  // Not a shortcut past the tree: it hands over the coins a clean run would
  // have banked by then and leaves the spending to you.
  const kit = (wave) => {
    modules.reset();
    state.coins = purseBefore(wave);
    state.earned = state.coins;
    aim(wave);
    world.hooks.openModules(wave);
  };

  row('jump kit',
    ...[5, 10, 15, 20].map((wave) =>
      button(`wave ${wave} · ${fmt.coins(purseBefore(wave))}c`, () => kit(wave),
             `open the upgrade screen before wave ${wave}, tree cleared, with the `
             + `coins a run that cleared waves 1-${wave - 1} without dying would hold`)),
  );

  row(null,
    button('restart', () => go(state.wave), 'begin the current wave again'),
    button('next', () => go(state.wave + 1)),
    button('+5', () => go(state.wave + 5)),
  );

  row('collapse',
    button('sink', () => arena.startSink(),
           `close the ring in to ${CFG.arena.collapse.floor}u now, as the `
           + `${CFG.arena.collapse.after / 60}-minute limit does`),
    button('reopen', () => { arena.resetSink(); state.waveTime = 0; },
           'stop it, put the ring back and wind the wave clock to nought'),
    button('skip to limit', () => { state.waveTime = CFG.arena.collapse.after; },
           'run the wave clock up to the limit and let the wave trigger it'),
  );
  panel.appendChild(note);
  paintWave();

  const specialRead = specialpanel.build();
  panel.appendChild(specialRead.el);
  panel.__paintSpecial = specialRead.paint;

  section('PLAYER');
  row(null,
    toggle('invuln', () => world.debug.invuln, (v) => { world.debug.invuln = v; }),
    toggle('auto heal', () => world.debug.autoHeal, (v) => { world.debug.autoHeal = v; },
           'damage still lands and still shows — the bar just refills'),
    toggle('inf charges', () => world.debug.infiniteCharges,
           (v) => { world.debug.infiniteCharges = v; }),
    toggle('inf energy', () => world.debug.infiniteEnergy,
           (v) => { world.debug.infiniteEnergy = v; },
           'the dash and the jetpack cost nothing — the bar sits full'),
    button('heal', () => { world.player.health = modules.maxHealth(); }),
    button('refill', () => firing.refillGuns(world.player), 'every gun back to full charges'),
  );
  row('coins',
    ...[10, 50, 250].map((n) => button(`+${n}`, () => { state.coins += n; },
      'straight into the purse, for testing the module screen')),
    button('x2', () => { state.coins *= 2; }, 'double whatever the purse holds'),
    button('clear', () => { state.coins = 0; }),
  );

  section('WORLD');

  const terrainRow = row('terrain');
  const terrainButtons = [];
  const pick = (slug, label) => {
    const b = button(label, () => {
      applyTheme(slug);
      for (const [other, el] of terrainButtons) el.classList.toggle('on', other === slug);
    });
    b.classList.toggle('on', themes.current() === slug);
    terrainButtons.push([slug, b]);
    terrainRow.appendChild(b);
  };
  pick(null, 'default');
  for (const name of themes.names()) pick(name, name);

  slider('sun intensity', 0, 4, 0.05, SUN_DEFAULT,
         (v) => { sun.intensity = v; }, (v) => v.toFixed(2));

  const zoomNum = document.createElement('input');
  zoomNum.type = 'number';
  zoomNum.min = '1';
  zoomNum.step = '0.01';
  zoomNum.className = 'dbg-num';
  zoomNum.value = String(world.debug.zoomOut);

  const zoomBar = slider('zoom out', 1, 6, 0.01, world.debug.zoomOut,
    (v) => { world.debug.zoomOut = v; zoomNum.value = String(v); },
    (v) => `${v.toFixed(2)}x`);

  zoomNum.oninput = () => {
    const v = Math.max(1, parseFloat(zoomNum.value) || 1);
    world.debug.zoomOut = v;
    zoomBar.querySelector('input').value = String(v);
    zoomBar.querySelector('b').textContent = `${v.toFixed(2)}x`;
  };
  // The bar stops at 6x; the box takes anything, for a look from much further out.
  row('exact zoom', zoomNum);

  const wallCount = Object.assign(document.createElement('span'),
    { className: 'dbg-lbl', textContent: '' });
  wallCount.style.whiteSpace = 'nowrap';
  const paintWalls = () => { wallCount.textContent = `${CFG.walls.boxes.length} boxes`; };
  const rebuild = () => { walls.build(); debugdraw.forget(); paintWalls(); };

  row('walls',
    toggle('draw', () => world.debug.drawWalls, (v) => { world.debug.drawWalls = v; }),
    button('undo', () => { CFG.walls.boxes.pop(); rebuild(); }, 'remove the last box drawn'),
    button('clear all', () => { CFG.walls.boxes.length = 0; rebuild(); }),
    button('copy', () => {
      const text = CFG.walls.boxes
        .filter((b) => !b.hidden)
        .map((b) => `      { x: ${b.x}, z: ${b.z}, hx: ${b.hx}, hz: ${b.hz} },`)
        .join('\n');
      navigator.clipboard?.writeText(`boxes: [\n${text}\n    ],`);
    }, 'copy the layout as config, ready to paste'),
    wallCount,
  );
  row('paths',
    toggle('show bug paths', () => world.debug.showPaths,
           (v) => { world.debug.showPaths = v; forget(); }),
  );
  paintWalls();
  wallPainters.push(paintWalls);

  section('MODULES · GUNS');
  const grid = document.createElement('div');
  grid.className = 'dbg-mods';
  panel.appendChild(grid);

  const modCells = [];
  const cell = (u, into) => {
    const box = document.createElement('div');
    box.className = 'dbg-mod';
    const name = Object.assign(document.createElement('span'), { className: 'dbg-mod-name' });
    name.title = u.name;
    box.append(name, button('+', () => grant(u.id, 1)),
               button('M', () => grant(u.id, modules.maxLevel(u.id))));
    into.appendChild(box);
    modCells.push({ u, name });
  };

  for (const u of modules.MODULES) if (u.kind === 'gun') cell(u, grid);

  section('MODULES');
  const rest = document.createElement('div');
  rest.className = 'dbg-mods';
  panel.appendChild(rest);
  for (const u of modules.MODULES) if (u.kind !== 'gun') cell(u, rest);

  row(null,
    button('max all', () => { for (const u of modules.MODULES) grant(u.id, modules.maxLevel(u.id)); }),
    button('reset', () => { modules.reset(); paintModules(); }),
    button('+1m coins', () => { state.coins += 1e6; }, 'a million coins in the purse, to buy with'),
  );

  function grant(id, n) {
    for (let i = 0; i < n; i++) {
      if (modules.maxed(id)) break;
      state.levels[id] = (state.levels[id] || 0) + 1;
    }
    paintModules();
  }
  function paintModules() {
    for (const { u, name } of modCells) {
      const lv = modules.level(u.id);
      name.textContent = `${u.id} ${lv}/${modules.maxLevel(u.id)}`;
      name.classList.toggle('on', lv > 0);
    }
  }
  paintModules();
  panel.__paintModules = paintModules;

  const out = document.createElement('div');
  out.id = 'dbg-stat';
  panel.appendChild(out);
  panel.__stat = out;

  document.getElementById('ui').appendChild(panel);
}

function show(force) {
  if (!panel) build();
  open = force !== undefined ? force : !open;
  panel.classList.toggle('shown', open);

  document.body.classList.toggle('mixer-open',
    !!document.querySelector('#mixer.shown, #debugmenu.shown'));
}

export function update(dt) {
  dummies.update(dt);
  rigdemo.update(dt);
  // Outside the early return: measuring is most of what the tape is for once the
  // panel is shut and there is a fight to measure across.
  ruler.update();
  if (!open || !panel) return;
  panel.__paintRuler();
  for (const paint of wallPainters) paint();
  if (panel.__paintModules) panel.__paintModules();
  panel.__paintSpecial();
  const g = CFG.guns[world.player.gun];
  panel.__stat.textContent =
    `wave ${state.wave} · phase ${state.phase}/${state.phases} · `
    + `group ${waves.groupsOpened()}/${waves.groupsPlanned()} · `
    + `${world.bugs.length} alive · ${world.corpses.length} dying · `
    + `hp ${Math.round(world.player.health)} · ${g.id} `
    + `${world.player.guns[world.player.gun].charges.toFixed(1)}`
    + dummies.readout();
}

// Knocking, not a key: the panel is a developer tool and no longer advertised
// at the foot of the screen, so it takes five presses to admit it is there.
const KNOCKS = 5;
let knocks = 0;

export function init() {
  onDebug(() => {
    if (knocks < KNOCKS) knocks += 1;
    if (knocks >= KNOCKS) show();
  });
  onEscape(() => (open ? (show(false), true) : false));
}
