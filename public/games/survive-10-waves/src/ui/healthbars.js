import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, camera } from '../engine/view.js';
import { world } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as labels from './labels.js';
import * as drone from '../allies/drone.js';
import * as boomerangs from '../bug/boomerangs.js';

const B = () => CFG.bugAnim.healthBar;

const PLANE = new THREE.PlaneGeometry(1, 1);

function bank(color, order) {
  const m = new THREE.InstancedMesh(PLANE, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0, depthWrite: false, depthTest: false,
    side: THREE.DoubleSide,
  }), B().max);
  m.renderOrder = order;
  m.frustumCulled = false;
  m.count = 0;
  scene.add(m);
  return m;
}

let track = null;
let fill = null;

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _tint = new THREE.Color();

export function clear() {
  if (track) { track.count = 0; fill.count = 0; }
}

// One bar, flat above whatever it belongs to and turned to face the camera, so
// it reads the same wherever that thing is on screen.
function draw(n, unit, high, wide, thick) {
  const C = B();
  const share = Math.max(0, unit.hp / unit.hpMax);
  _p.set(unit.pos.x, (unit.alt || 0) + high, unit.pos.z);

  _s.set(wide, thick, 1);
  track.setMatrixAt(n, _m.compose(_p, camera.quaternion, _s));

  _p.x -= (wide * (1 - share)) / 2 * camera.matrixWorld.elements[0];
  _p.z -= (wide * (1 - share)) / 2 * camera.matrixWorld.elements[2];
  _s.x = wide * share;
  fill.setMatrixAt(n, _m.compose(_p, camera.quaternion, _s));
  fill.setColorAt(n, _tint.setHex(share > 0.5 ? C.full : share > 0.22 ? C.hurt : C.dying));
}

export function update() {
  if (!track) { track = bank(B().back, 7); fill = bank(0xffffff, 8); }

  const C = B();
  // Reading an enemy is what the augur buys. Your own machines are always
  // legible, so the bars themselves are never switched off — what is drawn is.
  const on = modules.sees('health');
  const counting = modules.sees('count');
  track.material.opacity = C.backAlpha;
  fill.material.opacity = C.alpha;
  labels.begin(C.labels);

  let n = 0;
  if (on) {
    for (const bug of world.bugs) {
      if (n >= C.max || bug.dummy || bug.hp >= bug.hpMax) continue;
      const high = (bug.model.parts.height || 1) * bug.grow + C.lift * bug.grow;
      draw(n, bug, high, bug.radius * C.wide, C.thick * bug.grow);
      if (counting) labels.put(bug, high + C.labelLift * bug.grow);
      n += 1;
    }

    // A bone is read like anything else you can shoot down: it flies, so its own
    // height is where its bar goes.
    for (const b of boomerangs.live) {
      if (n >= C.max || b.hp >= b.hpMax) continue;
      const high = b.pos.y + C.lift;
      draw(n, b, high, CFG.boomerang.radius * b.grow * C.wide, C.thick * b.grow);
      if (counting) labels.put(b, high + C.labelLift);
      n += 1;
    }
  }

  for (const d of drone.list()) {
    if (n >= C.max || d.hp >= d.hpMax) continue;
    // It hangs in the air, so its own height is where the bar goes.
    const high = d.pos.y + C.lift;
    draw(n, d, high, d.radius * C.wide, C.thick);
    labels.put(d, high + C.labelLift);
    n += 1;
  }

  labels.end();
  track.count = fill.count = n;
  track.instanceMatrix.needsUpdate = true;
  fill.instanceMatrix.needsUpdate = true;
  if (fill.instanceColor) fill.instanceColor.needsUpdate = true;
}
