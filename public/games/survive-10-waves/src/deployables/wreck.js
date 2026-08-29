import { seq, ch } from './contract.js';

const GOLDEN = 2.399963;

function restHeight(THREE, object, box, rx, rz) {
  const tilt = new THREE.Euler(rx, 0, rz);
  const corner = new THREE.Vector3();
  let low = Infinity;
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x,
               i & 2 ? box.max.y : box.min.y,
               i & 4 ? box.max.z : box.min.z)
      .sub(object.position)
      .applyEuler(tilt);
    low = Math.min(low, corner.y);
  }
  return -low;
}

function topLevel(part, partRoots, root) {
  for (let o = part.object.parent; o && o !== root; o = o.parent) {
    if (partRoots.has(o)) return false;
  }
  return true;
}

export function wreckClip(THREE, { root, parts, hold = [], impacts = [], name = 'destroyed' }) {
  const sequences = hold.map(([part, target, value]) =>
    seq(`${part}-hold`, part, 0, 0.01, [ch(target, value, value)]));
  const partRoots = new Set(parts.map((p) => p.object));
  const falling = parts.filter((p) => p.group !== 'terrain' && topLevel(p, partRoots, root));
  const box = new THREE.Box3();

  falling.forEach((p, i) => {
    box.setFromObject(p.object);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const ang = Math.hypot(cx, cz) > 0.25 ? Math.atan2(cz, cx) : i * GOLDEN;
    const startY = p.object.position.y;
    const clearance = 0.012 + ((i % 5) + 1) * 0.004;
    let rx = ((((i * 13) % 7) - 3) / 3) * 0.55;
    let rz = ((((i * 5) % 7) - 3) / 3) * 0.55;
    let rest = restHeight(THREE, p.object, box, rx, rz) + clearance;
    for (let k = 0; k < 3 && rest > startY + 0.05; k++) {
      rx *= 0.5;
      rz *= 0.5;
      rest = restHeight(THREE, p.object, box, rx, rz) + clearance;
    }
    if (rest > startY + 0.05) {
      rx = 0;
      rz = 0;
      rest = restHeight(THREE, p.object, box, 0, 0) + clearance;
    }
    const drop = Math.max(0, startY - rest);
    const dist = 0.25 + 0.15 * (((i * 7) % 5) / 4) + drop * 0.55;
    const at = 0.04 + ((i * 11) % 6) * 0.05;
    const dur = 0.3 + 0.35 * Math.sqrt(drop) + ((i * 3) % 4) * 0.03;
    const hit = impacts.includes(p.name);

    sequences.push(
      seq(`${p.name}-fall`, p.name, at, dur,
          [ch('position.y', startY, rest)],
          { ease: 'gravity',
            sound: hit ? { id: 'heavy', rate: 0.78 + (i % 4) * 0.08 } : undefined }),
      seq(`${p.name}-scatter`, p.name, at, dur,
          [ch('position.x', p.object.position.x, p.object.position.x + Math.cos(ang) * dist),
           ch('position.z', p.object.position.z, p.object.position.z + Math.sin(ang) * dist)],
          { ease: 'linear' }),
      seq(`${p.name}-tumble`, p.name, at, dur,
          [ch('rotation.x', p.object.rotation.x, rx),
           ch('rotation.z', p.object.rotation.z, rz)],
          { ease: 'linear' }),
    );
    const lift = Math.min(0.08 + (i % 3) * 0.03, drop * 0.3);
    if (hit && lift > 0.02) {
      sequences.push(
        seq(`${p.name}-bounce-up`, p.name, at + dur, 0.1,
            [ch('position.y', rest, rest + lift)], { ease: 'easeOut' }),
        seq(`${p.name}-bounce-down`, p.name, at + dur + 0.1, 0.13,
            [ch('position.y', rest + lift, rest)], { ease: 'gravity' }),
      );
    }
  });
  return { name, sequences };
}
