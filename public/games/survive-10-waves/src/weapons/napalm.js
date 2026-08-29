import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import * as fx from '../fx/spatter.js';
import * as fire from '../fx/fire.js';
import { SPLAT_TEX } from '../fx/textures.js';
import * as combat from '../game/combat.js';

const LAUNCHER = CFG.guns.find((g) => g.projectile === 'grenade');

const pools = [];

const _lay = new THREE.Vector3();
const _at = new THREE.Vector3();

function layFire(x, z, radius) {
  const N = CFG.napalm;
  _lay.set(x, 0, z);
  fx.addHazard(_lay, radius * 1.25, N.scorch, N.life, 0, SPLAT_TEX);
  for (let i = 0, n = 3 + ((Math.random() * 3) | 0); i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = radius * (0.4 + Math.random() * 0.7);
    _lay.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
    fx.addHazard(_lay, radius * (0.4 + Math.random() * 0.4), N.color, N.life * 0.8, 0, SPLAT_TEX);
  }
}

// A pool knows who lit it and what it costs whoever lit it: the launcher's own
// napalm burns the player standing in it, and the drone's does not — nothing it
// drops on its own initiative is allowed to set you on fire.
export function pour(x, z, radius, tickDamage, heat = 1,
                     { by = LAUNCHER.name, selfShare = CFG.napalm.selfShare } = {}) {
  layFire(x, z, radius);
  fire.ignite(x, z, radius, CFG.napalm.life, heat);
  pools.push({ x, z, radius, tickDamage, by, selfShare, life: CFG.napalm.life, tick: 0 });
}

export function clear() { pools.length = 0; }

const covers = (a, x, z, pad) => Math.hypot(x - a.x, z - a.z) <= a.radius + pad;

// Fire is fire: standing in three pools at once burns no faster than standing
// in the worst of them.
function hottest(due, x, z, pad, share = 1) {
  let worst = null;
  for (const a of due) {
    if (!covers(a, x, z, pad)) continue;
    if (!worst || a.tickDamage * share(a) > worst.tickDamage * share(worst)) worst = a;
  }
  return worst;
}

const whole = () => 1;
const own = (a) => a.selfShare;

const _caught = [];

function burn(due) {
  _caught.length = 0;
  for (const b of world.bugs) {
    const a = hottest(due, b.pos.x, b.pos.z, b.radius, whole);
    if (a && a.tickDamage >= 1) _caught.push(b, a);
  }

  for (let i = 0; i < _caught.length; i += 2) {
    const b = _caught[i], a = _caught[i + 1];
    _at.set(b.pos.x, 0, b.pos.z);
    combat.hurt(b, Math.round(a.tickDamage), _at, 0.3, a.by);
  }

  const p = world.player;
  const mine = hottest(due, p.pos.x, p.pos.z, CFG.player.radius, own);
  const bite = mine ? mine.tickDamage * mine.selfShare : 0;
  if (bite > 0) {
    world.hooks.damagePlayer(Math.max(1, Math.round(bite)),
                             { stacks: true, by: 'your own napalm' });
  }
}

const _due = [];

export function update(dt) {
  const N = CFG.napalm;
  _due.length = 0;

  for (let i = pools.length - 1; i >= 0; i--) {
    const a = pools[i];
    a.life -= dt;
    if (a.life <= 0) { pools[i] = pools[pools.length - 1]; pools.pop(); continue; }

    a.tick -= dt;
    if (a.tick > 0) continue;
    a.tick = N.tick;
    _due.push(a);
  }

  if (_due.length) burn(_due);
}
