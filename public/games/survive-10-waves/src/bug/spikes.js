import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, shakeAt } from '../engine/view.js';
import { world } from '../core/world.js';
import { makePool } from '../core/pool.js';
import { audio } from '../engine/audio.js';
import * as fx from '../fx/spatter.js';
import { ZONE_TEX, ZONE_FILL, SPIKE_TEX, SPIKE_TIP_TEX } from '../fx/textures.js';
import * as pattern from './patterns.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import * as modules from '../modules/index.js';
import { clip } from '../arena/clip.js';

// One flat quad, unit sized, wearing whichever shape it needs: the wobble and
// the soft rim live in the texture, so a mark costs nothing but its own art.
const PLANE = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const CONE = new THREE.ConeGeometry(0.22, 1, 5);
CONE.translate(0, 0.5, 0);

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _at = new THREE.Vector3();
const _spot = { x: 0, z: 0 };
const _tint = new THREE.Color();

const flat = (x, z, sx, sz, yaw = 0) => {
  _e.set(0, yaw, 0);
  _p.set(x, 0, z);
  _s.set(sx, 1, sz);
  return _m.compose(_p, _q.setFromEuler(_e), _s);
};

const RING_SOFT = 0.05;

// A ring zone is a fence of a set thickness, so its outer and inner radii are
// not in any fixed proportion — no one painted annulus can be the shape of all
// of them. This one is cut in the shader from the zone's own numbers instead:
// exact, and still soft at both rims the way every telegraph in the game is.
function ringShader(mat) {
  const cut = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, renderer) => {
    cut(sh, renderer);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aInner;
        varying float vInner;
        varying vec2 vRing;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vInner = aInner;
        vRing = uv - 0.5;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vInner;
        varying vec2 vRing;`)
      .replace('#include <map_fragment>', `
        float ringD = length(vRing) * 2.0;
        diffuseColor.a *= smoothstep(vInner - ${RING_SOFT}, vInner + ${RING_SOFT}, ringD)
                        * (1.0 - smoothstep(1.0 - ${RING_SOFT}, 1.0, ringD));`);
  };
  mat.customProgramCacheKey = () => 'arena-cut-ring';
  return mat;
}

function markMesh(map, ring = false) {
  const S = CFG.spikes;
  // White and fully opaque: the tint and the brightness both ride on the
  // per-instance colour, since each zone lights on its own clock.
  const mat = clip(new THREE.MeshBasicMaterial({
    map: ring ? null : map, color: 0xffffff, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  // Its own geometry, since the inner radius rides on the instances.
  const geo = ring ? PLANE.clone() : PLANE;
  const m = new THREE.InstancedMesh(geo, ring ? ringShader(mat) : mat, S.maxZones);
  if (ring) {
    m.inner = new THREE.InstancedBufferAttribute(new Float32Array(S.maxZones), 1);
    geo.setAttribute('aInner', m.inner);
  }
  m.renderOrder = 3;
  m.frustumCulled = false;
  m.count = 0;
  return m;
}

const traps = makePool(
  () => {
    const S = CFG.spikes;
    const g = new THREE.Group();

    const marks = [markMesh(ZONE_TEX.disc), markMesh(null, true),
                   markMesh(ZONE_TEX.lane)];

    // The map carries the banding and the dirty foot; `color` still sets the
    // hue, so the species colour remains one number in the config.
    const shell = clip(new THREE.MeshStandardMaterial({
      color: S.color, map: SPIKE_TEX, roughness: 0.62, metalness: 0.12,
      emissive: S.markColor, emissiveMap: SPIKE_TIP_TEX, emissiveIntensity: S.tipGlow,
      transparent: true,
    }));
    // One instanced mesh, not one mesh a spike: a wide pattern needs hundreds of
    // them and they all move together anyway.
    const spikes = new THREE.InstancedMesh(CONE, shell, S.maxCount);
    spikes.castShadow = true;
    spikes.frustumCulled = false;
    spikes.count = 0;

    g.add(spikes, ...marks);
    g.position.y = 0.04;
    scene.add(g);
    return { mesh: g, marks, shell, spikes, zones: [], used: 0,
             seed: new Float32Array(S.maxCount * 7),
             age: 0, span: 0, hurt: 0 };
  },
  (p, zones, hurt, density, by = null) => {
    const S = CFG.spikes;
    p.zones = zones.slice(0, S.maxZones);
    for (const z of p.zones) { z.struck = false; z.cd = 0; }
    p.hurt = hurt;
    p.by = by;
    p.age = 0;
    p.span = Math.max(...p.zones.map((z) => z.at)) + S.telegraph + S.rise + S.hold + S.sink;
    p.shell.opacity = 1;
    p.spikes.count = 0;
    layMarks(p);

    // Spikes go by area, not by shape: every pattern stands at the same density
    // whatever ground it covers. `density` thins that for a field big enough
    // that standing it at an impaler's density would want tens of thousands.
    const area = p.zones.reduce((a, z) => a + pattern.areaOf(z), 0);
    const base = Math.PI * S.radius * S.radius;
    p.used = Math.min(S.maxCount, Math.round(S.count * density * (area / base)));

    for (let i = 0; i < p.used; i++) {
      let roll = Math.random() * area, at = 0, zone = p.zones[0];
      for (let j = 0; j < p.zones.length; j++) {
        roll -= pattern.areaOf(p.zones[j]);
        if (roll <= 0) { zone = p.zones[j]; at = j; break; }
      }
      pattern.sampleIn(zone, _spot);

      const k = i * 7;
      p.seed[k] = _spot.x;
      p.seed[k + 1] = _spot.z;
      p.seed[k + 2] = S.height * (0.6 + Math.random() * 0.7);
      p.seed[k + 3] = (Math.random() - 0.5) * 0.35;
      p.seed[k + 4] = Math.random() * Math.PI;
      p.seed[k + 5] = (Math.random() - 0.5) * 0.35;
      p.seed[k + 6] = at;
    }
    p.spikes.count = p.used;
    stand(p);
  },
);


// Every zone keeps its own clock, so a pattern can arrive a piece at a time.
function clockOf(p, z) {
  const S = CFG.spikes;
  const t = p.age - z.at;
  const since = t - S.telegraph;
  if (since < 0) return { warn: Math.max(0, t) / S.telegraph, out: 0, since };
  if (since < S.rise) return { warn: 1, out: 1 - Math.pow(1 - since / S.rise, 3), since };
  if (since < S.rise + S.hold) return { warn: 1, out: 1, since };
  const gone = (since - S.rise - S.hold) / S.sink;
  return { warn: 1, out: Math.max(0, 1 - gone), since };
}

// A breath of tips as a zone locks in, so the ground reads as taken before
// anything comes through it. Kept out of clockOf: what erupts and what hurts is
// that clock's to say, and this is only ever a look.
function peek(t) {
  const H = CFG.spikes.hint;
  if (t < 0 || t > H.time) return 0;
  const k = t / H.time;
  // Up, held, and back down: a shape that only touches its height in passing is
  // a flicker, and a cone this far out of the ground is a few pixels of tip.
  return H.out * Math.min(1, k / H.ease, (1 - k) / H.ease);
}

// How far each spike stands out of the ground, read from its own zone.
function stand(p) {
  for (let i = 0; i < p.used; i++) {
    const k = i * 7;
    const tall = p.seed[k + 2];
    const z = p.zones[p.seed[k + 6]];
    const out = Math.max(clockOf(p, z).out, peek(p.age - z.at));
    _e.set(p.seed[k + 3], p.seed[k + 4], p.seed[k + 5]);
    _p.set(p.seed[k], -tall * (1 - out), p.seed[k + 1]);
    _s.set(1, tall, 1);
    p.spikes.setMatrixAt(i, _m.compose(_p, _q.setFromEuler(_e), _s));
  }
  p.spikes.instanceMatrix.needsUpdate = true;
}

// Laid once, where the spikes will stand. It never moves or resizes after that;
// only its brightness changes.
function layMarks(p) {
  // Always laid out, even when nothing may be read yet: buying the augur
  // mid-trap must not find a zone that was never given a slot.
  const show = modules.sees('attacks');
  const n = [0, 0, 0];
  for (const z of p.zones) {
    const slot = z.band ? 2 : (z.inner > 0 ? 1 : 0);
    z.mark = { slot, at: n[slot] };
    // The art sits inside its canvas, so the quad is opened out to put the
    // painted edge exactly on the zone. A ring is cut from the quad's own
    // coordinates instead, so it wants the quad on the zone exactly.
    const fit = slot === 1 ? 2 : 2 / ZONE_FILL;
    const m = p.marks[slot];
    if (slot === 1) m.inner.array[n[slot]] = z.inner / z.r;
    m.setMatrixAt(n[slot]++, z.band
      ? flat(z.x, z.z, z.hw * fit, z.hl * fit, z.yaw)
      : flat(z.x, z.z, z.r * fit, z.r * fit));
  }
  // Dark before anything is drawn: an instance colour starts out white, and a
  // recycled one still holds the brightness it died at.
  p.marks.forEach((m, i) => {
    m.count = show ? n[i] : 0;
    m.instanceMatrix.needsUpdate = true;
    if (m.inner) m.inner.needsUpdate = true;
    for (let k = 0; k < n[i]; k++) m.setColorAt(k, _tint.setRGB(0, 0, 0));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
}

// Brightness rides on the instance colour, since each zone lights on its own
// clock while they all share one material.
function glowMarks(p) {
  const S = CFG.spikes;
  if (!p.marks[0].count && !p.marks[1].count && !p.marks[2].count) return;
  for (const z of p.zones) {
    const c = clockOf(p, z);
    const k = c.warn;
    // Barely there to begin with and rushing up at the end, so the last moment
    // before it breaks is the one that catches your eye.
    const alpha = c.since >= 0
      ? Math.max(0, S.markHigh * (1 - c.since / S.rise))
      : S.markLow + (S.markHigh - S.markLow) * Math.pow(k, S.markEase);
    const m = p.marks[z.mark.slot];
    m.setColorAt(z.mark.at, _tint.setHex(S.markColor).multiplyScalar(alpha));
    m.instanceColor.needsUpdate = true;
  }
}

export function summon(x, z, { grow = 1, hurt = CFG.spikes.damage, yaw = 0,
                               kind = pattern.pick(), density = 1, span = 1,
                               by = null } = {}) {
  traps.spawn(pattern.zonesOf(kind, x, z, CFG.spikes.radius * grow, yaw, span),
              hurt, density, by);
  audio.playAt('spit', x, z, { rate: 0.45, gainScale: 0.5 });
}

export function clear() { traps.clear(); }

// Every zone that is warning or standing, as flat circles: for anything that
// wants to keep off the ground the spikes have taken. A band answers with the
// circle that holds it, which is wider than it needs but never misses.
export function claimed(out) {
  out.length = 0;
  for (const p of traps.live) {
    for (const z of p.zones) {
      if (p.age < z.at) continue;
      out.push({ x: z.x, z: z.z, r: z.band ? Math.hypot(z.hw, z.hl) : z.r });
    }
  }
  return out;
}

// The live zones themselves, shapes and all, for anything that wants to ask them
// the same question gore() does rather than settle for a circle round them.
export function zones(out) {
  out.length = 0;
  for (const p of traps.live) {
    for (const z of p.zones) if (p.age >= z.at) out.push(z);
  }
  return out;
}

// Three layers, because one sample does not sound like stone coming through
// soil: the ground breaking, the shafts hitting their height, and the grit.
function erupt(p, z, at) {
  const S = CFG.spikes;
  z.struck = true;
  // Judged as the ground breaks rather than in gore(), which goes on asking for
  // as long as the shafts stand: the attack lands once.
  graze.edge(pattern.outside(z, world.player.pos) - CFG.player.radius * 0.5,
             { ground: true, from: p.by });
  const was = dodge.leaving();
  if (was && pattern.covers(z, was, CFG.player.radius * 0.5)) dodge.paid(was.x, was.z, p.by);

  // Ground breaking open is felt, not just seen.
  shakeAt(z.x, z.z, S.shake.power, S.shake.range);

  // A puff at the foot of every few spikes, so the whole shape breaks open at
  // once rather than one clod appearing in the middle of it.
  let spots = 0;
  for (let i = 0; i < p.used && spots < S.dirtSpots; i++) {
    const k = i * 7;
    if (p.seed[k + 6] !== at) continue;
    if (Math.random() > S.dirtShare) continue;
    _at.set(p.seed[k], 0.08, p.seed[k + 1]);
    fx.dirt(_at, S.dirtPuffs, S.dirtPower);
    spots++;
  }

  _at.set(z.x, 0.1, z.z);

  const size = Math.min(1.6, (z.band ? z.hl : z.r) / S.radius);
  audio.playAt('explode', _at.x, _at.z,
               { rate: S.thud.rate / size, gainScale: S.thud.gain });
  audio.playAt('spithit', _at.x, _at.z,
               { rate: S.crunch.rate * (0.95 + Math.random() * 0.1),
                 gainScale: S.crunch.gain });
  audio.blip({ freq: S.shriek.freq / size, type: 'sawtooth',
               dur: S.shriek.dur, gain: S.shriek.gain, slide: S.shriek.slide });
}

// They keep hurting while they stand: catching the eruption is one thing, but
// walking into a field of them afterwards is the same set of spikes.
function gore(p, z, out, dt) {
  const S = CFG.spikes;
  z.cd -= dt;
  if (out < S.bite || z.cd > 0) return;
  if (!pattern.covers(z, world.player.pos, CFG.player.radius * 0.5)) return;
  z.cd = S.contact;
  world.hooks.damagePlayer(p.hurt, { stacks: true, by: 'impaler', ground: true });
}

export function update(dt) {
  for (let i = traps.live.length - 1; i >= 0; i--) {
    const p = traps.live[i];
    p.age += dt;

    for (let zi = 0; zi < p.zones.length; zi++) {
      const z = p.zones[zi];
      const out = clockOf(p, z).out;
      if (!z.struck && out > 0) erupt(p, z, zi);
      if (z.struck) gore(p, z, out, dt);
    }
    stand(p);
    glowMarks(p);

    if (p.age >= p.span) traps.release(i);
  }
}
