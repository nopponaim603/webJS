import * as THREE from 'three';

const key = (v) => `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`;

// A Goldberg polyhedron: the dual of a geodesic icosahedron. Every vertex of the
// geodesic becomes a panel — twelve pentagons where the original solid had its
// corners, hexagons everywhere else — and every triangle becomes one corner of
// the panels that met at it. Unit radius; scale it where it is used.
export function build(detail = 1) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.getAttribute('position');
  const panels = new Map();

  for (let t = 0; t < pos.count; t += 3) {
    const tri = [];
    const mid = new THREE.Vector3();
    for (let k = 0; k < 3; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, t + k);
      tri.push(v);
      mid.add(v);
    }
    mid.divideScalar(3).normalize();
    for (const v of tri) {
      const id = key(v);
      if (!panels.has(id)) panels.set(id, { at: v.clone().normalize(), ring: [] });
      panels.get(id).ring.push(mid);
    }
  }
  geo.dispose();

  const faces = [];
  const lines = [];
  const across = new THREE.Vector3();
  const along = new THREE.Vector3();
  const seed = new THREE.Vector3();

  for (const { at, ring } of panels.values()) {
    // Wound about the panel's own normal so the fan below comes out convex: the
    // corners arrive in whatever order the triangles were walked in.
    seed.set(0, 0, 1);
    if (Math.abs(at.z) > 0.9) seed.set(1, 0, 0);
    across.copy(seed).cross(at).normalize();
    along.copy(at).cross(across);
    const turn = (v) => Math.atan2(v.dot(along), v.dot(across));
    ring.sort((a, b) => turn(a) - turn(b));

    for (let i = 1; i < ring.length - 1; i++) {
      faces.push(...ring[0].toArray(), ...ring[i].toArray(), ...ring[i + 1].toArray());
    }
    for (let i = 0; i < ring.length; i++) {
      lines.push(...ring[i].toArray(), ...ring[(i + 1) % ring.length].toArray());
    }
  }

  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(faces, 3));
  shell.computeVertexNormals();

  const cage = new THREE.BufferGeometry();
  cage.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));

  return { shell, cage };
}
