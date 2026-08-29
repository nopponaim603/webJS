import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { gibs } from './spatter.js';
import { GEO, ZONE_TEX, ZONE_FILL } from './textures.js';
import { makeGlow } from './glow.js';
import { clip } from '../arena/clip.js';

// What a near miss looks like from inside it. Two rings on one clock: one runs
// outward to the width the module actually pays over, and one snaps inward onto
// the boots — the outward half is the attack leaving, the inward half is the
// moment closing on you. They meet at the flash.
const G = () => CFG.graze.ring;

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

const _at = new THREE.Vector3();
const _dir = new THREE.Vector3();

const skin = () => clip(new THREE.MeshBasicMaterial({
  map: ZONE_TEX.annulus, color: G().color, transparent: true, opacity: 0,
  depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
}));

const rings = makePool(
  () => {
    const mesh = new THREE.Mesh(DISC, skin());
    mesh.renderOrder = 3;
    mesh.visible = false;
    scene.add(mesh);
    const snap = new THREE.Mesh(DISC, skin());
    snap.renderOrder = 4;
    scene.add(snap);
    const spark = makeGlow(G().color, 1, 0);
    spark.renderOrder = 7;
    scene.add(spark);
    return { mesh, snap, spark, t: 0, span: 1 };
  },
  (r, x, z, span, color) => {
    r.t = 0;
    r.span = span;
    r.spark.material.color.setHex(color);
    for (const m of [r.mesh, r.snap]) {
      m.material.color.setHex(color);
      m.position.set(x, 0.07, z);
      m.rotation.y = Math.random() * Math.PI;
      m.visible = true;
    }
    r.spark.position.set(x, CFG.player.height * 0.55, z);
    r.spark.visible = true;
  },
);

// Thrown out along the ground rather than dropped: the grit is the attack's
// wake, so it leaves the way the attack went.
function grit(x, z, span, color) {
  const C = G();
  for (let i = 0; i < C.grit; i++) {
    const a = Math.random() * Math.PI * 2;
    _at.set(x + Math.cos(a) * span * 0.35, 0.3 + Math.random() * 0.7,
            z + Math.sin(a) * span * 0.35);
    const g = gibs.spawn(_at, color, 0.4, GEO.spark);
    _dir.set(Math.cos(a), 0.35 + Math.random() * 0.5, Math.sin(a));
    g.vel.addScaledVector(_dir, C.gritSpeed * (0.6 + Math.random() * 0.8));
    g.life = C.gritLife * (0.7 + Math.random() * 0.6);
  }
}

export const live = rings.live;

export function pulse(x, z, span, color = G().color) {
  rings.spawn(x, z, span, color);
  grit(x, z, span, color);
}

// Fast open, slow fade: the ring is a thing that happened, not a thing standing
// there. The flash runs on a fraction of the same clock, so it reads as the
// moment and the rings as its wake.
export function update(dt) {
  const C = G();
  for (let i = rings.live.length - 1; i >= 0; i--) {
    const r = rings.live[i];
    r.t += dt;
    const k = r.t / C.life;
    if (k >= 1) {
      r.mesh.visible = r.snap.visible = r.spark.visible = false;
      rings.release(i);
      continue;
    }

    const open = 1 - Math.pow(1 - k, 3);
    const wide = r.span * (C.from + (1 - C.from) * open);
    r.mesh.scale.setScalar(wide * 2 / ZONE_FILL);
    r.mesh.material.opacity = C.alpha * Math.pow(1 - k, 1.6);

    // In on a shorter clock and gone the moment it lands, so the two are only
    // ever both on the floor at the start.
    const shut = Math.min(1, k / C.snap);
    r.snap.scale.setScalar(r.span * C.snapFrom * (1 - shut) * 2 / ZONE_FILL);
    r.snap.material.opacity = C.snapAlpha * (1 - shut) * (1 - shut);

    const flash = Math.max(0, 1 - k / C.flash);
    r.spark.scale.setScalar(C.spark * r.span * (0.5 + 0.9 * flash));
    r.spark.material.opacity = C.sparkAlpha * flash * flash;
  }
}

export function clear() {
  for (let i = rings.live.length - 1; i >= 0; i--) {
    const r = rings.live[i];
    r.mesh.visible = r.snap.visible = r.spark.visible = false;
    rings.release(i);
  }
}
