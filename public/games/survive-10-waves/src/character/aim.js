import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { readAim, aimPoint } from '../engine/input.js';
import { nearestBug } from '../game/targeting.js';
import { touchDevice } from '../mobile/detect.js';
import * as modules from '../modules/index.js';
import * as jetpack from './jetpack.js';

const _want = new THREE.Vector3();
const _rule = { min: 0, sight: false };

// Turned rather than snapped: the body carries the gun round with it, and a
// target swapping across the screen should look like a turn, not a cut.
function turnToward(aim, want, dt) {
  const from = Math.atan2(aim.x, aim.z);
  const to = Math.atan2(want.x, want.z);
  let delta = (to - from + Math.PI * 3) % (Math.PI * 2) - Math.PI;

  const step = CFG.autoAim.turnRate * dt;
  if (delta > step) delta = step;
  else if (delta < -step) delta = -step;

  const yaw = from + delta;
  aim.set(Math.sin(yaw), 0, Math.cos(yaw));
}

// Over the walls there is no wall to shoot through, so sight stops mattering.
function ruleFor(p) {
  const gun = CFG.guns[p.gun];
  _rule.min = gun.aimClear ? modules.splashRadius() + CFG.autoAim.blastClear : 0;
  _rule.sight = !!gun.aimSight && !jetpack.aboveWalls(p);
  return _rule;
}

function autoAim(p, dt) {
  p.target = nearestBug(p.pos, CFG.autoAim.range, p.target,
                        CFG.autoAim.stickiness, ruleFor(p));

  if (p.target) _want.set(p.target.pos.x - p.pos.x, 0, p.target.pos.z - p.pos.z);
  else _want.set(p.vel.x, 0, p.vel.z);

  if (_want.lengthSq() < 0.04) return;
  const reach = p.target ? _want.length() : CFG.autoAim.range;
  turnToward(p.aim, _want.normalize(), dt);

  // The grenade ring and the lob both read the aim point, which no longer comes
  // from a pointer here.
  aimPoint.set(p.pos.x + p.aim.x * reach, CFG.player.aimHeight, p.pos.z + p.aim.z * reach);
}

export function update(p, dt) {
  if (touchDevice) { autoAim(p, dt); return; }
  p.target = null;
  readAim(p.pos, p.aim);
}
