import * as THREE from 'three';
import { BUG_TYPES } from '../config/index.js';
import { world } from '../core/world.js';
import { scene } from '../engine/view.js';
import * as bugs from '../bug/roster.js';
import * as arena from '../arena/size.js';

const HP = 1e9;
const PLOT = { dist: 11, gap: 2.8, cols: 4 };
const PILLAR = { height: 3.2, color: 0x9aa6b8, ring: 0xff7a5c };
const BURST_END = 1.2;

const stock = BUG_TYPES.find((t) => t.key === 'tank') || BUG_TYPES[0];

const geo = new THREE.CylinderGeometry(stock.radius, stock.radius, PILLAR.height, 12);
const mat = new THREE.MeshStandardMaterial({ color: PILLAR.color, roughness: 0.7 });
const bandGeo = new THREE.TorusGeometry(stock.radius * 1.02, 0.09, 6, 16);
const bandMat = new THREE.MeshBasicMaterial({ color: PILLAR.ring });

const live = [];
let dealt = 0, span = 0, idle = 0, hpLast = 0, dps = 0;

export const count = () => live.length;

const totalHp = () => live.reduce((sum, d) => sum + d.bug.hp, 0);

function place(k, out) {
  const p = world.player;
  const col = k % PLOT.cols, rowN = Math.floor(k / PLOT.cols);
  const wide = (col - (PLOT.cols - 1) / 2) * PLOT.gap;
  const deep = PLOT.dist + rowN * PLOT.gap;
  const a = Math.atan2(p.aim.x, p.aim.z);
  out.set(p.pos.x + Math.sin(a) * deep + Math.cos(a) * wide, 0,
          p.pos.z + Math.cos(a) * deep - Math.sin(a) * wide);

  const lim = arena.radius() - stock.radius - 1;
  const d = Math.hypot(out.x, out.z);
  if (d > lim) { out.x *= lim / d; out.z *= lim / d; }
  return out;
}

const _at = new THREE.Vector3();

export function spawn(n) {
  clear();
  for (let k = 0; k < n; k++) {
    const bug = bugs.spawn(stock, place(k, _at));
    bug.dummy = true;
    bug.hp = HP;
    bug.model.object.visible = false;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(bug.pos.x, PILLAR.height / 2, bug.pos.z);
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = PILLAR.height * 0.28;
    mesh.add(band);
    scene.add(mesh);
    live.push({ bug, mesh });
  }
  resetMeter();
}

export function clear() {
  for (const d of live) {
    scene.remove(d.mesh);
    const at = world.bugs.indexOf(d.bug);
    if (at >= 0) bugs.despawn(at);
  }
  live.length = 0;
  resetMeter();
}

export function resetMeter() {
  dealt = 0; span = 0; idle = 0; dps = 0;
  hpLast = totalHp();
}

export function update(dt) {
  if (!live.length) return;
  const hp = totalHp();
  const hit = hpLast - hp;
  hpLast = hp;

  if (hit > 0) {
    dealt += hit;
    span += idle + dt;
    idle = 0;
    dps = dealt / span;
  } else if (dealt > 0) {
    idle += dt;
    if (idle > BURST_END) { dealt = 0; span = 0; idle = 0; }
  }
}

export function readout() {
  if (!live.length) return '';
  return ` · ${live.length} dummies · ${Math.round(dealt)} dmg in ${span.toFixed(1)}s`
    + ` · ${Math.round(dps)} dps`;
}
