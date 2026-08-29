import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CFG } from '../config/index.js';
import { newLocoState, resetLocoState, stepLocomotion, poseRig } from './locomotion.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { readMoveAxis, takeDash } from '../engine/input.js';
import * as aim from './aim.js';
import { audio } from '../engine/audio.js';
import * as wake from '../fx/wake.js';
import * as floaters from '../ui/floaters.js';
import * as effects from '../items/effects.js';
import { createGun, attachGunToBody } from '../weapons/gun.js';
import * as rigmod from './rig.js';
import * as firing from '../weapons/firing.js';
import { manager } from '../core/loading.js';
import * as modules from '../modules/index.js';
import * as ledger from '../game/ledger.js';
import { groundSpeed } from '../arena/footpath.js';
import * as arena from '../arena/size.js';
import * as death from './death.js';
import * as jetpack from './jetpack.js';
import * as energy from './energy.js';
import * as strike from './strike.js';

const MAT = {
  body: new THREE.MeshStandardMaterial({ color: 0x3ba7e0, roughness: 0.45, metalness: 0.25 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xe8f2ec, roughness: 0.5 }),
};

// Whether there is anything worth drawing where the player is standing.
export const hasFigure = (p) => !CFG.player.model || !!p.parts.gltf;

export function create() {
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';

  const stand = new THREE.Group();
  g.add(stand);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.7, 6, 14), MAT.body);
  body.position.y = 0.92;
  body.userData.baseY = 0.92;
  body.castShadow = true;
  stand.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), MAT.trim);
  head.position.y = 1.62;
  head.castShadow = true;
  stand.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x60c8f0 }));
  visor.position.set(0, 1.63, 0.26);
  stand.add(visor);

  const { gun, muzzle } = createGun(true);
  gun.position.set(0.34, 1.02, 0.42);
  g.add(gun);

  const p = {
    object: g,
    parts: { body, head, gun, muzzle, stand, bones: null, boneUnit: 1, legLength: 1, gunOnBone: false, gunInvScale: 1 },
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    aim: new THREE.Vector3(0, 0, 1),
    target: null,
    health: CFG.player.maxHealth,
    gun: 0,
    shownGun: 0,
    guns: CFG.guns.map((g) => ({ charges: g.charges, cd: 0, since: 99 })),
    swap: 0,
    gauge: 0,
    dryFx: 0,
    firePulse: 0,
    chargeShort: 0,
    dryNote: 0,
    dashTimer: 0, energy: energy.newState(), fireLock: 0, recoil: 0,
    invuln: 0, held: 0,
    walking: false,
    dashFrom: new THREE.Vector3(), dashAt: -99,
    graceBy: new Map(),
    effects: new Map(),
    grenadeBank: 0,
    salvo: [],
    dead: false,
    wakeCarry: 0,
    fly: jetpack.newState(),
    dashDir: new THREE.Vector3(),
    anim: newLocoState(),
  };

  scene.add(g);
  jetpack.attach(p);
  // The capsule and ball are scaffolding for the mesh, not a look the game will
  // show, and the jetpack riding on them would be left hanging in the air. So
  // the figure is the mesh or it is nothing: it stays dark until one arrives,
  // and where none was ever asked for the primitives are the figure.
  if (CFG.player.model) {
    g.visible = false;
    loadModel(p);
  }
  return p;
}

function loadModel(p) {
  new GLTFLoader(manager).load(CFG.player.model, (gltf) => {
    const model = rigmod.fit(gltf.scene);

    model.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    rigmod.dimEmissive(model);
    p.object.remove(p.parts.stand);
    p.object.add(model);
    p.parts.gltf = model;
    p.parts.body = null;
    p.object.visible = true;

    const { bones, boneUnit, legLength, chest } = rigmod.harvest(model, null);
    Object.assign(p.parts, { bones, boneUnit, legLength });

    if (chest) {
      p.parts.gunBase = attachGunToBody(p.object, chest, p.parts.gun);
      p.parts.carrier = p.object;
      p.parts.chest = chest;
      p.parts.gunOnBone = true;
    }

    const missing = rigmod.missingBones(bones);
    if (missing.length) console.warn(`player model missing bones: ${missing.join(', ')}`);
  }, undefined, (err) => console.warn('player model failed to load — the figure stays hidden', err));
}

const _move = new THREE.Vector3();
const _tmp = new THREE.Vector3();

// A dash crosses more ground in a frame than a wall is thick, so the move is
// walked in short legs rather than jumped: every leg is put back where it is
// legal before the next one is taken. Over the walls there is nothing to walk
// into, and the ring is the only thing holding the flight in.
function advance(p, dt) {
  if (jetpack.aboveWalls(p)) {
    p.pos.addScaledVector(p.vel, dt);
    arena.ring(p.pos, CFG.player.radius, 0.6);
    return;
  }

  const legs = Math.max(1, Math.ceil(p.vel.length() * dt / CFG.walls.maxStep));
  for (let i = 0; i < legs; i++) {
    p.pos.addScaledVector(p.vel, dt / legs);
    arena.confine(p.pos, CFG.player.radius, 0.6);
  }
}

export function update(p, dt) {
  if (p.dead) { jetpack.update(p, dt); death.update(p, dt); return; }

  aim.update(p, dt);
  readMoveAxis(_move);

  // Taken out of your hands while something else is carrying you. A timer, not a
  // flag: whatever set it has to keep setting it, so nothing can leave the
  // player stuck holding still.
  if (p.held > 0) {
    p.held -= dt;
    _move.set(0, 0, 0);
    p.vel.set(0, 0, 0);
    p.fireLock = Math.max(p.fireLock, 0.2);
  }

  // Asked of the input rather than of the velocity, which is eased and so still
  // reads as walking for a tenth of a second after the keys are let go.
  p.walking = _move.lengthSq() > 0 || p.dashTimer > 0 || jetpack.aloft(p);

  jetpack.update(p, dt);
  strike.update(p, dt);
  energy.regen(p, dt);

  if (takeDash() && canDash(p, _move)) dash(p, _move);

  const boost = effects.speedMult(p);
  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.vel.copy(p.dashDir).multiplyScalar(modules.dashSpeed() * boost);
  } else {
    const ground = jetpack.flying(p) ? 1 : groundSpeed(p.pos.x, p.pos.z);
    const speed = modules.moveSpeed() * boost * ground * jetpack.speedScale(p);
    p.vel.lerp(_tmp.copy(_move).multiplyScalar(speed),
               1 - Math.exp(-18 * dt));
  }
  advance(p, dt);

  if (p.dashTimer > 0) {
    p.wakeCarry = CFG.player.wake.carry;
    wake.feed(p.pos);
  } else if (p.wakeCarry > 0) {
    p.wakeCarry = Math.max(0, p.wakeCarry - dt);
    wake.feed(p.pos);
    if (p.wakeCarry === 0) wake.end();
  }

  p.object.position.set(p.pos.x, p.pos.y + jetpack.lift(p), p.pos.z);
  p.object.rotation.y = Math.atan2(p.aim.x, p.aim.z);
  jetpack.pose(p);

  if (p.parts.body) {
    const moving = p.vel.lengthSq() > 1;
    p.parts.body.position.y =
      p.parts.body.userData.baseY + (moving ? Math.sin(world.state.time * 14) * 0.045 : 0);
  }

  firing.swapPose(p);

  p.recoil = Math.max(0, p.recoil - dt * 8);
  if (p.parts.gunOnBone) {
    p.parts.gun.position.copy(p.parts.gunBase);
    p.parts.gun.position.z -= p.recoil * 0.14 * (CFG.player.height / 1.9);
  } else {
    p.parts.gun.position.z = 0.42 - p.recoil * 0.18;
  }

  animate(p, dt);

  p.invuln = Math.max(0, p.invuln - dt);
  tickGrace(p, dt);
  effects.step(p, dt);

  firing.guns(p, dt);
}

const _hurtAt = new THREE.Vector3();

// Grace is per attacker: one bug landing a bite must not cover for the five
// others biting alongside it. Sources with nobody behind them share the player's
// own clock.
function tickGrace(p, dt) {
  for (const [from, left] of p.graceBy) {
    if (left > dt) p.graceBy.set(from, left - dt);
    else p.graceBy.delete(from);
  }
}

export function damage(p, amount, o = {}) {
  if (p.dead || p.invuln > 0 || effects.covered(p) > 0 || world.debug.invuln) return;
  if (o.ground && jetpack.aloft(p)) return;
  const from = o.from || p;
  if (!o.stacks && p.graceBy.get(from) > 0) return;

  const took = modules.damageTaken(amount) * effects.takenMult(p);
  p.health -= took;
  // Below the guards above on purpose: a bite the dash ate or the grace window
  // swallowed never landed, and must not cancel what an item is paying out.
  effects.onDamage(p);
  _hurtAt.set(p.pos.x, CFG.player.height * 1.05, p.pos.z);
  floaters.playerDamage(_hurtAt, took);
  if (!o.stacks) p.graceBy.set(from, CFG.player.grace);
  ledger.taken(o.by || (o.from && o.from.type && o.from.type.key), took);
  audio.hurt(took / modules.maxHealth());
  world.hooks.onPlayerDamage(took);

  if (world.debug.autoHeal) p.health = modules.maxHealth();
  if (p.health <= 0) {
    p.health = 0;
    p.dead = true;
    death.begin(p);
    world.hooks.onDeath();
  }
}

// Off the pack rather than off the ground: the feet have to be on the floor to
// push off it, and a dash mid-climb would be paying for the lift twice over.
// Everything but the direction, which is what lights the touch button.
export const dashReady = (p) => !p.fly.on && p.dashTimer <= 0
  && modules.hasDash() && energy.has(p, modules.dashCost());

function canDash(p, move) {
  return dashReady(p) && move.lengthSq() > 0;
}

function dash(p, move) {
  energy.spend(p, modules.dashCost());
  // Where it was pushed off from, and when. What an escape is measured against
  // is the ground left behind, not the ground landed on.
  p.dashFrom.set(p.pos.x, 0, p.pos.z);
  p.dashAt = world.state.time;
  p.dashTimer = CFG.player.dashTime;
  p.fireLock = CFG.player.dashTime + CFG.player.dashFireLock;
  p.invuln = Math.max(p.invuln, modules.dashInvuln());

  p.dashDir.copy(move).normalize();
  wake.start();
  audio.dash();
}

export function revive(p) {
  p.dead = false;
  death.clear(p);
  // The collapse slerps every bone to its rest pose, which is the T. Standing
  // back up has to put the rig in a real pose before anything draws it.
  animate(p, 0);
}

export function reset(p) {
  p.pos.set(0, 0, 0);
  p.vel.set(0, 0, 0);
  p.health = modules.maxHealth();
  firing.reset(p);
  energy.fill(p);
  strike.clear();
  p.dashTimer = p.fireLock = p.recoil = p.invuln = p.held = 0;
  p.walking = false;
  p.dashAt = -99;
  p.target = null;
  p.graceBy.clear();
  p.effects.clear();
  p.wakeCarry = 0;
  jetpack.reset(p);
  resetLocoState(p.anim);
  revive(p);
}

export function animate(p, dt) {
  if (!p.parts.bones || !p.parts.bones.Hips) return;

  const spd = jetpack.flying(p) ? 0 : Math.hypot(p.vel.x, p.vel.z);
  stepLocomotion(p.anim, {
    spd,
    moveYaw: Math.atan2(p.vel.x, p.vel.z),
    aimYaw: Math.atan2(p.aim.x, p.aim.z),
    legLength: p.parts.legLength,
    dt,
  });

  poseRig({ bones: p.parts.bones, boneUnit: p.parts.boneUnit, root: p.object,
            gun: p.parts.gunOnBone ? p.parts.gun : null, chest: p.parts.chest },
          p.anim, world.state.time, jetpack.stance(p));

  jetpack.wear(p);
}
