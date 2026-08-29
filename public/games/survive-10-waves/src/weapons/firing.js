import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { triggerDown, gunPressed, takeGunCycle } from '../engine/input.js';
import { audio } from '../engine/audio.js';
import * as fx from '../fx/spatter.js';
import * as bullets from './bullets.js';
import * as grenades from './grenades.js';
import * as laser from './laser.js';
import { showGunModel } from './gun.js';
import * as loadout from './loadout.js';
import * as swaptip from '../ui/swaptip.js';
import * as modules from '../modules/index.js';
import * as effects from '../items/effects.js';
import * as gunmods from '../gunmods/index.js';

const _muzzleWorld = new THREE.Vector3();

const free = (p) => world.debug.infiniteCharges || effects.unlimitedAmmo(p);

// Fired from over the top of a wall, a shot is not stopped by it. Read off the
// muzzle rather than off the jetpack, so it is true whatever put it up there.
const clearsWalls = () => _muzzleWorld.y > CFG.walls.height;

function selectGun(p, gun) {
  if (gun === null || gun === p.gun || p.fireLock > 0) return;
  p.gun = gun;
  p.swap = CFG.player.swapTime;

  p.gauge = CFG.crosshair.gaugeAfterSwap;
  p.dryFx = 0;
  audio.blip({ freq: 520, dur: 0.05, gain: 0.04, type: 'triangle', slide: 180 });
}

export function swapPose(p) {
  const gun = p.parts.gun;
  if (!gun) return;
  const T = CFG.player.swapTime;
  const t = p.swap > 0 ? 1 - p.swap / T : 1;
  gun.userData.dip = p.swap > 0 ? CFG.player.swapDip * Math.sin(Math.PI * t) : 0;
  if (p.shownGun !== p.gun && t >= 0.5) {
    p.shownGun = p.gun;
    showGunModel(gun, p.gun);
  }
}

export function guns(p, dt) {
  stagger(p, dt);
  p.swap = Math.max(0, p.swap - dt);
  p.gauge = Math.max(0, p.gauge - dt);
  p.dryFx = Math.max(0, p.dryFx - dt);
  p.firePulse = Math.max(0, p.firePulse - dt);
  p.chargeShort = Math.max(0, p.chargeShort - dt);
  p.dryNote = Math.max(0, p.dryNote - dt);
  // With the rest of the timers, not inside the lance's own branch: a gun left
  // cooling in the rack has to cool while another one is in your hands.
  p.heat = Math.max(0, p.heat - dt);
  p.fireLock = Math.max(0, p.fireLock - dt);

  const cycle = takeGunCycle();
  let slot = gunPressed();
  if (cycle && slot < 0) slot = loadout.next(loadout.slotOf(p.gun));

  if (slot >= 0 && loadout.usable(slot)) {
    if (loadout.gunAt(slot) !== p.gun) swaptip.mark();
    selectGun(p, loadout.gunAt(slot));
  }

  if (loadout.disabled(p.gun) || loadout.slotOf(p.gun) < 0) {
    selectGun(p, loadout.gunAt(loadout.firstUsable()));
  }

  const triggerHeld = triggerDown() && !world.debug.drawWalls;
  const triggerPulled = triggerHeld && !p.triggerHeld;
  p.triggerHeld = triggerHeld;

  const freeFire = free(p);

  for (let i = 0; i < p.guns.length; i++) {
    const g = CFG.guns[i], st = p.guns[i];
    st.cd -= dt;

    if (i === p.gun && triggerHeld && !g.semi) st.since = 0;

    st.since += dt;
    if (freeFire) st.charges = modules.gunCharges(g);
    else if (st.since >= CFG.player.rechargeDelay) {
      st.charges = Math.min(modules.gunCharges(g),
                            st.charges + modules.gunRecovery(g) * dt);
    }
  }

  const gun = CFG.guns[p.gun];
  const st = p.guns[p.gun];

  if (gun.charge) { charging(p, gun, st, triggerHeld, dt); return; }
  p.charge = 0;
  laser.unwind();

  const wantsFire = gun.semi ? triggerPulled : triggerHeld;

  if (wantsFire && st.cd <= 0 && p.fireLock <= 0 && p.swap <= 0) {
    if (freeFire || st.charges >= gun.cost) {
      if (!freeFire) st.charges -= gun.cost;
      st.since = 0;
      st.cd = 1 / (modules.gunFireRate(gun) * effects.rateMult(p));
      p.gauge = Math.max(p.gauge, CFG.crosshair.gaugeAfterShot);
      p.firePulse = CFG.crosshair.firePulse;
      fire(p, gun);
    } else {
      p.gauge = Math.max(p.gauge, CFG.crosshair.gaugeAfterShot);
      p.dryFx = CFG.crosshair.dryHold;
      dryFire(p, dt);
    }
  }
}

// Hold to wind it up, let go to fire. Hold too long and the gun cooks itself
// and is dead until it cools — the crosshair swells with the charge and goes
// dry for the last stretch, which is the only warning you get.
function charging(p, gun, st, held, dt) {
  const L = CFG.laser;

  if (p.heat > 0) {
    p.charge = 0;
    laser.unwind();
    p.dryFx = CFG.crosshair.dryHold;
    p.gauge = Math.max(p.gauge, CFG.crosshair.gaugeAfterShot);
    return;
  }

  if (held && p.fireLock <= 0 && p.swap <= 0 && st.cd <= 0) {
    if (!free(p) && st.charges < gun.cost) { dryFire(p, dt); return; }
    p.charge += dt;
    st.since = 0;
    p.gauge = Math.max(p.gauge, CFG.crosshair.gaugeAfterShot);
    p.firePulse = CFG.crosshair.firePulse * Math.min(1, p.charge / L.overheat);
    if (p.charge > L.overheat - L.warn) p.dryFx = CFG.crosshair.dryHold;

    p.parts.muzzle.getWorldPosition(_muzzleWorld);
    laser.winding(_muzzleWorld, p.aim, Math.min(1, p.charge / L.overheat), dt, clearsWalls());

    if (p.charge >= L.overheat) {
      p.charge = 0;
      laser.unwind();
      p.heat = L.cooldown;
      world.hooks.damagePlayer(
        Math.max(1, Math.round(modules.laserDamage(gun) * L.selfBurn)),
        { stacks: true, by: 'your own lance' });
      audio.blip({ freq: 150, dur: 0.35, gain: 0.06, type: 'sawtooth', slide: -90 });
    }
    return;
  }

  laser.unwind();
  if (p.charge <= 0) return;
  const wound = p.charge;
  p.charge = 0;
  if (wound < L.minCharge) {
    p.chargeShort = CFG.crosshair.noteTime;
    audio.dry();
    return;
  }

  if (!free(p)) st.charges -= gun.cost;
  st.since = 0;
  st.cd = 1 / (modules.gunFireRate(gun) * effects.rateMult(p));
  p.firePulse = CFG.crosshair.firePulse;
  p.recoil = 1;
  p.parts.muzzle.getWorldPosition(_muzzleWorld);
  fx.muzzleFlash(_muzzleWorld, p.aim);
  laser.fire(_muzzleWorld, p.aim, gun, wound, clearsWalls());
}

let dryClick = 0;

function dryFire(p, dt) {
  p.dryNote = CFG.crosshair.noteTime;
  dryClick -= dt;
  if (dryClick > 0) return;
  dryClick = 0.32;
  audio.dry();
}

const _origin = new THREE.Vector3();
const _patternAim = new THREE.Vector3();
const _pellet = new THREE.Vector3();

const _up = new THREE.Vector3(0, 1, 0);

function aimWithCone(dir, extraDeg = 0) {
  const cone = modules.aimCone() + extraDeg * Math.PI / 180;
  if (cone <= 0) return dir;
  const t = (Math.random() + Math.random()) / 2;
  // Safe about world up only because dir is horizontal.
  return dir.applyAxisAngle(_up, (t * 2 - 1) * cone);
}

// The module pays out a fraction of a grenade a shot, and a fraction of a
// grenade cannot be fired. What is left over is kept, so 1.4 a shot really does
// land four grenades across three shots rather than three.
function drawGrenades(p) {
  p.grenadeBank += modules.grenadePart();
  const whole = Math.floor(p.grenadeBank + 1e-6);
  p.grenadeBank -= whole;
  return whole;
}

function lob(p, shot) {
  grenades.fire(_muzzleWorld, p.aim, shot.dmg, shot.turn, shot.depth);
  p.recoil = 1;
  fx.muzzleFlash(_muzzleWorld, p.aim);
  audio.launch();
}

// A volley leaves as a string rather than all at once, and the launcher is read
// again as each one goes, so the salvo follows the player instead of hanging in
// the air where the trigger was pulled.
function stagger(p, dt) {
  if (!p.salvo.length) return;
  p.parts.muzzle.getWorldPosition(_muzzleWorld);

  let kept = 0;
  for (const shot of p.salvo) {
    shot.wait -= dt;
    if (shot.wait > 0) p.salvo[kept++] = shot;
    else lob(p, shot);
  }
  p.salvo.length = kept;
}

function fire(p, gun) {
  p.parts.muzzle.getWorldPosition(_muzzleWorld);
  if (gun.projectile === 'grenade') lobbed(p, gun);
  else patterned(p, gun);
}

function lobbed(p, gun) {
  const salvo = {
    shells: drawGrenades(p),
    damage: modules.gunDamage(gun),
  };
  if (gunmods.plan(p, gun, salvo)) return;

  const fan = CFG.grenade.fanDeg * Math.PI / 180;
  for (let i = 0; i < salvo.shells; i++) {
    const t = salvo.shells > 1 ? (i / (salvo.shells - 1)) * 2 - 1 : 0;
    // Alternately short and long, never proportional to the fan: a depth that
    // tracks the turn only tilts the line the cluster lands on.
    const shot = { wait: i * CFG.grenade.stagger, dmg: salvo.damage,
                   turn: t * fan, depth: salvo.shells > 1 ? (i % 2 ? 1 : -1) : 0 };
    if (shot.wait > 0) p.salvo.push(shot);
    else lob(p, shot);
  }
}

// The pattern the gun is about to lay down, written out before a round leaves
// it so a module can change what is fired rather than chase what already has.
function patterned(p, gun) {
  _origin.set(p.pos.x, _muzzleWorld.y, p.pos.z);

  const aim = _patternAim.copy(p.aim).normalize();
  if (modules.gunUsesCone(gun)) aimWithCone(aim);

  const shot = {
    pellets: modules.gunPellets(gun),
    choke: modules.gunSpread(gun) * Math.PI / 180,
    range: modules.gunRange(gun),
    base: modules.gunBase(gun),
    knock: modules.gunKnock(gun),
    retain: modules.gunPierce(gun),
    arcs: modules.gunArcs(gun),
    look: gun.look,
    stagger: gun.stagger || 0,
    jitter: gun.rangeJitter || 0,
    scale: 1,
    tint: 0,
    quiet: false,
  };
  gunmods.plan(p, gun, shot);

  // Split across the pattern: the shell shoves, not each pellet, so adding
  // pellets never multiplies the push.
  const knock = shot.knock / Math.max(1, shot.pellets);
  for (let i = 0; i < shot.pellets; i++) {
    const t = shot.pellets > 1 ? (i / (shot.pellets - 1)) * 2 - 1 : 0;
    const spray = shot.pellets > 1
      ? (Math.random() - 0.5) * (2 * shot.choke / (shot.pellets - 1)) : 0;
    _pellet.copy(aim).applyAxisAngle(_up, t * shot.choke + spray);

    const reach = shot.range
      ? shot.range * (1 - shot.jitter + Math.random() * shot.jitter * 2) : 0;

    const wait = shot.pellets > 1 ? Math.random() * shot.stagger : 0;
    bullets.spawnLater(wait, _muzzleWorld, _pellet, gunmods.tag(p, gun, {
      origin: _origin, base: shot.base, range: reach, look: shot.look, knock,
      retain: shot.retain, arcs: shot.arcs, by: gun.name,
      scale: shot.scale, tint: shot.tint,
      overWalls: clearsWalls(),
    }));
  }

  p.recoil = 1;
  if (!shot.quiet) {
    fx.muzzleFlash(_muzzleWorld, aim);
    audio.shoot(gun.sfx);
  }
  gunmods.shot(p, gun, _muzzleWorld, aim, shot);
}

// A share of every gun's own full load, handed back at once. The recharge delay
// is left where it is: this is a top-up, not a gun that was never fired.
export function topUpGuns(p, share) {
  for (let i = 0; i < p.guns.length; i++) {
    const full = modules.gunCharges(CFG.guns[i]);
    p.guns[i].charges = Math.min(full, p.guns[i].charges + full * share);
  }
}

export function refillGuns(p) {
  for (let i = 0; i < p.guns.length; i++) {
    p.guns[i].charges = modules.gunCharges(CFG.guns[i]);
    p.guns[i].since = 99;
  }
}

export function reset(p) {
  loadout.reset();
  p.gun = loadout.gunAt(0) ?? 0;
  p.shownGun = p.gun;
  showGunModel(p.parts.gun, p.gun);
  p.swap = p.gauge = p.dryFx = p.firePulse = p.chargeShort = 0;
  p.triggerHeld = false;
  p.charge = 0;
  p.heat = 0;
  p.grenadeBank = 0;
  p.salvo.length = 0;
  refillGuns(p);
}
