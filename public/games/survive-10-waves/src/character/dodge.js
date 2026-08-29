import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as floaters from '../ui/floaters.js';
import * as grazering from '../fx/grazering.js';
import * as firing from '../weapons/firing.js';
import * as hud from '../ui/hud.js';
import { audio } from '../engine/audio.js';
import * as health from './health.js';
import * as adrenaline from './adrenaline.js';
import * as nearmiss from './nearmiss.js';

const _at = new THREE.Vector3();

const armed = () => modules.reflexOn() && world.player && !world.player.dead;

// The ground a dash has just left, while the leaving is still recent enough to
// have been an escape from what is landing now. Null when there is nothing to
// ask about, so a site does no geometry it does not need.
export function leaving() {
  if (!armed()) return null;
  const p = world.player;
  return state.time - p.dashAt <= modules.dodgeWindow() ? p.dashFrom : null;
}

// A sweep leaves no ground to have been standing in, so what is asked instead is
// how close the thing was when the dash went in. Judged on the first frame of
// the pass after the dash, which is within a frame of the dash itself, and once
// per dash per pass — a second dash into the same charge is a second escape.
const judged = new WeakMap();

export function sweeping(key, dist, from) {
  if (!armed() || nearmiss.spent(from)) return;
  const p = world.player;
  if (state.time - p.dashAt > modules.dodgeWindow()) return;
  if (judged.get(key) === p.dashAt) return;
  judged.set(key, p.dashAt);
  if (dist <= modules.dodgeReach()) paid(p.pos.x, p.pos.z, from);
}

// Said over the ground that was left rather than over the player: what the
// player is being shown is where they are not standing any more.
export function paid(x, z, from, volley) {
  if (nearmiss.spent(from)) return;
  const p = world.player;
  // Pieces of one field landing on the ground just left are one dash out of the
  // way, not one each — the same rule a sweep is judged by.
  if (volley) {
    if (judged.get(volley) === p.dashAt) return;
    judged.set(volley, p.dashAt);
  }
  nearmiss.take(from);
  const D = CFG.dodge;
  grazering.pulse(x, z, D.span, D.color);
  hud.flashGraze();
  audio.playAt('graze', x, z,
               { rate: D.rate[0] + Math.random() * (D.rate[1] - D.rate[0]) });

  firing.topUpGuns(p, modules.dodgeCharge());
  const got = health.heal(p, modules.dodgeHeal(adrenaline.scored()));
  if (got < 1) return;
  _at.set(p.pos.x, CFG.player.height * 1.05, p.pos.z);
  floaters.heal(_at, Math.round(got));
}
