/**
 * Spec-conformance audits for deployables, run with the host's THREE.
 *
 * auditProvenance — the physical-provenance check: scrub every clip to each
 * part's first visible frame (appear) and last visible frame (vanish) and
 * probe its bounding box (8 corners pulled a quarter of the way toward the
 * centre, plus the centre — the corners of a round part's AABB overhang the
 * part itself). Each probe must be underground or inside another visible
 * part's bounds; fewer than `need` concealed probes means the part pops into
 * or out of open air.
 *
 * auditOverlap — the flicker check: at every resting pose (clip start, clip
 * end, and just before/after each sequence) compare the world AABBs of every
 * visible mesh across parts of different groups. Two same-facing faces closer
 * than `gap` with footprints overlapping by more than `margin` will z-fight.
 * Opposite-facing coincident faces (a lid resting on a rim) are exempt —
 * backface culling hides one of them. Same-group pairs are exempt: ring
 * segments share planes by design and keep angular gaps instead.
 *
 * auditExposure — the swallowed-part check: at each clip's end pose, no
 * visible part's box may sit entirely inside a single axis-aligned sibling's
 * box. That is buried geometry — a roof sunk into its cabin instead of
 * overhanging it. Only axis-aligned neighbours count as containers (a tilted
 * box's AABB is mostly air), which also lets wreck piles pass.
 *
 * auditAttachment — the floating-part check: at each clip's end pose, every
 * visible part's box must touch (within ~1cm) at least one other visible
 * part's box, or reach the ground. A part touching nothing hangs in mid-air
 * with no mechanical connection — a hook with no trolley, a horn with no
 * strut.
 *
 * All are guardrails over AABBs, not proofs. A generated object must report
 * zero violations from each.
 */

export function auditProvenance(d, THREE, { ground = 0.05, need = 5 } = {}) {
  const bad = [];
  const wasClip = d.clip();
  const wasT = d.time();
  const box = new THREE.Box3();
  const other = new THREE.Box3();
  const probe = new THREE.Vector3();
  const centre = new THREE.Vector3();
  for (const [clipName, clip] of Object.entries(d.clips)) {
    for (const s of clip.sequences) {
      const frames = [];
      if (s.appear) frames.push({ t: s.at + 0.001, verb: 'appears' });
      if (s.vanish) frames.push({ t: s.at + s.dur - 0.001, verb: 'vanishes' });
      const part = d.parts.find((p) => p.name === s.part);
      if (!part) continue;
      for (const frame of frames) {
        d.setTime(clipName, frame.t);
        d.root.updateMatrixWorld(true);
        box.setFromObject(part.object);
        box.getCenter(centre);
        let hidden = 0;
        for (let i = 0; i < 9; i++) {
          if (i === 8) probe.copy(centre);
          else {
            probe.set(i & 1 ? box.max.x : box.min.x,
                      i & 2 ? box.max.y : box.min.y,
                      i & 4 ? box.max.z : box.min.z).lerp(centre, 0.25);
          }
          if (probe.y < ground) { hidden += 1; continue; }
          for (const p of d.parts) {
            if (p === part || !p.object.visible) continue;
            other.setFromObject(p.object);
            if (other.containsPoint(probe)) { hidden += 1; break; }
          }
        }
        if (hidden < need) {
          bad.push(`${clipName}/${s.name}: ${s.part} ${frame.verb} only ${hidden}/9 concealed`);
        }
      }
    }
  }
  d.setTime(wasClip, wasT);
  return bad;
}

export function auditExposure(d, THREE) {
  const bad = [];
  const wasClip = d.clip();
  const wasT = d.time();
  const partRoots = new Set(d.parts.map((p) => p.object));

  const shown = (o) => {
    for (let n = o; n; n = n.parent) {
      if (n.visible === false) return false;
      if (n === d.root) break;
    }
    return true;
  };

  const aligned = (m) => {
    const e = m.elements;
    for (const o of [0, 4, 8]) {
      const len = Math.hypot(e[o], e[o + 1], e[o + 2]) || 1;
      if (Math.max(Math.abs(e[o]), Math.abs(e[o + 1]), Math.abs(e[o + 2])) / len < 0.9999) {
        return false;
      }
    }
    return true;
  };

  const measure = (part) => {
    const box = new THREE.Box3();
    let allAligned = true;
    const walk = (node) => {
      if (node !== part.object && partRoots.has(node)) return;
      if (node.isMesh && node.visible) {
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
        box.union(new THREE.Box3().copy(node.geometry.boundingBox)
          .applyMatrix4(node.matrixWorld));
        if (!aligned(node.matrixWorld)) allAligned = false;
      }
      node.children.forEach(walk);
    };
    walk(part.object);
    return { box, allAligned };
  };

  for (const clipName of Object.keys(d.clips)) {
    d.setTime(clipName, d.duration(clipName));
    d.root.updateMatrixWorld(true);
    const boxes = [];
    for (const p of d.parts) {
      if (shown(p.object)) boxes.push([p, measure(p)]);
    }
    for (const [p, m] of boxes) {
      if (m.box.isEmpty()) continue;
      for (const [q, qm] of boxes) {
        if (q === p || !qm.allAligned || qm.box.isEmpty()) continue;
        if (qm.box.containsBox(m.box)) {
          bad.push(`${clipName}: ${p.name} rests fully swallowed inside ${q.name}`);
          break;
        }
      }
    }
  }
  d.setTime(wasClip, wasT);
  return bad;
}

export function auditAttachment(d, THREE, { gap = 0.012, ground = 0.05 } = {}) {
  const bad = [];
  const wasClip = d.clip();
  const wasT = d.time();
  const partRoots = new Set(d.parts.map((p) => p.object));

  const shown = (o) => {
    for (let n = o; n; n = n.parent) {
      if (n.visible === false) return false;
      if (n === d.root) break;
    }
    return true;
  };

  const ownBox = (part) => {
    const box = new THREE.Box3();
    const walk = (node) => {
      if (node !== part.object && partRoots.has(node)) return;
      if (node.isMesh && node.visible) {
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
        box.union(new THREE.Box3().copy(node.geometry.boundingBox)
          .applyMatrix4(node.matrixWorld));
      }
      node.children.forEach(walk);
    };
    walk(part.object);
    return box;
  };

  const reach = new THREE.Box3();
  for (const clipName of Object.keys(d.clips)) {
    d.setTime(clipName, d.duration(clipName));
    d.root.updateMatrixWorld(true);
    const boxes = [];
    for (const p of d.parts) {
      if (shown(p.object)) boxes.push([p, ownBox(p)]);
    }
    for (const [p, pb] of boxes) {
      if (pb.isEmpty() || pb.min.y < ground) continue;
      reach.copy(pb).expandByScalar(gap);
      const touching = boxes.some(([q, qb]) =>
        q !== p && !qb.isEmpty() && reach.intersectsBox(qb));
      if (!touching) bad.push(`${clipName}: ${p.name} floats unattached`);
    }
  }
  d.setTime(wasClip, wasT);
  return bad;
}

const AXES = ['x', 'y', 'z'];

export function auditOverlap(d, THREE, { gap = 0.004, margin = 0.01, ground = 0 } = {}) {
  const wasClip = d.clip();
  const wasT = d.time();
  const found = new Map();
  const partRoots = new Set(d.parts.map((p) => p.object));

  const shown = (o) => {
    for (let n = o; n; n = n.parent) {
      if (n.visible === false) return false;
      if (n === d.root) break;
    }
    return true;
  };

  const aligned = (m) => {
    const e = m.elements;
    for (const o of [0, 4, 8]) {
      const len = Math.hypot(e[o], e[o + 1], e[o + 2]) || 1;
      if (Math.max(Math.abs(e[o]), Math.abs(e[o + 1]), Math.abs(e[o + 2])) / len < 0.9999) {
        return false;
      }
    }
    return true;
  };

  const collect = (part, node, out) => {
    if (node !== part.object && partRoots.has(node)) return;
    if (node.isMesh && node.visible && aligned(node.matrixWorld)) {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      const box = new THREE.Box3().copy(node.geometry.boundingBox)
        .applyMatrix4(node.matrixWorld);
      out.push({ part, box });
    }
    for (const c of node.children) collect(part, c, out);
  };

  const ancestors = new Map();
  for (const p of d.parts) {
    const chain = [];
    for (let o = p.object.parent; o && o !== d.root; o = o.parent) {
      const owner = d.parts.find((q) => q.object === o);
      if (owner) chain.push(owner.name);
    }
    ancestors.set(p.name, chain);
  }

  for (const [clipName, clip] of Object.entries(d.clips)) {
    const len = d.duration(clipName);
    const times = new Set([0, len]);
    for (const s of clip.sequences) {
      times.add(Math.max(0, s.at - 0.01));
      times.add(Math.min(len, s.at + s.dur + 0.01));
    }
    const resting = (part, t) => clip.sequences.every(
      (s) => s.part !== part || t < s.at - 0.005 || t > s.at + s.dur + 0.005);
    const restingDeep = (part, t) =>
      resting(part, t) && ancestors.get(part).every((a) => resting(a, t));

    for (const t of times) {
      d.setTime(clipName, t);
      d.root.updateMatrixWorld(true);
      const items = [];
      for (const p of d.parts) {
        if (!shown(p.object) || !restingDeep(p.name, t)) continue;
        collect(p, p.object, items);
      }
      for (const { part, box } of items) {
        for (const side of ['min', 'max']) {
          if (Math.abs(box[side].y - ground) < gap && !found.has(`${part.name} ground`)) {
            found.set(`${part.name} ground`,
              `${clipName}@${t.toFixed(2)}s: ${part.name} lies in the ground plane`);
          }
        }
      }
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const A = items[i], B = items[j];
          if (A.part !== B.part && A.part.group === B.part.group) continue;
          for (let k = 0; k < 3; k++) {
            const u = AXES[(k + 1) % 3], v = AXES[(k + 2) % 3];
            if (Math.min(A.box.max[u], B.box.max[u]) - Math.max(A.box.min[u], B.box.min[u]) < margin
                || Math.min(A.box.max[v], B.box.max[v]) - Math.max(A.box.min[v], B.box.min[v]) < margin) {
              continue;
            }
            for (const side of ['min', 'max']) {
              const apart = Math.abs(A.box[side][AXES[k]] - B.box[side][AXES[k]]);
              const key = `${A.part.name}~${B.part.name} ${AXES[k]}.${side}`;
              if (apart < gap && !found.has(key)) {
                found.set(key, `${clipName}@${t.toFixed(2)}s: ${A.part.name} and ${B.part.name}`
                  + ` share a ${AXES[k]}-${side} plane (${apart.toFixed(4)} apart)`);
              }
            }
          }
        }
      }
    }
  }
  d.setTime(wasClip, wasT);
  return [...found.values()];
}
