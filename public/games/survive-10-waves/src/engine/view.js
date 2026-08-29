import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { touchDevice } from '../mobile/detect.js';

// A phone renders the same scene on a tenth of the power budget, and a retina
// backing store is the most expensive thing it would be asked to do.
export const renderer = new THREE.WebGLRenderer({
  antialias: !touchDevice, powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio, touchDevice ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CFG.sky.exposure;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.sky.background);
// The world does not move; the camera does. Left to recompose its own matrix the
// scene marks itself changed every frame, and three takes that as licence to
// remultiply every matrix beneath it — which is the whole scene graph, whatever
// is actually moving in it. Pinned here, an object that has not changed is
// skipped, which is what lets a pooled effect go idle cheaply. See core/pool.js.
scene.matrixAutoUpdate = false;

export const camera = new THREE.PerspectiveCamera(CFG.camera.fov, innerWidth / innerHeight, 0.1, 400);

const camBase = new THREE.Vector3(0, CFG.camera.height, CFG.camera.back);
export const camOffset = camBase.clone();
let camZoom = 1, camZoomTarget = 1;
let camFit = 1;

let zoomMax = CFG.camera.zoom.ceiling.from;
let atZoomMax = true;

let debugZoom = 1;

// A multiplier of its own rather than a target: the ceiling and the wheel go on
// meaning what they meant, and the pack hands the extra back when it cuts out.
let flightZoom = 1, flightWant = 1;

export function setZoomMax(v) {
  const mult = world.debug.zoomOut || 1;
  zoomMax = Math.max(CFG.camera.zoom.ceiling.from, v) * mult;
  if (mult !== debugZoom) {
    debugZoom = mult;
    camZoomTarget = zoomMax;
    atZoomMax = true;
    glide = 1;
    return;
  }
  camZoomTarget = Math.min(camZoomTarget, zoomMax);
}

// A wave-start glide runs on a clock rather than the wheel's smoothing, so a
// raised ceiling is opened over a set time however far it moved.
let glide = 1;
let glideFrom = 1;

// The camera can be lent out for a moment — the extraction pad takes it to hold
// the player close while it carries them — and handed back to whatever the
// player had set it to.
let focus = 0;
let leaving = false;

// How far out the view is pulled, as a multiple of the default. Everything that
// wants to be screen-relative rather than world-relative reads this.
export const viewZoom = () => camZoom * camFit * flightZoom;

// A wider window is otherwise free map: the field of view is vertical, so height
// on screen buys nothing and width is handed out with the aspect. Pulling the
// camera in by the whole of the excess pins how far the ground reaches to the
// sides, and a window squashed for the view only ever loses height for it.
function fitAspect() {
  const f = CFG.camera.fit;
  const upright = touchDevice && camera.aspect < 1 ? f.portrait : 1;
  camFit = upright * Math.min(1, Math.max(f.min, f.ref / camera.aspect));
  applyOffset();
}

function applyOffset() {
  const k = camZoom * camFit * flightZoom;
  camOffset.copy(camBase).multiplyScalar(k);
  setShadowSpan(SHADOW_BASE * k);
}

// What a wave is allowed to pull back to, so a scripted reveal can drive the
// camera out to exactly where the player's own zoom would have sat.
export const zoomCeiling = () => zoomMax;

export function focusZoom(k = CFG.camera.zoom.focus) { focus = k; leaving = false; }

export function releaseZoom() {
  if (!focus) return;
  focus = 0;
  leaving = true;
}

// A scripted pull-out keeps the ground it gained. Without this the camera would
// spring back to wherever the player had last wound it in to the moment the
// reveal let go of it.
export function pinZoomMax() {
  camZoomTarget = zoomMax;
  atZoomMax = true;
  glide = 1;
}

export function setFlightZoom(on) {
  flightWant = on ? CFG.camera.zoom.flight : 1;
}

export function followZoomMax() {
  if (!atZoomMax) return;
  camZoomTarget = zoomMax;
  if (Math.abs(camZoomTarget - camZoom) < 1e-3) return;
  glideFrom = camZoom;
  glide = 0;
}

export function updateZoom(dt) {
  flightZoom += (flightWant - flightZoom) * (1 - Math.exp(-CFG.camera.zoom.flightRate * dt));
  if (focus || leaving) {
    const want = focus || camZoomTarget;
    camZoom += (want - camZoom) * (1 - Math.exp(-CFG.camera.zoom.focusRate * dt));
    glide = 1;
    if (leaving && Math.abs(want - camZoom) < 0.01) leaving = false;
  } else if (glide < 1) {
    glide = Math.min(1, glide + dt / CFG.camera.zoom.waveTime);
    const k = glide * glide * (3 - 2 * glide);
    camZoom = glideFrom + (camZoomTarget - glideFrom) * k;
  } else {
    camZoom += (camZoomTarget - camZoom) * (1 - Math.exp(-CFG.camera.zoom.smooth * dt));
  }
  applyOffset();
}

// A wheel over a panel that can scroll belongs to the panel. The whole window
// is listened to, so without this the zoom eats every scroll in the UI — and
// refusing it by element would miss every panel built after this line.
function scrolls(node, axis) {
  for (let n = node; n instanceof HTMLElement; n = n.parentElement) {
    const flow = getComputedStyle(n)[axis === 'x' ? 'overflowX' : 'overflowY'];
    if (flow !== 'auto' && flow !== 'scroll') continue;
    const room = axis === 'x' ? n.scrollWidth - n.clientWidth : n.scrollHeight - n.clientHeight;
    if (room > 1) return true;
  }
  return false;
}

addEventListener('wheel', (e) => {
  if (scrolls(e.target, Math.abs(e.deltaX) > Math.abs(e.deltaY) ? 'x' : 'y')) return;
  e.preventDefault();
  const z = CFG.camera.zoom;

  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;

  camZoomTarget = Math.min(zoomMax, Math.max(z.min, camZoomTarget * Math.exp(e.deltaY * unit * z.speed)));
  atZoomMax = camZoomTarget >= zoomMax - 1e-3;
  glide = 1;
}, { passive: false });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  fitAspect();
  renderer.setSize(innerWidth, innerHeight);
});

const hemi = new THREE.HemisphereLight(CFG.sky.hemiSky, CFG.sky.hemiGround, CFG.sky.hemiIntensity);
scene.add(hemi);

const SUN_OFF = new THREE.Vector3();

export const sun = new THREE.DirectionalLight(CFG.sky.sunColor, CFG.sky.sunIntensity);
sun.castShadow = true;
sun.shadow.mapSize.setScalar(touchDevice ? 1024 : 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 130;

const SHADOW_BASE = 42;
let shadowSpan = 0;
function setShadowSpan(S) {
  if (Math.abs(S - shadowSpan) < 0.5) return;
  shadowSpan = S;
  Object.assign(sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S });
  sun.shadow.camera.updateProjectionMatrix();
}
setShadowSpan(SHADOW_BASE);
fitAspect();

sun.shadow.bias = 0;
sun.shadow.normalBias = 0.01;
scene.add(sun, sun.target);
export const SUN_DEFAULT = sun.intensity;

// Read back out of CFG rather than closed over, so a terrain theme swapped in
// mid-run moves the sun and the sky with it.
export function applySky() {
  const el = THREE.MathUtils.degToRad(CFG.sun.elevation);
  const az = THREE.MathUtils.degToRad(CFG.sun.azimuth);
  const flat = Math.cos(el) * CFG.sun.distance;
  SUN_OFF.set(Math.sin(az) * flat, Math.sin(el) * CFG.sun.distance, Math.cos(az) * flat);
  // Placed here as well as in followCamera: the menu scene never follows a
  // player, so this is the only thing that ever gets the sun off the origin.
  sun.position.copy(sun.target.position).add(SUN_OFF);

  scene.background.setHex(CFG.sky.background);
  hemi.color.setHex(CFG.sky.hemiSky);
  hemi.groundColor.setHex(CFG.sky.hemiGround);
  hemi.intensity = CFG.sky.hemiIntensity;
  sun.color.setHex(CFG.sky.sunColor);
  sun.intensity = CFG.sky.sunIntensity;
  renderer.toneMappingExposure = CFG.sky.exposure;
}

applySky();

export const muzzleLight = new THREE.PointLight(0xffcc66, 0, 14, 2);
scene.add(muzzleLight);

// Trauma, not a fixed wobble: hits add to it and it falls away on its own, so
// two things going off at once shake harder than either did.
let trauma = 0;
// A wobble that is held rather than taken: an engine running under the player
// does not hit the camera once, it never stops. Set every frame by whoever is
// running, in world units, and gone the frame they stop setting it.
let hum = 0;
let quake = 0;
const _jolt = new THREE.Vector3();

// Combined as a length, not a sum: a cluster of grenades going off together
// should shake harder than one, but not five times harder.
export function shake(power) {
  trauma = Math.min(CFG.camera.shake.max, Math.hypot(trauma, power));
}

// What most callers want: how hard it hit, and how far away it was.
export function shakeAt(x, z, power, range) {
  if (!world.player) return;
  const away = Math.hypot(x - world.player.pos.x, z - world.player.pos.z);
  const near = Math.max(0, 1 - away / range);
  if (near > 0) shake(power * near);
}

export function tremble(power) { hum = power; }

// A second held channel, so the ground giving way and the pack under the player
// are not one another's off switch.
export function rumble(power) { quake = power; }

// Squared, so a small knock is a nudge and a big one is a real hit. The hum is
// not: it is already the size it wants to be.
function jolt(dt) {
  const S = CFG.camera.shake;
  trauma = Math.max(0, trauma - S.decay * dt);
  const k = trauma * trauma * S.reach + hum + quake;
  if (k <= 0) return _jolt.set(0, 0, 0);
  return _jolt.set((Math.random() * 2 - 1) * k,
                   (Math.random() * 2 - 1) * k * S.lift,
                   (Math.random() * 2 - 1) * k);
}

// `rise` lifts the eye and what it is looking at by the same amount, so a player
// up on the jetpack is framed exactly as they are on foot — at a close zoom the
// camera would otherwise be looking at the ground they left. The sun stays down
// with that ground: the shadow belongs to the floor either way.
export function followCamera(target, dt = 0, rise = 0) {
  camera.position.copy(target).add(camOffset).add(jolt(dt));
  camera.position.y += rise;
  camera.lookAt(target.x, 1.0 + rise, target.z);

  sun.position.copy(target).add(SUN_OFF);
  sun.target.position.copy(target);
  sun.target.updateMatrixWorld();
}

export function render() {
  renderer.render(scene, camera);
}

export const framesDrawn = () => renderer.info.render.frame;

// A canvas keeps its last frame for as long as nothing draws over it. While a
// full-screen overlay is up nothing does, so the scene from before it would be
// what shows in the moment the overlay comes off.
export function blank() {
  renderer.setClearColor(CFG.sky.background, 1);
  renderer.clear();
}
