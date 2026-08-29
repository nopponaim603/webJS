import * as THREE from 'three';
import { CFG, BUG_TYPES } from '../config/index.js';
import { camera, scene } from '../engine/view.js';
import { world, state } from '../core/world.js';
import * as bugmodel from '../bug/model.js';
import { stepLegs } from '../bug/gait.js';
import * as player from '../character/player.js';
import { onReady } from '../core/loading.js';

const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _look = new THREE.Vector3();

let bug = null;
let bugType = null;
let showing = false;
let loaded = false;
let drift = 0;
let sway = 0;
let heroYaw = 0;

const typeOf = (key) => BUG_TYPES.find((t) => t.key === key) || BUG_TYPES[0];

const faceEachOther = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);

// The one phase of the walk with every foot down: the lift rides `cos` and both
// tripods are a quarter turn from it. Any other phase stands a leg in the air.
const PLANTED = Math.PI / 2;

function standBug() {
  const M = CFG.menu;
  dropBug();

  const type = typeOf(M.bug);
  bug = bugmodel.take(type);
  bugType = type;
  bug.object.visible = !bug.standIn;
  bug.object.scale.setScalar(type.scale);
  bug.object.position.set(M.bugAt[0], 0, M.bugAt[1]);
  bug.object.rotation.y = faceEachOther(M.bugAt, M.heroAt);
  scene.add(bug.object);

  if (bug.parts.legs && bug.parts.rigged) {
    stepLegs(bug.parts.legs, PLANTED, bug.object.quaternion, bug.parts.hip);
  }
  if (bug.parts.body) {
    const baseY = bug.parts.body.userData.baseY;
    bug.parts.body.position.y = baseY !== undefined ? baseY : 0.62;
  }
}

function dropBug() {
  if (!bug) return;
  scene.remove(bug.object);
  // A model taken before the mesh arrived is a primitive stand-in. Recycling one
  // would hand the same stand-in back to whoever takes that species next.
  if (bug.parts.rigged) bugmodel.recycle(bug, bugType.key);
  bug = null;
}

// Both figures are stand-ins until their meshes arrive — a capsule and a ball on
// legs. The welcome screen holds an empty shot rather than show either of them.
function reveal() {
  world.player.object.visible = loaded && player.hasFigure(world.player);
  if (loaded && !bug) standBug();
}

onReady(() => { loaded = true; if (showing) reveal(); });

export function enter() {
  const M = CFG.menu;
  showing = true;
  reveal();

  const p = world.player;
  p.pos.set(M.heroAt[0], 0, M.heroAt[1]);
  p.vel.set(0, 0, 0);
  p.object.position.copy(p.pos);
  heroYaw = faceEachOther(M.heroAt, M.bugAt);
  p.aim.set(Math.sin(heroYaw), 0, Math.cos(heroYaw));
  p.object.rotation.y = heroYaw;
  drift = sway = 0;
}

export function leave() {
  showing = false;
  world.player.object.visible = player.hasFigure(world.player);
  dropBug();
}

// The pair stand off-centre so the panel has the other half of the screen. The
// camera is aimed at them and then slid sideways, which moves them across the
// frame without turning the shot.
function toPane() {
  const M = CFG.menu;
  if (camera.aspect < M.wideAt) return;
  const reach = Math.tan(camera.fov * Math.PI / 360) * camera.position.distanceTo(_look);
  _right.setFromMatrixColumn(camera.matrixWorld, 0);
  _up.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(_right, -M.at[0] * reach * camera.aspect);
  camera.position.addScaledVector(_up, -M.at[1] * reach);
  camera.updateMatrixWorld();
}

function frameShot(dt) {
  const M = CFG.menu;
  drift += dt * M.drift.rate;
  const a = M.bearing + Math.sin(drift) * M.drift.sweep;

  _look.set(M.lookAt[0], M.lookAt[1], M.lookAt[2]);
  camera.position.set(_look.x + Math.sin(a) * M.dist,
                      M.height + Math.sin(drift * 0.7) * M.drift.lift,
                      _look.z + Math.cos(a) * M.dist);
  camera.lookAt(_look);
  camera.updateMatrixWorld();
  toPane();
}

// The walk cycle is off at a standstill, which leaves the character carved out
// of stone. This is only enough breath to say otherwise.
function idleHero(dt) {
  const M = CFG.menu;
  const p = world.player;
  sway += dt * M.idle.swayRate;
  p.object.rotation.y = heroYaw + Math.sin(sway) * M.idle.sway;
  p.object.position.y = Math.abs(Math.sin(sway)) * M.idle.lift;
  player.animate(p, dt);
}

export function update(dt) {
  state.time += dt;
  frameShot(dt);
  idleHero(dt);
}
