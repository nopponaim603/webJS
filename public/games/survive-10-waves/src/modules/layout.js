import { CFG } from '../config/index.js';
import * as store from '../core/store.js';

const KEY = 'survive10.skilltree';

export const keyOf = (id, level) => `${id}:${level}`;
export const partsOf = (key) => {
  const i = key.lastIndexOf(':');
  return { id: key.slice(0, i), level: +key.slice(i + 1) };
};

let layout = [];
export let NODES = [];
export let BY_KEY = new Map();

// How many rungs a module carries past the table it was written with. The run
// is what decides that, so it is handed in rather than read here.
let deepOf = () => 0;

export function setDeep(fn) { deepOf = fn; }

// The tail is only as long as the run has paid for, so the tree is rebuilt
// whenever it might have moved. Says whether it did: a sector arrived at with a
// shorter tail than the one left behind has rungs to take away, not only to add.
export function sync() {
  const had = BY_KEY;
  rebuild();
  return had.size !== BY_KEY.size || [...BY_KEY.keys()].some((key) => !had.has(key));
}

// What the config's tree looked like when a layout was saved against it.
const shapeOf = (list) => list
  .map((e) => `${e.id}/${e.levels}/${e.needs ? `${e.needs.mod}${e.needs.level}` : ''}/${e.gate || ''}`)
  .join(',');

function loadOverrides() {
  const raw = store.load(KEY);
  // A layout saved against a tree the code has since moved on from is not an
  // edit any more — it is an old copy of the config, quietly outranking it.
  if (!raw || !Array.isArray(raw.list) || raw.shape !== shapeOf(CFG.moduleTree)) {
    if (raw) store.forget(KEY);
    return null;
  }
  return raw.list;
}

export function currentLayout() { return layout; }

export function setLayout(next) {
  layout = next.map((e) => ({ ...e }));
  rebuild();
}

export function saveLayout() {
  return store.save(KEY, { shape: shapeOf(CFG.moduleTree), list: layout });
}

export function clearLayout() {
  store.forget(KEY);
  layout = CFG.moduleTree.map((e) => ({ ...e }));
  rebuild();
}

// How many rings out a chain starts: past the node it hangs off, plus the step
// that carries a branch clear of its parent. The wheel walks the same chain but
// shoves a crowded branch further out; price stays on the walk, so what a node
// costs does not move with how the tree happens to be drawn.
function ringsOut(id, seen = new Set()) {
  const e = layout.find((x) => x.id === id);
  if (!e || !e.needs || seen.has(id)) return 0;
  seen.add(id);
  const R = CFG.moduleRing;
  return ringsOut(e.needs.mod, seen) + (e.needs.level - 1) + R.branch / R.gap;
}

const priceAt = (rings) => {
  const P = CFG.modulePrice;
  const soft = Math.max(0, rings - P.softAt);
  return Math.round(P.base * Math.pow(P.perRing, rings - soft) * Math.pow(P.perRingSoft, soft));
};

function rebuild() {
  NODES = [];
  BY_KEY = new Map();
  for (const e of layout) {
    const levels = Math.max(1, e.levels | 0) + deepOf(e.id);
    const out = ringsOut(e.id);
    for (let n = 1; n <= levels; n++) {
      const needs = n > 1
        ? [keyOf(e.id, n - 1)]
        : (e.needs ? [keyOf(e.needs.mod, e.needs.level)] : []);
      const node = {
        key: keyOf(e.id, n),
        id: e.id,
        level: n,
        last: n === levels,
        deep: n > e.levels,
        rings: out + n - 1,
        cost: priceAt(out + n - 1),
        shown: n === 1 && !!e.shown,
        needs,
      };
      NODES.push(node);
      BY_KEY.set(node.key, node);
    }
  }
  for (const node of NODES) if (node.shown) showChain(node);
}

// A node put on the board early is no use hanging in space: the rungs it waits
// on come with it, so the line the player has to buy is drawn all the way back
// to the hub it starts at.
function showChain(node) {
  for (let key = node.needs[0]; key;) {
    const dep = BY_KEY.get(key);
    if (!dep || dep.shown) return;
    dep.shown = true;
    key = dep.needs[0];
  }
}

export function levelsOf(id) {
  const e = layout.find((x) => x.id === id);
  return e ? Math.max(1, e.levels | 0) : 0;
}

// What a branch waits on before it is part of the tree at all, if anything.
export function gateOf(id) {
  const e = layout.find((x) => x.id === id);
  return e ? e.gate : null;
}

export function validate(list = layout) {
  const out = [];
  const ids = new Set(list.map((e) => e.id));
  for (const e of list) {
    if (!e.needs) continue;
    if (!ids.has(e.needs.mod)) { out.push(`${e.id} needs ${e.needs.mod}, which is not in the tree`); continue; }
    const dep = list.find((x) => x.id === e.needs.mod);
    if (e.needs.level > dep.levels) out.push(`${e.id} needs ${e.needs.mod} level ${e.needs.level}, which only runs to ${dep.levels}`);
    if (e.needs.mod === e.id) out.push(`${e.id} needs itself`);
  }

  const seen = new Set();
  const walk = (id, trail) => {
    if (trail.includes(id)) { out.push(`cycle: ${[...trail, id].join(' -> ')}`); return; }
    if (seen.has(id)) return;
    seen.add(id);
    const e = list.find((x) => x.id === id);
    if (e && e.needs) walk(e.needs.mod, [...trail, id]);
  };
  for (const e of list) walk(e.id, []);
  return [...new Set(out)];
}

export function exportText(list = layout) {
  const lines = list.map((e) => {
    const head = `    { id: '${e.id}', levels: ${e.levels}`
      + (e.shown ? ', shown: true' : '')
      + (e.flip ? ', flip: true' : '')
      + (e.gate ? `, gate: '${e.gate}'` : '');
    return e.needs
      ? `${head},\n      needs: { mod: '${e.needs.mod}', level: ${e.needs.level} } },`
      : `${head} },`;
  });
  return `moduleTree: [\n${lines.join('\n')}\n  ],`;
}

const saved = loadOverrides();
layout = CFG.moduleTree.map((e) => {
  const own = saved && saved.find((s) => s.id === e.id);
  return { ...e, ...(own || {}) };
});
rebuild();
