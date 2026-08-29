import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, camera } from '../engine/view.js';
import { world } from '../core/world.js';
import { mouse } from '../engine/input.js';
import * as walls from '../arena/walls.js';

const PATH_Y = 0.25;
const pathMat = new THREE.LineBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.9,
                                              depthTest: false });
const wayMat = new THREE.MeshBasicMaterial({ color: 0xffd479, depthTest: false });
const WAY_GEO = new THREE.SphereGeometry(0.22, 8, 6);

const lines = [];
const marks = [];

function lineFor(i) {
  if (!lines[i]) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 3), 3));
    const l = new THREE.Line(geo, pathMat);
    l.frustumCulled = false;
    l.renderOrder = 9;
    scene.add(l);
    lines[i] = l;
  }
  return lines[i];
}

function markFor(i) {
  if (!marks[i]) {
    const m = new THREE.Mesh(WAY_GEO, wayMat);
    m.renderOrder = 9;
    scene.add(m);
    marks[i] = m;
  }
  return marks[i];
}

function drawPaths() {
  let n = 0;
  if (world.debug.showPaths) {
    for (const bug of world.bugs) {
      const pts = bug.path && bug.path.length > 1
        ? bug.path
        : [{ x: bug.pos.x, z: bug.pos.z }, { x: world.player.pos.x, z: world.player.pos.z }];

      const l = lineFor(n);
      const pos = l.geometry.attributes.position;
      const count = Math.min(pts.length, 64);
      for (let i = 0; i < count; i++) {
        const p = i === 0 ? bug.pos : pts[i];
        pos.setXYZ(i, p.x, PATH_Y, p.z);
      }
      pos.needsUpdate = true;
      l.geometry.setDrawRange(0, count);
      l.visible = true;

      const m = markFor(n);
      if (bug.way) { m.position.set(bug.way.x, PATH_Y, bug.way.z); m.visible = true; }
      else m.visible = false;
      n++;
    }
  }
  for (let i = n; i < lines.length; i++) lines[i].visible = false;
  for (let i = n; i < marks.length; i++) marks[i].visible = false;
}

const boxMat = new THREE.MeshBasicMaterial({ color: 0x7ee0a1, transparent: true, opacity: 0.35,
                                             depthTest: false });
const preview = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), boxMat);
preview.visible = false;
preview.renderOrder = 9;
scene.add(preview);

const ray = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hit = new THREE.Vector3();

function cursorGround(out) {
  ray.setFromCamera(mouse.ndc, camera);
  return ray.ray.intersectPlane(ground, out) ? out : null;
}

let dragging = false;
const dragFrom = { x: 0, z: 0 };

const MIN_HALF = 0.5;

function updateDrawing() {
  if (!world.debug.drawWalls) {
    if (dragging) { dragging = false; preview.visible = false; }
    return;
  }
  const at = cursorGround(_hit);
  if (!at) return;

  if (mouse.down && !dragging) {
    dragging = true;
    dragFrom.x = at.x; dragFrom.z = at.z;
  }

  if (dragging) {
    const hx = Math.max(MIN_HALF, Math.abs(at.x - dragFrom.x) / 2);
    const hz = Math.max(MIN_HALF, Math.abs(at.z - dragFrom.z) / 2);
    const cx = (at.x + dragFrom.x) / 2, cz = (at.z + dragFrom.z) / 2;
    preview.position.set(cx, CFG.walls.height / 2, cz);
    preview.scale.set(hx * 2, CFG.walls.height, hz * 2);
    preview.visible = true;

    if (!mouse.down) {
      dragging = false;
      preview.visible = false;
      CFG.walls.boxes.push({ x: +cx.toFixed(2), z: +cz.toFixed(2),
                             hx: +hx.toFixed(2), hz: +hz.toFixed(2) });
      walls.build();
      forget();
    }
  }
}

export function forget() {
  for (const bug of world.bugs) { bug.way = null; bug.path = null; }
}

export function update() {
  drawPaths();
  updateDrawing();
}
