import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { scene } from '../engine/view.js';
import { burning, onPool } from '../bug/spit.js';

// Not the art and not the circle: the ground is asked the same question the
// damage tick asks, cell by cell, and every cell that answers yes is painted.
// What shows is the hitbox itself, dilated by the player's own radius exactly
// as the test dilates it.
const CAP = 6000;
const STEP = 0.6;
const EVERY = 0.25;

const geo = new THREE.PlaneGeometry(STEP * 0.9, STEP * 0.9).rotateX(-Math.PI / 2);
const mat = new THREE.MeshBasicMaterial({
  color: 0xff2a2a, transparent: true, opacity: 0.45, depthWrite: false,
});

let mesh = null;
let wait = 0;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);

function build() {
  mesh = new THREE.InstancedMesh(geo, mat, CAP);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.renderOrder = 8;
  scene.add(mesh);
}

function paint() {
  let n = 0;
  const pad = CFG.player.radius;
  const cut = CFG.spit.pool.edge;

  for (const a of burning()) {
    const reach = a.bound + pad;
    for (let x = -reach; x <= reach && n < CAP; x += STEP) {
      for (let z = -reach; z <= reach && n < CAP; z += STEP) {
        if (!onPool(a, a.x + x, a.z + z, pad, cut)) continue;
        _p.set(a.x + x, 0.09, a.z + z);
        mesh.setMatrixAt(n++, _m.compose(_p, _q, _s));
      }
    }
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
}

export function update(dt) {
  if (!world.debug.acidBoxes) {
    if (mesh) mesh.count = 0;
    return;
  }
  if (!mesh) build();

  wait -= dt;
  if (wait > 0) return;
  wait = EVERY;
  paint();
}
