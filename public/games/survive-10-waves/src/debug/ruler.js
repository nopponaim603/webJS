import * as THREE from 'three';
import { scene, camera, renderer } from '../engine/view.js';
import { mouse } from '../engine/input.js';

// Straight-line distance between two spots on the floor, in the units everything
// else in the config is written in. Two clicks: the first plants the tape, the
// second lets it go — and until it does, the far end follows the cursor so the
// number moves while you look for the spot you meant.
const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const Y = 0.25;

const ray = new THREE.Raycaster();
const _hit = new THREE.Vector3();

let armed = false;
let from = null;
let to = null;
let kit = null;

function build() {
  const mat = new THREE.LineBasicMaterial({ color: 0xffd479, depthTest: false });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  line.renderOrder = 9;

  const pegs = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6),
                             new THREE.MeshBasicMaterial({ color: 0xffd479, depthTest: false }));
    m.renderOrder = 9;
    scene.add(m);
    return m;
  });
  scene.add(line);

  // Its own element rather than a floater: a measurement is not a thing that
  // rises and fades, it sits on the tape until the tape is moved.
  const tag = document.createElement('div');
  tag.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:none;'
    + 'font:600 12px/1 ui-monospace,monospace;letter-spacing:1px;color:#ffd479;'
    + 'text-shadow:0 0 6px #000,0 1px 2px #000;z-index:6;display:none';
  document.body.appendChild(tag);

  kit = { line, pegs, tag };
  return kit;
}

const onGround = () => (ray.setFromCamera(mouse.ndc, camera),
                        ray.ray.intersectPlane(GROUND, _hit) ? _hit.clone() : null);

// Caught on the way down to the canvas rather than on it: the canvas already has
// a pointerdown that pulls the trigger, and a measurement should not also be a
// burst of rifle fire.
addEventListener('pointerdown', (e) => {
  if (!armed || e.target !== renderer.domElement) return;
  const at = onGround();
  if (!at) return;
  e.preventDefault();
  e.stopPropagation();
  if (!from || to) { from = at; to = null; } else { to = at; }
}, true);

export const isArmed = () => armed;

export function arm(on) {
  armed = on;
  if (!on) hide();
}

export function reset() {
  from = null;
  to = null;
  hide();
}

function hide() {
  if (!kit) return;
  kit.line.visible = false;
  for (const peg of kit.pegs) peg.visible = false;
  kit.tag.style.display = 'none';
}

export const span = () => {
  const far = to || (armed && from ? onGround() : null);
  return from && far ? Math.hypot(far.x - from.x, far.z - from.z) : 0;
};

export const readout = () => {
  if (!from) return armed ? 'click the ground' : '';
  const far = to || onGround();
  if (!far) return '';
  return `${Math.hypot(far.x - from.x, far.z - from.z).toFixed(2)}u`
    + (to ? '' : ' …');
};

export function update() {
  if (!kit) build();
  const far = from ? (to || (armed ? onGround() : null)) : null;
  if (!from || !far) { hide(); return; }

  const pos = kit.line.geometry.attributes.position;
  pos.setXYZ(0, from.x, Y, from.z);
  pos.setXYZ(1, far.x, Y, far.z);
  pos.needsUpdate = true;
  kit.line.geometry.setDrawRange(0, 2);
  kit.line.computeLineDistances?.();
  kit.line.visible = true;

  for (const [i, at] of [from, far].entries()) {
    kit.pegs[i].position.set(at.x, Y, at.z);
    kit.pegs[i].visible = true;
  }

  _hit.set((from.x + far.x) / 2, Y, (from.z + far.z) / 2).project(camera);
  kit.tag.style.display = _hit.z > 1 ? 'none' : 'block';
  kit.tag.style.left = `${(_hit.x * 0.5 + 0.5) * innerWidth}px`;
  kit.tag.style.top = `${(-_hit.y * 0.5 + 0.5) * innerHeight}px`;
  kit.tag.textContent = `${Math.hypot(far.x - from.x, far.z - from.z).toFixed(2)}u`;
}
