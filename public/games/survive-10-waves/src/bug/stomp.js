import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { shakeAt } from '../engine/view.js';
import { dustPuffs } from '../fx/blast.js';
import { dirt } from '../fx/spatter.js';

const _at = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _foot = new THREE.Vector3();

// stepLegs lifts a leg while cos(phase) is positive, so the foot is down from
// the moment the phase passes a quarter turn. Counting those turns tells a
// footfall apart from a foot that was already planted last frame.
const PLANT = Math.PI / 2;
const downs = (phase) => Math.floor((phase - PLANT) / (Math.PI * 2));

function puff(x, z, S, scale) {
  for (let i = 0; i < S.puffs; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * S.spread * scale;
    _at.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
    _dir.set(Math.cos(a), 0, Math.sin(a));
    dustPuffs.spawn(_at, _dir, S.smoke, scale);
  }
  _at.set(x, 0.04, z);
  dirt(_at, S.dirt, S.grit);
}

// The legs walk as two tripods, so the ground is hit twice a stride, not six
// times: the whole set lands together and is heard and felt as one footfall.
// What a heavy thing arriving does to the ground under it: dust thrown out to
// `reach`, soil, a jolt, and a boom. The footfalls above are the small version
// of the same thing, one foot wide.
export function burst(x, z, reach, C) {
  for (let i = 0; i < C.puffs; i++) {
    const a = (i / C.puffs) * Math.PI * 2 + Math.random() * 0.4;
    const d = reach * (0.45 + Math.random() * 0.55);
    _at.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
    _dir.set(Math.cos(a), 0, Math.sin(a));
    dustPuffs.spawn(_at, _dir, C.smoke, reach * C.cloud);
  }
  _at.set(x, 0.05, z);
  dirt(_at, C.dirt, 1.5);

  shakeAt(x, z, C.shake.power, C.shake.range);
  audio.playAt('stomp', x, z, { rate: C.sfxRate });
}

export function footfalls(bug, was) {
  const S = CFG.stomp;
  const grow = bug.grow || 1;
  const scale = bug.radius * S.foot * grow;

  for (const set of [0, 1]) {
    const off = set ? Math.PI : 0;
    if (downs(was + off) === downs(bug.walk + off)) continue;

    for (const leg of bug.model.parts.legs) {
      if (leg.tripod !== set || !leg.tip) continue;
      leg.tip.getWorldPosition(_foot);
      puff(_foot.x, _foot.z, S, scale);
    }

    shakeAt(bug.pos.x, bug.pos.z, S.shake.power * grow, S.shake.range);
    audio.playAt('stomp', bug.pos.x, bug.pos.z, { rate: between(S.sfx.rate) / grow });
  }
}
