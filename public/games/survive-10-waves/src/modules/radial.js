import { CFG } from '../config/index.js';
import * as layout from './layout.js';

const RING = CFG.moduleRing;
const START = -Math.PI / 2;

function graph(shown) {
  const all = layout.currentLayout();
  const byAll = new Map(all.map((e) => [e.id, e]));
  const kept = (e, seen = new Set()) => {
    if (!shown(e.id) || seen.has(e.id)) return false;
    seen.add(e.id);
    const dep = e.needs && byAll.get(e.needs.mod);
    return !dep || kept(dep, seen);
  };
  const entries = all.filter((e) => kept(e));
  const byId = new Map(entries.map((e) => [e.id, e]));
  const kids = new Map(entries.map((e) => [e.id, []]));
  const roots = [];
  for (const e of entries) {
    const dep = e.needs && byId.has(e.needs.mod) && e.needs.mod !== e.id ? e.needs.mod : null;
    if (dep) kids.get(dep).push(e.id);
    else roots.push(e.id);
  }
  return { entries, byId, kids, roots };
}

export function compute(shown = () => true) {
  const { byId, kids, roots } = graph(shown);

  const weights = new Map();
  const weigh = (id) => {
    if (weights.has(id)) return weights.get(id);
    weights.set(id, 1);
    const w = 1 + kids.get(id).reduce((a, k) => a + weigh(k), 0);
    weights.set(id, w);
    return w;
  };

  const gate = (id) => {
    const e = byId.get(id);
    return e && e.needs ? e.needs.level : 0;
  };

  const flipped = (id) => !!(byId.get(id) || {}).flip;

  // Deepest gate nearest the parent's own slot. A branch that hangs off further
  // out starts further out, so keeping it close in angle means its edge never
  // has to cross a shallower sibling's chain to reach it. A flipped branch is
  // dealt the other side of the parent, and takes its place in that side's own
  // order rather than jumping the queue.
  const order = (list) => {
    const left = [], right = [];
    [...list].sort((a, b) => gate(b) - gate(a)).forEach((id, i) => {
      const own = i % 2 ? left : right;
      (flipped(id) ? (own === left ? right : left) : own).push(id);
    });
    return [...left.reverse(), null, ...right];
  };

  const angles = new Map();
  const spread = (id, from, to) => {
    const list = kids.get(id);
    const slots = order(list);
    let a = from;
    for (const kid of slots) {
      const span = (to - from) * (kid === null ? 1 : weigh(kid)) / weigh(id);
      if (kid === null) angles.set(id, a + span / 2);
      else spread(kid, a, a + span);
      a += span;
    }
  };
  // Sectors go by how much hangs off each root, so a lone chain is not handed
  // the same wedge as a whole weapon.
  const whole = roots.reduce((a, id) => a + weigh(id), 0) || 1;
  let edge = START;
  for (const id of roots) {
    const sector = Math.PI * 2 * weigh(id) / whole;
    spread(id, edge, edge + sector);
    edge += sector;
  }

  const rungs = new Map();
  for (const n of layout.NODES) rungs.set(n.id, (rungs.get(n.id) || 0) + 1);
  const spanOf = (id) => ((rungs.get(id) || 1) - 1) * RING.gap;

  const apart = (a, b) => {
    const d = Math.abs(angles.get(a) - angles.get(b));
    return Math.min(d, Math.PI * 2 - d);
  };

  const bases = new Map();
  const placed = [];

  const meets = (id, r, other) =>
    r <= bases.get(other) + spanOf(other) && bases.get(other) <= r + spanOf(id);

  // A chain is only crowded by the ones it shares rings with, and near the hub
  // hardly anything does: every branch begins outside the rung it hangs off, so
  // the inner rings carry a handful of chains spread wide apart. Measured
  // against its own wedge instead, a root would be shoved out to clear
  // neighbours that are not there yet, and its whole subtree with it. Of two
  // that do meet, the one starting further out gives way, and it shifts whole,
  // so the rungs stay evenly spaced.
  const cleared = (id, from) => {
    let r = from;
    for (let again = true; again;) {
      again = false;
      for (const other of placed) {
        const want = RING.clear / apart(id, other);
        if (r >= want || bases.get(other) >= want || !meets(id, r, other)) continue;
        r = want;
        again = true;
      }
    }
    return r;
  };

  // Where a chain's first rung lands. A branch begins outside the very rung it
  // hangs off — the one it is gated on, at the radius that rung actually ends up
  // at — so nothing you have yet to unlock ever sits closer to the middle than
  // what unlocks it.
  const baseOf = (id) => {
    if (bases.has(id)) return bases.get(id);
    bases.set(id, RING.first);
    const e = byId.get(id);
    const dep = e && e.needs && byId.has(e.needs.mod) ? e.needs : null;
    const from = dep
      ? baseOf(dep.mod) + (dep.level - 1) * RING.gap + RING.branch
      : RING.first;
    const r = cleared(id, from);
    bases.set(id, r);
    placed.push(id);
    return r;
  };

  // Where a chain would start with nothing in its way. It only ever rises along
  // a dependency, so walking the tree in this order places every parent before
  // its child, and every chain before any that begins outside it.
  const natural = (id, seen = new Set()) => {
    if (seen.has(id)) return RING.first;
    seen.add(id);
    const e = byId.get(id);
    const dep = e && e.needs && byId.has(e.needs.mod) ? e.needs : null;
    return dep
      ? natural(dep.mod, seen) + (dep.level - 1) * RING.gap + RING.branch
      : RING.first;
  };

  // Innermost first, which is what makes the rule above hold: whichever of two
  // crowded chains starts further out is the one still waiting to be placed, so
  // it is the one that gives way. Walked in the order the tree was written, a
  // root could be shoved out past the whole map to clear a branch hanging off
  // its neighbour — the branch being the one that should have moved.
  for (const id of [...byId.keys()].sort((a, b) => natural(a) - natural(b))) baseOf(id);

  const place = new Map();
  for (const n of layout.NODES) {
    if (!byId.has(n.id)) continue;
    const th = angles.has(n.id) ? angles.get(n.id) : 0;
    const r = baseOf(n.id) + (n.level - 1) * RING.gap;
    place.set(n.key, { x: Math.cos(th) * r, y: Math.sin(th) * r, a: th, r });
  }
  return place;
}

// The wheel's own spacing, drawn: the rungs a node can sit on, and the spokes
// it can sit along.
export function gridHTML(reach, spokes = 12) {
  const rings = [];
  for (let r = RING.first % RING.gap; r <= reach; r += RING.gap) rings.push(`<circle r="${r}" />`);
  const rays = Array.from({ length: spokes }, (_, i) => {
    const a = i * Math.PI * 2 / spokes;
    const x = Math.cos(a) * reach, y = Math.sin(a) * reach;
    return `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
  });
  return rings.join('') + rays.join('');
}

const bend = (from, to) => {
  const mid = (from.r + to.r) / 2;
  return [from,
          { x: Math.cos(from.a) * mid, y: Math.sin(from.a) * mid },
          { x: Math.cos(to.a) * mid, y: Math.sin(to.a) * mid },
          to];
};

const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

// The first slice of the very same curve, cut where it is, so a stub and the
// edge that replaces it lie on top of each other.
function upTo([p0, c1, c2, p3], t) {
  const a = lerp(p0, c1, t), b = lerp(c1, c2, t), c = lerp(c2, p3, t);
  const d = lerp(a, b, t), e = lerp(b, c, t);
  return [p0, a, d, lerp(d, e, t)];
}

const draw = ([p0, c1, c2, p3]) =>
  `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p3.x} ${p3.y}`;

export function edgePath(from, to) {
  if (Math.abs(from.a - to.a) < 1e-6) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  return draw(bend(from, to));
}

export function stubPath(from, to, reach) {
  const cut = Math.abs(from.a - to.a) < 1e-6
    ? [from, lerp(from, to, 1 / 3), lerp(from, to, 2 / 3), to]
    : bend(from, to);
  return upTo(cut, reach);
}

export const tipOf = (cut) => cut[3];

export const pathOf = draw;
