import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { lift } from '../character/jetpack.js';
import { GEO, ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import * as effects from './effects.js';

const A = () => CFG.items.aura;
const F = () => CFG.items.field;

const TUBE = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);

// Bright where it stands and gone by the top, so the column reads as light
// coming up off the ground rather than as a tube with a lid on it.
function makeFade() {
  const cv = document.createElement('canvas');
  cv.width = 4;
  cv.height = 64;
  const g = cv.getContext('2d');
  const up = g.createLinearGradient(0, cv.height, 0, 0);
  up.addColorStop(0.00, '#fff');
  up.addColorStop(0.40, 'rgba(255,255,255,0.55)');
  up.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = up;
  g.fillRect(0, 0, cv.width, cv.height);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FADE = makeFade();

// Two shells, the way the dash's cover is drawn: an inner glow that says you are
// carrying something, and a rim drawn from the inside so the edge reads against
// whatever is behind it.
function makeShell(inside) {
  const m = new THREE.Mesh(TUBE, new THREE.MeshBasicMaterial({
    map: FADE, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: inside ? THREE.BackSide : THREE.FrontSide,
  }));
  m.renderOrder = 5;
  m.visible = false;
  scene.add(m);
  return m;
}

const shells = [makeShell(false), makeShell(true)];

// The reach of a field item, on the floor where its edge can be read against
// what is standing on it: one soft wash out to the whole of it, with the same
// blurred edge every marked circle in the game wears.
function makeMark(tex, order) {
  const m = new THREE.Mesh(GEO.splat, new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = order;
  m.visible = false;
  scene.add(m);
  return m;
}

const marks = [makeMark(ZONE_TEX.disc, 2)];
let beat = 0;
let pulse = 0;

const hide = (list) => {
  for (const m of list) { m.visible = false; m.material.opacity = 0; }
};

export function clear() {
  hide(shells);
  hide(marks);
  beat = 0;
  pulse = 0;
}

// The circle a field is paying out over, held on the player carrying it.
function field(p, dt) {
  const on = p ? effects.mendField(p) : null;
  if (!on) {
    if (marks[0].visible) hide(marks);
    return;
  }

  const C = F();
  pulse += dt * C.beat;
  const wave = 0.78 + 0.22 * Math.sin(pulse);
  // The art is painted inside its own canvas, so the quad is opened out to put
  // the rim exactly on the reach the field is paying out over.
  const wide = (on.radius / ZONE_FILL) * (1 + C.swell * Math.sin(pulse));

  for (const m of marks) {
    m.visible = true;
    m.material.color.setHex(on.color);
    m.position.set(p.pos.x, C.y, p.pos.z);
    m.scale.setScalar(wide);
    m.material.opacity = C.fill * wave;
  }
}

export function update(dt) {
  const p = world.player;
  field(p, dt);

  const color = p ? effects.auraColor(p) : null;
  if (color === null) {
    if (shells[0].visible) hide(shells);
    return;
  }

  const C = A();
  beat += dt * C.beat;
  const wave = 0.72 + 0.28 * Math.sin(beat);

  // Off the floor to over the player's head, however high they are carrying
  // them: on foot a column around them, on the jetpack the shaft they are
  // standing at the top of.
  const tall = lift(p) + CFG.player.height * C.cap;
  const wide = C.radius * (1 + C.swell * wave);

  for (let i = 0; i < shells.length; i++) {
    const m = shells[i];
    m.visible = true;
    m.material.color.setHex(color);
    m.position.set(p.pos.x, p.pos.y + tall / 2, p.pos.z);
    m.scale.set(wide, tall, wide);
    m.material.opacity = (i ? C.rim : C.glow) * wave;
  }
}
