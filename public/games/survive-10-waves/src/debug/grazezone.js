import * as THREE from 'three';
import { CFG, BUG_TYPES } from '../config/index.js';
import { world } from '../core/world.js';
import { scene } from '../engine/view.js';
import { segDist2 } from '../core/geom2.js';
import * as modules from '../modules/index.js';
import * as pattern from '../bug/patterns.js';
import * as spikes from '../bug/spikes.js';
import * as spit from '../bug/spit.js';
import * as bombs from '../bug/bombs.js';

// Not an outline and not an idea of one: the floor is asked the same question
// the resolver asks, cell by cell. Red is what would hurt, green is what would
// pay. Every shape here is read off the attack that owns it, so a band with
// square corners shows square corners.
const CAP = 9000;
const STEP = 0.45;
const EVERY = 0.1;
const PAD = () => CFG.player.radius * 0.5;

const geo = new THREE.PlaneGeometry(STEP * 0.85, STEP * 0.85).rotateX(-Math.PI / 2);
const skin = (color, opacity) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, depthWrite: false,
});

let hurt = null;
let pays = null;
let wait = 0;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);

const shapes = [];
const live = [];

function build() {
  const make = (mat, order, name) => {
    const m = new THREE.InstancedMesh(geo, mat, CAP);
    m.name = name;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    m.renderOrder = order;
    scene.add(m);
    return m;
  };
  hurt = make(skin(0xff2a2a, 0.30), 8, 'grazeHurt');
  pays = make(skin(0x7ee0a1, 0.38), 8, 'grazePays');
}

// Everything telegraphed that is live right now, in the terms the graze judges
// it: a circle, an oriented band, or the line a charge is pointed down.
function collect() {
  shapes.length = 0;
  const R = CFG.player.radius;

  for (const z of spikes.zones(live)) shapes.push({ zone: z, pad: PAD() });
  for (const a of spit.incoming([])) {
    shapes.push({ pool: a, pad: CFG.player.radius * CFG.spit.pool.grip });
  }

  const boom = BUG_TYPES.find((t) => t.key === 'bomber').burst.radius;
  for (const b of bombs.flying()) shapes.push({ x: b.to.x, z: b.to.z, r: boom + R });

  for (const bug of world.bugs) {
    if (bug.slam) {
      shapes.push({ x: bug.pos.x, z: bug.pos.z,
                    r: CFG.slam.radius * (bug.grow || 1) + R });
    }
    if (bug.leap) shapes.push({ x: bug.leap.to.x, z: bug.leap.to.z, r: bug.leap.reach });
    if (bug.rush) {
      const C = CFG[bug.charging || bug.type.charge];
      shapes.push({ ax: bug.pos.x, az: bug.pos.z,
                    bx: bug.pos.x + bug.rush.dir.x * C.distance,
                    bz: bug.pos.z + bug.rush.dir.z * C.distance,
                    r: bug.radius + R });
    }
  }
  return shapes;
}

// How far outside a shape a spot is, negative while it is inside it — the same
// arithmetic each attack does for its own hit test.
let BAND = 0;

function outsideOf(s, x, z) {
  if (s.zone) return pattern.outside(s.zone, { x, z }) - s.pad;
  if (s.pool) {
    return spit.onPool(s.pool, x, z, s.pad, CFG.spit.pool.edge)
      ? 0 : spit.outsidePool(s.pool, x, z, s.pad, CFG.spit.pool.edge, modules.grazeBand());
  }
  if (s.ax !== undefined) return Math.sqrt(segDist2(s.ax, s.az, s.bx, s.bz, x, z)) - s.r;
  return Math.hypot(x - s.x, z - s.z) - s.r;
}

const reachOf = (s) => (s.zone
  ? Math.max(s.zone.band ? s.zone.hw : s.zone.r, s.zone.band ? s.zone.hl : s.zone.r) + s.pad
  : (s.pool ? s.pool.bound + s.pad : s.r));

function paint() {
  const band = modules.grazeBand();
  BAND = band;
  let red = 0, green = 0;

  for (const s of collect()) {
    const cx = s.ax !== undefined ? (s.ax + s.bx) / 2 : (s.zone || s.pool || s).x;
    const cz = s.az !== undefined ? (s.az + s.bz) / 2 : (s.zone || s.pool || s).z;
    const span = reachOf(s) + band
      + (s.ax !== undefined ? Math.hypot(s.bx - s.ax, s.bz - s.az) / 2 : 0);

    for (let x = cx - span; x <= cx + span; x += STEP) {
      for (let z = cz - span; z <= cz + span; z += STEP) {
        const out = outsideOf(s, x, z);
        if (out > band) continue;
        const into = out > 0 ? pays : hurt;
        const n = out > 0 ? green++ : red++;
        if (n >= CAP) continue;
        _p.set(x, 0.1, z);
        into.setMatrixAt(n, _m.compose(_p, _q, _s));
      }
    }
  }

  hurt.count = Math.min(red, CAP);
  pays.count = Math.min(green, CAP);
  hurt.instanceMatrix.needsUpdate = true;
  pays.instanceMatrix.needsUpdate = true;
}

export function update(dt) {
  if (!world.debug.grazeZones) {
    if (hurt) hurt.count = pays.count = 0;
    return;
  }
  if (!hurt) build();

  wait -= dt;
  if (wait > 0) return;
  wait = EVERY;
  paint();
}
