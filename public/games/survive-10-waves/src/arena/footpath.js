import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { manager } from '../core/loading.js';
import { segDist2 } from '../core/geom2.js';

const S = () => CFG.scatter;

const loader = new THREE.TextureLoader(manager);
let pathSurfaces = null;

export function reset() {
  for (const t of pathSurfaces ?? []) t.dispose();
  pathSurfaces = null;
}

export function surface(i) {
  if (!pathSurfaces) {
    const off = [[0, 0], [0.37, 0.51], [0.68, 0.23]];
    pathSurfaces = off.map(([ox, oy]) => {
      const t = loader.load(S().pathTexture);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(0.8, 0.8);
      t.offset.set(ox, oy);
      return t;
    });
  }
  return pathSurfaces[i % pathSurfaces.length];
}

function pathLine(rnd, from, to, wanderScale = 1) {
  const pts = [];
  const P = S().path;
  const nx = -(to.y - from.y), nz = to.x - from.x;
  const nl = Math.hypot(nx, nz) || 1;

  const ph = rnd() * Math.PI * 2;
  for (let i = 0; i <= P.steps; i++) {
    const t = i / P.steps;

    const hump = Math.sin(t * Math.PI);
    const off = (Math.sin(t * Math.PI * 1.6 + ph) * 0.7 + Math.sin(t * Math.PI * 3.4 + ph * 2) * 0.3)
              * P.wander * wanderScale * hump;
    pts.push(new THREE.Vector2(
      from.x + (to.x - from.x) * t + (nx / nl) * off,
      from.y + (to.y - from.y) * t + (nz / nl) * off,
    ));
  }

  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    return { p, hx: b.x - a.x, hz: b.y - a.y };
  });
}

function pathNetwork(rnd) {
  const R = CFG.arena.max - 6;
  const a0 = rnd() * Math.PI * 2;
  const from = new THREE.Vector2(Math.cos(a0) * R, Math.sin(a0) * R);
  const to = new THREE.Vector2(Math.cos(a0 + Math.PI) * R, Math.sin(a0 + Math.PI) * R);
  const trunk = pathLine(rnd, from, to);

  const lines = [trunk];
  for (let i = 0; i < S().path.forks; i++) {
    const at = trunk[Math.floor(trunk.length * (0.33 + rnd() * 0.34))].p;
    const away = a0 + Math.PI / 2 + (rnd() - 0.5) * 1.4 + (i % 2 ? Math.PI : 0);
    const end = new THREE.Vector2(Math.cos(away) * R, Math.sin(away) * R);
    lines.push(pathLine(rnd, at.clone(), end, 0.7));
  }
  return lines;
}

// Spans, not points: samples are further apart than the band is wide, so a
// nearest-sample test pinches the strip between two of them. Per line, so a
// fork's first point never joins the trunk's last.
let spans = [];
let halfWidth = 0;

export function plan(rnd) {
  const P = S().path;
  spans = [];

  halfWidth = P.width * P.walkable / 2;
  const lines = pathNetwork(rnd);
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1].p, b = line[i].p;
      spans.push(a.x, a.y, b.x, b.y);
    }
  }
  return lines.flat();
}

export function onPath(x, z) {
  const h2 = halfWidth * halfWidth;
  for (let i = 0; i < spans.length; i += 4) {
    if (segDist2(spans[i], spans[i + 1], spans[i + 2], spans[i + 3], x, z) < h2) return true;
  }
  return false;
}

export function groundSpeed(x, z) {
  return onPath(x, z) ? S().path.speed : 1;
}
