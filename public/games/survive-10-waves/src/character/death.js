import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { lift } from './jetpack.js';

const FLAT = Math.PI / 2;

const _tilt = new THREE.Quaternion();
const _e = new THREE.Euler();

export function begin(p) {
  const D = CFG.player.death;
  p.death = {
    t: 0,
    face: Math.random() < D.forward ? 1 : -1,
    roll: (Math.random() - 0.5) * 2 * D.roll,
    gunQuat: p.parts.gun ? p.parts.gun.quaternion.clone() : null,
  };
}

export function clear(p) {
  p.death = null;
  p.object.rotation.set(0, 0, 0);
  p.object.position.copy(p.pos);
}

export function update(p, dt) {
  const D = CFG.player.death;
  const s = p.death;
  if (!s) return;
  s.t += dt;

  const fall = Math.min(1, s.t / D.time);
  const rest = Math.max(0, s.t - D.time);
  const bounce = Math.exp(-rest * D.settle) * Math.sin(rest * D.bounceRate) * D.bounce;
  const angle = FLAT * fall * fall + bounce;

  p.object.rotation.x = angle * s.face;
  p.object.rotation.z = s.roll * fall;
  p.object.position.set(p.pos.x, lift(p) + D.lift * Math.sin(Math.min(angle, FLAT)), p.pos.z);

  levelGun(p, s);
  limp(p, 1 - Math.exp(-D.limp * dt));
}

// The gun hangs off the player group, not the hands, so the topple would swing a
// levelled rifle up to point at the sky. Undo the tilt, keeping the yaw.
function levelGun(p, s) {
  if (!s.gunQuat) return;
  _e.set(p.object.rotation.x, 0, p.object.rotation.z, 'XYZ');
  p.parts.gun.quaternion.copy(_tilt.setFromEuler(_e).invert()).multiply(s.gunQuat);
  p.parts.gun.rotateX(CFG.player.death.gunDrop);
}

function limp(p, k) {
  const bones = p.parts.bones;
  if (!bones) return;
  for (const name in bones) {
    const b = bones[name];
    if (b.userData.rest) b.quaternion.slerp(b.userData.rest, k);
    if (b.userData.restPos) b.position.lerp(b.userData.restPos, k);
  }
}
