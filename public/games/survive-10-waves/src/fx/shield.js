import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { lift } from '../character/jetpack.js';
import * as effects from '../items/effects.js';
import * as drone from '../allies/drone.js';
import * as goldberg from './goldberg.js';

const S = () => CFG.player.shield;

// One cage, built once: the panels lit from inside and their edges drawn over
// the top, so what reads at a glance is the pattern rather than a ball of glow.
const { shell: SHELL, cage: CAGE } = goldberg.build(1);

function build() {
  const skin = new THREE.Mesh(SHELL, new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  const wire = new THREE.LineSegments(CAGE, new THREE.LineBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  for (const m of [skin, wire]) {
    m.renderOrder = 5;
    m.visible = false;
    scene.add(m);
  }
  return { skin, wire };
}

const cages = [];
const cageAt = (i) => cages[i] || (cages[i] = build());

const _hot = new THREE.Color();
const _cool = new THREE.Color();
const _tint = new THREE.Color();
let beat = 0;
let spin = 0;
let shown = 0;

export function clear() {
  for (const { skin, wire } of cages) {
    for (const m of [skin, wire]) { m.visible = false; m.material.opacity = 0; }
  }
  beat = spin = shown = 0;
}

function draw(i, x, y, z, wide, cap, left) {
  const C = S();
  const wave = 0.5 + 0.5 * Math.sin(beat);
  // Fading as it runs out, so the moment cover ends is visible rather than
  // something you find out by being bitten.
  const life = Math.min(1, left / C.fade);
  const size = wide * (1 + 0.05 * wave);
  const { skin, wire } = cageAt(i);

  for (const m of [skin, wire]) {
    m.visible = true;
    m.material.color.copy(_tint);
    m.position.set(x, y, z);
    m.scale.set(size, size * cap, size);
    m.rotation.y = spin;
  }
  skin.material.opacity = C.glow * life * (0.55 + 0.45 * wave);
  wire.material.opacity = C.rim * life * (0.7 + 0.3 * wave);
}

function hideFrom(n) {
  for (let i = n; i < shown; i++) {
    for (const m of [cages[i].skin, cages[i].wire]) { m.visible = false; m.material.opacity = 0; }
  }
  shown = n;
}

export function update(dt) {
  const p = world.player;
  // The machines are covered by the pickup alone: what the dash and the charge
  // buy is cover for the body that spent it.
  const lent = p ? effects.covered(p) : 0;
  const own = p ? Math.max(p.invuln, lent) : 0;
  if (own <= 0 && lent <= 0) {
    if (shown) clear();
    return;
  }

  const C = S();
  beat += dt * C.beat;
  spin += dt * C.spin;
  const wave = 0.5 + 0.5 * Math.sin(beat);

  // Yellow at the top of the beat and orange at the bottom of it, rather than
  // one colour breathing: the swing is what makes it read as powered.
  _tint.copy(_hot.setHex(C.hot)).lerp(_cool.setHex(C.color), wave);

  let n = 0;
  if (own > 0) {
    draw(n++, p.pos.x, p.pos.y + lift(p) + CFG.player.height * C.rise, p.pos.z,
         C.radius, C.cap, own);
  }
  if (lent > 0) {
    for (const d of drone.list()) {
      draw(n++, d.pos.x, d.pos.y, d.pos.z, d.radius * C.machine, 1, lent);
    }
  }
  hideFrom(n);
}
