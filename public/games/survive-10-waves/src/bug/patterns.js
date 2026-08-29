import { CFG } from '../config/index.js';
import { between } from '../core/rng.js';

// A pattern is a handful of zones on the floor. A zone is either a disc (with an
// optional hole) or a band; everything else — where the spikes stand, where the
// mark is drawn, what counts as a hit — is read off these.
const disc = (x, z, r, inner = 0, at = 0) => ({ x, z, r, inner, at, band: false });
const band = (x, z, hw, hl, yaw, at = 0) => ({ x, z, hw, hl, yaw, at, band: true });


const SHAPES = {
  circle: (x, z, r) => [disc(x, z, r)],

  halo: (x, z, r) => {
    const H = CFG.spikes.halo;
    return [disc(x, z, r * H.core),
            disc(x, z, r * H.outer, r * H.inner)];
  },

  // Turned with the impaler, not with the world: one lane runs down the line it
  // is facing you along, the other cuts across it.
  laneAlong: (x, z, r, yaw) => [lane(x, z, r, yaw)],
  laneAcross: (x, z, r, yaw) => [lane(x, z, r, yaw + Math.PI / 2)],

  // The boss's own two, and the only ones that take the whole map: `r` is the
  // arena's radius, not a spike zone's.
  //
  // Rings close on you from the middle outward, one every `stagger`, so where
  // you stand decides how long you have and every ring is a fence to cross.
  rings: (x, z, r) => {
    const C = CFG.spikes.rings;
    const step = C.width + C.gap;
    const out = [];
    // Stepped out by a fixed stride rather than divided into the radius: the
    // lane between two rings has to be the width of a ring exactly, so the
    // last one falls where it falls instead of being stretched to the rim.
    for (let rad = step, i = 0; rad <= r; rad += step, i++) {
      out.push(disc(x, z, rad, rad - C.width, i * C.stagger));
    }
    return out;
  },

  // Lines thrown out from the boss on random bearings. Each line is a run of
  // rectangles laid end to end — every one exactly as long as the step, so they
  // meet with nothing between them and the ray reads as one unbroken lane — and
  // each breaks after the one behind it, so the ground opens away from the boss
  // like a crack running.
  rays: (x, z, r) => {
    const C = CFG.spikes.rays;
    const lines = C.lines[0] + ((Math.random() * (C.lines[1] - C.lines[0] + 1)) | 0);
    const steps = Math.max(1, Math.round(r / C.step));
    const len = r / steps;
    const out = [];

    // Evenly round the boss rather than scattered: what varies is where the
    // whole figure is pointed, not the gaps between its arms.
    const turn = Math.random() * Math.PI * 2;
    for (let l = 0; l < lines; l++) {
      const a = turn + (l / lines) * Math.PI * 2;
      // A band runs along (sin yaw, cos yaw), so a lane pointing down the
      // bearing is that bearing turned a quarter of the way back.
      const yaw = Math.PI / 2 - a;
      for (let i = 0; i < steps; i++) {
        const d = (i + 0.5) * len;
        out.push(band(x + Math.cos(a) * d, z + Math.sin(a) * d,
                      C.wide, len / 2, yaw, i * C.stagger));
      }
    }
    return out;
  },

  // Two thick bars crossed on the player and turned together: what is left
  // standing is the four quadrants between the arms, and getting to one of them
  // is the whole answer. `span` is how far the arms reach — short enough and the
  // quadrants are ground you can stand on, at full length they are the map.
  cross: (x, z, r, yaw, span) => {
    const C = CFG.spikes.cross;
    const turn = Math.random() * Math.PI * 2;
    const long = r * C.long * span;
    return [band(x, z, r * C.wide, long, turn),
            band(x, z, r * C.wide, long, turn + Math.PI / 2)];
  },

  // Two bars laid either side of the player on a rolled bearing, leaving a
  // corridor down the middle that runs whichever way the pair was thrown.
  // `span` shortens the bars without touching the corridor: a short pair is
  // rounded at the ends, a full one has to be run.
  pincer: (x, z, r, yaw, span) => {
    const C = CFG.spikes.pincer;
    const turn = Math.random() * Math.PI * 2;
    // A band's width runs along (cos yaw, -sin yaw), so stepping the pair out
    // on that axis is what puts one either side rather than end to end.
    const ax = Math.cos(turn), az = -Math.sin(turn);
    const off = r * C.apart;
    const long = r * C.long * span;
    return [band(x + ax * off, z + az * off, r * C.wide, long, turn),
            band(x - ax * off, z - az * off, r * C.wide, long, turn)];
  },

  scatter: (x, z, r) => {
    const C = CFG.spikes.scatter;
    const n = C.count[0] + ((Math.random() * (C.count[1] - C.count[0] + 1)) | 0);
    // One at a time, in the order they were rolled: each circle brings its own
    // warning with it rather than the whole field lighting up at once.
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.9;
      const d = between(C.spread) * r;
      out.push(disc(x + Math.cos(a) * d, z + Math.sin(a) * d,
                    r * between(C.size), 0, i * C.stagger));
    }
    return out;
  },
};

function lane(x, z, r, yaw) {
  const L = CFG.spikes.lane;
  return band(x, z, r * L.wide, r * L.long, yaw);
}

// What an impaler may roll. The boss's map-wide shapes live in SHAPES with the
// rest, but nothing rolls them — they are asked for by name.
export const KINDS = ['circle', 'halo', 'laneAlong', 'laneAcross', 'scatter'];

// Figures thrown round the player rather than out from whatever threw them.
export const ONPLAYER = new Set(['cross', 'pincer']);

const openAt = (kind) => CFG.spikes.unlock[kind] || 1;

export const learnt = (kind, level) => level >= openAt(kind);

export const kindsAt = (level) => KINDS.filter((k) => learnt(k, level));

// The same gate over a list somebody else keeps: the boss's field figures are
// never rolled out of KINDS, but they are learnt the same way.
export const openIn = (list, level) => list.filter((k) => learnt(k, level));

export function pick(level = Infinity) {
  const open = kindsAt(level);
  return open[(Math.random() * open.length) | 0];
}

export const zonesOf = (kind, x, z, r, yaw, span = 1) =>
  (SHAPES[kind] || SHAPES.circle)(x, z, r, yaw, span);

export const areaOf = (z) => (z.band
  ? 4 * z.hw * z.hl
  : Math.PI * (z.r * z.r - z.inner * z.inner));

// Uniform inside the shape: a band is sampled in its own frame and turned, a
// ring is sampled by area so it does not bunch up at the hole.
export function sampleIn(z, out) {
  if (z.band) {
    const u = (Math.random() * 2 - 1) * z.hw;
    const v = (Math.random() * 2 - 1) * z.hl;
    // Turned the way three.js turns a mesh about Y, so the spikes stand exactly
    // where the mark that was drawn for them lies.
    const s = Math.sin(z.yaw), c = Math.cos(z.yaw);
    out.x = z.x + c * u + s * v;
    out.z = z.z - s * u + c * v;
    return out;
  }
  const a = Math.random() * Math.PI * 2;
  const d = Math.sqrt(z.inner * z.inner + Math.random() * (z.r * z.r - z.inner * z.inner));
  out.x = z.x + Math.cos(a) * d;
  out.z = z.z + Math.sin(a) * d;
  return out;
}

// How far outside a zone a point is, negative while it is inside. A ring answers
// for its hole as well as its rim: standing in the middle of one is a dodge.
export function outside(z, x) {
  const dx = x.x - z.x, dz = x.z - z.z;
  if (z.band) {
    const s = Math.sin(z.yaw), c = Math.cos(z.yaw);
    return Math.max(Math.abs(c * dx - s * dz) - z.hw, Math.abs(s * dx + c * dz) - z.hl);
  }
  const d = Math.hypot(dx, dz);
  return Math.max(d - z.r, z.inner - d);
}

export function covers(z, x, pad) {
  const dx = x.x - z.x, dz = x.z - z.z;
  if (z.band) {
    const s = Math.sin(z.yaw), c = Math.cos(z.yaw);
    return Math.abs(c * dx - s * dz) <= z.hw + pad
      && Math.abs(s * dx + c * dz) <= z.hl + pad;
  }
  const d = Math.hypot(dx, dz);
  return d <= z.r + pad && d >= Math.max(0, z.inner - pad);
}
