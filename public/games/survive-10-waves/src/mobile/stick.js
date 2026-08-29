import { CFG } from '../config/index.js';
import { setStick, requestDash } from '../engine/input.js';

const T = CFG.touch;

let held = -1;
let originX = 0;
let originY = 0;
let armedAt = -1;
let lastDown = -1;

function place(el, x, y) {
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}

// Past the ring the origin is dragged along, so a thumb that wanders keeps its
// full range instead of pinning the stick at the edge.
function chase(dx, dy) {
  const dist = Math.hypot(dx, dy);
  const over = dist - T.stickRadius;
  if (over <= 0) return;
  originX += (dx / dist) * over;
  originY += (dy / dist) * over;
}

function pushed(dist) {
  const mag = Math.min(1, dist / T.stickRadius);
  return mag < T.deadzone ? 0 : (mag - T.deadzone) / (1 - T.deadzone);
}

// Armed by the second tap and spent on the first real push: the thumb is back
// at the centre the moment it lands, and a dash with no direction is nothing.
function spendDash(push) {
  if (armedAt < 0) return;
  if (performance.now() - armedAt > T.dashArmMs) { armedAt = -1; return; }
  if (push < T.dashPush) return;
  armedAt = -1;
  requestDash();
}

export function wire({ zone, base, knob }) {
  zone.addEventListener('pointerdown', (e) => {
    if (held >= 0) return;
    e.preventDefault();
    held = e.pointerId;
    zone.setPointerCapture(e.pointerId);

    const now = performance.now();
    armedAt = now - lastDown < T.doubleTapMs ? now : -1;
    lastDown = now;

    originX = e.clientX;
    originY = e.clientY;
    place(base, originX, originY);
    place(knob, 0, 0);
    zone.classList.add('live');
  });

  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== held) return;
    chase(e.clientX - originX, e.clientY - originY);

    const dx = e.clientX - originX;
    const dy = e.clientY - originY;
    const dist = Math.hypot(dx, dy);
    place(base, originX, originY);
    place(knob, dx, dy);

    const push = pushed(dist);
    setStick(dist ? (dx / dist) * push : 0, dist ? (dy / dist) * push : 0);
    spendDash(push);
  });

  const lift = (e) => {
    if (e.pointerId !== held) return;
    held = -1;
    armedAt = -1;
    zone.classList.remove('live');
    place(knob, 0, 0);
    setStick(0, 0);
  };
  zone.addEventListener('pointerup', lift);
  zone.addEventListener('pointercancel', lift);
}
