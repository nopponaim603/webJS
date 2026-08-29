import * as THREE from 'three';
import { camera } from '../engine/view.js';
import { track } from '../core/track.js';
import { touchDevice } from './detect.js';
import * as layout from './layout.js';
import * as stick from './stick.js';
import * as buttons from './buttons.js';

export const active = touchDevice;

let els = null;
const crosshair = document.getElementById('crosshair');
const _at = new THREE.Vector3();

// touch-action stops the browser zooming on a tap, but not on a pinch, and two
// thumbs on a pad are a pinch. Safari's own gesture events are the only way to
// refuse that one; the module tree pinches on pointer events, so it is untouched.
function refuseZoom() {
  for (const type of ['gesturestart', 'gesturechange']) {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
}

export function init({ pause }) {
  if (!touchDevice) return;
  document.body.classList.add('touch');
  refuseZoom();
  els = layout.build();
  stick.wire(els);
  buttons.wire(els, pause);
  track('touch_controls');
}

// Nothing is aimed by hand here, so the crosshair stops being a cursor and
// becomes the answer to "which one am I shooting at".
function markTarget(target) {
  if (!target) { crosshair.classList.add('off'); return; }

  _at.set(target.pos.x, target.pos.y + 0.9, target.pos.z).project(camera);
  if (_at.z > 1) { crosshair.classList.add('off'); return; }

  const x = (_at.x * 0.5 + 0.5) * innerWidth;
  const y = (-_at.y * 0.5 + 0.5) * innerHeight;
  crosshair.classList.remove('off');
  crosshair.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}

export function sync(p, readout) {
  if (!els) return;
  buttons.sync(p, readout);
  markTarget(p.target);
}
