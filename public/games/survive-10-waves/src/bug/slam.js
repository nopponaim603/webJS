import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { voiceOf } from './voice.js';
import * as modules from '../modules/index.js';
import * as evolve from './evolve.js';
import { cap, cooling } from './kit.js';
import { burst } from './stomp.js';
import * as spikes from './spikes.js';
import * as patterns from './patterns.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import * as arena from '../arena/size.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import { clip } from '../arena/clip.js';

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

const marks = makePool(
  () => {
    const mesh = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.disc, color: CFG.slam.markColor, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, held: 0, aim: 0, reach: 1 };
  },
  (m) => { m.held = 0; m.aim = 0; m.reach = 1; m.mesh.material.opacity = 0; },
);

const combos = [];

export function clear() { marks.clear(); combos.length = 0; }

// The other half of a combo, held with its numbers already worked out: the
// ground is committed the moment the first figure lands, so killing the boss in
// the beat between them does not call the second one off. It is summoned rather
// than slammed, so it never rolls a combo of its own — two figures is the whole
// move, not the start of a chain.
export function updateCombos(dt) {
  for (let i = combos.length - 1; i >= 0; i--) {
    const c = combos[i];
    c.t -= dt;
    if (c.t > 0) continue;
    spikes.summon(c.x, c.z, c.shot);
    combos[i] = combos[combos.length - 1];
    combos.pop();
  }
}

export function updateMarks(dt) {
  const S = CFG.slam;
  for (let i = marks.live.length - 1; i >= 0; i--) {
    const m = marks.live[i];
    m.held -= dt;
    const want = m.held > 0 ? S.markOpacity * (0.35 + 0.65 * m.aim) : 0;
    const mat = m.mesh.material;
    mat.opacity += (want - mat.opacity) * Math.min(1, S.markEase * dt);
    // The art sits inside its canvas, so the quad opens out to put the painted
    // edge on the ground the slam actually reaches.
    m.mesh.scale.setScalar((m.reach * 2 / ZONE_FILL) * (1.25 - 0.25 * m.aim));
    if (m.held <= 0 && mat.opacity < 0.01) marks.release(i);
  }
}

// Held rather than owned, so a boss killed mid-rear leaves no ring behind.
function hold(bug, S, aim) {
  if (!modules.sees('attacks')) return;
  if (!bug.slam.mark) bug.slam.mark = marks.spawn();
  bug.slam.mark.mesh.position.set(bug.pos.x, 0.05, bug.pos.z);
  bug.slam.mark.held = S.markHold;
  bug.slam.mark.aim = aim;
  bug.slam.mark.reach = reachOf(bug, S);
}

const reachOf = (bug, S) => S.radius * (bug.grow || 1);

function pose(bug, lift, pitch) {
  const body = bug.model.parts.body;
  if (!body) return;
  const baseY = body.userData.baseY !== undefined ? body.userData.baseY : 0.62;
  body.position.y = baseY + lift;
  body.rotation.x = pitch;
}

function land(bug, S) {
  const reach = reachOf(bug, S);
  const p = world.player;

  const hurt = evolve.share(bug, S.share);
  const gap = Math.hypot(p.pos.x - bug.pos.x, p.pos.z - bug.pos.z);
  if (gap <= reach + CFG.player.radius) {
    world.hooks.damagePlayer(hurt, { from: bug, by: bug.type.key, ground: true });
  } else {
    graze.at(gap, reach + CFG.player.radius, { ground: true, from: bug });
    const was = dodge.leaving();
    if (was && Math.hypot(was.x - bug.pos.x, was.z - bug.pos.z) <= reach + CFG.player.radius) {
      dodge.paid(was.x, was.z, bug);
    }
  }
  for (const d of drone.list()) {
    if (Math.hypot(d.pos.x - bug.pos.x, d.pos.z - bug.pos.z) <= reach + d.radius) {
      drone.damage(d, hurt);
    }
  }

  // The whole floor answers it, in one of the figures the boss has learnt by its
  // level. Some open from the boss outward and some are thrown round the player,
  // so where the figure is centred is the pattern's to say, not the slam's.
  const F = S.field;
  const open = patterns.openIn(F.patterns, bug.level || 1);
  const pool = open.length ? open : F.patterns;
  const kind = bug.slam.kind || pool[(Math.random() * pool.length) | 0];
  const at = patterns.ONPLAYER.has(kind) ? world.player.pos : bug.pos;

  const shot = {
    grow: arena.radius() / CFG.spikes.radius,
    hurt: evolve.share(bug, F.share),
    kind,
    density: F.density,
    span: cap(bug, 'fieldSpan', 1),
    by: bug,
  };
  spikes.summon(at.x, at.z, shot);

  const C = F.combo;
  const answer = C.pairs[kind];
  if (answer && patterns.learnt(answer, bug.level || 1) && Math.random() < C.chance) {
    combos.push({ t: C.delay, x: at.x, z: at.z, shot: { ...shot, kind: answer } });
  }

  burst(bug.pos.x, bug.pos.z, reach, S);
}

// Started on demand, whatever the range: the cooldown and the ring are the
// caller's business, not this one's. It comes down in a circle around the boss,
// so it is never turned to face you first — snapping a body this long round is
// the head crossing half the ring in a frame.
export function begin(bug, kind = null) {
  bug.slam = { t: CFG.slam.windup, phase: 'rear', mark: null, kind };
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

// Owns the frame from the rear up to the recovery, so the walk cycle and the
// bite in step() stay out of the way until the boss has its feet back.
export function update(bug, dist, dt, held = false) {
  const S = CFG.slam;

  if (!bug.slam) {
    bug.slamCd -= cooling(bug, dt);
    if (held || bug.slamCd > 0 || dist > reachOf(bug, S) + S.opening) return false;
    begin(bug);
  }

  const L = bug.slam;
  L.t -= dt;
  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);

  if (L.phase === 'rear') {
    const k = 1 - Math.max(0, L.t) / S.windup;
    pose(bug, S.rear * k, -S.rearPitch * k);
    // The ground it will hit is fixed the moment it rears: the whole wind-up is
    // yours to walk out of the ring.
    hold(bug, S, k);
    if (L.t > 0) return true;
    L.phase = 'drop';
    L.t = S.drop;
  }

  if (L.phase === 'drop') {
    const k = Math.max(0, L.t) / S.drop;
    pose(bug, S.rear * k * k, -S.rearPitch * k * k);
    if (L.t > 0) return true;
    land(bug, S);
    L.phase = 'recover';
    L.t = S.recover;
  }

  pose(bug, 0, 0);
  if (L.t > 0) return true;

  bug.slam = null;
  bug.slamCd = between(S.cooldown);
  return false;
}
