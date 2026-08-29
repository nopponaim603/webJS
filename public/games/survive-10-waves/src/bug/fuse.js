import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { audio } from '../engine/audio.js';
import * as modules from '../modules/index.js';
import * as bugs from './roster.js';
import * as evolve from './evolve.js';
import { clip } from '../arena/clip.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';

// A bomber does not have to be shot to be spent. Once it is close enough that
// the blast would reach the player it stops where it stands, swells, and goes
// off. The fuse is what makes that fair — long enough to walk out of, and drawn
// on the body as well as on the floor so it can be read without the augur. Walk
// out of the circle and it goes out: what the player buys with the step back is
// the bomber still coming, not the bomber spent.

const F = () => CFG.bomberFuse;

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

// Drawn at the blast it will make rather than at the body making it, and on the
// soft rim every other telegraph in the game uses.
const rings = makePool(
  () => {
    const mesh = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.annulus, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh };
  },
  (r, x, z, radius) => {
    r.mesh.position.set(x, 0.05, z);
    r.mesh.scale.setScalar((radius * 2) / ZONE_FILL);
    r.mesh.material.color.setHex(F().ring.color);
    r.mesh.material.opacity = 0;
  },
);

export function clear() { rings.clear(); }

const reachOf = (bug) => evolve.burstRadius(bug) * F().arm;

function light(bug) {
  const shown = modules.sees('attacks') || F().alwaysWarn;
  bug.fuse = {
    t: F().time,
    ring: shown ? rings.spawn(bug.pos.x, bug.pos.z, evolve.burstRadius(bug)) : null,
    beat: 0,
  };
  audio.playAt(F().sfx, bug.pos.x, bug.pos.z, { rate: 0.95 + Math.random() * 0.1 });
}

// The last thing it does is die, and dying is already what sets a bomber off:
// the burst, the coins and the corpse all come out of the one path a shot down
// bomber takes, so there is no second copy of any of it here.
function blow(bug) {
  drop(bug);
  bugs.kill(bug);
}

// The swell is written straight onto the model, so putting a fuse out has to put
// the body back: a corpse or a chase left wearing half a fuse is the one way
// this can be seen to have gone wrong.
function drop(bug) {
  if (bug.fuse && bug.fuse.ring) rings.releaseObject(bug.fuse.ring);
  bug.fuse = null;
  bug.model.object.scale.setScalar(bug.type.scale * bug.grow);
}

function snuff(bug) {
  drop(bug);
  bug.fuseCd = F().relight;
}

export function forget(bug) { if (bug.fuse) drop(bug); }

// Faster and wider the closer it is to going, so the beat itself is the count:
// a body that is merely lit and a body about to open read differently at a
// glance, which is the whole of what the warning has to do.
function swell(bug, dt, k) {
  const G = bug.type.glow;
  const glow = bug.shown ? bug.model.parts.glow : null;
  const P = F().pulse;

  bug.pulse += P.rate * (1 + k * P.gain) * dt;
  const beat = Math.sin(bug.pulse) ** 2;

  const grow = 1 + k * F().swell;
  bug.model.object.scale.setScalar(bug.type.scale * bug.grow * grow);
  if (!glow) return;
  glow.material.opacity = Math.min(1, G.min + (1 - G.min) * beat + k * 0.5);
  glow.scale.setScalar(bug.model.parts.span * G.size * (0.82 + 0.32 * beat) * grow);
}

function paint(bug, k) {
  const r = bug.fuse.ring;
  if (!r) return;
  const R = F().ring;
  r.mesh.position.set(bug.pos.x, 0.05, bug.pos.z);
  const beat = 0.5 + 0.5 * Math.sin(bug.fuse.beat * R.pulse * (1 + k * 2));
  r.mesh.material.opacity = R.opacity * (R.dim + (1 - R.dim) * beat) * Math.min(1, k * 4 + 0.25);
}

// Owns the frame while it burns: a bomber winding up does not also get to keep
// closing, or the beat it hands the player is one they cannot use. Answering
// false hands the frame straight back to the chase, which is what a fuse that
// has just gone out wants.
export function update(bug, dist, dt) {
  if (!bug.type.fuse) return false;

  if (!bug.fuse) {
    bug.fuseCd = Math.max(0, (bug.fuseCd || 0) - dt);
    if (bug.fuseCd > 0 || dist > reachOf(bug)) return false;
    light(bug);
  }

  if (dist > reachOf(bug) * F().letGo) { snuff(bug); return false; }

  const f = bug.fuse;
  f.t -= dt;
  f.beat += dt;
  const k = 1 - Math.max(0, f.t) / F().time;

  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);
  swell(bug, dt, k);
  paint(bug, k);

  if (f.t > 0) return true;
  blow(bug);
  return true;
}
