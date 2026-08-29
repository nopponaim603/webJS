import * as THREE from 'three';

const TRIS = [0, 1, 2, 0, 2, 3];

const at = (c, y) => ({ x: c.x, y, z: c.z });

const ringOf = (hw, hd) => [
  { x: hw, z: hd }, { x: hw, z: -hd }, { x: -hw, z: -hd }, { x: -hw, z: hd },
];

function normalOf(p) {
  const ax = p[1].x - p[0].x, ay = p[1].y - p[0].y, az = p[1].z - p[0].z;
  const bx = p[3].x - p[0].x, by = p[3].y - p[0].y, bz = p[3].z - p[0].z;
  const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

function quad(out, p, uv) {
  const n = normalOf(p);
  for (const i of TRIS) {
    out.pos.push(p[i].x, p[i].y, p[i].z);
    out.nor.push(n.x, n.y, n.z);
    out.uv.push(uv[i * 2], uv[i * 2 + 1]);
  }
}

// A box whose four top edges are cut back at 45 degrees. The chamfer is taken
// out of the top face rather than added on, so the block keeps the footprint
// the collision boxes are written against.
export function wallBox(w, hh, d, chamfer, tile) {
  const hw = w / 2, hd = d / 2, hy = hh / 2;
  const c = Math.max(0, Math.min(chamfer, hw * 0.9, hd * 0.9, hh * 0.5));
  const shoulder = hy - c;
  const base = ringOf(hw, hd);
  const top = ringOf(hw - c, hd - c);
  const out = { pos: [], nor: [], uv: [] };

  const vSide = (hh - c) / tile;
  const vTop = vSide + (c * Math.SQRT2) / tile;

  for (let i = 0; i < 4; i++) {
    const a = base[i], b = base[(i + 1) % 4];
    const ta = top[i], tb = top[(i + 1) % 4];
    const u = Math.hypot(b.x - a.x, b.z - a.z) / tile;

    quad(out, [at(a, -hy), at(b, -hy), at(b, shoulder), at(a, shoulder)],
         [0, 0, u, 0, u, vSide, 0, vSide]);

    if (c <= 0) continue;
    const inset = c / tile;
    quad(out, [at(a, shoulder), at(b, shoulder), at(tb, hy), at(ta, hy)],
         [0, vSide, u, vSide, u - inset, vTop, inset, vTop]);
  }

  const cap = (ring, y) => ring.map((p) => at(p, y));
  const capUV = (ring) => ring.flatMap((p) => [(p.x + hw) / tile, (p.z + hd) / tile]);

  quad(out, cap(top, hy), capUV(top));
  quad(out, cap([...base].reverse(), -hy), capUV([...base].reverse()));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(out.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
  return geo;
}
