// A flat uniform grid over the ground plane, for the question every crowd asks:
// who is standing near here. Rebuilt from a list once a frame, then read as many
// times as anything likes — a lookup is arithmetic, and nothing allocates after
// the first few frames.
//
// Cells are held as two integer arrays rather than buckets: `head` is the first
// item in each cell and `next` walks the rest, so a rebuild writes one number per
// item and never touches the heap.
//
// A query hands back indices, not items, and the position and reach of every
// item are copied into `body` as it is filed. At two thousand items the cost of
// answering is almost all the cost of finding the bodies in memory, and three
// arrays of eight kilobytes stay in cache where two thousand objects scattered
// over the heap do not. So a caller sifts on the numbers and only reaches for the
// item itself once it has found one it cares about.
export function makeGrid(cell, span) {
  const wide = Math.ceil((span * 2) / cell);
  const head = new Int32Array(wide * wide).fill(-1);
  let next = new Int32Array(0);

  // The grid's own copy of the references, so a list that swap-pops a dead item
  // mid-frame cannot turn every cell into a lie.
  const items = [];
  const body = { x: new Float32Array(0), z: new Float32Array(0), r: new Float32Array(0) };
  let widest = 0;

  // Read by the caller straight after a query, so only one query may be open at
  // a time. Never shortened: the count is what says how much of it is live.
  const hits = [];
  let found = 0;

  const at = (v) => {
    const i = Math.floor((v + span) / cell);
    return i < 0 ? 0 : i >= wide ? wide - 1 : i;
  };

  function room(n) {
    if (next.length >= n) return;
    const size = Math.max(1024, n * 2);
    next = new Int32Array(size);
    body.x = new Float32Array(size);
    body.z = new Float32Array(size);
    body.r = new Float32Array(size);
  }

  function build(list) {
    head.fill(-1);
    room(list.length);
    widest = 0;
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      items[i] = it;
      const x = it.pos.x, z = it.pos.z, r = it.radius;
      body.x[i] = x; body.z[i] = z; body.r[i] = r;
      const c = at(x) + at(z) * wide;
      next[i] = head[c];
      head[c] = i;
      if (r > widest) widest = r;
    }
  }

  function near(x, z, r) {
    found = 0;
    const x0 = at(x - r), x1 = at(x + r);
    const z1 = at(z + r);
    for (let cz = at(z - r); cz <= z1; cz++) {
      const row = cz * wide;
      for (let cx = x0; cx <= x1; cx++) {
        for (let i = head[row + cx]; i >= 0; i = next[i]) hits[found++] = i;
      }
    }
    return found;
  }

  return { build, near, hits, body, item: (i) => items[i], widest: () => widest };
}
