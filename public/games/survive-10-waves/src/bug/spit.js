import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { makePool } from '../core/pool.js';
import { GEO as DECAL, ACID_TEX as POOL_TEX, ACID_SOFT } from '../fx/textures.js';
import { audio } from '../engine/audio.js';
import * as fx from '../fx/spatter.js';
import * as acid from '../fx/acid.js';
import { maskOf, alphaAt } from '../fx/mask.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import { between } from '../core/rng.js';
import * as evolve from './evolve.js';
import * as modules from '../modules/index.js';
import * as arena from '../arena/size.js';
import { clip } from '../arena/clip.js';

const GEO = new THREE.SphereGeometry(CFG.spit.thickness, 10, 8);

// The alpha a pool is hit-tested against, read now, behind the loading screen.
// Pulling a texture back off the graphics card costs tens of milliseconds: left
// until the first pool of each shape is laid, it is four dropped frames mid-fight.
for (const tex of POOL_TEX) maskOf(tex);

function makeAcidTexture() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  let seed = 1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  g.fillStyle = '#4d8a1e';
  g.fillRect(0, 0, S, S);

  const wrapped = (fn) => { for (const dy of [-S, 0, S]) { g.save(); g.translate(0, dy); fn(); g.restore(); } };

  for (let i = 0; i < 46; i++) {
    const x = rnd() * S, y = rnd() * S;
    const r = 6 + rnd() * 20;
    const dark = rnd() < 0.5;
    wrapped(() => {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, dark ? 'rgba(32,68,12,0.85)' : 'rgba(150,222,72,0.8)');
      grd.addColorStop(1, 'rgba(77,138,30,0)');
      g.fillStyle = grd;
      g.save(); g.translate(x, y); g.scale(1, 1.9); g.translate(-x, -y);
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.restore();
    });
  }

  for (let i = 0; i < 30; i++) {
    const x = rnd() * S, y = rnd() * S, r = 1.5 + rnd() * 4.5;
    wrapped(() => {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = 'rgba(28,58,10,0.55)'; g.fill();
      g.lineWidth = 1.2;
      g.strokeStyle = `rgba(206,255,138,${0.5 + rnd() * 0.45})`;
      g.stroke();
    });
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2.2);
  return tex;
}

const ACID_TEX = makeAcidTexture();
const MAT = new THREE.MeshStandardMaterial({
  map: ACID_TEX,
  emissive: 0x7fd23a,
  emissiveMap: ACID_TEX,
  emissiveIntensity: 0.55,
  roughness: 0.22,
  metalness: 0.0,
  transparent: true,
  opacity: 0.94,
});

const HIST = 48;

const pool = makePool(
  () => {
    const group = new THREE.Group();
    const beads = [];
    for (let i = 0; i < CFG.spit.beads; i++) {
      const m = new THREE.Mesh(GEO, MAT);
      m.castShadow = i < 3;
      group.add(m);
      beads.push(m);
    }
    scene.add(group);
    const hist = [];
    for (let i = 0; i < HIST; i++) hist.push(new THREE.Vector3());
    return {
      mesh: group, beads, hist, n: 0,
      pos: new THREE.Vector3(), vel: new THREE.Vector3(),
      life: 0, dmg: 0, trail: 0, seed: 0,
    };
  },
  (s, pos, vel, dmg) => {
    s.pos.copy(pos);
    s.vel.copy(vel);
    s.dmg = dmg;
    s.volley = null;
    s.life = CFG.spit.life;
    s.trail = 0;
    s.seed = Math.random() * 100;
    s.hold = 0;
    s.every = 0;
    s.tail = 0;
    s.n = 0;
    for (const h of s.hist) h.copy(pos);
    for (const b of s.beads) b.position.copy(pos);
  },
);

// Marks only fade while playing, so a cleared round has to take them down.
export function clear() { pool.clear(); clearPools(); marks.clear(); }

const _a = new THREE.Vector3();
const _to = new THREE.Vector3();
const _lay = new THREE.Vector3();

function planPool(grow, life = CFG.spit.pool.life, blobs = 0) {
  const P = CFG.spit.pool;
  const main = P.radius * 1.3 * grow;
  const plan = [{ dx: 0, dz: 0, size: main, life, shape: fx.planSplat(main, POOL_TEX) }];
  for (let i = 0, n = blobs || 3 + ((Math.random() * 3) | 0); i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = P.radius * grow * (0.5 + Math.random() * 0.75);
    const size = main * (0.3 + Math.random() * 0.3);
    plan.push({ dx: Math.cos(a) * d, dz: Math.sin(a) * d, size,
                life: life * 0.8, shape: fx.planSplat(size, POOL_TEX) });
  }
  return plan;
}

// predict() aims at chest height, so the arc carries on past that point before
// it meets the floor. This is where it truly comes down.
function groundAt(from, vel) {
  const S = CFG.spit;
  const drop = Math.max(0, from.y - S.thickness);
  const t = (vel.y + Math.sqrt(vel.y * vel.y + 2 * S.gravity * drop)) / S.gravity;
  return { x: from.x + vel.x * t, z: from.z + vel.z * t };
}

function layPool(x, z, plan) {
  for (const b of plan) {
    _lay.set(x + b.dx, 0, z + b.dz);
    fx.addHazard(_lay, b.size, acid.ACID, b.life, 0, POOL_TEX, b.shape);
  }
}

// The blobs as the floor holds them: where each one sits, how it is turned, how
// far it reaches, and the alpha it was painted with. A pool burns exactly the
// ground it is drawn on, so the hit test reads the same numbers the splat mesh
// was built from — a splat is a 2x2 plane laid flat, scaled to its own grow,
// and turned in its own plane before it is laid down.
function shapesOf(x, z, plan) {
  const inset = CFG.spit.pool.inset;
  return plan.map((b) => ({
    x: x + b.dx, z: z + b.dz,
    cos: Math.cos(b.shape.rot), sin: Math.sin(b.shape.rot),
    hw: b.shape.grow * b.shape.stretch * inset,
    hh: b.shape.grow * inset,
    mask: maskOf(POOL_TEX[b.shape.tex]),
  }));
}

const boundOf = (shapes, x, z) => shapes.reduce((r, s) => Math.max(r,
  Math.hypot(s.x - x, s.z - z) + Math.hypot(s.hw, s.hh)), 0);

// Sampled about the middle rather than at the player's full width: the ground
// is already drawn in past the paint, and probing at arm's length would hand
// that margin straight back. The rim is still read, so a hole narrower than a
// boot is not somewhere to stand.
const RING = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// One blob, asked how solid it is painted at a spot on the floor.
function alphaOn(s, px, pz) {
  const x = px - s.x, z = pz - s.z;
  const lx = s.cos * x + s.sin * -z;
  const ly = -s.sin * x + s.cos * -z;
  return alphaAt(s.mask, lx / s.hw, ly / s.hh);
}

export function onPool(a, px, pz, pad, cut) {
  for (const s of a.shapes) {
    for (let i = -1; i < RING.length; i++) {
      const x = px + (i < 0 ? 0 : RING[i][0] * pad);
      const z = pz + (i < 0 ? 0 : RING[i][1] * pad);
      if (alphaOn(s, x, z) > cut) return true;
    }
  }
  return false;
}

const OUT_STEP = 0.2;

// How far a spot is from the paint. Marched straight at each blob rather than
// solved: the footprint is an alpha mask and has no edge to put in an equation.
// Zero the moment the spot is on the pool, so what was hit is never also a miss.
export function outsidePool(a, px, pz, pad, cut, reach) {
  let best = Infinity;
  for (const s of a.shapes) {
    const dx = s.x - px, dz = s.z - pz;
    const d = Math.hypot(dx, dz);
    if (d <= 1e-6) return 0;
    const ux = dx / d, uz = dz / d;
    for (let t = 0; t <= Math.min(d, reach + pad); t += OUT_STEP) {
      if (alphaOn(s, px + ux * t, pz + uz * t) <= cut) continue;
      if (t < best) best = t;
      break;
    }
  }
  return Math.max(0, best - pad);
}

const MARK_BLOBS = 6;

// The mark is the pool, drawn early and soft: one quad per blob of the plan the
// gob is already carrying, at the same offset, turn and size the splat will be
// laid with. Same shapes, blurred edge — so what is promised is what arrives.
const marks = makePool(
  () => {
    const group = new THREE.Group();
    const quads = [];
    for (let i = 0; i < MARK_BLOBS; i++) {
      const q = new THREE.Mesh(DECAL.splat, clip(new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      })));
      q.rotation.x = -Math.PI / 2;
      q.renderOrder = 2;
      group.add(q);
      quads.push(q);
    }
    scene.add(group);
    return { mesh: group, quads, held: 0, phase: 0 };
  },
  (m, x, z, plan) => {
    m.mesh.position.set(x, 0.045, z);

    m.quads.forEach((q, i) => {
      const b = plan[i];
      q.visible = !!b;
      if (!b) return;
      q.position.set(b.dx, 0, b.dz);
      q.rotation.z = b.shape.rot;
      q.scale.set(b.shape.grow * b.shape.stretch, b.shape.grow, 1);
      q.material.map = ACID_SOFT[b.shape.tex];
      q.material.color.setHex(CFG.spit.mark.color);
      q.material.opacity = 0;
    });

    m.held = 0;
    m.phase = Math.random() * Math.PI * 2;
  },
);

export function updateMarks(dt) {
  const M = CFG.spit.mark;
  for (let i = marks.live.length - 1; i >= 0; i--) {
    const m = marks.live[i];
    m.held -= dt;
    m.phase += dt * M.pulse;

    const beat = 0.5 + 0.5 * Math.sin(m.phase);
    const want = m.held > 0 ? M.opacity * (M.dim + (1 - M.dim) * beat) : 0;

    let lit = 0;
    for (const q of m.quads) {
      if (!q.visible) continue;
      q.material.opacity += (want - q.material.opacity) * Math.min(1, M.ease * dt);
      lit = Math.max(lit, q.material.opacity);
    }
    if (m.held <= 0 && lit < 0.01) marks.release(i);
  }
}
const _vel = new THREE.Vector3();
const _d = new THREE.Vector3();

const track = {
  vel: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  steady: 1,
};

function observe(dt) {
  const A = CFG.spit.aim;
  const p = world.player;
  const k = 1 - Math.exp(-dt / A.memory);

  track.vel.lerp(p.vel, 1 - Math.exp(-dt / A.velMemory));

  const sp = Math.hypot(p.vel.x, p.vel.z);
  if (sp > 0.5) {
    _d.set(p.vel.x / sp, 0, p.vel.z / sp);

    track.dir.lerp(_d, k);
    const len = track.dir.length();
    track.steady = Math.min(1, Math.max(0, (len - A.loose) / (A.firm - A.loose)));
  } else {
    track.dir.multiplyScalar(1 - k);
    track.steady += (1 - track.steady) * k;
  }
}

// Where to throw so the gob and the mark arrive together. The player is led off
// a remembered heading — how steadily they have been running decides how much —
// while anything else is led off its own velocity, since nothing is watching it
// closely enough to have a memory of it.
export function predict(out, mark = world.player) {
  const S = CFG.spit;
  const A = S.aim;
  const own = mark === world.player;
  const lead = own ? A.maxLead * track.steady * S.flight : S.flight;
  const vx = own ? track.vel.x : mark.vel.x;
  const vz = own ? track.vel.z : mark.vel.z;
  out.set(mark.pos.x + vx * lead, S.aimHeight, mark.pos.z + vz * lead);

  const lim = arena.radius() - CFG.player.radius - 0.6;
  const d = Math.hypot(out.x, out.z);
  if (d > lim) { out.x *= lim / d; out.z *= lim / d; }
  return out;
}

export function fire(from, bug, mark = world.player) {
  const S = CFG.spit;
  const A = S.aim;

  predict(_to, mark);
  _to.x += (Math.random() - 0.5) * A.jitter;
  _to.z += (Math.random() - 0.5) * A.jitter;
  _vel.subVectors(_to, from).divideScalar(S.flight);
  _vel.y += 0.5 * S.gravity * S.flight;
  const s = pool.spawn(from, _vel, bug.damage);
  s.by = bug;
  s.plan = planPool(evolve.poolMult(bug));
  s.pool = CFG.spit.pool.radius * evolve.poolMult(bug);
  s.burn = evolve.hit(bug, CFG.spit.pool.damage);
  s.to = groundAt(from, _vel);
  s.mark = modules.sees('attacks') ? marks.spawn(s.to.x, s.to.z, s.plan) : null;
  audio.playAt('spit', from.x, from.z, {});
  return s;
}

// A gob thrown by something that is not a spitter: the caller picks the ground
// it lands on and what it leaves burning there, and it flies, drips and marks
// its landing exactly as a spit does. Flight time grows with the throw so a
// long one hangs, which is what gives the mark time to be read.
export function lob(from, to, C) {
  const S = CFG.spit;
  const flight = C.flight[0] + Math.hypot(to.x - from.x, to.z - from.z) * C.flight[1];

  _vel.set((to.x - from.x) / flight, 0, (to.z - from.z) / flight);
  _vel.y = -from.y / flight + 0.5 * S.gravity * flight;

  const s = pool.spawn(from, _vel, 0);
  s.by = C.by || null;
  s.volley = C.volley || null;
  s.plan = planPool(C.grow, C.life, C.blobs);
  s.pool = S.pool.radius * C.grow;
  s.burn = C.burn;
  s.hold = C.life;
  s.every = C.tick;
  s.tail = C.beads || 0;
  s.to = { x: to.x, z: to.z };
  s.mark = C.warn || modules.sees('attacks') ? marks.spawn(to.x, to.z, s.plan) : null;
  audio.playAt('spit', from.x, from.z, { rate: C.rate });
  return s;
}

// Laid where it is, not thrown: for something that covers the ground by
// crossing it. Same art, same burn, same hit shape as a gob's landing.
export function pour(x, z, C) {
  const plan = planPool(C.grow, C.life, C.blobs);
  layPool(x, z, plan);
  const shapes = shapesOf(x, z, plan);
  pools.push({ x, z, r: CFG.spit.pool.radius * C.grow, burn: C.burn, shapes,
               bound: boundOf(shapes, x, z),
               life: C.life, maxLife: C.life, tick: 0, every: C.tick,
               bub: 0, fume: 0 });
}

const _hit = new THREE.Vector3();

export function update(dt) {
  const S = CFG.spit;
  const p = world.player;
  observe(dt);
  updatePools(dt);

  ACID_TEX.offset.y -= dt * CFG.spit.flow;

  for (let i = pool.live.length - 1; i >= 0; i--) {
    const s = pool.live[i];
    s.life -= dt;
    s.vel.y -= S.gravity * dt;
    s.pos.addScaledVector(s.vel, dt);

    s.n = Math.min(s.n + 1, HIST);
    for (let k = Math.min(s.n, HIST) - 1; k > 0; k--) s.hist[k].copy(s.hist[k - 1]);
    s.hist[0].copy(s.pos);

    layoutBeads(s, s.vel.length());
    if (s.mark) s.mark.held = S.mark.hold;

    s.trail -= dt;
    if (s.trail <= 0) {
      s.trail = 0.028;
      acid.drip(s.pos);
    }

    const pos = s.pos;

    if (pos.y <= S.thickness) {
      // The step that crosses the floor lands a little short of the arc's true
      // end, so the pool goes on the marked spot rather than there.
      _hit.set(s.to.x, 0, s.to.z);
      // The pool is laid first so the splash can be asked of the ground it just
      // painted: what the gob hits and what it goes on burning are one shape.
      const a = splash(s, _hit, true);
      const P = S.pool;
      const grip = CFG.player.radius * P.grip;
      const near = drone.nearest(_hit.x, _hit.z);
      if (s.dmg > 0 && near && onPool(a, near.pos.x, near.pos.z, near.radius, P.edge)) {
        drone.damage(near, s.dmg * S.splashDamage);
      }
      // A thrown gob carries no impact of its own — what it leaves on the
      // ground is the attack — and a zero would still float a number. What it
      // burns is aimed either way, so what it misses by is still a near miss.
      const under = onPool(a, p.pos.x, p.pos.z, grip, P.edge);
      if (s.dmg > 0 && under) {
        world.hooks.damagePlayer(s.dmg * S.splashDamage, { stacks: true, by: 'spitter' });
      } else if (!under) {
        graze.edge(outsidePool(a, p.pos.x, p.pos.z, grip, P.edge, modules.grazeBand()),
                   { from: s.by, volley: s.volley });
      }
      const was = dodge.leaving();
      if (was && onPool(a, was.x, was.z, grip, P.edge)) {
        dodge.paid(was.x, was.z, s.by, s.volley);
      }
      pool.release(i);
      continue;
    }

    if (s.life <= 0) { splash(s, pos, true); pool.release(i); }
  }
}

function layoutBeads(s, speed) {
  const S = CFG.spit;
  // A thrown volley is dozens of gobs at once, so it asks for a shorter tail
  // than a spitter's single shot and the beads past it are put away.
  const n = Math.min(s.beads.length, s.tail || s.beads.length);
  for (let i = n; i < s.beads.length; i++) s.beads[i].visible = false;
  const tail = Math.min(S.maxTail, speed * S.tailTime);
  const t = performance.now() * 0.001;

  let seg = 0;
  let walked = 0;
  for (let i = 0; i < n; i++) {
    const want = tail * Math.pow(i / (n - 1), S.spacing);
    while (seg < s.n - 1 && walked + s.hist[seg].distanceTo(s.hist[seg + 1]) < want) {
      walked += s.hist[seg].distanceTo(s.hist[seg + 1]);
      seg++;
    }
    const a = s.hist[seg];
    const b = s.hist[Math.min(seg + 1, s.n - 1)];
    const segLen = a.distanceTo(b);
    const f = segLen > 1e-6 ? Math.min(1, (want - walked) / segLen) : 0;
    _a.copy(a).lerp(b, f);

    const bead = s.beads[i];
    bead.position.copy(_a);
    const k = i / (n - 1);
    const taper = 1 - (1 - S.tailTaper) * k;
    const wob = 1 + Math.sin(t * 11 + s.seed + i * 1.7) * S.wobble * (0.35 + k);
    bead.scale.setScalar(taper * wob);

    bead.visible = s.n > 1 || i === 0;
  }
}

function splash(s, pos, ground) {
  audio.playAt('spitHit', pos.x, pos.z, {});
  acid.burst(pos);
  if (!ground) return null;
  layPool(pos.x, pos.z, s.plan);
  const shapes = shapesOf(pos.x, pos.z, s.plan);
  const life = s.hold || CFG.spit.pool.life;
  const a = { x: pos.x, z: pos.z, r: s.pool, burn: s.burn, shapes,
              bound: boundOf(shapes, pos.x, pos.z),
              life, maxLife: life, tick: 0, every: s.every,
              bub: 0, fume: 0 };
  pools.push(a);
  return a;
}

const pools = [];

// The live pools, for anything that wants to draw what they cover rather than
// wait to be burnt by it.
export const burning = () => pools;

// Ground that is spoken for but not yet burning: every gob in the air, on the
// spot its own mark is drawn on. This is the warning read back — anything that
// can dodge is dodging the same circle the player is being shown.
export function threat(out) {
  const S = CFG.spit;
  for (const s of pool.live) out.push({ x: s.to.x, z: s.to.z, r: s.pool + S.dodge });
  return out;
}

// The pool a gob in the air is going to lay, worked out where it will land: the
// same shapes the splash will be asked of, before either exists.
export function incoming(out) {
  for (const s of pool.live) {
    if (s.dmg <= 0) continue;
    const shapes = shapesOf(s.to.x, s.to.z, s.plan);
    out.push({ x: s.to.x, z: s.to.z, shapes, bound: boundOf(shapes, s.to.x, s.to.z) });
  }
  return out;
}

function clearPools() { pools.length = 0; }

function updatePools(dt) {
  const P = CFG.spit.pool;
  const p = world.player;
  for (let i = pools.length - 1; i >= 0; i--) {
    const a = pools[i];
    a.life -= dt;
    if (a.life <= 0) { pools[i] = pools[pools.length - 1]; pools.pop(); continue; }

    const boil = CFG.spit.boil;
    a.bub -= dt;
    if (a.bub <= 0) { a.bub = between(boil.every); acid.bubble(a.x, a.z, a.r); }

    a.fume -= dt;
    if (a.fume <= 0) { a.fume = between(boil.smokeEvery); acid.fume(a.x, a.z, a.r); }

    a.tick -= dt;
    if (a.tick > 0) continue;
    if (fx.showing(a.life, a.maxLife) < P.burnAlpha) continue;
    if (Math.hypot(p.pos.x - a.x, p.pos.z - a.z) > a.bound + CFG.player.radius) continue;
    if (onPool(a, p.pos.x, p.pos.z, CFG.player.radius * P.grip, P.edge)) {
      a.tick = a.every || P.tick;
      world.hooks.damagePlayer(a.burn, { from: a, by: 'spitter', ground: true });
    }
  }
}
