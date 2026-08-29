import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import * as skin from '../bug/skin.js';
import * as nearmiss from '../character/nearmiss.js';

// What a bug is still worth getting close to, burnt into its hide: a line of
// dots down the back, one a payout it has left, going out from the tail forward
// until the back is bare.
//
// They are painted into the emissive sheet the veins already live on rather than
// hung over the body as geometry. Nothing floats, nothing clips, and a dot
// follows every fold of the animal because it is the animal's own texture.
const D = () => CFG.nearmiss.dots;

const _box = new THREE.Box3();
const _ray = new THREE.Raycaster();
const _down = new THREE.Vector3(0, -1, 0);
const _from = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

// How much texture a face is given, as a radius in UV units for a dot of a
// wanted size on the hide. A sheet is stretched differently over a shoulder than
// over a flank, so a dot drawn at one size in the sheet comes out at a dozen on
// the animal unless the density under it is asked first.
function uvRadius(hit, want) {
  const geo = hit.object.geometry;
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  const f = hit.face;
  if (!uv || !pos || !f) return null;

  _a.fromBufferAttribute(pos, f.a).applyMatrix4(hit.object.matrixWorld);
  _b.fromBufferAttribute(pos, f.b).applyMatrix4(hit.object.matrixWorld);
  _c.fromBufferAttribute(pos, f.c).applyMatrix4(hit.object.matrixWorld);
  const world = _b.sub(_a).cross(_c.sub(_a)).length() / 2;

  const ax = uv.getX(f.a), ay = uv.getY(f.a);
  const skin = Math.abs((uv.getX(f.b) - ax) * (uv.getY(f.c) - ay)
                      - (uv.getX(f.c) - ax) * (uv.getY(f.b) - ay)) / 2;
  return world > 1e-9 && skin > 1e-12 ? want * Math.sqrt(skin / world) : null;
}

// Where the row sits, found by dropping a line onto the back and reading the
// texture coordinate it lands on. The model answers for its own anatomy, so no
// species table has to say where a back is.
export function markDots(body) {
  const C = D();
  if (!body) return null;

  _box.setFromObject(body);
  const long = _box.max.z - _box.min.z;
  if (!(long > 0)) return null;
  const mid = (_box.min.z + _box.max.z) / 2 + long * C.nudge;
  const n = CFG.nearmiss.perBug;

  const uvs = [];
  for (let i = 0; i < n; i++) {
    const along = n > 1 ? i / (n - 1) : 0.5;
    _from.set(0, _box.max.y + long, mid + (0.5 - along) * long * C.run);
    _ray.set(_from, _down);
    const hit = _ray.intersectObject(body, true)[0];
    const r = hit && hit.uv ? uvRadius(hit, long * C.size) : null;
    uvs.push(r ? { u: hit.uv.x, v: hit.uv.y, r } : null);
  }
  return uvs.some(Boolean) ? uvs : null;
}

// The sheet is the veins plus the dots still owed, so a level that lights the
// veins lights the dots with them, and a bug whose rung buys no glow at all is
// given just enough emissive to show the row.
export function update() {
  const C = D();

  for (const bug of world.bugs) {
    const uvs = bug.model.parts.dotUv;
    if (!uvs || bug.flash > 0) continue;

    // Worn whether or not the run has anything to spend them on: what the row
    // says about a bug is true of the bug, not of the player's tree.
    const left = bug.shown ? nearmiss.left(bug) : 0;

    for (const m of bug.model.parts.materials || []) {
      const u = m.userData;
      if (!m.emissive || !u.veins) continue;

      // Spent, and back to exactly the animal it was.
      if (left <= 0) {
        if (m.emissiveMap === u.veins) continue;
        m.emissiveMap = u.veins;
        m.emissive.setHex(u.baseEmissive);
        m.emissiveIntensity = u.baseEmissiveIntensity;
        continue;
      }

      const want = skin.dotSheets(bug.type, uvs, CFG.nearmiss.perBug)[left];
      if (m.emissiveMap !== want) m.emissiveMap = want;
      // An animal whose level lights nothing is given just enough to show the
      // row. Its veins come up with it, which is the price of sharing the sheet.
      if (u.baseEmissiveIntensity <= 0) {
        m.emissive.setHex(C.color);
        m.emissiveIntensity = C.glow;
      }
    }
  }
}

export const clear = () => {};
