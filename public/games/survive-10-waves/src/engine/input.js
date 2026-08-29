import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { camera, renderer } from './view.js';
import { world } from '../core/world.js';

export const keys = new Set();
export const mouse = { ndc: new THREE.Vector2(), down: false };

// What the touch pad drives. Kept apart from the mouse so releasing one never
// speaks for the other.
const pad = { x: 0, z: 0, fire: false };

const crosshair = document.getElementById('crosshair');
const listeners = {
  pause: () => {}, mute: () => {}, firstInput: () => {},
  options: () => {}, debug: () => {}, konami: () => {},
};

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft',
                'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiAt = 0;

const escapeHandlers = [];

let cycleWanted = false;
let dashWanted = false;
let useWanted = false;
let flyWanted = false;

export function onPause(fn) { listeners.pause = fn; }
export function onMute(fn) { listeners.mute = fn; }
export function onFirstInput(fn) { listeners.firstInput = fn; }
export function onOptions(fn) { listeners.options = fn; }
export function onDebug(fn) { listeners.debug = fn; }
export function onKonami(fn) { listeners.konami = fn; }

function trackKonami(code) {
  konamiAt = code === KONAMI[konamiAt] ? konamiAt + 1 : (code === KONAMI[0] ? 1 : 0);
  if (konamiAt < KONAMI.length) return;
  konamiAt = 0;
  listeners.konami();
}

export function onEscape(fn) { escapeHandlers.push(fn); }

addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (!e.repeat) trackKonami(e.code);

  if (e.code === 'Tab' && world.state.mode === 'playing') { e.preventDefault(); return; }
  if (e.code === 'Escape' || (e.code === 'KeyP' && !e.repeat)) {
    for (const h of escapeHandlers) if (h()) return;
    listeners.pause();
    return;
  }

  if (e.code === 'KeyQ' && !e.repeat) { cycleWanted = true; return; }
  if (e.code === 'KeyE' && !e.repeat) { requestUse(); return; }
  if (e.code === 'Backquote' && !e.repeat) { listeners.debug(); return; }
  if (e.code === 'KeyO' && !e.repeat) { listeners.options(); return; }
  if (e.code === 'KeyM' && !e.repeat) { listeners.mute(); return; }
  if (e.code === 'Space' && !e.repeat && world.state.mode === 'playing') flyWanted = true;
  if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight')
      && !e.repeat && world.state.mode === 'playing') dashWanted = true;
  keys.add(e.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => {
  keys.clear();
  releaseInput();
  cycleWanted = false;
  dashWanted = false;
  useWanted = false;
  flyWanted = false;
});

// Filtered on the pointer type: a tap fires the mouse events too, and the pad
// already said what that tap meant.
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  mouse.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);

  crosshair.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
});

// On the canvas, not the window, so a click on a menu button is not also a shot.
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  // The right button is the swap: the hand is already on it, nothing in the
  // arena claims it, and the menu it would otherwise open is suppressed below.
  if (e.button === 2) {
    requestCycle();
    listeners.firstInput();
    return;
  }
  if (e.button !== 0) return;
  mouse.down = true;
  listeners.firstInput();
});
addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse' && e.button === 0) mouse.down = false;
});
addEventListener('contextmenu', (e) => e.preventDefault());

export function setStick(x, z) { pad.x = x; pad.z = z; }

export function setTrigger(on) {
  pad.fire = on;
  if (on) listeners.firstInput();
}

// Whenever the game takes the controls away — a pause, a screen, a lost window
// — everything is let go, or the player comes back already running and firing.
export function releaseInput() {
  mouse.down = false;
  pad.fire = false;
  pad.x = pad.z = 0;
}

export function triggerDown() { return mouse.down || pad.fire; }

export function requestCycle() { cycleWanted = true; }

export function requestUse() {
  if (world.state.mode === 'playing') useWanted = true;
}

export function takeUse() {
  const want = useWanted;
  useWanted = false;
  return want;
}

export function takeFly() {
  const want = flyWanted;
  flyWanted = false;
  return want;
}

export function requestDash() {
  if (world.state.mode === 'playing') dashWanted = true;
}

// The stick is analogue and already inside the unit circle, so it passes
// through: a half push is a walk.
export function readMoveAxis(out) {
  out.set(0, 0, 0);
  if (keys.has('KeyW') || keys.has('ArrowUp')) out.z -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) out.z += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) out.x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) out.x += 1;
  if (out.lengthSq() > 0) return out.normalize();
  return out.set(pad.x, 0, pad.z);
}

export function takeDash() {
  const want = dashWanted;
  dashWanted = false;
  return want;
}

export function gunPressed() {
  for (let i = 0; i < CFG.gunSlots; i++) {
    if (keys.has(`Digit${i + 1}`) || keys.has(`Numpad${i + 1}`)) return i;
  }
  return -1;
}

export function takeGunCycle() {
  const want = cycleWanted;
  cycleWanted = false;
  return want;
}

const raycaster = new THREE.Raycaster();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CFG.player.aimHeight);

export const aimPoint = new THREE.Vector3();

export function readAim(origin, out) {
  raycaster.setFromCamera(mouse.ndc, camera);
  if (raycaster.ray.intersectPlane(aimPlane, aimPoint)) {
    const dx = aimPoint.x - origin.x;
    const dz = aimPoint.z - origin.z;
    if (dx * dx + dz * dz > 0.04) out.set(dx, 0, dz).normalize();
  }
  return out;
}
