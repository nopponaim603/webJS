// virtual:main.js
import * as THREE5 from "three/webgpu";
import {
  cameraPosition as cameraPosition2,
  faceDirection,
  fog,
  max,
  min,
  mix as mix2,
  normalView,
  normalWorld,
  pass,
  positionLocal,
  positionView,
  positionWorld as positionWorld2,
  screenCoordinate as screenCoordinate2,
  uniform as uniform3,
  uv,
  vec2,
  vec3 as vec32,
  vec4
} from "three/tsl";
import GUI from "lil-gui";
import Stats from "stats-gl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import {
  BuildContext,
  ContourBuildFlags,
  NULL_AREA,
  addTile,
  buildCompactHeightfield,
  buildContours,
  buildDistanceField,
  buildPolyMesh,
  buildPolyMeshDetail,
  buildRegions,
  buildTile,
  calculateGridSize,
  calculateMeshBounds,
  createDefaultQueryFilter,
  createFindNearestPolyResult,
  createHeightfield,
  createNavMesh,
  erodeWalkableArea,
  filterLedgeSpans,
  filterLowHangingWalkableObstacles,
  filterWalkableLowHeightSpans,
  findNearestPoly,
  findRandomPointAroundCircle,
  markBoxArea,
  markWalkableTriangles,
  polyMeshDetailToTileDetailMesh,
  polyMeshToTilePolys,
  rasterizeTriangles
} from "navcat";
import { crowd as navCrowd } from "navcat/blocks";
import Box3D from "box3d.js-bundled";
import { MeshoptSimplifier } from "meshoptimizer";

// virtual:FixedTimestep.js
var FixedTimestep = class {
  accumulator = 0;
  lastTimestamp = -1;
  alpha = 0;
  constructor({ dt = 1 / 60, maxSteps = 3 } = {}) {
    this.dt = dt;
    this.maxSteps = maxSteps;
  }
  // Call once per frame with a timestamp (ms).
  // Returns number of fixed steps to run. 
  update(timestamp) {
    if (this.lastTimestamp < 0) this.lastTimestamp = timestamp;
    const frameDt = Math.min((timestamp - this.lastTimestamp) / 1e3, this.maxSteps * this.dt);
    this.lastTimestamp = timestamp;
    this.accumulator += frameDt;
    let steps = 0;
    while (this.accumulator >= this.dt && steps < this.maxSteps) {
      this.accumulator -= this.dt;
      steps++;
    }
    this.accumulator = this.accumulator % this.dt;
    this.alpha = this.accumulator / this.dt;
    return steps;
  }
};

// virtual:BakedNoise3D.js
import * as THREE from "three/webgpu";
import { mat3, texture3D, uniform, vec3 } from "three/tsl";
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var BakedNoise3D = class {
  #octaves;
  #seed;
  #cache = /* @__PURE__ */ new Map();
  #texture;
  #uPeriod = uniform(1);
  // texture3D nodes created by fbm(), retargeted on every setTexture() swap
  #sampleNodes = [];
  // per-octave golden-angle rotations about a skew axis (octave 0 = identity),
  // plus a phase offset in cell units
  #octaveTransforms = [];
  constructor({ size = 64, period = 8, octaves = 4, seed = 1234567 } = {}) {
    this.#octaves = octaves;
    this.#seed = seed;
    const octaveAxis = new THREE.Vector3(1, 2, 3).normalize();
    for (let i = 0; i < octaves; i++) {
      this.#octaveTransforms.push({
        rotation: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationAxis(octaveAxis, i * 2.39996)),
        offset: new THREE.Vector3(0.17, 0.39, 0.61).multiplyScalar(i)
      });
    }
    this.setTexture(size, period);
  }
  // Bake (or fetch cached) a texture of `size` texels per axis wrapping every
  // `period` noise cells, and swap it into every fbm sample node. Materials
  // whose shaders embed the nodes keep working as-is; only a change of period
  // (a different repeat rate) needs their needsUpdate raised by the caller.
  setTexture(size, period) {
    const key = `${size}|${period}`;
    let texture = this.#cache.get(key);
    if (!texture) {
      texture = this.#bake(size, period);
      this.#cache.set(key, texture);
    }
    this.#texture = texture;
    this.#uPeriod.value = period;
    for (const node of this.#sampleNodes) node.value = texture;
  }
  // fbm built from the baked texture — p is in noise cells (frequency already
  // applied), octave amplitudes follow `gain`.
  fbm(p, gain) {
    let sum = null;
    for (let i = 0; i < this.#octaves; i++) {
      const { rotation, offset } = this.#octaveTransforms[i];
      const q = i === 0 ? p : mat3(rotation).mul(p).mul(2 ** i).add(vec3(offset));
      const sampleNode = texture3D(this.#texture, q.div(this.#uPeriod));
      this.#sampleNodes.push(sampleNode);
      sum = sum === null ? sampleNode.r : sum.add(sampleNode.r.mul(gain ** i));
    }
    return sum;
  }
  // Perlin noise with unit gradients on a lattice wrapping every `period`
  // cells, sampled at texel centers over one period — seamless under
  // RepeatWrapping.
  #bake(res, period) {
    const rand = mulberry32(this.#seed);
    const gradients = new Float32Array(period * period * period * 3);
    for (let i = 0; i < gradients.length; i += 3) {
      const z = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      gradients[i] = r * Math.cos(a);
      gradients[i + 1] = r * Math.sin(a);
      gradients[i + 2] = z;
    }
    const dotGradient = (xi, yi, zi, dx, dy, dz) => {
      const g = ((zi % period * period + yi % period) * period + xi % period) * 3;
      return gradients[g] * dx + gradients[g + 1] * dy + gradients[g + 2] * dz;
    };
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + (b - a) * t;
    const values = new Float32Array(res * res * res);
    let maxAbs = 0;
    let n = 0;
    for (let z = 0; z < res; z++) {
      const pz = (z + 0.5) / res * period;
      const zi = Math.floor(pz);
      const fz = pz - zi;
      const w = fade(fz);
      for (let y = 0; y < res; y++) {
        const py = (y + 0.5) / res * period;
        const yi = Math.floor(py);
        const fy = py - yi;
        const v = fade(fy);
        for (let x = 0; x < res; x++) {
          const px = (x + 0.5) / res * period;
          const xi = Math.floor(px);
          const fx = px - xi;
          const u = fade(fx);
          const sample = lerp(
            lerp(
              lerp(dotGradient(xi, yi, zi, fx, fy, fz), dotGradient(xi + 1, yi, zi, fx - 1, fy, fz), u),
              lerp(dotGradient(xi, yi + 1, zi, fx, fy - 1, fz), dotGradient(xi + 1, yi + 1, zi, fx - 1, fy - 1, fz), u),
              v
            ),
            lerp(
              lerp(dotGradient(xi, yi, zi + 1, fx, fy, fz - 1), dotGradient(xi + 1, yi, zi + 1, fx - 1, fy, fz - 1), u),
              lerp(
                dotGradient(xi, yi + 1, zi + 1, fx, fy - 1, fz - 1),
                dotGradient(xi + 1, yi + 1, zi + 1, fx - 1, fy - 1, fz - 1),
                u
              ),
              v
            ),
            w
          );
          if (Math.abs(sample) > maxAbs) maxAbs = Math.abs(sample);
          values[n++] = sample;
        }
      }
    }
    const data = new Uint16Array(values.length);
    for (let i = 0; i < values.length; i++) data[i] = THREE.DataUtils.toHalfFloat(values[i] / maxAbs);
    const texture = new THREE.Data3DTexture(data, res, res, res);
    texture.format = THREE.RedFormat;
    texture.type = THREE.HalfFloatType;
    texture.wrapS = texture.wrapT = texture.wrapR = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }
};

// virtual:GamepadInput.js
var GamepadInput = class {
  // standard-mapping button indices
  static SOUTH = 0;
  // A / Cross
  static EAST = 1;
  // B / Circle
  static WEST = 2;
  // X / Square
  static NORTH = 3;
  // Y / Triangle
  static BACK = 8;
  // Back / Select / Share
  static START = 9;
  // Start / Options
  connected = false;
  x = 0;
  y = 0;
  rx = 0;
  ry = 0;
  lt = 0;
  rt = 0;
  deadZone;
  #prev = [];
  #curr = [];
  constructor({ deadZone = 0.15 } = {}) {
    this.deadZone = deadZone;
    addEventListener("gamepadconnected", (e) => console.info(`gamepad connected \u2014 ${e.gamepad.id}`));
    addEventListener("gamepaddisconnected", (e) => console.info(`gamepad disconnected \u2014 ${e.gamepad.id}`));
  }
  update() {
    let pad = null;
    for (const p of navigator.getGamepads?.() ?? []) {
      if (p?.connected) {
        pad = p;
        break;
      }
    }
    this.connected = pad !== null;
    [this.#prev, this.#curr] = [this.#curr, this.#prev];
    this.#curr.length = 0;
    if (!pad) {
      this.x = this.y = this.rx = this.ry = this.lt = this.rt = 0;
      return;
    }
    for (let i = 0; i < pad.buttons.length; i++) this.#curr[i] = pad.buttons[i].pressed;
    const [lx = 0, ly = 0, rxAxis = 0, ryAxis = 0] = pad.axes;
    const lm = Math.hypot(lx, ly);
    if (lm < this.deadZone) {
      this.x = this.y = 0;
    } else {
      const out = Math.min((lm - this.deadZone) / (1 - this.deadZone), 1);
      this.x = lx / lm * out;
      this.y = -ly / lm * out;
    }
    const rm = Math.hypot(rxAxis, ryAxis);
    if (rm < this.deadZone) {
      this.rx = this.ry = 0;
    } else {
      const out = Math.min((rm - this.deadZone) / (1 - this.deadZone), 1);
      this.rx = rxAxis / rm * out;
      this.ry = -ryAxis / rm * out;
    }
    this.lt = pad.buttons[6]?.value ?? 0;
    this.rt = pad.buttons[7]?.value ?? 0;
  }
  isPressed(index) {
    return this.#curr[index] === true;
  }
  justPressed(index) {
    return this.#curr[index] === true && this.#prev[index] !== true;
  }
};

// virtual:TouchJoystick.js
var styleInjected = false;
var TouchJoystick = class {
  x = 0;
  y = 0;
  active = false;
  deadZone;
  #root;
  #knob;
  #config = {};
  #pointerId = null;
  #centerX = 0;
  #centerY = 0;
  constructor({
    size = 130,
    // base diameter (px)
    margin = 28,
    // inset from the corner (px), padded by the safe area
    knobScale = 0.45,
    // knob diameter as a fraction of the base
    deadZone = 0.12,
    idleOpacity = 0.55,
    // opacity when untouched — full while dragged
    accent = "#ffffff",
    zIndex = 10,
    parent = document.body
  } = {}) {
    this.deadZone = deadZone;
    if (!styleInjected) {
      styleInjected = true;
      const style = document.createElement("style");
      style.textContent = `
        .touch-joystick {
          position: fixed;
          left: calc(50% - var(--tj-size) / 2);
          top: calc(75% - var(--tj-size) / 2);
          width: var(--tj-size);
          height: var(--tj-size);
          border-radius: 50%;
          z-index: var(--tj-z);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          opacity: var(--tj-idle-opacity);
          transition: opacity 0.2s ease;
          border: 2px solid color-mix(in srgb, var(--tj-accent) 55%, transparent);
          background: radial-gradient(circle, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
        }
        .touch-joystick.active {
          opacity: 1;
        }
        .touch-joystick-knob {
          position: absolute;
          left: 50%;
          top: 50%;
          width: calc(var(--tj-size) * var(--tj-knob));
          height: calc(var(--tj-size) * var(--tj-knob));
          border-radius: 50%;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(255, 255, 255, 0.75);
          background: radial-gradient(
            circle at 35% 30%,
            color-mix(in srgb, var(--tj-accent) 60%, white),
            var(--tj-accent) 55%,
            color-mix(in srgb, var(--tj-accent) 75%, black)
          );
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          transition: transform 0.18s ease;
          pointer-events: none;
        }
        .touch-joystick.active .touch-joystick-knob {
          transition: none;
        }
      `;
      document.head.appendChild(style);
    }
    this.#root = document.createElement("div");
    this.#root.className = "touch-joystick";
    this.#knob = document.createElement("div");
    this.#knob.className = "touch-joystick-knob";
    this.#root.appendChild(this.#knob);
    parent.appendChild(this.#root);
    this.configure({ size, margin, knobScale, idleOpacity, accent, zIndex });
    this.#root.addEventListener("pointerdown", this.#onDown);
    this.#root.addEventListener("pointermove", this.#onMove);
    this.#root.addEventListener("pointerup", this.#onEnd);
    this.#root.addEventListener("pointercancel", this.#onEnd);
    this.#root.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  // Partial updates allowed — unspecified options keep their current value.
  configure(options) {
    Object.assign(this.#config, options);
    const c = this.#config;
    this.#root.style.setProperty("--tj-size", `${c.size}px`);
    this.#root.style.setProperty("--tj-margin", `${c.margin}px`);
    this.#root.style.setProperty("--tj-knob", c.knobScale);
    this.#root.style.setProperty("--tj-idle-opacity", c.idleOpacity);
    this.#root.style.setProperty("--tj-accent", c.accent);
    this.#root.style.setProperty("--tj-z", c.zIndex);
  }
  setVisible(visible) {
    this.#root.style.display = visible ? "" : "none";
    if (!visible) this.#release();
  }
  #onDown = (e) => {
    if (this.#pointerId !== null) return;
    e.preventDefault();
    this.#pointerId = e.pointerId;
    this.#root.setPointerCapture(e.pointerId);
    const rect = this.#root.getBoundingClientRect();
    this.#centerX = rect.left + rect.width / 2;
    this.#centerY = rect.top + rect.height / 2;
    this.#root.classList.add("active");
    this.active = true;
    this.#track(e);
  };
  #onMove = (e) => {
    if (e.pointerId === this.#pointerId) this.#track(e);
  };
  #onEnd = (e) => {
    if (e.pointerId === this.#pointerId) this.#release();
  };
  #track(e) {
    const travel = this.#config.size / 2;
    const dx = e.clientX - this.#centerX;
    const dy = e.clientY - this.#centerY;
    const len = Math.hypot(dx, dy);
    const clamp = len > travel ? travel / len : 1;
    this.#knob.style.transform = `translate(-50%, -50%) translate(${dx * clamp}px, ${dy * clamp}px)`;
    const m = Math.min(len / travel, 1);
    if (m < this.deadZone || m === 0) {
      this.x = 0;
      this.y = 0;
    } else {
      const out = (m - this.deadZone) / (1 - this.deadZone);
      this.x = dx * clamp / travel / m * out;
      this.y = -dy * clamp / travel / m * out;
    }
  }
  #release() {
    this.#pointerId = null;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.#root.classList.remove("active");
    this.#knob.style.transform = "translate(-50%, -50%)";
  }
  dispose() {
    this.#release();
    this.#root.remove();
  }
};

// virtual:InstanceCulling.js
import * as THREE2 from "three/webgpu";
var CapsuleFrustum = class {
  #frustum = new THREE2.Frustum();
  #viewProjection = new THREE2.Matrix4();
  // Rebuild the planes from the camera's current matrices. The caller ensures
  // camera.updateMatrixWorld() ran after any camera movement this frame.
  update(camera2, coordinateSystem) {
    this.#viewProjection.multiplyMatrices(camera2.projectionMatrix, camera2.matrixWorldInverse);
    this.#frustum.setFromProjectionMatrix(this.#viewProjection, coordinateSystem);
  }
  // Conservative capsule-vs-frustum with per-endpoint radii: only culls when
  // both endpoint spheres are fully outside one plane, so it never drops a
  // visible capsule.
  intersectsCapsule(x0, y0, z0, x1, y1, z1, r0, r1) {
    for (const plane of this.#frustum.planes) {
      const n = plane.normal;
      if (n.x * x0 + n.y * y0 + n.z * z0 + plane.constant < -r0 && n.x * x1 + n.y * y1 + n.z * z1 + plane.constant < -r1) {
        return false;
      }
    }
    return true;
  }
  intersectsSphere(x, y, z, r) {
    return this.intersectsCapsule(x, y, z, x, y, z, r, r);
  }
};
var BOX_EDGES = [];
for (let axis = 0; axis < 3; axis++) {
  const j = (axis + 1) % 3;
  const k = (axis + 2) % 3;
  for (let sj = 0; sj < 2; sj++) {
    for (let sk = 0; sk < 2; sk++) {
      const base = sj << j | sk << k;
      BOX_EDGES.push([base, base | 1 << axis, j * 2 + sj, k * 2 + sk]);
    }
  }
}
var MAX_VOLUME_PLANES = 9;
var BoxOccluderVolumes = class {
  count = 0;
  #capacity;
  // packed [nx, ny, nz, w] per plane; a sphere is hidden when n·c + w ≥ radius
  // for every plane of one volume
  #planes;
  #planeCounts;
  #cameraPosition = new THREE2.Vector3();
  #axes = [new THREE2.Vector3(), new THREE2.Vector3(), new THREE2.Vector3()];
  #half = new Float32Array(3);
  #corners = Array.from({ length: 8 }, () => new THREE2.Vector3());
  #front = new Uint8Array(6);
  #center = new THREE2.Vector3();
  #edgeA = new THREE2.Vector3();
  #edgeB = new THREE2.Vector3();
  #normal = new THREE2.Vector3();
  constructor(capacity = 8) {
    this.#capacity = capacity;
    this.#planes = new Float32Array(capacity * MAX_VOLUME_PLANES * 4);
    this.#planeCounts = new Uint8Array(capacity);
  }
  // Start a fresh frame of volumes, viewed from this camera position.
  reset(cameraPosition3) {
    this.count = 0;
    this.#cameraPosition.copy(cameraPosition3);
  }
  // Exact occlusion volume of a solid oriented box seen from the camera: a
  // point is hidden iff it lies inside every silhouette-edge plane and behind
  // every camera-facing face plane. `scale` is the box's full extent per axis;
  // `box` an optional extent-normalized {min, max} solid core (arrays of 3
  // fractions) — an occluder must under-estimate its geometry, and render
  // bboxes often include air; `shrink` adds a further safety shrink. Returns
  // false (volume not added) when the camera is inside the box or an edge
  // plane degenerates.
  addBox(position, quaternion, scale, box = null, shrink = 1) {
    if (this.count >= this.#capacity) return false;
    const camera2 = this.#cameraPosition;
    this.#center.copy(position);
    for (let a = 0; a < 3; a++) {
      const lo = box ? box.min[a] : 0;
      const hi = box ? box.max[a] : 1;
      const extent = scale.getComponent(a);
      this.#axes[a].set(a === 0 ? 1 : 0, a === 1 ? 1 : 0, a === 2 ? 1 : 0).applyQuaternion(quaternion);
      this.#half[a] = extent * ((hi - lo) / 2) * shrink;
      this.#center.addScaledVector(this.#axes[a], extent * ((lo + hi) / 2 - 0.5));
    }
    this.#edgeA.subVectors(camera2, this.#center);
    let frontCount = 0;
    for (let a = 0; a < 3; a++) {
      const d = this.#edgeA.dot(this.#axes[a]);
      this.#front[a * 2] = d < -this.#half[a] ? 1 : 0;
      this.#front[a * 2 + 1] = d > this.#half[a] ? 1 : 0;
      frontCount += this.#front[a * 2] + this.#front[a * 2 + 1];
    }
    if (frontCount === 0) return false;
    for (let c = 0; c < 8; c++) {
      this.#corners[c].copy(this.#center).addScaledVector(this.#axes[0], c & 1 ? this.#half[0] : -this.#half[0]).addScaledVector(this.#axes[1], c & 2 ? this.#half[1] : -this.#half[1]).addScaledVector(this.#axes[2], c & 4 ? this.#half[2] : -this.#half[2]);
    }
    const base = this.count * MAX_VOLUME_PLANES * 4;
    let planes = 0;
    for (let a = 0; a < 3; a++) {
      for (let s = 0; s < 2; s++) {
        if (!this.#front[a * 2 + s]) continue;
        const sign = s === 0 ? -1 : 1;
        const axis = this.#axes[a];
        this.#planes[base + planes * 4] = -sign * axis.x;
        this.#planes[base + planes * 4 + 1] = -sign * axis.y;
        this.#planes[base + planes * 4 + 2] = -sign * axis.z;
        this.#planes[base + planes * 4 + 3] = sign * axis.dot(this.#center) + this.#half[a];
        planes++;
      }
    }
    for (const [c0, c1, f0, f1] of BOX_EDGES) {
      if (this.#front[f0] === this.#front[f1]) continue;
      this.#edgeA.subVectors(this.#corners[c0], camera2);
      this.#edgeB.subVectors(this.#corners[c1], camera2);
      this.#normal.crossVectors(this.#edgeA, this.#edgeB);
      const length = this.#normal.length();
      if (length < 1e-6) return false;
      this.#normal.divideScalar(length);
      this.#edgeA.subVectors(this.#center, camera2);
      if (this.#normal.dot(this.#edgeA) < 0) this.#normal.negate();
      this.#planes[base + planes * 4] = this.#normal.x;
      this.#planes[base + planes * 4 + 1] = this.#normal.y;
      this.#planes[base + planes * 4 + 2] = this.#normal.z;
      this.#planes[base + planes * 4 + 3] = -this.#normal.dot(camera2);
      planes++;
    }
    this.#planeCounts[this.count] = planes;
    this.count++;
    return true;
  }
  // Both capsule endpoints inside one convex volume ⇒ the whole segment —
  // instance, shadow landing, and any shadow receiver in between — is hidden.
  segmentHidden(x0, y0, z0, x1, y1, z1, r0, r1) {
    for (let s = 0; s < this.count; s++) {
      const planes = this.#planeCounts[s];
      let base = s * MAX_VOLUME_PLANES * 4;
      let inside = true;
      for (let p = 0; p < planes; p++) {
        const nx = this.#planes[base];
        const ny = this.#planes[base + 1];
        const nz = this.#planes[base + 2];
        const w = this.#planes[base + 3];
        if (nx * x0 + ny * y0 + nz * z0 + w < r0 || nx * x1 + ny * y1 + nz * z1 + w < r1) {
          inside = false;
          break;
        }
        base += 4;
      }
      if (inside) return true;
    }
    return false;
  }
};
function shadowSweepEndpoint(x, y, z, r, sunDir2, out) {
  const t = Math.max(y, 0) / -sunDir2.y;
  out.x = x + sunDir2.x * t;
  out.y = Math.min(y, 0);
  out.z = z + sunDir2.z * t;
  out.r = r / -sunDir2.y;
  return out;
}
var TopCandidates = class {
  count = 0;
  #scores;
  #ids;
  #budget = 0;
  constructor(capacity) {
    this.#scores = new Float32Array(capacity);
    this.#ids = new Int32Array(capacity);
  }
  reset(budget = this.#scores.length) {
    this.count = 0;
    this.#budget = Math.min(budget, this.#scores.length);
  }
  offer(id, score2) {
    if (this.count === this.#budget && (this.#budget === 0 || score2 <= this.#scores[this.count - 1])) return;
    let at = Math.min(this.count, this.#budget - 1);
    while (at > 0 && this.#scores[at - 1] < score2) {
      this.#scores[at] = this.#scores[at - 1];
      this.#ids[at] = this.#ids[at - 1];
      at--;
    }
    this.#scores[at] = score2;
    this.#ids[at] = id;
    if (this.count < this.#budget) this.count++;
  }
  id(index) {
    return this.#ids[index];
  }
};
function sortPackNearToFar(indices, depths, n) {
  for (let a = 1; a < n; a++) {
    const depth = depths[a];
    const index = indices[a];
    let b = a - 1;
    while (b >= 0 && depths[b] > depth) {
      depths[b + 1] = depths[b];
      indices[b + 1] = indices[b];
      b--;
    }
    depths[b + 1] = depth;
    indices[b + 1] = index;
  }
}

// virtual:LODs.js
import * as THREE3 from "three/webgpu";
function simplifyGeometryIndex(simplifier2, geometry, targetTris, errorBound, flags = []) {
  const source = geometry.index.array;
  const indices = source instanceof Uint32Array ? source : new Uint32Array(source);
  const [collapsed, error] = simplifier2.simplify(
    indices,
    geometry.attributes.position.array,
    3,
    Math.floor(targetTris) * 3,
    errorBound,
    flags
  );
  return { indices: collapsed, error };
}
function buildLodChain(simplifier2, geometries, levels, { trisMin = 0, detail = 1, flags = [], stallRatio = 0.92 } = {}) {
  const lods = [{ geometries, error: 0 }];
  for (const { ratio, error: errorBound } of levels) {
    const previous = lods[lods.length - 1];
    let reduced = false;
    let maxError = 0;
    const levelGeometries = geometries.map((base, m) => {
      if (!base.index) return previous.geometries[m];
      const target = Math.max(base.index.count / 3 * ratio, trisMin) * detail;
      const { indices, error } = simplifyGeometryIndex(simplifier2, base, target, errorBound / detail, [
        "Prune",
        ...flags
      ]);
      const prevGeometry = previous.geometries[m];
      const prevTris = (prevGeometry.index ?? prevGeometry.attributes.position).count / 3;
      if (indices.length / 3 >= prevTris * stallRatio) return prevGeometry;
      reduced = true;
      maxError = Math.max(maxError, error);
      const geometry = new THREE3.BufferGeometry();
      for (const name in base.attributes) geometry.setAttribute(name, base.attributes[name]);
      geometry.setIndex(new THREE3.BufferAttribute(indices, 1));
      return geometry;
    });
    if (reduced) lods.push({ geometries: levelGeometries, error: maxError });
  }
  return lods;
}
function lodPixelScale(viewportHeight, fov) {
  return viewportHeight / 2 / Math.tan(THREE3.MathUtils.degToRad(fov) / 2);
}
function selectLodLevel(lods, lastLod, errPx, downPx, upPx) {
  const maxLod = lods.length - 1;
  let lod = Math.min(lastLod, maxLod);
  while (lod < maxLod && lods[lod + 1].error * errPx < downPx) lod++;
  while (lod > 0 && lods[lod].error * errPx > upPx) lod--;
  return lod;
}

// virtual:SightConeCutout.js
import * as THREE4 from "three/webgpu";
import {
  cameraPosition,
  float,
  materialAlphaTest,
  materialOpacity,
  mix,
  positionWorld,
  screenCoordinate,
  uniform as uniform2
} from "three/tsl";
var SightConeCutout = class {
  uEnabled = uniform2(0);
  uRadius = uniform2(0);
  // cone radius at the target plane (m)
  #renderer;
  #materialCache = /* @__PURE__ */ new Map();
  #mask;
  #uOpacity;
  #dither;
  // CPU mirror of the cone for conservative routing tests
  #camera = new THREE4.Vector3();
  #axis = new THREE4.Vector3();
  #axisLen2 = 1;
  #axisLen = 1;
  #maxRadius = 0;
  // `target` is a vec3 uniform node tracking the cone's far end; the getters
  // pull their params per frame (single source of truth stays with the caller).
  // feather: dissolve edge width (m); opacity: dithered opacity kept inside
  // the cone; release: fraction of the camera→target span over which the cut
  // fades near the target.
  constructor(renderer2, { target, feather, opacity, release }) {
    this.#renderer = renderer2;
    const uFeather = uniform2(0).onFrameUpdate(feather);
    const uRelease = uniform2(0).onFrameUpdate(release);
    this.#uOpacity = uniform2(0).onFrameUpdate(opacity);
    const bayer2 = (coord) => coord.x.mul(0.5).add(coord.y.mul(coord.y).mul(0.75)).fract();
    const bayerCoord = screenCoordinate.xy.mod(8).floor();
    this.#dither = bayer2(bayerCoord).add(bayer2(bayerCoord.mul(0.5).floor()).mul(0.25)).add(bayer2(bayerCoord.mul(0.25).floor()).mul(0.0625));
    const axis = target.sub(cameraPosition);
    const vec = positionWorld.sub(cameraPosition);
    const t = vec.dot(axis).div(axis.dot(axis));
    const radial = vec.sub(axis.mul(t)).length();
    this.#mask = radial.sub(this.uRadius.mul(t)).smoothstep(0, uFeather.mul(t.max(0.05))).oneMinus().mul(t.oneMinus().smoothstep(0.02, uRelease)).mul(this.uEnabled);
  }
  // Node-material clone of a material (the same conversion the renderer
  // applies to plain materials internally) with the dithered cutout wired into
  // opacity + alpha test. The dither threshold only engages inside the cone —
  // outside it the authored opacity/alphaTest behavior is untouched. An
  // optional gate uniform (0..1) fades the whole cutout for this material.
  materialFor(material, uGate = null) {
    let cutoutMaterial = this.#materialCache.get(material);
    if (!cutoutMaterial) {
      cutoutMaterial = this.#renderer.library.fromMaterial(material);
      const gatedMask = uGate ? this.#mask.mul(uGate) : this.#mask;
      cutoutMaterial.opacityNode = materialOpacity.mul(mix(float(1), this.#uOpacity, gatedMask));
      cutoutMaterial.alphaTestNode = gatedMask.greaterThan(0).select(this.#dither, materialAlphaTest);
      this.#materialCache.set(material, cutoutMaterial);
    }
    return cutoutMaterial;
  }
  // Refresh the CPU mirror of the cone. `maxRadius` is the widest radius at
  // the target plane the test should consider (typically uRadius + feather).
  updateCone(cameraPosition3, targetX, targetY, targetZ, maxRadius) {
    this.#camera.copy(cameraPosition3);
    this.#axis.set(targetX - cameraPosition3.x, targetY - cameraPosition3.y, targetZ - cameraPosition3.z);
    this.#axisLen2 = Math.max(this.#axis.lengthSq(), 1e-12);
    this.#axisLen = Math.sqrt(this.#axisLen2);
    this.#maxRadius = maxRadius;
  }
  // Conservative bounding-sphere-vs-cone test against the last updateCone().
  sphereMeetsCone(x, y, z, radius) {
    const wx = x - this.#camera.x;
    const wy = y - this.#camera.y;
    const wz = z - this.#camera.z;
    const t = (wx * this.#axis.x + wy * this.#axis.y + wz * this.#axis.z) / this.#axisLen2;
    const tMargin = radius / this.#axisLen;
    if (t + tMargin < 0 || t - tMargin > 1) return false;
    const rx = wx - this.#axis.x * t;
    const ry = wy - this.#axis.y * t;
    const rz = wz - this.#axis.z * t;
    return Math.hypot(rx, ry, rz) - radius < this.#maxRadius * Math.min(t + tMargin, 1);
  }
};

// virtual:main.js
var ASSETS = {
  chimeSound: "assets/click.mp3",
  trumpetsSound: "assets/victory.mp3",
  models: {
    manhole: window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_round_cast-iron_Hong_Kong_manhole_cover_with_a_simple_geometric_grid_pattern.glb"
    )?.dataUrl,
    "fruit-crate": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_wooden_fruit_crate_half-filled_with_oranges.glb"
    )?.dataUrl,
    "cardboard-box": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_folded_cardboard_box_bundle_tied_with_string.glb"
    )?.dataUrl,
    crate: window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "a_classic_closed_wooden_shipping_crate_of_warm_brown_planks_with_diagonal_cross-bracing_on_each_side_and_lighter_corner_posts.glb"
    )?.dataUrl,
    "fire-hydrant": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_fire_hydrant_squat_with_two_side_outlets.glb"
    )?.dataUrl,
    bench: window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_public_bench_with_green_metal_slats_and_cast-iron_legs.glb"
    )?.dataUrl,
    taxi: window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_red_Hong_Kong_taxi_boxy_90s_sedan_shape_with_a_rooftop_taxi_sign.glb"
    )?.dataUrl,
    "white-van": window.UPLOADED_3D_MODELS?.find((m) => m.name === "A_white_delivery_van.glb")?.dataUrl,
    "garbage-truck": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_garbage_truck_with_a_rear_compactor_in_municipal_green.glb"
    )?.dataUrl,
    "double-decker-bus": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "An_hong_kong_red_double-decker_bus.glb"
    )?.dataUrl,
    tree: window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_leafy_street_tree_with_a_slim_trunk_in_a_square_sidewalk_grate.glb"
    )?.dataUrl,
    "building-3": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_tall_pencil-slim_glass_office_tower_with_a_blue_curtain-wall_grid_and_a_small_rooftop_mechanical_box.glb"
    )?.dataUrl,
    "building-5": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_tall_slim_commercial_tower_of_roll-up_shutter_shopfronts_at_the_base_and_narrow_tiled_floors_rising_above.glb"
    )?.dataUrl,
    "building-6": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_tall_skinny_mixed-use_tower_plastered_floor-to-roof_with_overlapping_shop_signs_banners_and_stacked_horizontal_neon_boxes.glb"
    )?.dataUrl,
    "human-man": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_Hong_Kong_office_worker_in_a_short-sleeve_shirt.glb"
    )?.dataUrl,
    "human-woman": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "a_Hong_Kong_businesswoman_in_a_charcoal_skirt_suit_with_a_black_bob_haircut.glb"
    )?.dataUrl,
    "human-kid": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_schoolkid_in_a_white_uniform_with_a_backpack_standing_upright.glb"
    )?.dataUrl,
    "human-vendor": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_street_vendor_woman_in_an_apron_with_rolled_sleeves_standing_upright.glb"
    )?.dataUrl,
    "human-worker": window.UPLOADED_3D_MODELS?.find(
      (m) => m.name === "A_construction_worker_in_a_yellow_hard_hat_and_reflective_vest_standing_upright.glb"
    )?.dataUrl
  }
};
async function instantiateBox3D(attempts = 6) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await Box3D();
    } catch (err) {
      if (attempt >= attempts - 1) throw err;
      console.warn(`box3d.js instantiation failed (attempt ${attempt + 1}/${attempts}), retrying\u2026`, err);
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }
}
var b3 = await instantiateBox3D();
var params = {
  debug: false,
  showColliders: false,
  // collider wireframes — slabs, walls, vehicle & tree compounds
  // View
  cameraFov: navigator.maxTouchPoints > 0 || "ontouchstart" in window ? 40 : 30,
  // wider on mobile — portrait framing needs it
  cameraFollow: true,
  followDamping: 3,
  // eased orbit-target tracking of the hole
  toneMapping: "ACESFilmic",
  toneMappingExposure: 1,
  // Controls — on-screen joystick (auto = touch devices only) + gamepad
  // (standard mapping: left stick moves, right stick orbits, triggers zoom,
  // A/Start starts, Back restarts)
  joystickMode: "auto",
  // 'on' forces it visible — handy for mouse testing
  joystickSize: 260,
  // base diameter (px)
  joystickMargin: 28,
  // inset from the bottom-left corner (px)
  joystickKnobScale: 0.45,
  // knob diameter as a fraction of the base
  joystickDeadZone: 0.12,
  joystickIdleOpacity: 0.55,
  // opacity when untouched — full while dragged
  gamepadDeadZone: 0.15,
  gamepadRotateSpeed: 2.5,
  // right-stick camera orbit rate (rad/s)
  gamepadZoomSpeed: 1.2,
  // trigger dolly rate (exponential, per second)
  gamepadInvertX: false,
  // flip right-stick orbit direction
  gamepadInvertY: false,
  // flip right-stick tilt direction
  // HUD
  showHud: true,
  showTimer: true,
  // bottom-right level timer
  hudColor: "#ffc83c",
  titleHungryColor: "#ff5e4d",
  // gradient base of the "HUNGRY" word
  titleManholeColor: "#ffc83c",
  // gradient base of the "MANHOLE" word
  titleOutlineColor: "#241540",
  // title outline + 3D extrusion ink
  showPopups: true,
  // floating +N score popups over the hole
  popupSize: 36,
  // popup font size (px) for a 1-point catch
  popupGrowth: 0.12,
  // extra size per point above 1, capped at 2.5×
  clearedDelay: 0.6,
  // seconds between the last catch and the LEVEL CLEARED banner
  showConfetti: true,
  // confetti bursts on the level-cleared celebration
  confettiCount: 160,
  // pieces in the main confetti burst
  // Sound
  sound: true,
  chimeVolume: 0.5,
  // catch-chime loudness
  chimePitchJitter: 0.06,
  // ± random playback-rate per chime so back-to-back catches don't read as one loop
  trumpetsVolume: 0.6,
  // level-cleared fanfare loudness
  // Hole
  holeSize: 1.05,
  // starting hole radius — noticeably wider than the manhole cover
  holeSizeMax: 12,
  coverPopVelocity: 9,
  // upward launch of the manhole cover on START
  coverSpawnY: 0.1,
  // resting height of the cover center — negative sinks it below street level
  holeSegments: 20,
  // ring colliders approximating the circle — they are also the visible street edge, low counts read faceted at large radii
  holeSpeed: 8,
  holeAccel: 12,
  holeDepth: 4,
  // meters below street a prop's top must sink before it's collected —
  // starts shallow and deepens linearly as the hole outgrows its start radius
  collectDepthStart: 1,
  collectDepthGrowth: 1,
  // extra collect depth per meter of hole radius growth
  // Suction — once a prop's center sinks below the street it's already
  // committed to the shaft; pull it straight down so nothing stalls mid-fall
  suction: true,
  suctionDownward: 6,
  // downward pull at full ramp (m/s², mass-proportional — adds to gravity)
  suctionRamp: 0.75,
  // depth (m) below the street over which the pull fades in — keeps the grab subtle at the rim
  holeGrowth: true,
  growthEvery: 10,
  // points for the first growth step; each next step costs one more (10, 20, 30…)
  growthFactor: 1.3,
  growthFrequency: 2.2,
  // spring speed of the radius transition
  growthBounce: 0.7,
  // 0 = smooth ease-out, →1 overshoots harder before settling
  growthZoom: 0.9,
  // pull-back ∝ radius growth: 1 keeps the hole's apparent size constant, 0 disables
  zoomDuration: 4,
  // seconds for the camera pull-back to settle (smooth — deliberately ignores the bounce)
  showRim: true,
  rimColor: "#ffc83c",
  rimThickness: 0.09,
  // See-through cutout — props flagged `cutout` (buildings)
  // dissolve in a screen-door dither wherever they
  // fall inside the sight cone from the camera to the hole disc. Each model
  // is released once the hole outgrows its footprint and can swallow it.
  cutoutEnabled: true,
  cutoutScale: 2.5,
  // cone radius at the hole plane, in hole radii
  cutoutPadding: 1.8,
  // extra cone radius (m) so the rim ring stays visible
  cutoutFeather: 3.6,
  // dissolve edge width (m)
  cutoutOpacity: 0.08,
  // dithered opacity kept inside the cone — a ghost of the occluder
  cutoutRelease: 0.13,
  // fraction of the camera→hole span over which the cut fades near the hole
  cutoutSwallowScale: 1.3,
  // hole radii per footprint radius at which a model stops dissolving
  // Culling — three.js can only cull whole InstancedMesh draws, so the
  // instance buffers are re-packed each frame with just the instances that
  // can affect the image (see Instance Culling section).
  cullEnabled: true,
  cullMargin: 0,
  // bounding-sphere padding (m) — safety slack on every cull test
  // off-screen props whose sun shadow lands on screen: 'box' casts it from a
  // cheap bbox proxy in the shadow pass only, 'full' keeps the real geometry,
  // 'cull' drops them (their shadow pops out at the frustum edge)
  offscreenCasters: "box",
  cullSort: true,
  // draw instances near-to-far so early-Z rejects hidden fragments
  occlusionEnabled: true,
  // drop props fully hidden behind buildings
  occluderMax: 8,
  // biggest on-screen buildings used as occluders per frame (≤ MAX_OCCLUDERS)
  occluderShrink: 1,
  // safety shrink of each occluder box — facades aren't perfectly solid
  // Distance LOD — each visible instance draws the coarsest LOD level whose
  // collapse error projects under lodPopPixels on screen, so triangle cost
  // tracks apparent size instead of scene extent as the camera pulls back.
  lodPopPixels: 1.5,
  // on-screen silhouette error budget (px) — 0 pins everything to LOD0
  lodHysteresis: 0.1,
  // switch-up fires this fraction above the switch-down error
  lodHoleClampRadius: 5,
  // hole radii within which props stay ≥ LOD1 — the swallow is the show
  lodForceCheapest: false,
  // pin every instance to its coarsest level — perf isolation
  // Per-family render toggles (perf isolation) — physics bodies stay alive
  showBuildings: true,
  showCrates: true,
  showCardboardBoxes: true,
  showFruitCrates: true,
  // City — counts per category; models are scaled to real-world meters and
  // the hole's growth ladder climbs from street litter to whole towers.
  globalScale: 1,
  // multiplies every model's real-world size
  sizeVariation: 0.07,
  // per-instance uniform scale jitter
  buildingCount: 16,
  treeCount: 30,
  benchCount: 8,
  hydrantCount: 5,
  crateStackCount: 20,
  // box towers — crates, fruit crates, cardboard
  crateStackLevelsMin: 5,
  // tower height range
  crateStackLevelsMax: 10,
  cratePyramidCount: 20,
  crateQuadCount: 8,
  // 2×2 box piles, a couple of levels tall
  crateBacklotCount: 12,
  // mega columns in the dead space behind buildings
  crateBacklotLevelsMin: 7,
  crateBacklotLevelsMax: 13,
  // clutterCount: 20, // loose boxes and crates on the pavements (buildClutter disabled)
  propFriction: 0.6,
  propRestitution: 0,
  rollingResistance: 0.05,
  // lets tipped props settle and sleep
  // Pedestrians — skinned humans wandering the pavements on a navcat navmesh
  // built from the sidewalk strips + zebra crossings, minus every placed
  // footprint. They walk by default, stampede away when the hole eats
  // something close by, and plummet with a clueless idle once the ground
  // under them is gone.
  pedestrianCount: 24,
  pedestrianPoints: 5,
  // score per swallowed pedestrian
  pedestrianWalkSpeed: 1.1,
  pedestrianRunSpeed: 3.4,
  pedestrianWalkStride: 1.4,
  // meters covered per walk-cycle loop — syncs feet to ground
  pedestrianRunStride: 3.2,
  // meters covered per run-cycle loop
  pedestrianTurnRate: 10,
  // yaw damping toward the movement direction
  pedestrianWalkAccel: 5,
  // crowd steering acceleration while strolling
  pedestrianRunAccel: 12,
  // crowd steering acceleration while panicking
  pedestrianSeparationWeight: 2,
  // personal-space push between agents
  pedestrianCollisionRangeMult: 12,
  // neighbor/obstacle scan reach, × agent radius
  pedestrianAnimFade: 0.25,
  // crossfade seconds between walk/run/idle
  pedestrianEmissive: 0,
  // the exports bake albedo into the emissive slot — 0 keeps them lit by the scene
  pedestrianFallInset: 0.15,
  // rim inset (m) — the center must be this far inside the opening to fall
  pedestrianFallPull: 0.75,
  // drift rate toward the shaft axis while falling
  panicRadius: 5,
  // pedestrians this close to a catch break into a run
  panicRadiusGrowth: 1.2,
  // extra panic radius per meter of hole radius growth — a bigger hole alarms a wider crowd
  panicDuration: 4,
  // seconds of running after the latest nearby catch
  fleeDistance: 10,
  // how far past the pedestrian the flee target is projected
  fleeSpread: 1.2,
  // angular fan-out (rad) of flee targets — a crowd disperses
  fleeReplanCooldown: 0.5,
  // min seconds between panic replans per agent
  pedestrianStuckSpeed: 0.25,
  // below this (m/s) an agent counts as stalled — repath, re-seat, rim-fall
  stuckRepathWalk: 2,
  // seconds a stalled walker idles before repathing
  stuckRepathRun: 0.7,
  // seconds a stalled runner idles before repathing
  stuckReseatAfter: 3,
  // stalled repaths in a row before the agent is re-seated on the navmesh
  pedestrianHoverMargin: 0.15,
  // stalled peds fall already this far (m) outside the rim
  pedestrianIdleSpeed: 0.15,
  // below this (m/s) walkers stand with the idle — no slow-motion treadmill
  wanderRadius: 14,
  // reachable-poly sampling radius for the next stroll target
  // Traffic — every vehicle in the city cruises the road polys of the
  // navmesh: normal props (instanced mesh, points, hole food) whose kinematic
  // body is chauffeured by a crowd agent, so they brake for pedestrians and
  // each other, and floor it when spooked. They pull out a few seconds after
  // START, so nothing drives over the freshly opened hole.
  carCount: 6,
  carSpawnDelay: 3,
  // seconds after START before the traffic pulls out
  carRecoverDelay: 2,
  // seconds a dropped car must survive (and settle) before the driver rejoins traffic
  carSpeed: 5.5,
  carAccel: 6,
  carSpookSpeed: 8,
  // panicked drivers floor it
  carSpookAccel: 14,
  carTurnRate: 5,
  // yaw damping toward the travel direction
  carBrakeDistance: 3,
  // windshield scan reach (m) past the bumper, for pedestrians and cars
  carBrakeWidth: 2,
  // lateral half-width (m) of the windshield scan
  carRouteMargin: 5,
  // route endpoints stop this far from the arena edge
  // Navmesh — voxel rasterization of the whole ground; footprint blockers
  // carve the placed props out, and area marks flag each poly as pavement,
  // crossing or asphalt (walkers keep to pavements + crossings, runners go
  // anywhere, cars keep to asphalt + crossings). Rebuilt on every city build.
  navmeshCellSize: 0.15,
  // voxel xz size (m) — smaller hugs the kerbs tighter
  navmeshAgentRadius: 0.22,
  // walkable erosion radius (m) around obstacles
  showNavmesh: false,
  // debug overlay of the walkable polys
  navmeshColor: "#3fd2ff",
  // pavement/crossing polys
  navmeshRoadColor: "#ff9b3f",
  // asphalt + run-only polys
  // Models — load-time simplification. Models load once at startup, so these
  // need a reload; the GUI controls save params first. /models/hong-kong
  // holds the raw exports (~150k tris each). Simplification collapses edges
  // in the index buffer (meshoptimizer), referencing the original vertices —
  // UVs, normals and textures survive.
  modelSimplifyRatio: 1,
  // flat fraction of triangles kept — 1 loads meshes as-is
  // Per-model triangle budget ∝ world size — the raw exports spend ~150k tris
  // on everything from a crate to a tower, so a flat ratio either
  // starves the towers or wastes millions on litter. 0 disables the budget.
  modelTrisPerMeter: 2500,
  // budget per meter of the model's largest world extent
  modelTrisMin: 2e3,
  // budget floor — keeps small props from faceting up close
  // Per-model budget multiplier — 1 = plain size budget, higher keeps more
  // triangles (big values effectively skip simplification).
  detail_manhole: 4,
  // title-screen hero
  "detail_fruit-crate": 8,
  "detail_cardboard-box": 15,
  detail_crate: 3,
  "detail_fire-hydrant": 10,
  detail_bench: 3,
  detail_taxi: 8,
  "detail_white-van": 5,
  "detail_garbage-truck": 3,
  "detail_double-decker-bus": 5,
  detail_tree: 5,
  // organic canopy silhouette
  "detail_building-3": 3,
  "detail_building-5": 2,
  "detail_building-6": 2,
  modelSimplifyError: 0.01,
  // max relative deviation — too strict silently blocks collapses
  modelSimplifyLockBorder: false,
  // pin open-boundary verts — crisper silhouettes, worse ratios
  // Distance-LOD chain — two coarser index buffers collapsed from LOD0 at
  // load, sharing its vertex buffers (GPU cost = two small extra indices).
  // Ratios are fractions of LOD0's triangles; error bounds are meshopt
  // deviations relative to the mesh extent, and the achieved error drives the
  // per-instance LOD selection in packInstances.
  lodEnabled: true,
  lodRatio1: 0.3,
  lodRatio2: 0.1,
  lodError1: 0.05,
  lodError2: 0.15,
  // far silhouettes tolerate deep collapses
  lodTrisMin: 400,
  // per-level floor — even far hulls keep a readable shape
  // Per-model LOD multiplier — raises the LOD1/2 triangle targets (×) and
  // tightens their error bounds (÷), so the level keeps more detail AND the
  // selector holds it longer. Vehicles collapse badly: thin
  // frames, mirrors and cargo read as damage well before the error bound.
  lodDetail_manhole: 1,
  "lodDetail_fruit-crate": 1,
  "lodDetail_cardboard-box": 1,
  lodDetail_crate: 1,
  "lodDetail_fire-hydrant": 1,
  lodDetail_bench: 1,
  lodDetail_taxi: 2.5,
  "lodDetail_white-van": 2.5,
  "lodDetail_garbage-truck": 1,
  "lodDetail_double-decker-bus": 1,
  lodDetail_tree: 1,
  "lodDetail_building-3": 1,
  "lodDetail_building-5": 1,
  "lodDetail_building-6": 1,
  // Physics
  gravityY: -25,
  substeps: 4,
  sleeping: true,
  ccd: false,
  // continuous collision detection — keeps fast props from tunneling through the slabs
  speculative: false,
  // speculative contact margin in the solver; off = pure discrete collision
  wakeMargin: 1,
  // Arena
  arenaHalf: 40,
  walls: false,
  // optional boundary colliders; off = open field
  boundaryPlanes: true,
  // invisible colliders sealing the city limits — nothing escapes
  showBounds: true,
  // flat strips marking the playable edge when walls are off
  boundsColor: "#ffe9a8",
  boundsOpacity: 0.35,
  boundsThickness: 0.12,
  wallHeight: 1,
  wallThickness: 0.6,
  wallColor: "#7a7264",
  wallRoughness: 0.85,
  wallFriction: 0.4,
  // Streets & ground — two roads cross at the origin, painted in the shader
  roadWidth: 7,
  sidewalkWidth: 2.5,
  asphaltColor: "#3b3b40",
  sidewalkColor: "#9b948a",
  blockColor: "#8a8478",
  markingColor: "#e8e4da",
  markingIntensity: 0.85,
  // opacity of the painted road markings
  dashLength: 3,
  // period of the dashed center line
  centerLineWidth: 0.18,
  // painted width of the center line
  crosswalkWidth: 1.6,
  // depth of the zebra bands at the intersection
  crosswalkOffset: 0.7,
  // gap between the intersection and the zebra bands
  zebraPitch: 0.7,
  // repeat of the zebra bars across the road
  // excavated shaft — hole-local dirt strata and displaced rock bumps on a
  // deep pit wall that fades into darkness before its bottom is ever seen
  shaftNoiseEnabled: true,
  // fbm dirt strata + bump relief; off = flat dirt (rebuilds the materials)
  shaftNoiseTexSize: 64,
  // baked noise texture resolution per axis (rebakes)
  shaftNoiseTile: 8,
  // noise cells per texture repeat — more hides tiling, costs texel density (rebakes)
  shaftRockColorA: "#8a6f52",
  shaftRockColorB: "#5c4732",
  shaftRockFrequency: 0.9,
  // fbm noise cells per meter
  shaftStrataFrequency: 0.7,
  // sediment bands per meter of depth
  shaftStrataWarp: 0.45,
  // how much the noise bends the bands
  shaftCreviceIntensity: 0.55,
  // dark cracks along the noise veins
  shaftColor: "#241f1b",
  // deep tone the rock fades into toward the bottom
  voidColor: "#0a0908",
  shaftVisualDepth: 50,
  // visual-only pit depth — colliders keep holeDepth
  // meters over which the dirt fades to black — follows the animated hole
  // radius linearly, so a small pothole goes dark fast and the endgame
  // crater stays lit deeper
  shaftFadeDepthMin: 3,
  // fade depth at the starting radius (holeSize)
  shaftFadeDepthMax: 12,
  // fade depth at the max radius (holeSizeMax)
  shaftDisplacementAmplitude: 0.45,
  // rock bump height (m) fed to the bump normals
  shaftDisplacementFrequency: 0.55,
  // rock bumps per meter
  shaftRadialSegments: 128,
  tileFrequency: 1,
  // pavement tile cells per meter
  gridIntensity: 0.18,
  gridLineWidth: 0.03,
  groundRoughness: 0.9,
  groundFriction: 0.7,
  // Lighting
  ambientColor: "#ffffff",
  ambientIntensity: 0.35,
  sunColor: "#fff2dd",
  sunIntensity: 3,
  hemiSkyColor: "#cfe5ff",
  hemiGroundColor: "#57534b",
  hemiIntensity: 0.5,
  shadows: true,
  shadowMapSize: 4096,
  shadowBias: -2e-4,
  shadowNormalBias: 0.02,
  shadowRadius: 1,
  shadowIntensity: 1,
  // shadow darkness, 1 = fully dark
  shadowCameraScale: 1.5,
  // ortho box half-size as a multiple of arenaHalf
  shadowCameraNear: 1,
  shadowCameraFar: 160,
  // Environment
  bgColor: "#a6c3d8",
  fogColor: "#a6c3d8",
  fogNear: 55,
  fogFar: 180,
  // Post-processing — vignette applied in linear HDR before the tonemap
  vignetteIntensity: 0.5,
  // 0 disables
  vignetteRadius: 0.35,
  // uv distance from center where the falloff starts
  vignetteSmoothness: 0.55,
  // Splash vignette — the idle screen opens on a tight iris around the manhole
  // that relaxes to the gameplay vignette when START is pressed
  splashVignetteIntensity: 0.99,
  splashVignetteRadius: 0.07,
  splashVignetteSmoothness: 0.26,
  vignetteSoftenDuration: 1.4
  // seconds for the iris to ease out after START
};
var TONE_MAPPING = {
  None: THREE5.NoToneMapping,
  Linear: THREE5.LinearToneMapping,
  Reinhard: THREE5.ReinhardToneMapping,
  Cineon: THREE5.CineonToneMapping,
  ACESFilmic: THREE5.ACESFilmicToneMapping,
  AgX: THREE5.AgXToneMapping,
  Neutral: THREE5.NeutralToneMapping
};
var MAX_PROPS = 2048;
var SLAB_REACH = 200;
var CLOSED_RADIUS = 0.05;
var IDENTITY_QUAT = { v: { x: 0, y: 0, z: 0 }, s: 1 };
var IDENTITY_TRANSFORM = { p: { x: 0, y: 0, z: 0 }, q: IDENTITY_QUAT };
var UP = new THREE5.Vector3(0, 1, 0);
var scene = new THREE5.Scene();
scene.background = new THREE5.Color(params.bgColor);
var uFogColor = uniform3(new THREE5.Color()).onFrameUpdate(() => uFogColor.value.set(params.fogColor));
var uFogNear = uniform3(0).onFrameUpdate(() => params.fogNear);
var uFogFar = uniform3(0).onFrameUpdate(() => params.fogFar);
scene.fogNode = fog(uFogColor, positionWorld2.xz.sub(cameraPosition2.xz).length().smoothstep(uFogNear, uFogFar));
var camera = new THREE5.PerspectiveCamera(params.cameraFov, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0.07, 5.29, 7.3);
async function createRenderer() {
  for (const forceWebGL of [false, true]) {
    const candidate = new THREE5.WebGPURenderer({ antialias: true, forceWebGL });
    try {
      await candidate.init();
      if (forceWebGL) console.warn("WebGPU unavailable \u2014 running on the WebGL2 backend");
      return candidate;
    } catch (err) {
      try {
        candidate.dispose();
      } catch {
      }
      if (forceWebGL) throw err;
      console.warn("WebGPU init failed \u2014 retrying with the WebGL2 backend\u2026", err);
    }
  }
}
var renderer = await createRenderer();
renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE5.PCFSoftShadowMap;
(document.getElementById("root") ?? document.body).appendChild(renderer.domElement);
var stats = new Stats({ trackGPU: true });
stats.dom.style.display = params.debug ? "" : "none";
(document.getElementById("root") ?? document.body).appendChild(stats.dom);
stats.init(renderer);
var vignetteBlend = 0;
var vignetteBlendEase = () => vignetteBlend * vignetteBlend * (3 - 2 * vignetteBlend);
var uVignetteIntensity = uniform3(0).onFrameUpdate(
  () => THREE5.MathUtils.lerp(params.splashVignetteIntensity, params.vignetteIntensity, vignetteBlendEase())
);
var uVignetteRadius = uniform3(0).onFrameUpdate(
  () => THREE5.MathUtils.lerp(params.splashVignetteRadius, params.vignetteRadius, vignetteBlendEase())
);
var uVignetteSmoothness = uniform3(0).onFrameUpdate(
  () => THREE5.MathUtils.lerp(params.splashVignetteSmoothness, params.vignetteSmoothness, vignetteBlendEase())
);
var renderPipeline = new THREE5.RenderPipeline(renderer);
var scenePass = pass(scene, camera);
var vignetteDist = uv().sub(0.5).length();
var vignetteShade = vignetteDist.smoothstep(uVignetteRadius, uVignetteRadius.add(uVignetteSmoothness)).mul(uVignetteIntensity).oneMinus();
renderPipeline.outputNode = vec4(scenePass.rgb.mul(vignetteShade), scenePass.a);
var controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 90;
controls.minPolarAngle = 0.1;
controls.maxPolarAngle = 1.45;
var homeCameraPosition = camera.position.clone();
var homeCameraTarget = controls.target.clone();
function resetCamera() {
  camera.position.copy(homeCameraPosition);
  controls.target.copy(homeCameraTarget);
}
function applyView() {
  camera.fov = params.cameraFov;
  camera.updateProjectionMatrix();
  renderer.toneMapping = TONE_MAPPING[params.toneMapping];
  renderer.toneMappingExposure = params.toneMappingExposure;
  renderPipeline.needsUpdate = true;
}
applyView();
var ambientLight = new THREE5.AmbientLight(params.ambientColor, params.ambientIntensity);
scene.add(ambientLight);
var dirLight = new THREE5.DirectionalLight(params.sunColor, params.sunIntensity);
dirLight.position.set(24, 40, 14);
dirLight.castShadow = params.shadows;
dirLight.shadow.mapSize.set(params.shadowMapSize, params.shadowMapSize);
dirLight.shadow.bias = params.shadowBias;
dirLight.shadow.normalBias = params.shadowNormalBias;
dirLight.shadow.radius = params.shadowRadius;
dirLight.shadow.intensity = params.shadowIntensity;
scene.add(dirLight);
scene.add(dirLight.target);
function applyShadowCamera() {
  const r = params.arenaHalf * params.shadowCameraScale;
  const shadowCamera = dirLight.shadow.camera;
  shadowCamera.left = -r;
  shadowCamera.right = r;
  shadowCamera.top = r;
  shadowCamera.bottom = -r;
  shadowCamera.near = params.shadowCameraNear;
  shadowCamera.far = params.shadowCameraFar;
  shadowCamera.updateProjectionMatrix();
}
applyShadowCamera();
function applyShadowMapSize() {
  dirLight.shadow.mapSize.set(params.shadowMapSize, params.shadowMapSize);
  if (dirLight.shadow.map) {
    dirLight.shadow.map.dispose();
    dirLight.shadow.map = null;
  }
}
var hemiLight = new THREE5.HemisphereLight(params.hemiSkyColor, params.hemiGroundColor, params.hemiIntensity);
scene.add(hemiLight);
var worldDef = b3.b3DefaultWorldDef();
worldDef.gravity = { x: 0, y: params.gravityY, z: 0 };
worldDef.enableSleep = params.sleeping;
worldDef.enableContinuous = params.ccd;
worldDef.workerCount = 0;
worldDef.capacity = {
  staticBodyCount: 64,
  staticShapeCount: 64,
  dynamicBodyCount: MAX_PROPS + 64,
  dynamicShapeCount: MAX_PROPS + 768,
  // compounds carry extra shapes: vehicles up to 7, trees 2, benches 6, large signs 3
  contactCount: MAX_PROPS * 12
};
var world = b3.b3CreateWorld(worldDef);
b3.b3World_EnableSpeculative(world, params.speculative);
var unitCylinderHull = b3.b3CreateCylinder(1, 0.5, -0.5, 16);
var unitBoxHull = b3.b3CreateHull(
  [-0.5, 0.5].flatMap((x) => [-0.5, 0.5].flatMap((y) => [-0.5, 0.5].map((z) => [x, y, z]))).flat()
);
console.info("box3d.js \u2014 single-threaded solver");
var started = false;
var levelTime = 0;
var holeX = 0;
var holeZ = 0;
var holePrevX = 0;
var holePrevZ = 0;
var holeVelX = 0;
var holeVelZ = 0;
var holeRadius = CLOSED_RADIUS;
var holePrevRadius = CLOSED_RADIUS;
var holeTargetRadius = CLOSED_RADIUS;
var holeRadiusVel = 0;
var zoomRadius = params.holeSize;
var zoomPrevRadius = params.holeSize;
var holeViewX = 0;
var holeViewZ = 0;
var holeViewRadius = CLOSED_RADIUS;
var zoomViewRadius = params.holeSize;
var cameraViewRadius = params.holeSize;
var score = 0;
var growthLevel = 0;
var totalProps = 0;
var aliveCount = 0;
var audioContext = new AudioContext();
function loadSound(url) {
  const sound = { buffer: null, gain: audioContext.createGain() };
  sound.gain.connect(audioContext.destination);
  fetch(url).then((res) => res.arrayBuffer()).then((data) => audioContext.decodeAudioData(data)).then((buffer) => {
    sound.buffer = buffer;
  });
  return sound;
}
var chimeSound = loadSound(ASSETS.chimeSound);
var trumpetsSound = loadSound(ASSETS.trumpetsSound);
function playSound(sound, volume, playbackRate = 1) {
  if (!params.sound || !sound.buffer) return;
  if (audioContext.state === "suspended") audioContext.resume();
  sound.gain.gain.value = volume;
  const source = audioContext.createBufferSource();
  source.buffer = sound.buffer;
  source.playbackRate.value = playbackRate;
  source.connect(sound.gain);
  source.start();
}
function playChime() {
  playSound(chimeSound, params.chimeVolume, 1 + (Math.random() * 2 - 1) * params.chimePitchJitter);
}
var uAsphaltColor = uniform3(new THREE5.Color()).onFrameUpdate(() => uAsphaltColor.value.set(params.asphaltColor));
var uSidewalkColor = uniform3(new THREE5.Color()).onFrameUpdate(() => uSidewalkColor.value.set(params.sidewalkColor));
var uBlockColor = uniform3(new THREE5.Color()).onFrameUpdate(() => uBlockColor.value.set(params.blockColor));
var uMarkingColor = uniform3(new THREE5.Color()).onFrameUpdate(() => uMarkingColor.value.set(params.markingColor));
var uMarkingIntensity = uniform3(0).onFrameUpdate(() => params.markingIntensity);
var uShaftColor = uniform3(new THREE5.Color()).onFrameUpdate(() => uShaftColor.value.set(params.shaftColor));
var uRoadHalf = uniform3(0).onFrameUpdate(() => params.roadWidth / 2);
var uWalkOuter = uniform3(0).onFrameUpdate(() => params.roadWidth / 2 + params.sidewalkWidth);
var uDashLength = uniform3(0).onFrameUpdate(() => params.dashLength);
var uCenterLineHalf = uniform3(0).onFrameUpdate(() => params.centerLineWidth / 2);
var uCrosswalkWidth = uniform3(0).onFrameUpdate(() => params.crosswalkWidth);
var uCrosswalkOffset = uniform3(0).onFrameUpdate(() => params.crosswalkOffset);
var uZebraPitch = uniform3(0).onFrameUpdate(() => params.zebraPitch);
var uTileFrequency = uniform3(0).onFrameUpdate(() => params.tileFrequency);
var uGridIntensity = uniform3(0).onFrameUpdate(() => params.gridIntensity);
var uGridLineWidth = uniform3(0).onFrameUpdate(() => params.gridLineWidth);
var EDGE_AA = 0.06;
var groundAbsX = positionWorld2.x.abs();
var groundAbsZ = positionWorld2.z.abs();
var roadAlongZ = groundAbsX.smoothstep(uRoadHalf.sub(EDGE_AA), uRoadHalf).oneMinus();
var roadAlongX = groundAbsZ.smoothstep(uRoadHalf.sub(EDGE_AA), uRoadHalf).oneMinus();
var roadMask = max(roadAlongZ, roadAlongX);
var walkBandX = groundAbsX.smoothstep(uWalkOuter.sub(EDGE_AA), uWalkOuter).oneMinus();
var walkBandZ = groundAbsZ.smoothstep(uWalkOuter.sub(EDGE_AA), uWalkOuter).oneMinus();
var sidewalkMask = max(walkBandX, walkBandZ).mul(roadMask.oneMinus());
var tileCell = positionWorld2.xz.mul(uTileFrequency);
var tileUv = tileCell.fract();
var tileEdge = min(min(tileUv.x, tileUv.x.oneMinus()), min(tileUv.y, tileUv.y.oneMinus()));
var tileFactor = tileEdge.smoothstep(0, uGridLineWidth).oneMinus().mul(uGridIntensity).oneMinus();
var intersectionMask = roadAlongZ.mul(roadAlongX);
var dashAlongZ = positionWorld2.z.div(uDashLength).fract().smoothstep(0.48, 0.52).oneMinus();
var dashAlongX = positionWorld2.x.div(uDashLength).fract().smoothstep(0.48, 0.52).oneMinus();
var centerLineZ = groundAbsX.smoothstep(uCenterLineHalf, uCenterLineHalf.add(EDGE_AA)).oneMinus();
var centerLineX = groundAbsZ.smoothstep(uCenterLineHalf, uCenterLineHalf.add(EDGE_AA)).oneMinus();
var centerLines = max(centerLineZ.mul(dashAlongZ).mul(roadAlongZ), centerLineX.mul(dashAlongX).mul(roadAlongX));
var crossStart = uRoadHalf.add(uCrosswalkOffset);
var crossEnd = crossStart.add(uCrosswalkWidth);
var crossBandZ = groundAbsZ.smoothstep(crossStart.sub(EDGE_AA), crossStart).mul(groundAbsZ.smoothstep(crossEnd, crossEnd.add(EDGE_AA)).oneMinus());
var crossBandX = groundAbsX.smoothstep(crossStart.sub(EDGE_AA), crossStart).mul(groundAbsX.smoothstep(crossEnd, crossEnd.add(EDGE_AA)).oneMinus());
var zebraCenterDistZ = positionWorld2.x.div(uZebraPitch).add(0.5).fract().sub(0.5).abs();
var zebraCenterDistX = positionWorld2.z.div(uZebraPitch).add(0.5).fract().sub(0.5).abs();
var zebraBarOuter = uZebraPitch.mul(0.3);
var zebraNearestCenterZ = positionWorld2.x.div(uZebraPitch).round().abs().mul(uZebraPitch);
var zebraNearestCenterX = positionWorld2.z.div(uZebraPitch).round().abs().mul(uZebraPitch);
var zebraFitZ = zebraNearestCenterZ.add(zebraBarOuter).step(uRoadHalf.sub(EDGE_AA)).oneMinus();
var zebraFitX = zebraNearestCenterX.add(zebraBarOuter).step(uRoadHalf.sub(EDGE_AA)).oneMinus();
var zebraBarsZ = zebraCenterDistZ.smoothstep(0.2, 0.3).oneMinus().mul(zebraFitZ);
var zebraBarsX = zebraCenterDistX.smoothstep(0.2, 0.3).oneMinus().mul(zebraFitX);
var crosswalks = max(roadAlongZ.mul(crossBandZ).mul(zebraBarsZ), roadAlongX.mul(crossBandX).mul(zebraBarsX));
var paintMask = max(centerLines, crosswalks).mul(intersectionMask.oneMinus()).mul(uMarkingIntensity);
var roadSurface = mix2(uAsphaltColor, uMarkingColor, paintMask);
var pavement = mix2(uBlockColor.mul(tileFactor), uSidewalkColor.mul(tileFactor), sidewalkMask);
var groundTopColor = mix2(pavement, roadSurface, roadMask);
var shaftNoise = new BakedNoise3D({ size: params.shaftNoiseTexSize, period: params.shaftNoiseTile });
function applyNoiseTexture() {
  shaftNoise.setTexture(params.shaftNoiseTexSize, params.shaftNoiseTile);
  groundMaterial.needsUpdate = true;
  shaftMaterial.needsUpdate = true;
}
var uShaftRockColorA = uniform3(new THREE5.Color()).onFrameUpdate(
  () => uShaftRockColorA.value.set(params.shaftRockColorA)
);
var uShaftRockColorB = uniform3(new THREE5.Color()).onFrameUpdate(
  () => uShaftRockColorB.value.set(params.shaftRockColorB)
);
var uShaftRockFrequency = uniform3(0).onFrameUpdate(() => params.shaftRockFrequency);
var uShaftStrataFrequency = uniform3(0).onFrameUpdate(() => params.shaftStrataFrequency);
var uShaftStrataWarp = uniform3(0).onFrameUpdate(() => params.shaftStrataWarp);
var uShaftCrevice = uniform3(0).onFrameUpdate(() => params.shaftCreviceIntensity);
var uShaftDepth = uniform3(0).onFrameUpdate(() => params.holeDepth);
var uHoleCenter = uniform3(new THREE5.Vector3());
function shaftRockColor(localPos) {
  const rockNoise = shaftNoise.fbm(localPos.mul(uShaftRockFrequency), 0.55);
  const strataPhase = localPos.y.mul(uShaftStrataFrequency).add(rockNoise.mul(uShaftStrataWarp)).fract();
  const strataBand = strataPhase.smoothstep(0, 0.45).mul(strataPhase.smoothstep(0.55, 1).oneMinus());
  const creviceShade = rockNoise.abs().oneMinus().pow(3).mul(uShaftCrevice);
  return mix2(uShaftRockColorA, uShaftRockColorB, strataBand).mul(creviceShade.oneMinus());
}
var rockColor = shaftRockColor(positionWorld2.sub(uHoleCenter));
var shaftDepthFade = positionWorld2.y.negate().div(uShaftDepth).clamp(0, 1).pow(0.8);
var shaftRock = mix2(rockColor, uShaftColor, shaftDepthFade);
var flatRock = mix2(uShaftRockColorA, uShaftRockColorB, 0.5);
var shaftRockFlat = mix2(flatRock, uShaftColor, shaftDepthFade);
var groundMaterial = new THREE5.MeshStandardNodeMaterial({ roughness: params.groundRoughness });
var groundSideMask = normalWorld.y.smoothstep(0.4, 0.8);
var groundColorNoisy = mix2(shaftRock, groundTopColor, groundSideMask);
var groundColorFlat = mix2(shaftRockFlat, groundTopColor, groundSideMask);
var unitBoxGeometry = new THREE5.BoxGeometry(1, 1, 1);
var unitBoxEdges = new THREE5.EdgesGeometry(unitBoxGeometry);
var unitCylinderEdges = new THREE5.EdgesGeometry(new THREE5.CylinderGeometry(0.5, 0.5, 1, 16));
var unitSphereEdges = new THREE5.EdgesGeometry(new THREE5.SphereGeometry(0.5, 16, 8));
var colliderWireframeMaterial = new THREE5.LineBasicMaterial({
  color: "#00ff88",
  depthTest: false
});
var colliderWireframes = [];
var GROUND_ORDER = 1e5;
var WIREFRAME_ORDER = 2e5;
function makeColliderLines(geometry) {
  const lines = new THREE5.LineSegments(geometry, colliderWireframeMaterial);
  lines.renderOrder = WIREFRAME_ORDER;
  return lines;
}
function addColliderWireframe(mesh) {
  const lines = makeColliderLines(unitBoxEdges);
  lines.visible = false;
  mesh.add(lines);
  colliderWireframes.push(lines);
}
var slabMeshes = [];
for (let i = 0; i < 4; i++) {
  const mesh = new THREE5.Mesh(unitBoxGeometry, groundMaterial);
  mesh.receiveShadow = true;
  mesh.renderOrder = GROUND_ORDER;
  addColliderWireframe(mesh);
  scene.add(mesh);
  slabMeshes.push(mesh);
}
var voidMesh = new THREE5.Mesh(
  new THREE5.PlaneGeometry(SLAB_REACH * 4, SLAB_REACH * 4),
  new THREE5.MeshBasicMaterial({ color: params.voidColor })
);
voidMesh.rotation.x = -Math.PI / 2;
voidMesh.renderOrder = GROUND_ORDER + 2;
scene.add(voidMesh);
var uShaftRadius = uniform3(1);
var uShaftVisualDepth = uniform3(0).onFrameUpdate(() => params.shaftVisualDepth);
var uShaftFadeDepth = uniform3(0).onFrameUpdate(() => {
  const t = (uShaftRadius.value - params.holeSize) / (params.holeSizeMax - params.holeSize);
  return THREE5.MathUtils.lerp(params.shaftFadeDepthMin, params.shaftFadeDepthMax, THREE5.MathUtils.clamp(t, 0, 1));
});
var uShaftDisplacementAmplitude = uniform3(0).onFrameUpdate(() => params.shaftDisplacementAmplitude);
var uShaftDisplacementFrequency = uniform3(0).onFrameUpdate(() => params.shaftDisplacementFrequency);
var shaftMeterPos = vec32(
  positionLocal.x.mul(uShaftRadius),
  positionLocal.y.sub(0.5).mul(uShaftVisualDepth),
  positionLocal.z.mul(uShaftRadius)
);
var shaftDepthBelow = shaftMeterPos.y.negate();
var shaftBump = shaftNoise.fbm(shaftMeterPos.mul(uShaftDisplacementFrequency), 0.5).mul(0.5).add(0.5).clamp(0, 1);
var shaftRimFade = shaftDepthBelow.smoothstep(0, 1.2);
var shaftDispMeters = shaftBump.mul(uShaftDisplacementAmplitude).mul(shaftRimFade);
var shaftMaterial = new THREE5.MeshStandardNodeMaterial({
  roughness: 1,
  side: THREE5.BackSide
});
shaftMaterial.shadowSide = THREE5.DoubleSide;
var shaftDHdxy = vec2(shaftDispMeters.dFdx(), shaftDispMeters.dFdy());
var shaftSigmaX = positionView.dFdx().normalize();
var shaftSigmaY = positionView.dFdy().normalize();
var shaftR1 = shaftSigmaY.cross(normalView);
var shaftR2 = normalView.cross(shaftSigmaX);
var shaftDet = shaftSigmaX.dot(shaftR1).mul(faceDirection);
var shaftGrad = shaftDet.sign().mul(shaftDHdxy.x.mul(shaftR1).add(shaftDHdxy.y.mul(shaftR2)));
var shaftNormalNoisy = shaftDet.abs().mul(normalView).sub(shaftGrad).normalize();
var shaftDirt = shaftRockColor(shaftMeterPos).mul(shaftBump.mul(0.5).add(0.6));
var shaftDarkness = shaftDepthBelow.div(uShaftFadeDepth).clamp(0, 1).pow(1.4);
var shaftEndFade = shaftDepthBelow.smoothstep(uShaftFadeDepth, uShaftFadeDepth.mul(2.5)).oneMinus();
var shaftColorNoisy = mix2(shaftDirt, uShaftColor, shaftDarkness).mul(shaftEndFade);
var shaftColorFlat = mix2(flatRock.mul(0.85), uShaftColor, shaftDarkness).mul(shaftEndFade);
var shaftMesh = new THREE5.Mesh(void 0, shaftMaterial);
shaftMesh.castShadow = true;
shaftMesh.receiveShadow = true;
shaftMesh.renderOrder = GROUND_ORDER + 1;
scene.add(shaftMesh);
var shaftGeometryCache = /* @__PURE__ */ new Map();
function rebuildShaftGeometry() {
  const key = params.shaftRadialSegments;
  let geometry = shaftGeometryCache.get(key);
  if (!geometry) {
    geometry = new THREE5.CylinderGeometry(1, 1, 1, params.shaftRadialSegments, 1, true);
    shaftGeometryCache.set(key, geometry);
  }
  shaftMesh.geometry = geometry;
}
rebuildShaftGeometry();
function applyShaftNoise() {
  const noisy = params.shaftNoiseEnabled;
  groundMaterial.colorNode = noisy ? groundColorNoisy : groundColorFlat;
  shaftMaterial.colorNode = noisy ? shaftColorNoisy : shaftColorFlat;
  shaftMaterial.normalNode = noisy ? shaftNormalNoisy : null;
  groundMaterial.needsUpdate = true;
  shaftMaterial.needsUpdate = true;
}
applyShaftNoise();
function applyVoidDepth() {
  voidMesh.position.y = -Math.max(params.holeDepth, params.shaftVisualDepth) - 0.02;
}
var rimMaterial = new THREE5.MeshBasicMaterial({ color: params.rimColor });
var rimMesh = new THREE5.Mesh(void 0, rimMaterial);
rimMesh.rotation.x = -Math.PI / 2;
rimMesh.visible = false;
scene.add(rimMesh);
var rimGeometryCache = /* @__PURE__ */ new Map();
function layoutRim() {
  const ratio = 1 + params.rimThickness / Math.max(holeTargetRadius, params.holeSize);
  const key = ratio.toFixed(4);
  let geometry = rimGeometryCache.get(key);
  if (!geometry) {
    geometry = new THREE5.RingGeometry(1, ratio, 96);
    rimGeometryCache.set(key, geometry);
  }
  rimMesh.geometry = geometry;
}
var slabCenters = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 0 }
];
function computeSlabCenters(x, z) {
  const y = -params.holeDepth / 2;
  const gap = params.holeSizeMax;
  slabCenters[0].x = x;
  slabCenters[0].y = y;
  slabCenters[0].z = z + gap + SLAB_REACH;
  slabCenters[1].x = x;
  slabCenters[1].y = y;
  slabCenters[1].z = z - gap - SLAB_REACH;
  slabCenters[2].x = x + gap + SLAB_REACH;
  slabCenters[2].y = y;
  slabCenters[2].z = 0;
  slabCenters[3].x = x - gap - SLAB_REACH;
  slabCenters[3].y = y;
  slabCenters[3].z = 0;
  return slabCenters;
}
var slabBodies = [];
var segmentBodies = [];
var segmentMeshes = [];
var segmentData = [];
var segmentRadialHalf = 0;
var segmentScratch = { x: 0, y: 0, z: 0 };
function ensureSegmentMeshes(n) {
  while (segmentMeshes.length < n) {
    const mesh = new THREE5.Mesh(unitBoxGeometry, groundMaterial);
    mesh.receiveShadow = true;
    mesh.renderOrder = GROUND_ORDER;
    addColliderWireframe(mesh);
    scene.add(mesh);
    segmentMeshes.push(mesh);
  }
  while (segmentMeshes.length > n) {
    const mesh = segmentMeshes.pop();
    scene.remove(mesh);
    colliderWireframes.splice(colliderWireframes.indexOf(mesh.children[0]), 1);
  }
  applyShowColliders();
}
function rebuildHole() {
  for (const body of slabBodies) b3.b3DestroyBody(body);
  for (const body of segmentBodies) b3.b3DestroyBody(body);
  slabBodies = [];
  segmentBodies = [];
  const depth = params.holeDepth;
  const gap = params.holeSizeMax;
  const halfExtents = [
    [gap, depth / 2, SLAB_REACH],
    [gap, depth / 2, SLAB_REACH],
    [SLAB_REACH, depth / 2, SLAB_REACH],
    [SLAB_REACH, depth / 2, SLAB_REACH]
  ];
  const centers = computeSlabCenters(holeX, holeZ);
  for (let i = 0; i < 4; i++) {
    const bodyDef = b3.b3DefaultBodyDef();
    bodyDef.type = b3.b3BodyType.b3_kinematicBody;
    bodyDef.position = centers[i];
    const body = b3.b3CreateBody(world, bodyDef);
    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.baseMaterial.friction = params.groundFriction;
    b3.b3CreateBoxShape(body, shapeDef, halfExtents[i][0], halfExtents[i][1], halfExtents[i][2]);
    slabBodies.push(body);
    slabMeshes[i].scale.set(halfExtents[i][0] * 2, depth, halfExtents[i][2] * 2);
  }
  const n = params.holeSegments;
  ensureSegmentMeshes(n);
  const radial = gap * Math.SQRT2 + 0.5;
  const tangential = 2 * (gap * Math.SQRT2 + 1) * Math.tan(Math.PI / n) * 1.25;
  segmentRadialHalf = radial / 2;
  segmentData = [];
  for (let i = 0; i < n; i++) {
    const theta = i / n * Math.PI * 2;
    const segment = {
      cos: Math.cos(theta),
      sin: Math.sin(theta),
      // yaw of -theta points the box's local +x radially outward
      quat: { v: { x: 0, y: Math.sin(-theta / 2), z: 0 }, s: Math.cos(-theta / 2) }
    };
    segmentData.push(segment);
    const mid = holeRadius + segmentRadialHalf;
    const bodyDef = b3.b3DefaultBodyDef();
    bodyDef.type = b3.b3BodyType.b3_kinematicBody;
    bodyDef.position = { x: holeX + segment.cos * mid, y: -depth / 2, z: holeZ + segment.sin * mid };
    bodyDef.rotation = segment.quat;
    const body = b3.b3CreateBody(world, bodyDef);
    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.baseMaterial.friction = params.groundFriction;
    b3.b3CreateBoxShape(body, shapeDef, radial / 2, depth / 2, tangential / 2);
    segmentBodies.push(body);
    const mesh = segmentMeshes[i];
    mesh.scale.set(radial, depth, tangential);
    mesh.rotation.y = -theta;
  }
  applyVoidDepth();
  layoutRim();
  wakeNearHole();
}
function positionHole() {
  const centers = computeSlabCenters(holeX, holeZ);
  for (let i = 0; i < 4; i++) {
    b3.b3Body_SetTransform(slabBodies[i], centers[i], IDENTITY_QUAT);
  }
  const mid = holeRadius + segmentRadialHalf;
  const y = -params.holeDepth / 2;
  for (let i = 0; i < segmentBodies.length; i++) {
    const segment = segmentData[i];
    segmentScratch.x = holeX + segment.cos * mid;
    segmentScratch.y = y;
    segmentScratch.z = holeZ + segment.sin * mid;
    b3.b3Body_SetTransform(segmentBodies[i], segmentScratch, segment.quat);
  }
}
function updateHoleVisuals(alpha) {
  const x = THREE5.MathUtils.lerp(holePrevX, holeX, alpha);
  const z = THREE5.MathUtils.lerp(holePrevZ, holeZ, alpha);
  const r = THREE5.MathUtils.lerp(holePrevRadius, holeRadius, alpha);
  holeViewX = x;
  holeViewZ = z;
  holeViewRadius = r;
  zoomViewRadius = THREE5.MathUtils.lerp(zoomPrevRadius, zoomRadius, alpha);
  const centers = computeSlabCenters(x, z);
  for (let i = 0; i < 4; i++) {
    slabMeshes[i].position.set(centers[i].x, centers[i].y, centers[i].z);
  }
  const mid = r + segmentRadialHalf;
  const y = -params.holeDepth / 2 - 1e-3;
  for (let i = 0; i < segmentMeshes.length; i++) {
    const segment = segmentData[i];
    segmentMeshes[i].position.set(x + segment.cos * mid, y, z + segment.sin * mid);
  }
  rimMesh.position.set(x, 0.02, z);
  rimMesh.scale.setScalar(r);
  uHoleCenter.value.set(x, 0, z);
  sightCutout.uRadius.value = r * params.cutoutScale + params.cutoutPadding;
  sightCutout.uEnabled.value = params.cutoutEnabled && started ? 1 : 0;
  for (const model of models) {
    if (!model.cutout) continue;
    const swallowRadius = model.cutout.footprintRadius * params.globalScale * params.cutoutSwallowScale;
    model.cutout.uGate.value = 1 - THREE5.MathUtils.smoothstep(r, swallowRadius * 0.85, swallowRadius);
  }
  const shaftR = r * 0.995;
  shaftMesh.position.set(x, -params.shaftVisualDepth / 2, z);
  shaftMesh.scale.set(shaftR, params.shaftVisualDepth, shaftR);
  uShaftRadius.value = shaftR;
}
var wallMaterial = new THREE5.MeshStandardMaterial({
  color: params.wallColor,
  roughness: params.wallRoughness
});
var wallMeshes = [];
for (let i = 0; i < 4; i++) {
  const mesh = new THREE5.Mesh(unitBoxGeometry, wallMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addColliderWireframe(mesh);
  scene.add(mesh);
  wallMeshes.push(mesh);
}
var boundsMaterial = new THREE5.MeshBasicMaterial({
  color: params.boundsColor,
  transparent: true,
  opacity: params.boundsOpacity
});
var boundsMeshes = [];
for (let i = 0; i < 4; i++) {
  const mesh = new THREE5.Mesh(unitBoxGeometry, boundsMaterial);
  scene.add(mesh);
  boundsMeshes.push(mesh);
}
function layoutBounds() {
  const a = params.arenaHalf;
  const t = params.boundsThickness;
  const layout = [
    [0, a, a * 2 + t, t],
    [0, -a, a * 2 + t, t],
    [a, 0, t, a * 2 + t],
    [-a, 0, t, a * 2 + t]
  ];
  for (let i = 0; i < 4; i++) {
    const [x, z, sizeX, sizeZ] = layout[i];
    boundsMeshes[i].scale.set(sizeX, 0.02, sizeZ);
    boundsMeshes[i].position.set(x, 0.011, z);
    boundsMeshes[i].visible = params.showBounds && !params.walls;
  }
}
var wallBodies = [];
function rebuildWalls() {
  for (const body of wallBodies) b3.b3DestroyBody(body);
  wallBodies = [];
  for (const mesh of wallMeshes) mesh.visible = params.walls;
  layoutBounds();
  if (!params.walls) return;
  const a = params.arenaHalf;
  const t = params.wallThickness;
  const h = params.wallHeight;
  const sides = [
    [0, a + t / 2, a * 2 + t * 2, t],
    [0, -a - t / 2, a * 2 + t * 2, t],
    [a + t / 2, 0, t, a * 2],
    [-a - t / 2, 0, t, a * 2]
  ];
  for (let i = 0; i < 4; i++) {
    const [x, z, sizeX, sizeZ] = sides[i];
    const bodyDef = b3.b3DefaultBodyDef();
    bodyDef.position = { x, y: h / 2, z };
    const body = b3.b3CreateBody(world, bodyDef);
    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.baseMaterial.friction = params.wallFriction;
    b3.b3CreateBoxShape(body, shapeDef, sizeX / 2, h / 2, sizeZ / 2);
    wallBodies.push(body);
    wallMeshes[i].scale.set(sizeX, h, sizeZ);
    wallMeshes[i].position.set(x, h / 2, z);
  }
}
var boundaryBodies = [];
function rebuildBoundaryPlanes() {
  for (const body of boundaryBodies) b3.b3DestroyBody(body);
  boundaryBodies = [];
  if (!params.boundaryPlanes) return;
  const a = params.arenaHalf;
  const t = 1;
  const h = 100;
  const sides = [
    [0, a + t, a + 2 * t, t],
    [0, -a - t, a + 2 * t, t],
    [a + t, 0, t, a + 2 * t],
    [-a - t, 0, t, a + 2 * t]
  ];
  for (const [x, z, hx, hz] of sides) {
    const bodyDef = b3.b3DefaultBodyDef();
    bodyDef.position = { x, y: h / 2 - 20, z };
    const body = b3.b3CreateBody(world, bodyDef);
    const shapeDef = b3.b3DefaultShapeDef();
    shapeDef.baseMaterial.friction = params.wallFriction;
    b3.b3CreateBoxShape(body, shapeDef, hx, h / 2, hz);
    boundaryBodies.push(body);
  }
}
var startStyle = document.createElement("style");
startStyle.textContent = `
  #start-overlay {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 52px 24px calc(44px + env(safe-area-inset-bottom, 0px));
    color: #fff;
    font-family: system-ui, sans-serif;
    text-align: center;
    pointer-events: none;
    user-select: none;
    background: transparent;
    transition: opacity 0.45s ease, background-color 0.45s ease;
  }
  /* loading: opaque black backdrop hides the not-yet-rendered canvas, the
     spinner stands in for the START button until the models are ready */
  #start-overlay.loading {
    background: black;
  }
  #start-overlay.loading #start-button {
    display: none;
  }
  #start-overlay:not(.loading) #loading-center {
    display: none;
  }
  #loading-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
  }
  #loading-label {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 1.5px;
    opacity: 0.85;
  }
  #start-spinner {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: 4px solid color-mix(in srgb, var(--hud-accent, #ffc83c) 22%, transparent);
    border-top-color: var(--hud-accent, #ffc83c);
    animation: spinner-turn 0.9s linear infinite;
  }
  @keyframes spinner-turn {
    to {
      transform: rotate(360deg);
    }
  }
  #start-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
  }
  #start-overlay.hidden {
    opacity: 0;
  }
  #start-overlay.hidden #start-button {
    pointer-events: none;
  }
  #start-title {
    --title-hungry: ${params.titleHungryColor};
    --title-manhole: ${params.titleManholeColor};
    --title-outline: ${params.titleOutlineColor};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Luckiest Guy', 'Arial Black', system-ui, sans-serif;
    font-size: clamp(44px, 11vw, 104px);
    line-height: 0.92;
    animation: title-bob 3.8s ease-in-out infinite alternate;
  }
  /* Two stacked layers per word: the element itself draws a fat centered
     stroke + extrusion shadows, the ::after redraws the same glyphs with a
     gradient fill clipped to the text \u2014 net effect is a gradient fill with a
     half-stroke-width outer outline, which plain text-stroke can't do. */
  .title-word {
    position: relative;
    white-space: nowrap;
    color: var(--title-outline);
    -webkit-text-stroke: 0.14em var(--title-outline);
    text-shadow:
      0 0.05em 0 color-mix(in srgb, var(--title-outline) 72%, black),
      0 0.1em 0 color-mix(in srgb, var(--title-outline) 45%, black),
      0 0.18em 0.24em rgba(0, 0, 0, 0.5);
    animation: title-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  }
  .title-word::after {
    content: attr(data-text);
    position: absolute;
    /* background-clip: text only paints inside the box, and the tight
       line-height lets cap ink overflow the line box \u2014 the negative offset +
       equal padding grows the paint box without moving the glyphs */
    top: -0.16em;
    left: -0.16em;
    padding: 0.16em;
    -webkit-text-stroke: 0;
    text-shadow: none;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--word-color) 45%, white) 19%,
      var(--word-color) 54%,
      color-mix(in srgb, var(--word-color) 55%, black) 84%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  /* wide-tracked small word locked over the big one, classic logo stack;
     negative right margin cancels the trailing letter-spacing gap so the
     glyph run stays optically centered */
  .title-word:nth-child(1) {
    --word-color: var(--title-hungry);
    font-size: 0.55em;
    letter-spacing: 0.34em;
    margin-right: -0.34em;
    animation-delay: 0.05s;
  }
  .title-word:nth-child(2) {
    --word-color: var(--title-manhole);
    letter-spacing: 0.04em;
    margin-right: -0.04em;
    animation-delay: 0.16s;
  }
  @keyframes title-bob {
    from {
      transform: rotate(-3deg) translateY(0);
    }
    to {
      transform: rotate(-1deg) translateY(-0.1em);
    }
  }
  @keyframes title-pop {
    from {
      transform: scale(0) rotate(-6deg);
    }
    to {
      transform: scale(1) rotate(0deg);
    }
  }
  #start-button,
  #next-level-button {
    pointer-events: auto;
    cursor: pointer;
    padding: 18px 68px;
    border-radius: 44px;
    border: 3px solid rgba(255, 255, 255, 0.85);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--hud-accent, #ffc83c) 65%, white),
      var(--hud-accent, #ffc83c) 55%,
      color-mix(in srgb, var(--hud-accent, #ffc83c) 80%, black)
    );
    color: #241c10;
    font-family: inherit;
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 5px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
    transition: transform 0.15s ease;
  }
  #start-button:hover:enabled,
  #next-level-button:hover:enabled {
    transform: scale(1.07);
  }
  #start-button:disabled {
    cursor: default;
    opacity: 0.75;
  }
  #start-hint {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 1.5px;
    opacity: 0.85;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  }
`;
document.head.appendChild(startStyle);
var startOverlay = document.createElement("div");
startOverlay.id = "start-overlay";
startOverlay.classList.add("loading");
var startTitle = document.createElement("div");
startTitle.id = "start-title";
for (const word of ["HUNGRY", "MANHOLE"]) {
  const wordEl = document.createElement("span");
  wordEl.className = "title-word";
  wordEl.dataset.text = word;
  wordEl.textContent = word;
  startTitle.appendChild(wordEl);
}
var startButton = document.createElement("button");
startButton.id = "start-button";
startButton.textContent = "START";
startButton.disabled = true;
var startHint = document.createElement("div");
startHint.id = "start-hint";
startHint.textContent = "WASD to move \u2014 swallow the whole city";
var startBottom = document.createElement("div");
startBottom.id = "start-bottom";
startBottom.append(startButton, startHint);
var loadingCenter = document.createElement("div");
loadingCenter.id = "loading-center";
var startSpinner = document.createElement("div");
startSpinner.id = "start-spinner";
var loadingLabel = document.createElement("div");
loadingLabel.id = "loading-label";
loadingLabel.textContent = "Loading assets...";
loadingCenter.append(startSpinner, loadingLabel);
startOverlay.append(startTitle, loadingCenter, startBottom);
(document.getElementById("root") ?? document.body).appendChild(startOverlay);
var sightCutout = new SightConeCutout(renderer, {
  target: uHoleCenter,
  feather: () => params.cutoutFeather,
  opacity: () => params.cutoutOpacity,
  release: () => params.cutoutRelease
});
var propDissolving = new Uint8Array(MAX_PROPS);
function updateCutoutCone() {
  propDissolving.fill(0);
  if (!params.cutoutEnabled || !started) return;
  sightCutout.updateCone(camera.position, holeViewX, 0, holeViewZ, sightCutout.uRadius.value + params.cutoutFeather);
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i]) continue;
    const cutout = models[propModels[i]].cutout;
    if (!cutout || cutout.uGate.value === 0) continue;
    const o = i * 7;
    if (sightCutout.sphereMeetsCone(propCurr[o], propCurr[o + 1], propCurr[o + 2], propSphereRadii[i])) {
      propDissolving[i] = 1;
    }
  }
}
var MODEL_DEFS = [
  { key: "manhole", collider: "cylinder", height: 0.3, capacity: 4, points: 0 },
  // the cover is a freebie — no score, no growth
  { key: "fruit-crate", collider: "box", height: 0.76, capacity: 512, points: 1 },
  { key: "cardboard-box", collider: "box", height: 0.66, capacity: 512, points: 1 },
  { key: "crate", collider: "box", height: 1.5, capacity: 512, points: 2 },
  { key: "fire-hydrant", collider: "cylinder", colliderXZ: 0.8, height: 0.85, capacity: 16, points: 1 },
  {
    key: "bench",
    collider: "boxes",
    height: 1.3,
    capacity: 24,
    points: 2,
    boxes: [
      { min: [0, 0, 0.12], max: [0.05, 0.3, 0.3] },
      // legs
      { min: [0.95, 0, 0.12], max: [1, 0.3, 0.3] },
      { min: [0, 0, 0.73], max: [0.05, 0.3, 0.93] },
      { min: [0.95, 0, 0.73], max: [1, 0.3, 0.93] },
      { min: [0, 0.3, 0.21], max: [1, 0.72, 1] },
      // seat
      { min: [0, 0.7, 0], max: [1, 1, 0.33] }
      // backrest
    ]
  },
  {
    key: "taxi",
    collider: "vehicle",
    height: 1.5,
    capacity: 16,
    points: 5,
    wheels: { radius: 0.19, width: 0.12, track: 0.36, axles: [0.33, -0.23] }
  },
  {
    key: "white-van",
    collider: "vehicle",
    height: 2,
    capacity: 16,
    points: 6,
    wheels: { radius: 0.145, width: 0.1, track: 0.36, axles: [0.34, -0.27] }
  },
  {
    key: "garbage-truck",
    collider: "vehicle",
    height: 3.2,
    yawAlign: Math.PI,
    // modeled nose-toward -Z — flip so it drives cab first
    capacity: 8,
    points: 10,
    wheels: { radius: 0.145, width: 0.16, track: 0.34, axles: [-0.33, 0.1, 0.24] }
  },
  {
    key: "double-decker-bus",
    collider: "vehicle",
    height: 4.4,
    capacity: 8,
    points: 12,
    wheels: { radius: 0.14, width: 0.12, track: 0.35, axles: [0.29, -0.2] }
  },
  {
    key: "tree",
    collider: "tree",
    height: 4.5,
    capacity: 32,
    points: 6,
    trunk: { radius: 0.05, top: 0.44 },
    canopy: { centerY: 0.7, radius: 0.37 }
  },
  { key: "building-3", collider: "box", height: 26, capacity: 16, points: 50, cutout: true, occluder: true },
  {
    key: "building-5",
    collider: "box",
    height: 15,
    capacity: 16,
    points: 30,
    cutout: true,
    occluder: true,
    occluderBox: { min: [0.2, 0, 0.2], max: [0.8, 1, 0.8] }
    // set-back tower on a wider podium
  },
  {
    key: "building-6",
    collider: "box",
    height: 23,
    capacity: 16,
    points: 40,
    cutout: true,
    occluder: true,
    occluderBox: { min: [0.05, 0, 0.08], max: [0.95, 0.8, 0.92] }
    // y-capped below the tapered top
  }
];
var MODEL = {};
MODEL_DEFS.forEach((def, i) => {
  MODEL[def.key] = i;
});
var BUILDING_KEYS = ["building-3", "building-5", "building-6"];
for (const def of MODEL_DEFS) {
  params[`size_${def.key}`] = def.height;
  params[`points_${def.key}`] = def.points;
}
var HUMAN_DEFS = [
  { key: "human-man", height: 1.78, detail: 6 },
  { key: "human-woman", height: 1.66, detail: 6 },
  { key: "human-kid", height: 1.15, detail: 6 },
  { key: "human-vendor", height: 1.72, detail: 6 },
  { key: "human-worker", height: 1.8, detail: 6 }
];
for (const def of HUMAN_DEFS) {
  params[`size_${def.key}`] = def.height;
  params[`detail_${def.key}`] = def.detail;
}
function processModel(def, gltf) {
  gltf.scene.updateMatrixWorld(true);
  const sourceMeshes = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) sourceMeshes.push(child);
  });
  const bounds = new THREE5.Box3();
  for (const mesh of sourceMeshes) {
    mesh.geometry.applyMatrix4(mesh.matrixWorld);
    mesh.geometry.computeBoundingBox();
    bounds.union(mesh.geometry.boundingBox);
  }
  const extents = bounds.getSize(new THREE5.Vector3());
  if (simplifier) simplifyModel(def, sourceMeshes, extents);
  const lods = simplifier && params.lodEnabled ? buildModelLods(def, sourceMeshes) : [{ geometries: sourceMeshes.map((mesh) => mesh.geometry), error: 0 }];
  const center = bounds.getCenter(new THREE5.Vector3());
  const normalize = new THREE5.Matrix4().makeScale(1 / extents.x, 1 / extents.y, 1 / extents.z).multiply(new THREE5.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  const unitSize = extents.clone().divideScalar(extents.y);
  const baseSize = unitSize.clone().multiplyScalar(params[`size_${def.key}`]);
  const cutout = def.cutout ? {
    uGate: uniform3(1),
    footprintRadius: def.cutoutFootprint ?? Math.hypot(baseSize.x, baseSize.z) / 2
  } : null;
  sourceMeshes.forEach((mesh, m) => {
    mesh.geometry.applyMatrix4(normalize);
    mesh.geometry.computeBoundingSphere();
    for (const level of lods) {
      const geometry = level.geometries[m];
      if (geometry !== mesh.geometry) geometry.boundingSphere = mesh.geometry.boundingSphere;
    }
  });
  const buckets = [];
  const bucketFor = [[], []];
  const makeBucket = (lod, dissolving) => {
    const meshes = lods[lod].geometries.map((geometry, m) => {
      const material = dissolving ? sightCutout.materialFor(sourceMeshes[m].material, cutout.uGate) : sourceMeshes[m].material;
      const instanced = new THREE5.InstancedMesh(geometry, material, def.capacity);
      instanced.instanceMatrix.setUsage(THREE5.DynamicDrawUsage);
      instanced.castShadow = true;
      instanced.receiveShadow = true;
      instanced.frustumCulled = false;
      instanced.count = 0;
      scene.add(instanced);
      return instanced;
    });
    const bucket = {
      lod,
      dissolving,
      meshes,
      trisPerInstance: meshes.reduce((sum, mesh) => sum + mesh.geometry.index.count / 3, 0),
      // per-frame scratch for the culled + depth-sorted instance list
      indices: new Uint16Array(def.capacity),
      depths: new Float32Array(def.capacity),
      count: 0
    };
    buckets.push(bucket);
    return bucket;
  };
  for (let lod = 0; lod < lods.length; lod++) {
    bucketFor[0][lod] = makeBucket(lod, false);
    if (cutout) {
      bucketFor[1][lod] = lod > 0 && lod === lods.length - 1 ? bucketFor[1][lod - 1] : makeBucket(lod, true);
    }
  }
  return { def, lods, buckets, bucketFor, baseSize, unitSize, cutout };
}
function processHuman(def, gltf) {
  gltf.scene.updateMatrixWorld(true);
  const rawHeight = new THREE5.Box3().setFromObject(gltf.scene).getSize(new THREE5.Vector3()).y;
  const materials = [];
  gltf.scene.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    child.material.side = THREE5.FrontSide;
    child.material.metalness = 0;
    child.material.emissiveIntensity = params.pedestrianEmissive;
    materials.push(child.material);
    if (simplifier && child.geometry.index) {
      const geometry = child.geometry;
      const totalTris = geometry.index.count / 3;
      const detail = params[`detail_${def.key}`] ?? 1;
      const budget = Math.max(params.modelTrisPerMeter * params[`size_${def.key}`] * detail, params.modelTrisMin);
      if (params.modelTrisPerMeter > 0 && budget < totalTris) {
        const budgeted = simplifyGeometryIndex(simplifier, geometry, budget, params.modelSimplifyError, simplifyFlags());
        geometry.setIndex(new THREE5.BufferAttribute(budgeted.indices, 1));
        simplifyLog.push({
          model: def.key,
          meters: +params[`size_${def.key}`].toFixed(1),
          before: Math.round(totalTris),
          after: budgeted.indices.length / 3
        });
      }
    }
  });
  const clips = {};
  for (const clip of gltf.animations) clips[clip.name.toLowerCase()] = clip;
  return { def, scene: gltf.scene, clips, rawHeight, materials };
}
var dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
var gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
var simplifier = params.modelSimplifyRatio < 1 || params.modelTrisPerMeter > 0 || params.lodEnabled ? MeshoptSimplifier : null;
if (simplifier) await simplifier.ready;
var simplifyFlags = () => params.modelSimplifyLockBorder ? ["LockBorder"] : [];
var simplifyLog = [];
function simplifyModel(def, sourceMeshes, extents) {
  let totalTris = 0;
  for (const mesh of sourceMeshes) totalTris += (mesh.geometry.index?.count ?? 0) / 3;
  if (totalTris === 0) return;
  const worldMax = params[`size_${def.key}`] / extents.y * Math.max(extents.x, extents.y, extents.z);
  let target = totalTris * params.modelSimplifyRatio;
  if (params.modelTrisPerMeter > 0) {
    const detail = params[`detail_${def.key}`] ?? 1;
    const budget = Math.max(params.modelTrisPerMeter * worldMax * detail, params.modelTrisMin);
    target = Math.min(target, budget);
  }
  const ratio = Math.min(target / totalTris, 1);
  if (ratio < 1) {
    for (const mesh of sourceMeshes) {
      if (!mesh.geometry.index) continue;
      const budgeted = simplifyGeometryIndex(
        simplifier,
        mesh.geometry,
        mesh.geometry.index.count / 3 * ratio,
        params.modelSimplifyError,
        simplifyFlags()
      );
      mesh.geometry.setIndex(new THREE5.BufferAttribute(budgeted.indices, 1));
    }
  }
  simplifyLog.push({
    model: def.key,
    meters: +worldMax.toFixed(1),
    before: Math.round(totalTris),
    after: Math.round(totalTris * ratio)
  });
}
function buildModelLods(def, sourceMeshes) {
  const lods = buildLodChain(
    simplifier,
    sourceMeshes.map((mesh) => mesh.geometry),
    [
      { ratio: params.lodRatio1, error: params.lodError1 },
      { ratio: params.lodRatio2, error: params.lodError2 }
    ],
    { trisMin: params.lodTrisMin, detail: params[`lodDetail_${def.key}`] ?? 1, flags: simplifyFlags() }
  );
  const row = simplifyLog.find((entry) => entry.model === def.key);
  if (row) {
    for (let level = 1; level < lods.length; level++) {
      let tris = 0;
      for (const geometry of lods[level].geometries) tris += geometry.index.count / 3;
      row[`lod${level}`] = Math.round(tris);
      row[`err${level}`] = +lods[level].error.toFixed(3);
    }
  }
  return lods;
}
var [models, humans] = await Promise.all([
  Promise.all(
    MODEL_DEFS.map(async (def) => processModel(def, await gltfLoader.loadAsync(ASSETS.models[def.key])))
  ),
  Promise.all(
    HUMAN_DEFS.map(async (def) => processHuman(def, await gltfLoader.loadAsync(ASSETS.models[def.key])))
  )
]);
dracoLoader.dispose();
{
  const lodTotals = [0, 0, 0];
  for (const model of models) {
    model.lods.forEach((level, l) => {
      for (const geometry of level.geometries)
        lodTotals[l] += (geometry.index ?? geometry.attributes.position).count / 3;
    });
  }
  const lodNote = lodTotals[1] ? ` \xB7 LOD1 ${Math.round(lodTotals[1]).toLocaleString()} \xB7 LOD2 ${Math.round(lodTotals[2]).toLocaleString()}` : "";
  console.log(
    `[models] ${Math.round(lodTotals[0]).toLocaleString()} tris across ${models.length} models${lodNote}`
  );
  if (simplifyLog.length) console.table(simplifyLog);
}
function applyPropSizes() {
  for (const model of models) {
    model.baseSize.copy(model.unitSize).multiplyScalar(params[`size_${model.def.key}`]);
    if (model.cutout) {
      model.cutout.footprintRadius = model.def.cutoutFootprint ?? Math.hypot(model.baseSize.x, model.baseSize.z) / 2;
    }
  }
}
var propBodies = new Array(MAX_PROPS);
var propAlive = new Uint8Array(MAX_PROPS);
var propModels = new Uint8Array(MAX_PROPS);
var propSlots = new Uint16Array(MAX_PROPS);
var propScales = new Float32Array(MAX_PROPS * 3);
var propRadii = new Float32Array(MAX_PROPS);
var propSphereRadii = new Float32Array(MAX_PROPS);
var propPoints = new Uint16Array(MAX_PROPS);
var propMasses = new Float32Array(MAX_PROPS);
var propLastLod = new Uint8Array(MAX_PROPS);
var propCurr = new Float32Array(MAX_PROPS * 7);
var propPrev = new Float32Array(MAX_PROPS * 7);
var typeCounts = new Uint16Array(MODEL_DEFS.length);
var propCount = 0;
var tmpMatrix = new THREE5.Matrix4();
var tmpPosition = new THREE5.Vector3();
var tmpQuaternion = new THREE5.Quaternion();
var tmpQuaternionB = new THREE5.Quaternion();
var tmpScale = new THREE5.Vector3();
var sphereScratch = { center: { x: 0, y: 0, z: 0 }, radius: 0 };
var hullScale = { x: 1, y: 1, z: 1 };
var shapeTransform = { p: { x: 0, y: 0, z: 0 }, q: IDENTITY_QUAT };
var WHEEL_QUAT_AXLE_X = { v: { x: 0, y: 0, z: Math.SQRT1_2 }, s: Math.SQRT1_2 };
var WHEEL_QUAT_AXLE_Z = { v: { x: Math.SQRT1_2, y: 0, z: 0 }, s: Math.SQRT1_2 };
function vehicleLayout(wheels, sx, sy, sz) {
  const radius = wheels.radius * sy;
  const alongX = sx > sz;
  const lateral = alongX ? sz : sx;
  return {
    radius,
    alongX,
    axleY: radius - sy / 2,
    width: wheels.width * lateral,
    track: wheels.track * lateral
  };
}
function createVehicleShapes(body, shapeDef, wheels, sx, sy, sz) {
  const { radius, alongX, axleY, width, track } = vehicleLayout(wheels, sx, sy, sz);
  shapeTransform.p.x = 0;
  shapeTransform.p.y = radius / 2;
  shapeTransform.p.z = 0;
  shapeTransform.q = IDENTITY_QUAT;
  hullScale.x = sx;
  hullScale.y = sy - radius;
  hullScale.z = sz;
  b3.b3CreateTransformedHullShape(body, shapeDef, unitBoxHull, shapeTransform, hullScale);
  shapeTransform.p.y = axleY;
  shapeTransform.q = alongX ? WHEEL_QUAT_AXLE_Z : WHEEL_QUAT_AXLE_X;
  hullScale.x = radius * 2;
  hullScale.y = width;
  hullScale.z = radius * 2;
  for (const axle of wheels.axles) {
    for (const side of [-1, 1]) {
      shapeTransform.p.x = alongX ? axle * sx : side * track;
      shapeTransform.p.z = alongX ? side * track : axle * sz;
      b3.b3CreateTransformedHullShape(body, shapeDef, unitCylinderHull, shapeTransform, hullScale);
    }
  }
}
function createTreeShapes(body, shapeDef, def, sy) {
  const trunkHeight = def.trunk.top * sy;
  const trunkDiameter = def.trunk.radius * 2 * sy;
  shapeTransform.p.x = 0;
  shapeTransform.p.y = (trunkHeight - sy) / 2;
  shapeTransform.p.z = 0;
  shapeTransform.q = IDENTITY_QUAT;
  hullScale.x = trunkDiameter;
  hullScale.y = trunkHeight;
  hullScale.z = trunkDiameter;
  b3.b3CreateTransformedHullShape(body, shapeDef, unitCylinderHull, shapeTransform, hullScale);
  sphereScratch.center.x = 0;
  sphereScratch.center.y = (def.canopy.centerY - 0.5) * sy;
  sphereScratch.center.z = 0;
  sphereScratch.radius = def.canopy.radius * sy;
  b3.b3CreateSphereShape(body, shapeDef, sphereScratch);
}
function createBoxesShapes(body, shapeDef, boxes, sx, sy, sz) {
  shapeTransform.q = IDENTITY_QUAT;
  for (const b of boxes) {
    shapeTransform.p.x = ((b.min[0] + b.max[0]) / 2 - 0.5) * sx;
    shapeTransform.p.y = ((b.min[1] + b.max[1]) / 2 - 0.5) * sy;
    shapeTransform.p.z = ((b.min[2] + b.max[2]) / 2 - 0.5) * sz;
    hullScale.x = (b.max[0] - b.min[0]) * sx;
    hullScale.y = (b.max[1] - b.min[1]) * sy;
    hullScale.z = (b.max[2] - b.min[2]) * sz;
    b3.b3CreateTransformedHullShape(body, shapeDef, unitBoxHull, shapeTransform, hullScale);
  }
}
var propWireframes = new Array(MAX_PROPS).fill(null);
function addVehicleWireframe(i, wheels, sx, sy, sz) {
  const { radius, alongX, axleY, width, track } = vehicleLayout(wheels, sx, sy, sz);
  const group = new THREE5.Group();
  const chassis = makeColliderLines(unitBoxEdges);
  chassis.scale.set(sx, sy - radius, sz);
  chassis.position.y = radius / 2;
  group.add(chassis);
  for (const axle of wheels.axles) {
    for (const side of [-1, 1]) {
      const wheel = makeColliderLines(unitCylinderEdges);
      wheel.scale.set(radius * 2, width, radius * 2);
      if (alongX) {
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(axle * sx, axleY, side * track);
      } else {
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * track, axleY, axle * sz);
      }
      group.add(wheel);
    }
  }
  return registerPropWireframe(i, group);
}
function addTreeWireframe(i, def, sy) {
  const group = new THREE5.Group();
  const trunkHeight = def.trunk.top * sy;
  const trunkDiameter = def.trunk.radius * 2 * sy;
  const trunk = makeColliderLines(unitCylinderEdges);
  trunk.scale.set(trunkDiameter, trunkHeight, trunkDiameter);
  trunk.position.y = (trunkHeight - sy) / 2;
  group.add(trunk);
  const canopy = makeColliderLines(unitSphereEdges);
  canopy.scale.setScalar(def.canopy.radius * 2 * sy);
  canopy.position.y = (def.canopy.centerY - 0.5) * sy;
  group.add(canopy);
  return registerPropWireframe(i, group);
}
function addBoxesWireframe(i, boxes, sx, sy, sz) {
  const group = new THREE5.Group();
  for (const b of boxes) {
    const box = makeColliderLines(unitBoxEdges);
    box.scale.set((b.max[0] - b.min[0]) * sx, (b.max[1] - b.min[1]) * sy, (b.max[2] - b.min[2]) * sz);
    box.position.set(
      ((b.min[0] + b.max[0]) / 2 - 0.5) * sx,
      ((b.min[1] + b.max[1]) / 2 - 0.5) * sy,
      ((b.min[2] + b.max[2]) / 2 - 0.5) * sz
    );
    group.add(box);
  }
  return registerPropWireframe(i, group);
}
function addPropWireframe(i, def, sx, sy, sz) {
  if (def.collider === "vehicle") return addVehicleWireframe(i, def.wheels, sx, sy, sz);
  if (def.collider === "tree") return addTreeWireframe(i, def, sy);
  if (def.collider === "boxes") return addBoxesWireframe(i, def.boxes, sx, sy, sz);
  let lines;
  if (def.collider === "box") {
    lines = makeColliderLines(unitBoxEdges);
    lines.scale.set(sx, sy, sz);
  } else if (def.collider === "cylinder") {
    const d = (sx + sz) / 2 * (def.colliderXZ ?? 1);
    lines = makeColliderLines(unitCylinderEdges);
    lines.scale.set(d, sy, d);
  } else {
    lines = makeColliderLines(unitSphereEdges);
    lines.scale.setScalar(sy);
  }
  return registerPropWireframe(i, lines);
}
function registerPropWireframe(i, wireframe) {
  wireframe.visible = params.debug && params.showColliders;
  scene.add(wireframe);
  propWireframes[i] = wireframe;
  return wireframe;
}
function removePropWireframe(i) {
  if (!propWireframes[i]) return;
  scene.remove(propWireframes[i]);
  propWireframes[i] = null;
}
function spawnProp(mi, x, z, { yaw = 0, scale = 1, y, asleep = true, kinematic = false } = {}) {
  const model = models[mi];
  const def = model.def;
  if (propCount >= MAX_PROPS || typeCounts[mi] >= def.capacity) return;
  const s = scale * params.globalScale;
  const sx = model.baseSize.x * s;
  const sy = model.baseSize.y * s;
  const sz = model.baseSize.z * s;
  const py = y ?? sy / 2 + 0.01;
  tmpQuaternion.setFromAxisAngle(UP, yaw + (def.yawAlign ?? 0));
  const bodyDef = b3.b3DefaultBodyDef();
  bodyDef.type = kinematic ? b3.b3BodyType.b3_kinematicBody : b3.b3BodyType.b3_dynamicBody;
  bodyDef.position = { x, y: py, z };
  bodyDef.rotation = { v: { x: tmpQuaternion.x, y: tmpQuaternion.y, z: tmpQuaternion.z }, s: tmpQuaternion.w };
  const body = b3.b3CreateBody(world, bodyDef);
  const shapeDef = b3.b3DefaultShapeDef();
  shapeDef.baseMaterial.friction = params.propFriction;
  shapeDef.baseMaterial.restitution = params.propRestitution;
  shapeDef.baseMaterial.rollingResistance = params.rollingResistance;
  if (def.collider === "box") {
    b3.b3CreateBoxShape(body, shapeDef, sx / 2, sy / 2, sz / 2);
  } else if (def.collider === "vehicle") {
    createVehicleShapes(body, shapeDef, def.wheels, sx, sy, sz);
  } else if (def.collider === "tree") {
    createTreeShapes(body, shapeDef, def, sy);
  } else if (def.collider === "boxes") {
    createBoxesShapes(body, shapeDef, def.boxes, sx, sy, sz);
  } else if (def.collider === "cylinder") {
    const d = (sx + sz) / 2 * (def.colliderXZ ?? 1);
    hullScale.x = d;
    hullScale.y = sy;
    hullScale.z = d;
    b3.b3CreateTransformedHullShape(body, shapeDef, unitCylinderHull, IDENTITY_TRANSFORM, hullScale);
  } else {
    sphereScratch.center.x = 0;
    sphereScratch.center.y = 0;
    sphereScratch.center.z = 0;
    sphereScratch.radius = sy / 2;
    b3.b3CreateSphereShape(body, shapeDef, sphereScratch);
  }
  if (asleep && !kinematic) b3.b3Body_SetAwake(body, false);
  const i = propCount++;
  propBodies[i] = body;
  propAlive[i] = 1;
  propModels[i] = mi;
  propSlots[i] = typeCounts[mi]++;
  propScales[i * 3] = sx;
  propScales[i * 3 + 1] = sy;
  propScales[i * 3 + 2] = sz;
  propRadii[i] = Math.hypot(sx, sz) / 2;
  propSphereRadii[i] = Math.hypot(sx, sy, sz) / 2;
  propMasses[i] = kinematic ? 0 : b3.b3Body_GetMass(body);
  propPoints[i] = params[`points_${def.key}`];
  propLastLod[i] = 0;
  const o = i * 7;
  propCurr[o] = x;
  propCurr[o + 1] = py;
  propCurr[o + 2] = z;
  propCurr[o + 3] = tmpQuaternion.x;
  propCurr[o + 4] = tmpQuaternion.y;
  propCurr[o + 5] = tmpQuaternion.z;
  propCurr[o + 6] = tmpQuaternion.w;
  for (let k = 0; k < 7; k++) propPrev[o + k] = propCurr[o + k];
  tmpMatrix.compose(tmpPosition.set(x, py, z), tmpQuaternion, tmpScale.set(sx, sy, sz));
  for (const mesh of model.bucketFor[0][0].meshes) mesh.setMatrixAt(propSlots[i], tmpMatrix);
  const wireframe = addPropWireframe(i, def, sx, sy, sz);
  wireframe.position.set(x, py, z);
  wireframe.quaternion.copy(tmpQuaternion);
  return i;
}
var placedSpots = [];
function fitsAt(x, z, radius, gap, ignored = []) {
  const clearance = Math.min(params.holeSize + 2.5, params.arenaHalf * 0.6);
  if (Math.hypot(x, z) < clearance + radius) return false;
  if (Math.abs(x) > params.arenaHalf - radius - 0.5 || Math.abs(z) > params.arenaHalf - radius - 0.5) return false;
  return !placedSpots.some(
    (spot) => !ignored.includes(spot) && Math.hypot(x - spot.x, z - spot.z) < spot.r + radius + gap
  );
}
function tryPlace(x, z, radius, gap = 0.6, ignore = null) {
  const ignored = Array.isArray(ignore) ? ignore : ignore ? [ignore] : [];
  if (!fitsAt(x, z, radius, gap, ignored)) return null;
  const spot = { x, z, r: radius };
  placedSpots.push(spot);
  return spot;
}
function placeWith(radius, gap, sample) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate = sample();
    if (tryPlace(candidate[0], candidate[1], radius, gap)) return candidate;
  }
  return null;
}
function randomScale(spread = 1) {
  return 1 + (Math.random() * 2 - 1) * params.sizeVariation * spread;
}
function randomSign() {
  return Math.random() < 0.5 ? 1 : -1;
}
var roadHalf = () => params.roadWidth / 2;
var walkOuter = () => params.roadWidth / 2 + params.sidewalkWidth;
function alongRoad(exclusion) {
  const lo = exclusion;
  const hi = Math.max(lo + 1, params.arenaHalf - 2);
  return randomSign() * (lo + Math.random() * (hi - lo));
}
function sampleSidewalk(curb = false, clearance = 0) {
  const side = randomSign();
  const lo = Math.max(curb ? 0.35 : 0.4, clearance + 0.05);
  const hi = curb ? lo + 0.25 : Math.max(lo + 0.2, params.sidewalkWidth - 0.4);
  const inset = lo + Math.random() * (hi - lo);
  const offset = side * (roadHalf() + inset);
  const t = alongRoad(walkOuter() + 0.5 + clearance);
  if (Math.random() < 0.5) return [offset, t, side > 0 ? -Math.PI / 2 : Math.PI / 2];
  return [t, offset, side > 0 ? Math.PI : 0];
}
function sampleLot(depth) {
  const side = randomSign();
  const offset = side * (walkOuter() + depth / 2 + 0.3);
  const lo = walkOuter() + depth / 2;
  const hi = Math.max(lo + 1, params.arenaHalf - depth / 2 - 1);
  const t = randomSign() * (lo + Math.random() * (hi - lo));
  if (Math.random() < 0.5) return [offset, t, side > 0 ? -Math.PI / 2 : Math.PI / 2];
  return [t, offset, side > 0 ? Math.PI : 0];
}
function footprintRadius(mi, scale) {
  const base = models[mi].baseSize;
  return Math.hypot(base.x, base.z) / 2 * scale * params.globalScale;
}
var buildingLots = [];
function sampleAlley(radius) {
  const lot = buildingLots[Math.floor(Math.random() * buildingLots.length)];
  const dist = lot.spot.r + radius + 0.2 + Math.random() * 1.4;
  const dir = randomSign();
  const back = (Math.random() - 0.5) * lot.depth * 0.6;
  const sideX = Math.cos(lot.yaw) * dir;
  const sideZ = -Math.sin(lot.yaw) * dir;
  const frontX = Math.sin(lot.yaw);
  const frontZ = Math.cos(lot.yaw);
  return [lot.x + sideX * dist - frontX * back, lot.z + sideZ * dist - frontZ * back, lot.yaw];
}
function sampleBacklot(radius) {
  const lot = buildingLots[Math.floor(Math.random() * buildingLots.length)];
  const dist = lot.spot.r + radius + 0.2 + Math.random() * 1.8;
  const across = (Math.random() - 0.5) * lot.width * 0.8;
  const frontX = Math.sin(lot.yaw);
  const frontZ = Math.cos(lot.yaw);
  const sideX = Math.cos(lot.yaw);
  const sideZ = -Math.sin(lot.yaw);
  return [lot.x - frontX * dist + sideX * across, lot.z - frontZ * dist + sideZ * across, lot.yaw];
}
function buildBuildings() {
  buildingLots.length = 0;
  const kinds = BUILDING_KEYS.map((key) => MODEL[key]);
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  for (let i = 0; i < params.buildingCount; i++) {
    const mi = kinds[i % kinds.length];
    const scale = randomScale();
    const base = models[mi].baseSize;
    const depth = base.z * scale * params.globalScale;
    const spot = placeWith(footprintRadius(mi, scale), 1, () => sampleLot(depth));
    if (!spot) continue;
    spawnProp(mi, spot[0], spot[1], { yaw: spot[2], scale });
    buildingLots.push({
      x: spot[0],
      z: spot[1],
      yaw: spot[2],
      depth,
      width: base.x * scale * params.globalScale,
      height: base.y * scale * params.globalScale,
      spot: placedSpots[placedSpots.length - 1]
    });
  }
}
function buildStreetFurniture() {
  const rows = [
    [MODEL.tree, params.treeCount, 1.5, false],
    [MODEL.bench, params.benchCount, 0.8, false],
    [MODEL["fire-hydrant"], params.hydrantCount, 0.8, true]
  ];
  for (const [mi, count, gap, curb] of rows) {
    for (let i = 0; i < count; i++) {
      const scale = randomScale();
      const spot = placeWith(footprintRadius(mi, scale) + 0.1, gap, () => sampleSidewalk(curb));
      if (!spot) continue;
      spawnProp(mi, spot[0], spot[1], { yaw: spot[2] + (Math.random() - 0.5) * 0.2, scale });
    }
  }
}
function buildCrateStacks() {
  const kinds = [MODEL.crate, MODEL["fruit-crate"], MODEL["cardboard-box"]];
  const sampleStack = (radius) => {
    if (!buildingLots.length) return sampleSidewalk(false, radius);
    const roll = Math.random();
    if (roll < 0.5) return sampleAlley(radius);
    if (roll < 0.75) return sampleBacklot(radius);
    return sampleSidewalk(false, radius);
  };
  const randomLevels = (min2, max2) => min2 + Math.floor(Math.random() * (max2 - min2 + 1));
  for (let i = 0; i < params.crateStackCount; i++) {
    const mi = kinds[i % kinds.length];
    const base = models[mi].baseSize;
    const scale = randomScale(0.6);
    const size = base.y * scale * params.globalScale;
    const radius = footprintRadius(mi, scale);
    const spot = placeWith(radius, 0.5, () => sampleStack(radius));
    if (!spot) continue;
    const levels = randomLevels(params.crateStackLevelsMin, params.crateStackLevelsMax);
    const yaw = Math.random() * Math.PI;
    for (let level = 0; level < levels; level++) {
      spawnProp(mi, spot[0] + (Math.random() - 0.5) * 0.04, spot[1] + (Math.random() - 0.5) * 0.04, {
        yaw: yaw + (Math.random() - 0.5) * 0.15,
        scale,
        y: size / 2 + level * (size + 5e-3) + 0.01
      });
    }
  }
  for (let i = 0; i < params.crateBacklotCount && buildingLots.length; i++) {
    const mi = kinds[i % kinds.length];
    const base = models[mi].baseSize;
    const scale = randomScale(0.4);
    const size = base.y * scale * params.globalScale;
    const step = base.x * scale * params.globalScale * 1.04;
    const quad = Math.random() < 0.4;
    const radius = quad ? step + 0.3 : footprintRadius(mi, scale);
    const spot = placeWith(radius, 0.4, () => sampleBacklot(radius));
    if (!spot) continue;
    const levels = randomLevels(params.crateBacklotLevelsMin, params.crateBacklotLevelsMax);
    const yaw = spot[2];
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const span = quad ? 2 : 1;
    for (let level = 0; level < levels; level++) {
      for (let gx = 0; gx < span; gx++) {
        for (let gz = 0; gz < span; gz++) {
          const ox = quad ? (gx - 0.5) * step : (Math.random() - 0.5) * 0.04;
          const oz = quad ? (gz - 0.5) * step : (Math.random() - 0.5) * 0.04;
          spawnProp(mi, spot[0] + ox * cos + oz * sin, spot[1] - ox * sin + oz * cos, {
            yaw: yaw + (quad ? 0 : (Math.random() - 0.5) * 0.1),
            scale,
            y: size / 2 + level * (size + 5e-3) + 0.01
          });
        }
      }
    }
  }
  for (let i = 0; i < params.cratePyramidCount; i++) {
    const mi = kinds[i % kinds.length];
    const base = models[mi].baseSize;
    const scale = randomScale(0.4);
    const size = base.y * scale * params.globalScale;
    const step = base.x * scale * params.globalScale * 1.04;
    const n = 3;
    const radius = n * step / 2 + 0.3;
    const spot = placeWith(radius, 0.6, () => sampleStack(radius));
    if (!spot) continue;
    const yaw = spot[2];
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    for (let level = 0; level < n; level++) {
      const m = n - level;
      for (let gx = 0; gx < m; gx++) {
        for (let gz = 0; gz < m; gz++) {
          const ox = (gx - (m - 1) / 2) * step;
          const oz = (gz - (m - 1) / 2) * step;
          spawnProp(mi, spot[0] + ox * cos + oz * sin, spot[1] - ox * sin + oz * cos, {
            yaw,
            scale,
            y: size / 2 + level * (size + 5e-3) + 0.01
          });
        }
      }
    }
  }
  for (let i = 0; i < params.crateQuadCount; i++) {
    const mi = kinds[i % kinds.length];
    const base = models[mi].baseSize;
    const scale = randomScale(0.5);
    const size = base.y * scale * params.globalScale;
    const step = base.x * scale * params.globalScale * 1.04;
    const radius = step + 0.3;
    const spot = placeWith(radius, 0.5, () => sampleStack(radius));
    if (!spot) continue;
    const yaw = spot[2];
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const levels = 2 + Math.floor(Math.random() * 2);
    for (let level = 0; level < levels; level++) {
      for (let gx = 0; gx < 2; gx++) {
        for (let gz = 0; gz < 2; gz++) {
          const ox = (gx - 0.5) * step;
          const oz = (gz - 0.5) * step;
          spawnProp(mi, spot[0] + ox * cos + oz * sin, spot[1] - ox * sin + oz * cos, {
            yaw,
            scale,
            y: size / 2 + level * (size + 5e-3) + 0.01
          });
        }
      }
    }
  }
}
var manholeIndex = -1;
function buildManhole() {
  manholeIndex = spawnProp(MODEL.manhole, 0, 0, { yaw: Math.random() * Math.PI * 2, y: params.coverSpawnY }) ?? -1;
  if (manholeIndex >= 0) b3.b3Body_Disable(propBodies[manholeIndex]);
}
var coverPosition = { x: 0, y: 0, z: 0 };
var coverRotation = { v: { x: 0, y: 0, z: 0 }, s: 1 };
function seatCover(y) {
  if (manholeIndex < 0 || !propAlive[manholeIndex]) return;
  const o = manholeIndex * 7;
  coverPosition.x = propCurr[o];
  coverPosition.y = y;
  coverPosition.z = propCurr[o + 2];
  coverRotation.v.x = propCurr[o + 3];
  coverRotation.v.y = propCurr[o + 4];
  coverRotation.v.z = propCurr[o + 5];
  coverRotation.s = propCurr[o + 6];
  b3.b3Body_SetTransform(propBodies[manholeIndex], coverPosition, coverRotation);
  propCurr[o + 1] = y;
  propPrev[o + 1] = y;
}
function buildCity() {
  placedSpots.length = 0;
  buildBuildings();
  buildStreetFurniture();
  buildCrateStacks();
  buildManhole();
  if (propCount >= MAX_PROPS) console.warn(`physics-hole: prop cap of ${MAX_PROPS} reached`);
  const spawned = {};
  MODEL_DEFS.forEach((def, i) => {
    spawned[def.key] = typeCounts[i];
  });
  console.log(`[city] ${propCount} props`, spawned);
  totalProps = propCount;
  aliveCount = propCount;
}
var navMesh = null;
var navmeshDebugDirty = false;
var nearestPolyResult = createFindNearestPolyResult();
var NAVMESH_QUERY_EXTENTS = [0.6, 0.8, 0.6];
var AREA_SIDEWALK = 2;
var AREA_CROSSWALK = 3;
var AREA_ROAD = 4;
var FLAG_WALK = 1;
var FLAG_RUN = 2;
var FLAG_ROAD = 4;
var walkQueryFilter = createDefaultQueryFilter();
walkQueryFilter.includeFlags = FLAG_WALK;
var runQueryFilter = createDefaultQueryFilter();
runQueryFilter.includeFlags = FLAG_RUN;
var roadQueryFilter = createDefaultQueryFilter();
roadQueryFilter.includeFlags = FLAG_ROAD;
function pushNavRect(positions, indices, x0, z0, x1, z1) {
  const base = positions.length / 3;
  positions.push(
    Math.min(x0, x1),
    0,
    Math.min(z0, z1),
    Math.min(x0, x1),
    0,
    Math.max(z0, z1),
    Math.max(x0, x1),
    0,
    Math.max(z0, z1),
    Math.max(x0, x1),
    0,
    Math.min(z0, z1)
  );
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
var NAV_BLOCKER_HEIGHT = 0.9;
function pushNavBlocker(positions, indices, x, z, radius) {
  const base = positions.length / 3;
  const n = 8;
  const r = radius / Math.cos(Math.PI / n);
  for (let i = 0; i < n; i++) {
    const angle = i / n * Math.PI * 2;
    const px = x + Math.cos(angle) * r;
    const pz = z + Math.sin(angle) * r;
    positions.push(px, 0, pz, px, NAV_BLOCKER_HEIGHT, pz);
  }
  for (let i = 0; i < n; i++) {
    const b0 = base + i * 2;
    const t0 = b0 + 1;
    const b1 = base + (i + 1) % n * 2;
    const t1 = b1 + 1;
    indices.push(b0, t1, b1, b0, t0, t1);
  }
  for (let i = 1; i < n - 1; i++) {
    indices.push(base + 1, base + (i + 1) * 2 + 1, base + i * 2 + 1);
  }
}
function buildNavmesh() {
  const positions = [];
  const indices = [];
  const a = params.arenaHalf;
  const rh = roadHalf();
  const wo = walkOuter();
  const crossStart2 = rh + params.crosswalkOffset;
  const crossEnd2 = crossStart2 + params.crosswalkWidth;
  pushNavRect(positions, indices, -a, -a, a, a);
  for (const spot of placedSpots) pushNavBlocker(positions, indices, spot.x, spot.z, spot.r);
  const cellSize = params.navmeshCellSize;
  const cellHeight = 0.2;
  const agentRadius = params.navmeshAgentRadius;
  const walkableClimbVoxels = 1;
  const walkableHeightVoxels = Math.ceil(1.8 / cellHeight);
  const start = performance.now();
  const ctx = BuildContext.create();
  const triAreaIds = new Uint8Array(indices.length / 3).fill(0);
  markWalkableTriangles(positions, indices, triAreaIds, 50);
  const bounds = calculateMeshBounds([0, 0, 0, 0, 0, 0], positions, indices);
  const [gridWidth, gridHeight] = calculateGridSize([0, 0], bounds, cellSize);
  const heightfield = createHeightfield(gridWidth, gridHeight, bounds, cellSize, cellHeight);
  rasterizeTriangles(ctx, heightfield, positions, indices, triAreaIds, walkableClimbVoxels);
  filterLowHangingWalkableObstacles(heightfield, walkableClimbVoxels);
  filterLedgeSpans(heightfield, walkableHeightVoxels, walkableClimbVoxels);
  filterWalkableLowHeightSpans(heightfield, walkableHeightVoxels);
  const compactHeightfield = buildCompactHeightfield(ctx, walkableHeightVoxels, walkableClimbVoxels, heightfield);
  erodeWalkableArea(Math.ceil(agentRadius / cellSize), compactHeightfield);
  const markRect = (x0, z0, x1, z1, areaId) => markBoxArea(
    [Math.min(x0, x1), -0.5, Math.min(z0, z1), Math.max(x0, x1), NAV_BLOCKER_HEIGHT * 0.5, Math.max(z0, z1)],
    areaId,
    compactHeightfield
  );
  markRect(-rh, -a, rh, a, AREA_ROAD);
  markRect(-a, -rh, a, rh, AREA_ROAD);
  for (const side of [1, -1]) {
    markRect(side * rh, rh, side * wo, a, AREA_SIDEWALK);
    markRect(side * rh, -a, side * wo, -rh, AREA_SIDEWALK);
    markRect(rh, side * rh, a, side * wo, AREA_SIDEWALK);
    markRect(-a, side * rh, -rh, side * wo, AREA_SIDEWALK);
    markRect(-rh, side * crossStart2, rh, side * crossEnd2, AREA_CROSSWALK);
    markRect(side * crossStart2, -rh, side * crossEnd2, rh, AREA_CROSSWALK);
  }
  buildDistanceField(compactHeightfield);
  buildRegions(ctx, compactHeightfield, 0, 8, 20);
  const contourSet = buildContours(ctx, compactHeightfield, 1.3, 12, ContourBuildFlags.CONTOUR_TESS_WALL_EDGES);
  const polyMesh = buildPolyMesh(ctx, contourSet, 5);
  for (let p = 0; p < polyMesh.nPolys; p++) {
    const area = polyMesh.areas[p];
    if (area === NULL_AREA) continue;
    if (area === AREA_SIDEWALK) polyMesh.flags[p] = FLAG_WALK | FLAG_RUN;
    else if (area === AREA_CROSSWALK) polyMesh.flags[p] = FLAG_WALK | FLAG_RUN | FLAG_ROAD;
    else if (area === AREA_ROAD) polyMesh.flags[p] = FLAG_RUN | FLAG_ROAD;
    else polyMesh.flags[p] = FLAG_RUN;
  }
  const polyMeshDetail = buildPolyMeshDetail(ctx, polyMesh, compactHeightfield, cellSize * 6, cellHeight);
  const nav = createNavMesh();
  nav.tileWidth = polyMesh.bounds[3] - polyMesh.bounds[0];
  nav.tileHeight = polyMesh.bounds[5] - polyMesh.bounds[2];
  nav.origin[0] = polyMesh.bounds[0];
  nav.origin[1] = polyMesh.bounds[1];
  nav.origin[2] = polyMesh.bounds[2];
  const tilePolys = polyMeshToTilePolys(polyMesh);
  const tileDetailMesh = polyMeshDetailToTileDetailMesh(tilePolys.polys, polyMeshDetail);
  const tile = buildTile({
    bounds: polyMesh.bounds,
    vertices: tilePolys.vertices,
    polys: tilePolys.polys,
    detailMeshes: tileDetailMesh.detailMeshes,
    detailVertices: tileDetailMesh.detailVertices,
    detailTriangles: tileDetailMesh.detailTriangles,
    tileX: 0,
    tileY: 0,
    tileLayer: 0,
    cellSize,
    cellHeight,
    walkableHeight: 1.8,
    walkableRadius: agentRadius,
    walkableClimb: 0.2
  });
  addTile(nav, tile);
  navMesh = nav;
  navmeshDebugDirty = true;
  applyNavmeshVisibility();
  let polyCount = 0;
  for (const t of Object.values(navMesh.tiles)) polyCount += t.polys.length;
  console.log(`[navmesh] ${polyCount} polys in ${Math.round(performance.now() - start)}ms`);
}
var makeNavmeshDebugMesh = (color) => {
  const mesh = new THREE5.Mesh(
    void 0,
    new THREE5.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false })
  );
  mesh.renderOrder = WIREFRAME_ORDER - 1;
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
};
var navmeshDebugWalkMesh = makeNavmeshDebugMesh(params.navmeshColor);
var navmeshDebugRoadMesh = makeNavmeshDebugMesh(params.navmeshRoadColor);
var navmeshDebugLines = new THREE5.LineSegments(void 0, new THREE5.LineBasicMaterial({ color: params.navmeshColor }));
navmeshDebugLines.renderOrder = WIREFRAME_ORDER - 1;
navmeshDebugLines.visible = false;
scene.add(navmeshDebugLines);
function rebuildNavmeshDebug() {
  const walkTris = [];
  const roadTris = [];
  const linePositions = [];
  const lift = 0.03;
  for (const tile of Object.values(navMesh.tiles)) {
    for (const poly of tile.polys) {
      const v = poly.vertices;
      const point = (k) => [tile.vertices[v[k] * 3], tile.vertices[v[k] * 3 + 1] + lift, tile.vertices[v[k] * 3 + 2]];
      const triPositions = poly.flags & FLAG_WALK ? walkTris : roadTris;
      for (let k = 2; k < v.length; k++) triPositions.push(...point(0), ...point(k - 1), ...point(k));
      for (let k = 0; k < v.length; k++) linePositions.push(...point(k), ...point((k + 1) % v.length));
    }
  }
  for (const [mesh, triPositions] of [
    [navmeshDebugWalkMesh, walkTris],
    [navmeshDebugRoadMesh, roadTris]
  ]) {
    const geometry = new THREE5.BufferGeometry();
    geometry.setAttribute("position", new THREE5.Float32BufferAttribute(triPositions, 3));
    mesh.geometry = geometry;
  }
  const lineGeometry = new THREE5.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE5.Float32BufferAttribute(linePositions, 3));
  navmeshDebugLines.geometry = lineGeometry;
  navmeshDebugDirty = false;
}
function applyNavmeshVisibility() {
  const visible = params.debug && params.showNavmesh && navMesh !== null;
  if (visible && navmeshDebugDirty) rebuildNavmeshDebug();
  navmeshDebugWalkMesh.visible = visible;
  navmeshDebugRoadMesh.visible = visible;
  navmeshDebugLines.visible = visible;
}
var pedestrians = [];
var pedCrowd = null;
var pedTime = 0;
var HUMAN_FORWARD_YAW = 0;
function setPedestrianAction(ped, name) {
  if (ped.actionName === name) return;
  const previous = ped.actions[ped.actionName];
  const next = ped.actions[name];
  ped.actionName = name;
  next.reset().crossFadeFrom(previous, params.pedestrianAnimFade, false).play();
}
function samplePedestrianSpot() {
  const side = randomSign();
  const inset = 0.45 + Math.random() * Math.max(0.3, params.sidewalkWidth - 0.9);
  const offset = side * (roadHalf() + inset);
  const t = randomSign() * (walkOuter() + 1 + Math.random() * Math.max(1, params.arenaHalf - walkOuter() - 3));
  return Math.random() < 0.5 ? [offset, t] : [t, offset];
}
function wanderPedestrian(ped) {
  const agent = pedCrowd.agents[ped.agentId];
  findNearestPoly(nearestPolyResult, navMesh, agent.position, NAVMESH_QUERY_EXTENTS, walkQueryFilter);
  if (!nearestPolyResult.success || !nearestPolyResult.nodeRef) return;
  const startRef = nearestPolyResult.nodeRef;
  const startPos = [...nearestPolyResult.position];
  for (let attempt = 0; attempt < 4; attempt++) {
    const target = findRandomPointAroundCircle(
      navMesh,
      startRef,
      startPos,
      params.wanderRadius,
      walkQueryFilter,
      Math.random
    );
    if (!target.success) continue;
    if (Math.hypot(target.position[0] - holeX, target.position[2] - holeZ) < holeRadius + 1) continue;
    navCrowd.requestMoveTarget(pedCrowd, ped.agentId, target.nodeRef, [...target.position]);
    return;
  }
}
function fleePedestrian(ped) {
  if (pedTime < ped.lastFleeAt + params.fleeReplanCooldown) return;
  ped.lastFleeAt = pedTime;
  let dx = ped.x - holeX;
  let dz = ped.z - holeZ;
  const length = Math.hypot(dx, dz);
  if (length < 1e-3) {
    const angle = Math.random() * Math.PI * 2;
    dx = Math.cos(angle);
    dz = Math.sin(angle);
  } else {
    dx /= length;
    dz /= length;
  }
  const spread = (Math.random() - 0.5) * params.fleeSpread;
  const cos = Math.cos(spread);
  const sin = Math.sin(spread);
  const reach = Math.max(1, params.arenaHalf - 1);
  const tx = THREE5.MathUtils.clamp(ped.x + (dx * cos - dz * sin) * params.fleeDistance, -reach, reach);
  const tz = THREE5.MathUtils.clamp(ped.z + (dx * sin + dz * cos) * params.fleeDistance, -reach, reach);
  const extent = Math.max(1, params.fleeDistance * 0.5);
  findNearestPoly(nearestPolyResult, navMesh, [tx, 0, tz], [extent, 0.4, extent], runQueryFilter);
  if (nearestPolyResult.success && nearestPolyResult.nodeRef && Math.abs(nearestPolyResult.position[1]) < NAV_BLOCKER_HEIGHT / 2) {
    navCrowd.requestMoveTarget(pedCrowd, ped.agentId, nearestPolyResult.nodeRef, [...nearestPolyResult.position]);
  } else {
    const agent = pedCrowd.agents[ped.agentId];
    findNearestPoly(nearestPolyResult, navMesh, agent.position, NAVMESH_QUERY_EXTENTS, runQueryFilter);
    if (!nearestPolyResult.success || !nearestPolyResult.nodeRef) return;
    const target = findRandomPointAroundCircle(
      navMesh,
      nearestPolyResult.nodeRef,
      [...nearestPolyResult.position],
      params.fleeDistance,
      runQueryFilter,
      Math.random
    );
    if (target.success) navCrowd.requestMoveTarget(pedCrowd, ped.agentId, target.nodeRef, [...target.position]);
  }
}
function alertCrowd(x, z) {
  if (!pedCrowd) return;
  const radius = params.panicRadius + Math.max(0, holeRadius - params.holeSize) * params.panicRadiusGrowth;
  const radiusSq = radius * radius;
  for (const ped of pedestrians) {
    if (ped.dead || ped.state === "fall") continue;
    const dx = ped.x - x;
    const dz = ped.z - z;
    if (dx * dx + dz * dz > radiusSq) continue;
    ped.panicUntil = pedTime + params.panicDuration;
    if (ped.state !== "run") {
      ped.state = "run";
      pedCrowd.agents[ped.agentId].queryFilter = runQueryFilter;
      setPedestrianAction(ped, "run");
    }
    fleePedestrian(ped);
  }
  for (const car of cars) {
    if (car.dead) continue;
    const dx = car.x - x;
    const dz = car.z - z;
    if (dx * dx + dz * dz > radiusSq) continue;
    car.spookUntil = pedTime + params.panicDuration;
    spookCar(car);
  }
}
function collectPedestrian(ped) {
  ped.dead = true;
  ped.mixer.stopAllAction();
  scene.remove(ped.root);
  playChime();
  alertCrowd(ped.x, ped.z);
  const points = params.pedestrianPoints;
  if (points > 0 && !clearedShown) {
    score += points;
    spawnScorePopup(points);
    applyHoleSize();
  }
}
function clearPedestrians() {
  for (const ped of pedestrians) {
    ped.mixer.stopAllAction();
    scene.remove(ped.root);
    ped.root.traverse((child) => child.isSkinnedMesh && child.skeleton.dispose());
  }
  pedestrians.length = 0;
  pedCrowd = null;
}
function pedestrianAgentOptions(height, queryFilter) {
  const flags = navCrowd.CrowdUpdateFlags;
  return {
    radius: params.navmeshAgentRadius,
    height,
    maxAcceleration: params.pedestrianWalkAccel,
    maxSpeed: params.pedestrianWalkSpeed,
    collisionQueryRange: params.navmeshAgentRadius * params.pedestrianCollisionRangeMult,
    separationWeight: params.pedestrianSeparationWeight,
    updateFlags: flags.ANTICIPATE_TURNS | flags.OBSTACLE_AVOIDANCE | flags.SEPARATION | flags.OPTIMIZE_VIS | flags.OPTIMIZE_TOPO,
    queryFilter
  };
}
function spawnPedestrians() {
  clearPedestrians();
  if (!navMesh) return;
  pedCrowd = navCrowd.create(2);
  pedCrowd.maxIterationsPerUpdate = Math.max(600, (params.pedestrianCount + params.carCount) * 60);
  for (let i = 0; i < params.pedestrianCount; i++) {
    const human = humans[i % humans.length];
    let spawn = null;
    for (let attempt = 0; attempt < 40 && !spawn; attempt++) {
      const [x, z] = samplePedestrianSpot();
      if (Math.hypot(x - holeX, z - holeZ) < Math.max(holeRadius, params.holeSize) + 2.5) continue;
      if (pedestrians.some((other) => Math.hypot(other.x - x, other.z - z) < 1)) continue;
      findNearestPoly(nearestPolyResult, navMesh, [x, 0, z], NAVMESH_QUERY_EXTENTS, walkQueryFilter);
      if (!nearestPolyResult.success || !nearestPolyResult.nodeRef) continue;
      if (Math.abs(nearestPolyResult.position[1]) > NAV_BLOCKER_HEIGHT / 2) continue;
      spawn = [...nearestPolyResult.position];
    }
    if (!spawn) continue;
    const root = cloneSkinned(human.scene);
    const height = params[`size_${human.def.key}`] * params.globalScale * randomScale(0.5);
    root.scale.setScalar(height / human.rawHeight);
    const yaw = Math.random() * Math.PI * 2;
    root.position.set(spawn[0], 0, spawn[2]);
    root.rotation.y = yaw;
    scene.add(root);
    const mixer = new THREE5.AnimationMixer(root);
    const actions = {
      walk: mixer.clipAction(human.clips.walk),
      run: mixer.clipAction(human.clips.run),
      idle: mixer.clipAction(human.clips.idle)
    };
    actions.walk.play();
    actions.walk.time = Math.random() * human.clips.walk.duration;
    const agentId = navCrowd.addAgent(pedCrowd, navMesh, spawn, pedestrianAgentOptions(height, walkQueryFilter));
    const ped = {
      human,
      root,
      mixer,
      actions,
      actionName: "walk",
      agentId,
      state: "walk",
      panicUntil: 0,
      lastFleeAt: -1,
      stuckTime: 0,
      stuckRepaths: 0,
      fallVelY: 0,
      x: spawn[0],
      y: 0,
      z: spawn[2],
      yaw,
      height,
      pace: 1 + (Math.random() * 2 - 1) * 0.12
      // nobody walks in lockstep
    };
    pedestrians.push(ped);
    wanderPedestrian(ped);
  }
}
function updateCrowd(dt) {
  if (!pedCrowd || dt <= 0) return;
  pedTime += dt;
  navCrowd.update(pedCrowd, navMesh, Math.min(dt, 0.05));
}
function settlePedestrian(ped, agent) {
  findNearestPoly(nearestPolyResult, navMesh, agent.position, [0.4, 0.5, 0.4], walkQueryFilter);
  const onPavement = nearestPolyResult.success && nearestPolyResult.nodeRef && Math.hypot(nearestPolyResult.position[0] - ped.x, nearestPolyResult.position[2] - ped.z) < 0.4;
  if (onPavement) {
    ped.state = "walk";
    agent.queryFilter = walkQueryFilter;
    setPedestrianAction(ped, "walk");
    wanderPedestrian(ped);
    return;
  }
  if (pedTime < ped.lastFleeAt + params.fleeReplanCooldown) return;
  ped.lastFleeAt = pedTime;
  findNearestPoly(nearestPolyResult, navMesh, agent.position, [8, 0.4, 8], walkQueryFilter);
  if (nearestPolyResult.success && nearestPolyResult.nodeRef && Math.abs(nearestPolyResult.position[1]) < NAV_BLOCKER_HEIGHT / 2) {
    navCrowd.requestMoveTarget(pedCrowd, ped.agentId, nearestPolyResult.nodeRef, [...nearestPolyResult.position]);
  }
}
function reseatPedestrian(ped) {
  navCrowd.removeAgent(pedCrowd, ped.agentId);
  const filter = ped.state === "run" ? runQueryFilter : walkQueryFilter;
  ped.agentId = navCrowd.addAgent(pedCrowd, navMesh, [ped.x, 0, ped.z], pedestrianAgentOptions(ped.height, filter));
  if (ped.state === "run") fleePedestrian(ped);
  else wanderPedestrian(ped);
}
function updatePedestrians(dt) {
  if (pedestrians.length === 0 || dt <= 0) return;
  for (const human of humans) {
    for (const material of human.materials) material.emissiveIntensity = params.pedestrianEmissive;
  }
  const collectY = -(params.collectDepthStart + Math.max(0, holeRadius - params.holeSize) * params.collectDepthGrowth);
  const fallRadius = holeRadius - params.pedestrianFallInset;
  for (const ped of pedestrians) {
    if (ped.dead) continue;
    if (ped.state === "fall") {
      ped.fallVelY += params.gravityY * dt;
      ped.y += ped.fallVelY * dt;
      const pull = Math.min(0.5, params.pedestrianFallPull * dt);
      ped.x += (holeX - ped.x) * pull;
      ped.z += (holeZ - ped.z) * pull;
      ped.root.position.set(ped.x, ped.y, ped.z);
      if (ped.root.visible) ped.mixer.update(dt);
      if (ped.y + ped.height < collectY) collectPedestrian(ped);
      continue;
    }
    const agent = pedCrowd.agents[ped.agentId];
    ped.x = agent.position[0];
    ped.z = agent.position[2];
    const vx = agent.velocity[0];
    const vz = agent.velocity[2];
    const speed = Math.hypot(vx, vz);
    const hx = ped.x - holeX;
    const hz = ped.z - holeZ;
    const distSq = hx * hx + hz * hz;
    const hoverRadius = holeRadius + params.pedestrianHoverMargin;
    const hovering = started && speed < params.pedestrianStuckSpeed && distSq < hoverRadius * hoverRadius;
    if (fallRadius > 0 && distSq < fallRadius * fallRadius || hovering) {
      ped.state = "fall";
      ped.fallVelY = 0;
      navCrowd.removeAgent(pedCrowd, ped.agentId);
      setPedestrianAction(ped, "idle");
      ped.root.position.set(ped.x, 0, ped.z);
      ped.mixer.update(dt);
      continue;
    }
    if (ped.state === "run" && pedTime > ped.panicUntil) settlePedestrian(ped, agent);
    const running = ped.state === "run";
    agent.maxSpeed = (running ? params.pedestrianRunSpeed : params.pedestrianWalkSpeed) * ped.pace;
    agent.maxAcceleration = running ? params.pedestrianRunAccel : params.pedestrianWalkAccel;
    agent.separationWeight = params.pedestrianSeparationWeight;
    agent.collisionQueryRange = params.navmeshAgentRadius * params.pedestrianCollisionRangeMult;
    if (speed > 0.05) {
      const delta = Math.atan2(vx, vz) + HUMAN_FORWARD_YAW - ped.yaw;
      const wrapped = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      ped.yaw += wrapped * Math.min(1, params.pedestrianTurnRate * dt);
    }
    if (speed > params.pedestrianStuckSpeed) {
      ped.stuckTime = 0;
      ped.stuckRepaths = 0;
    } else {
      ped.stuckTime += dt;
      if (ped.stuckTime > (running ? params.stuckRepathRun : params.stuckRepathWalk)) {
        ped.stuckTime = 0;
        if (++ped.stuckRepaths >= params.stuckReseatAfter) {
          ped.stuckRepaths = 0;
          reseatPedestrian(ped);
        } else if (running) fleePedestrian(ped);
        else wanderPedestrian(ped);
      }
    }
    if (navCrowd.isAgentAtTarget(pedCrowd, ped.agentId, 0.5)) {
      if (running)
        fleePedestrian(ped);
      else wanderPedestrian(ped);
    }
    ped.root.position.set(ped.x, 0, ped.z);
    ped.root.rotation.y = ped.yaw;
    if (running) {
      const action = ped.actions.run;
      const stride = Math.max(params.pedestrianRunStride, 0.1);
      action.timeScale = params.pedestrianRunSpeed * ped.pace / stride * action.getClip().duration;
    } else if (ped.actionName === "idle" ? speed < params.pedestrianIdleSpeed * 2 : speed < params.pedestrianIdleSpeed) {
      setPedestrianAction(ped, "idle");
      ped.actions.idle.timeScale = 1;
    } else {
      setPedestrianAction(ped, "walk");
      const action = ped.actions.walk;
      const stride = Math.max(params.pedestrianWalkStride, 0.1);
      action.timeScale = THREE5.MathUtils.clamp(speed / stride * action.getClip().duration, 0.2, 3);
    }
    if (ped.root.visible) ped.mixer.update(dt);
  }
}
var cars = [];
var carSpawnCountdown = -1;
var CAR_MODEL_KEYS = ["taxi", "white-van", "taxi", "double-decker-bus", "white-van", "garbage-truck", "taxi"];
var carBodyPosition = { x: 0, y: 0, z: 0 };
var carBodyRotation = { v: { x: 0, y: 0, z: 0 }, s: 1 };
function carLaneEnd(axis, dir) {
  const lane = params.roadWidth / 4;
  const end = Math.max(params.arenaHalf - params.carRouteMargin, roadHalf() + 4);
  if (axis === "z") return [dir * lane, dir * end];
  return [dir * end, -dir * lane];
}
function targetCarRoute(car) {
  const [tx, tz] = carLaneEnd(car.axis, car.dir);
  findNearestPoly(nearestPolyResult, navMesh, [tx, 0, tz], [2.5, 0.4, 2.5], roadQueryFilter);
  if (!nearestPolyResult.success || !nearestPolyResult.nodeRef) return false;
  if (Math.abs(nearestPolyResult.position[1]) > NAV_BLOCKER_HEIGHT / 2) return false;
  navCrowd.requestMoveTarget(pedCrowd, car.agentId, nearestPolyResult.nodeRef, [...nearestPolyResult.position]);
  return true;
}
function nextCarTarget(car) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const axis = Math.random() < 0.5 ? "z" : "x";
    const dir = randomSign();
    if (attempt < 3 && axis === car.axis && dir === -car.dir) continue;
    const [tx, tz] = carLaneEnd(axis, dir);
    if (Math.hypot(tx - car.x, tz - car.z) < 8) continue;
    const prevAxis = car.axis;
    const prevDir = car.dir;
    car.axis = axis;
    car.dir = dir;
    if (targetCarRoute(car)) return;
    car.axis = prevAxis;
    car.dir = prevDir;
  }
}
function spookCar(car) {
  if (pedTime < car.lastPlanAt + params.fleeReplanCooldown) return;
  car.lastPlanAt = pedTime;
  const along = car.axis === "z" ? car.z - holeZ : car.x - holeX;
  car.dir = along >= 0 ? 1 : -1;
  targetCarRoute(car);
}
function addCarAgent(i, x, z) {
  const flags = navCrowd.CrowdUpdateFlags;
  const agentRadius = Math.min(propScales[i * 3], propScales[i * 3 + 2]) / 2 + 0.15;
  return navCrowd.addAgent(pedCrowd, navMesh, [x, 0, z], {
    radius: agentRadius,
    height: propScales[i * 3 + 1],
    maxAcceleration: params.carAccel,
    maxSpeed: params.carSpeed,
    collisionQueryRange: agentRadius * 8,
    separationWeight: 0,
    // lanes, not flocking — avoidance still dodges pedestrians
    updateFlags: flags.ANTICIPATE_TURNS | flags.OBSTACLE_AVOIDANCE | flags.OPTIMIZE_VIS | flags.OPTIMIZE_TOPO,
    queryFilter: roadQueryFilter
  });
}
function reattachCarAgents() {
  if (!pedCrowd) return;
  for (const car of cars) {
    if (car.dead) continue;
    car.agentId = addCarAgent(car.propIndex, car.x, car.z);
    targetCarRoute(car);
  }
}
function spawnCars() {
  cars.length = 0;
  if (!navMesh || !pedCrowd || params.carCount === 0) return;
  for (let c = 0; c < params.carCount; c++) {
    const mi = MODEL[CAR_MODEL_KEYS[c % CAR_MODEL_KEYS.length]];
    let spawn = null;
    let axis = "z";
    let dir = 1;
    for (let attempt = 0; attempt < 40 && !spawn; attempt++) {
      axis = Math.random() < 0.5 ? "z" : "x";
      dir = randomSign();
      const lane = params.roadWidth / 4;
      const along = (Math.random() * 2 - 1) * (params.arenaHalf - params.carRouteMargin);
      if (Math.abs(along) < roadHalf() + 3) continue;
      const x = axis === "z" ? dir * lane : along;
      const z = axis === "z" ? along : -dir * lane;
      if (Math.hypot(x - holeX, z - holeZ) < Math.max(holeRadius, params.holeSize) + 3) continue;
      if (cars.some((other) => Math.hypot(other.x - x, other.z - z) < 10)) continue;
      findNearestPoly(nearestPolyResult, navMesh, [x, 0, z], [1.5, 0.4, 1.5], roadQueryFilter);
      if (!nearestPolyResult.success || !nearestPolyResult.nodeRef) continue;
      if (Math.abs(nearestPolyResult.position[1]) > NAV_BLOCKER_HEIGHT / 2) continue;
      if (Math.hypot(nearestPolyResult.position[0] - x, nearestPolyResult.position[2] - z) > 1) continue;
      spawn = [...nearestPolyResult.position];
    }
    if (!spawn) continue;
    const yaw = axis === "z" ? dir > 0 ? 0 : Math.PI : dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const i = spawnProp(mi, spawn[0], spawn[2], { yaw, kinematic: true });
    if (i === void 0) continue;
    const agentId = addCarAgent(i, spawn[0], spawn[2]);
    const car = {
      propIndex: i,
      agentId,
      axis,
      dir,
      x: spawn[0],
      z: spawn[2],
      yaw,
      halfLength: Math.max(propScales[i * 3], propScales[i * 3 + 2]) / 2,
      // windshield scans start at the bumper
      spookUntil: -1,
      droppedAt: -1,
      lastPlanAt: -1,
      stuckTime: 0,
      brakeTime: 0,
      dead: false
    };
    cars.push(car);
    targetCarRoute(car);
  }
}
function spawnDelayedCars() {
  const before = propCount;
  spawnCars();
  totalProps = propCount;
  aliveCount += propCount - before;
}
function dropCar(car) {
  const i = car.propIndex;
  const agent = pedCrowd.agents[car.agentId];
  const vx = agent.velocity[0];
  const vz = agent.velocity[2];
  navCrowd.removeAgent(pedCrowd, car.agentId);
  car.dead = true;
  car.droppedAt = pedTime;
  const def = models[propModels[i]].def;
  const sx = propScales[i * 3];
  const sy = propScales[i * 3 + 1];
  const sz = propScales[i * 3 + 2];
  b3.b3DestroyBody(propBodies[i]);
  const bodyDef = b3.b3DefaultBodyDef();
  bodyDef.type = b3.b3BodyType.b3_dynamicBody;
  bodyDef.position = { x: car.x, y: sy / 2 + 0.01, z: car.z };
  tmpQuaternion.setFromAxisAngle(UP, car.yaw + (def.yawAlign ?? 0));
  bodyDef.rotation = { v: { x: tmpQuaternion.x, y: tmpQuaternion.y, z: tmpQuaternion.z }, s: tmpQuaternion.w };
  const body = b3.b3CreateBody(world, bodyDef);
  const shapeDef = b3.b3DefaultShapeDef();
  shapeDef.baseMaterial.friction = params.propFriction;
  shapeDef.baseMaterial.restitution = params.propRestitution;
  shapeDef.baseMaterial.rollingResistance = params.rollingResistance;
  createVehicleShapes(body, shapeDef, def.wheels, sx, sy, sz);
  b3.b3Body_SetLinearVelocity(body, { x: vx, y: 0, z: vz });
  propBodies[i] = body;
  propMasses[i] = b3.b3Body_GetMass(body);
}
function carWheelOverHole(car, def, i) {
  const sx = propScales[i * 3];
  const sy = propScales[i * 3 + 1];
  const sz = propScales[i * 3 + 2];
  const { radius, alongX, track } = vehicleLayout(def.wheels, sx, sy, sz);
  const engulf = holeRadius - radius * 0.5;
  if (engulf <= 0) return false;
  const bodyYaw = car.yaw + (def.yawAlign ?? 0);
  const sinYaw = Math.sin(bodyYaw);
  const cosYaw = Math.cos(bodyYaw);
  for (const axle of def.wheels.axles) {
    for (const side of [-1, 1]) {
      const lx = alongX ? axle * sx : side * track;
      const lz = alongX ? side * track : axle * sz;
      const dx = car.x + lx * cosYaw + lz * sinYaw - holeX;
      const dz = car.z - lx * sinYaw + lz * cosYaw - holeZ;
      if (dx * dx + dz * dz < engulf * engulf) return true;
    }
  }
  return false;
}
function tryRecoverCar(car) {
  const i = car.propIndex;
  if (!propAlive[i]) return;
  if (pedTime < car.droppedAt + params.carRecoverDelay) return;
  const body = propBodies[i];
  if (b3.b3Body_IsAwake(body)) return;
  const def = models[propModels[i]].def;
  const sy = propScales[i * 3 + 1];
  const p = b3.b3Body_GetPosition(body);
  const q = b3.b3Body_GetRotation(body);
  if (Math.abs(p.y - (sy / 2 + 0.01)) > 0.4) return;
  if (1 - 2 * (q.v.x * q.v.x + q.v.z * q.v.z) < 0.85) return;
  findNearestPoly(nearestPolyResult, navMesh, [p.x, 0, p.z], [1.5, 0.4, 1.5], roadQueryFilter);
  if (!nearestPolyResult.success || !nearestPolyResult.nodeRef) return;
  if (Math.abs(nearestPolyResult.position[1]) > NAV_BLOCKER_HEIGHT / 2) return;
  if (Math.hypot(nearestPolyResult.position[0] - p.x, nearestPolyResult.position[2] - p.z) > 1) return;
  car.x = nearestPolyResult.position[0];
  car.z = nearestPolyResult.position[2];
  car.yaw = Math.atan2(2 * (q.v.x * q.v.z + q.s * q.v.y), 1 - 2 * (q.v.x * q.v.x + q.v.y * q.v.y)) - (def.yawAlign ?? 0);
  if (carWheelOverHole(car, def, i)) return;
  const sx = propScales[i * 3];
  const sz = propScales[i * 3 + 2];
  b3.b3DestroyBody(body);
  const bodyDef = b3.b3DefaultBodyDef();
  bodyDef.type = b3.b3BodyType.b3_kinematicBody;
  bodyDef.position = { x: car.x, y: sy / 2 + 0.01, z: car.z };
  tmpQuaternion.setFromAxisAngle(UP, car.yaw + (def.yawAlign ?? 0));
  bodyDef.rotation = { v: { x: tmpQuaternion.x, y: tmpQuaternion.y, z: tmpQuaternion.z }, s: tmpQuaternion.w };
  const newBody = b3.b3CreateBody(world, bodyDef);
  const shapeDef = b3.b3DefaultShapeDef();
  shapeDef.baseMaterial.friction = params.propFriction;
  shapeDef.baseMaterial.restitution = params.propRestitution;
  shapeDef.baseMaterial.rollingResistance = params.rollingResistance;
  createVehicleShapes(newBody, shapeDef, def.wheels, sx, sy, sz);
  propBodies[i] = newBody;
  propMasses[i] = 0;
  car.dead = false;
  car.stuckTime = 0;
  car.brakeTime = 0;
  car.agentId = addCarAgent(i, car.x, car.z);
  car.spookUntil = pedTime + params.panicDuration;
  car.lastPlanAt = -1;
  spookCar(car);
}
function updateTraffic(dt) {
  if (cars.length === 0 || dt <= 0) return;
  for (const car of cars) {
    if (car.dead) {
      tryRecoverCar(car);
      continue;
    }
    const i = car.propIndex;
    const def = models[propModels[i]].def;
    const agent = pedCrowd.agents[car.agentId];
    car.x = agent.position[0];
    car.z = agent.position[2];
    const hx = car.x - holeX;
    const hz = car.z - holeZ;
    const reach = holeRadius + propRadii[i];
    if (hx * hx + hz * hz < reach * reach && carWheelOverHole(car, def, i)) {
      dropCar(car);
      continue;
    }
    const spooked = pedTime < car.spookUntil;
    agent.maxSpeed = spooked ? params.carSpookSpeed : params.carSpeed;
    agent.maxAcceleration = spooked ? params.carSpookAccel : params.carAccel;
    const headX = Math.sin(car.yaw);
    const headZ = Math.cos(car.yaw);
    let braked = false;
    for (const ped of pedestrians) {
      if (ped.dead || ped.state === "fall") continue;
      const rx = ped.x - car.x;
      const rz = ped.z - car.z;
      const forward = rx * headX + rz * headZ;
      if (forward > 0 && forward - car.halfLength < params.carBrakeDistance && Math.abs(rx * headZ - rz * headX) < params.carBrakeWidth) {
        braked = true;
        break;
      }
    }
    if (!braked && car.brakeTime < 3) {
      for (const other of cars) {
        if (other === car) continue;
        let ox = other.x;
        let oz = other.z;
        if (other.dead) {
          const oo = other.propIndex * 7;
          if (!propAlive[other.propIndex] || propCurr[oo + 1] < 0) continue;
          ox = propCurr[oo];
          oz = propCurr[oo + 2];
        }
        const rx = ox - car.x;
        const rz = oz - car.z;
        const forward = rx * headX + rz * headZ;
        if (forward > 0 && forward - car.halfLength - other.halfLength < params.carBrakeDistance && Math.abs(rx * headZ - rz * headX) < params.carBrakeWidth) {
          braked = true;
          break;
        }
      }
    }
    car.brakeTime = braked ? car.brakeTime + dt : Math.max(0, car.brakeTime - dt);
    if (braked) agent.maxSpeed = 0;
    const vx = agent.velocity[0];
    const vz = agent.velocity[2];
    const speed = Math.hypot(vx, vz);
    if (speed > 0.1) {
      const delta = Math.atan2(vx, vz) - car.yaw;
      const wrapped = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      car.yaw += wrapped * Math.min(1, params.carTurnRate * dt);
      car.stuckTime = 0;
    } else if (!braked) {
      car.stuckTime += dt;
      if (car.stuckTime > 3) {
        car.stuckTime = 0;
        nextCarTarget(car);
      }
    }
    if (navCrowd.isAgentAtTarget(pedCrowd, car.agentId, 2)) nextCarTarget(car);
    const sy = propScales[i * 3 + 1];
    carBodyPosition.x = car.x;
    carBodyPosition.y = sy / 2 + 0.01;
    carBodyPosition.z = car.z;
    tmpQuaternion.setFromAxisAngle(UP, car.yaw + (def.yawAlign ?? 0));
    carBodyRotation.v.x = tmpQuaternion.x;
    carBodyRotation.v.y = tmpQuaternion.y;
    carBodyRotation.v.z = tmpQuaternion.z;
    carBodyRotation.s = tmpQuaternion.w;
    b3.b3Body_SetTransform(propBodies[i], carBodyPosition, carBodyRotation);
    const o = i * 7;
    propPrev[o] = propCurr[o] = car.x;
    propPrev[o + 1] = propCurr[o + 1] = carBodyPosition.y;
    propPrev[o + 2] = propCurr[o + 2] = car.z;
    propPrev[o + 3] = propCurr[o + 3] = tmpQuaternion.x;
    propPrev[o + 4] = propCurr[o + 4] = tmpQuaternion.y;
    propPrev[o + 5] = propCurr[o + 5] = tmpQuaternion.z;
    propPrev[o + 6] = propCurr[o + 6] = tmpQuaternion.w;
  }
}
function recomputePropPoints() {
  for (let i = 0; i < propCount; i++) {
    propPoints[i] = params[`points_${models[propModels[i]].def.key}`];
  }
}
function computeHoleRadius() {
  const level = params.holeGrowth ? growthLevel : 0;
  return Math.min(params.holeSize * params.growthFactor ** level, params.holeSizeMax);
}
function levelCost(level) {
  return params.growthEvery * (level + 1);
}
function levelStartScore(level) {
  return params.growthEvery * level * (level + 1) / 2;
}
function currentLevel() {
  return Math.floor((Math.sqrt(1 + 8 * score / params.growthEvery) - 1) / 2);
}
function applyHoleSize() {
  growthLevel = currentLevel();
  holeTargetRadius = started ? computeHoleRadius() : CLOSED_RADIUS;
  layoutRim();
  updateHUD();
}
function wakeNearHole() {
  const reach = holeRadius + params.wakeMargin;
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i]) continue;
    const o = i * 7;
    const dx = propCurr[o] - holeX;
    const dz = propCurr[o + 2] - holeZ;
    const r = reach + propRadii[i];
    if (dx * dx + dz * dz < r * r) {
      b3.b3Body_SetAwake(propBodies[i], true);
    }
  }
}
function restart() {
  for (let i = 0; i < propCount; i++) {
    if (propAlive[i]) b3.b3DestroyBody(propBodies[i]);
    removePropWireframe(i);
  }
  propCount = 0;
  typeCounts.fill(0);
  score = 0;
  growthLevel = 0;
  levelTime = 0;
  holeX = 0;
  holeZ = 0;
  holePrevX = 0;
  holePrevZ = 0;
  holeVelX = 0;
  holeVelZ = 0;
  started = false;
  vignetteBlend = 0;
  startOverlay.classList.remove("hidden");
  applyHudVisibility();
  applyJoystick();
  applyBuildingShadows();
  rimMesh.visible = false;
  holeTargetRadius = CLOSED_RADIUS;
  holeRadius = CLOSED_RADIUS;
  holePrevRadius = CLOSED_RADIUS;
  holeRadiusVel = 0;
  const zoomBase = computeHoleRadius();
  zoomRadius = zoomBase;
  zoomPrevRadius = zoomBase;
  cameraViewRadius = zoomBase;
  zoomViewRadius = zoomBase;
  cars.length = 0;
  carSpawnCountdown = -1;
  buildCity();
  buildNavmesh();
  spawnPedestrians();
  for (let mi = 0; mi < models.length; mi++) {
    for (const mesh of models[mi].bucketFor[0][0].meshes) {
      mesh.count = typeCounts[mi];
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  rebuildHole();
  clearScorePopups();
  hideLevelCleared();
  levelUpText.classList.remove("show");
  levelBadge.classList.remove("pop");
  levelTrack.classList.remove("flash");
  updateHUD();
  updateTimer();
}
function startGame() {
  if (started || startButton.disabled) return;
  started = true;
  carSpawnCountdown = params.carSpawnDelay;
  startOverlay.classList.add("hidden");
  applyHudVisibility();
  applyJoystick();
  applyBuildingShadows();
  rimMesh.visible = params.showRim;
  applyHoleSize();
  if (manholeIndex >= 0 && propAlive[manholeIndex]) {
    const body = propBodies[manholeIndex];
    b3.b3Body_Enable(body);
    seatCover(propScales[manholeIndex * 3 + 1] / 2 + 0.01);
    b3.b3Body_SetAwake(body, true);
    b3.b3Body_SetLinearVelocity(body, {
      x: (Math.random() - 0.5) * 1,
      y: params.coverPopVelocity,
      z: (Math.random() - 0.5) * 1
    });
    b3.b3Body_SetAngularVelocity(body, {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 8
    });
  }
}
function applyBuildingShadows() {
  for (const model of models) {
    if (!model.def.occluder) continue;
    for (const bucket of model.buckets) {
      for (const mesh of bucket.meshes) mesh.castShadow = started;
    }
  }
}
applyBuildingShadows();
startButton.addEventListener("click", startGame);
var keys = {};
addEventListener("keydown", (e) => {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  keys[e.code] = true;
  if (e.code === "Enter" || e.code === "Space") {
    if (clearedShown) nextLevel();
    else startGame();
  }
});
addEventListener("keyup", (e) => {
  keys[e.code] = false;
});
addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
});
var joystick = new TouchJoystick({
  deadZone: params.joystickDeadZone,
  accent: "var(--hud-accent, #ffc83c)",
  zIndex: 15
  // above the level HUD, below the popups and overlays
});
var hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
if (hasTouch) document.body.classList.add("touch");
function applyJoystick() {
  joystick.configure({
    size: params.joystickSize,
    margin: params.joystickMargin,
    knobScale: params.joystickKnobScale,
    idleOpacity: params.joystickIdleOpacity
  });
  const enabled = params.joystickMode === "on" || params.joystickMode === "auto" && hasTouch;
  joystick.setVisible(enabled && started);
  startHint.textContent = `${enabled ? "Drag the joystick" : "WASD"} to move \u2014 swallow the whole city`;
}
applyJoystick();
var gamepad = new GamepadInput({ deadZone: params.gamepadDeadZone });
var moveDir = new THREE5.Vector3();
var camForward = new THREE5.Vector3();
var camRight = new THREE5.Vector3();
function computeMoveDir() {
  const right = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joystick.x + gamepad.x;
  const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + joystick.y + gamepad.y;
  camera.getWorldDirection(camForward);
  camForward.y = 0;
  if (camForward.lengthSq() < 1e-6) camForward.set(0, 0, -1);
  camForward.normalize();
  camRight.crossVectors(camForward, UP);
  moveDir.copy(camForward).multiplyScalar(forward).addScaledVector(camRight, right);
  if (moveDir.lengthSq() > 1) moveDir.normalize();
}
function capturePropStates() {
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i]) continue;
    const o = i * 7;
    for (let k = 0; k < 7; k++) propPrev[o + k] = propCurr[o + k];
    const body = propBodies[i];
    if (!b3.b3Body_IsAwake(body)) continue;
    const p = b3.b3Body_GetPosition(body);
    const q = b3.b3Body_GetRotation(body);
    propCurr[o] = p.x;
    propCurr[o + 1] = p.y;
    propCurr[o + 2] = p.z;
    propCurr[o + 3] = q.v.x;
    propCurr[o + 4] = q.v.y;
    propCurr[o + 5] = q.v.z;
    propCurr[o + 6] = q.s;
  }
}
function stepPhysics(dt) {
  if (started) computeMoveDir();
  else moveDir.set(0, 0, 0);
  const smoothing = Math.min(1, params.holeAccel * dt);
  holeVelX += (moveDir.x * params.holeSpeed - holeVelX) * smoothing;
  holeVelZ += (moveDir.z * params.holeSpeed - holeVelZ) * smoothing;
  holePrevRadius = holeRadius;
  zoomPrevRadius = zoomRadius;
  if (holeRadius !== holeTargetRadius || holeRadiusVel !== 0) {
    const omega = Math.PI * 2 * params.growthFrequency;
    holeRadiusVel += ((holeTargetRadius - holeRadius) * omega * omega - 2 * (1 - params.growthBounce) * omega * holeRadiusVel) * dt;
    holeRadius = THREE5.MathUtils.clamp(holeRadius + holeRadiusVel * dt, CLOSED_RADIUS, params.holeSizeMax);
    if (Math.abs(holeRadius - holeTargetRadius) < 1e-3 && Math.abs(holeRadiusVel) < 0.01) {
      holeRadius = holeTargetRadius;
      holeRadiusVel = 0;
    }
  }
  const zoomTarget = computeHoleRadius();
  if (zoomRadius !== zoomTarget) {
    zoomRadius = THREE5.MathUtils.damp(zoomRadius, zoomTarget, Math.log(100) / params.zoomDuration, dt);
    if (Math.abs(zoomRadius - zoomTarget) < 1e-3) zoomRadius = zoomTarget;
  }
  const limit = Math.max(0, params.arenaHalf - holeRadius);
  holePrevX = holeX;
  holePrevZ = holeZ;
  const newX = THREE5.MathUtils.clamp(holeX + holeVelX * dt, -limit, limit);
  const newZ = THREE5.MathUtils.clamp(holeZ + holeVelZ * dt, -limit, limit);
  const moved = Math.abs(newX - holeX) + Math.abs(newZ - holeZ) > 1e-6 || holeRadius !== holePrevRadius;
  holeX = newX;
  holeZ = newZ;
  if (moved) {
    positionHole();
    wakeNearHole();
  }
  if (started && params.suction) applyHoleSuction();
  b3.b3World_Step(world, dt, params.substeps);
  capturePropStates();
}
var suctionForce = { x: 0, y: 0, z: 0 };
function applyHoleSuction() {
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i]) continue;
    const mass = propMasses[i];
    if (mass === 0) continue;
    const cy = propCurr[i * 7 + 1];
    if (cy >= 0) continue;
    suctionForce.y = -mass * params.suctionDownward * Math.min(1, -cy / params.suctionRamp);
    b3.b3Body_ApplyForceToCenter(propBodies[i], suctionForce, true);
  }
}
var tossPosition = { x: 0, y: 0, z: 0 };
var ZERO_VEC3 = { x: 0, y: 0, z: 0 };
function tossBackInside(i) {
  const o = i * 7;
  const inner = Math.max(1, params.arenaHalf - 1);
  tossPosition.x = THREE5.MathUtils.clamp(propCurr[o], -inner, inner);
  tossPosition.y = Math.max(params.wallHeight + 2, propScales[i * 3 + 1] + 0.5);
  tossPosition.z = THREE5.MathUtils.clamp(propCurr[o + 2], -inner, inner);
  const body = propBodies[i];
  b3.b3Body_SetTransform(body, tossPosition, IDENTITY_QUAT);
  b3.b3Body_SetLinearVelocity(body, ZERO_VEC3);
  b3.b3Body_SetAngularVelocity(body, ZERO_VEC3);
  b3.b3Body_SetAwake(body, true);
  propCurr[o] = tossPosition.x;
  propCurr[o + 1] = tossPosition.y;
  propCurr[o + 2] = tossPosition.z;
  propCurr[o + 3] = 0;
  propCurr[o + 4] = 0;
  propCurr[o + 5] = 0;
  propCurr[o + 6] = 1;
  for (let k = 0; k < 7; k++) propPrev[o + k] = propCurr[o + k];
}
function syncProps() {
  const collectY = -(params.collectDepthStart + Math.max(0, holeRadius - params.holeSize) * params.collectDepthGrowth);
  const outOfBounds = params.arenaHalf + (params.walls ? params.wallThickness + 1 : 0.5);
  let collected = 0;
  let points = 0;
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i]) continue;
    const o = i * 7;
    if (propCurr[o + 1] + propSphereRadii[i] < collectY) {
      b3.b3DestroyBody(propBodies[i]);
      propAlive[i] = 0;
      removePropWireframe(i);
      collected++;
      points += propPoints[i];
      if (propModels[i] !== MODEL.manhole) alertCrowd(propCurr[o], propCurr[o + 2]);
      continue;
    }
    if (propCurr[o + 1] > 0 && (Math.abs(propCurr[o]) > outOfBounds || Math.abs(propCurr[o + 2]) > outOfBounds)) {
      tossBackInside(i);
    }
  }
  if (collected > 0) {
    aliveCount -= collected;
    playChime();
    if (points > 0) {
      score += points;
      spawnScorePopup(points);
      applyHoleSize();
    } else {
      updateHUD();
    }
    if (started && aliveCount === 0) scheduleLevelCleared();
  }
}
var cullStats = { alive: 0, drawn: 0, peds: 0, proxied: 0, offscreen: 0, occluded: 0, lod0: 0, lod1: 0, lod2: 0 };
var cullFrustum = new CapsuleFrustum();
var cullCamDir = new THREE5.Vector3();
var sunDir = new THREE5.Vector3();
var sweepEnd = { x: 0, y: 0, z: 0, r: 0 };
var SHADOW_PROXY_LAYER = 1;
var uProxyShadowFade = uniform3(0).onFrameUpdate(() => started ? vignetteBlendEase() : 0);
var proxyBayer2 = (coord) => coord.x.mul(0.5).add(coord.y.mul(coord.y).mul(0.75)).fract();
var proxyBayerCoord = screenCoordinate2.xy.mod(8).floor();
var proxyDither = proxyBayer2(proxyBayerCoord).add(proxyBayer2(proxyBayerCoord.mul(0.5).floor()).mul(0.25)).add(proxyBayer2(proxyBayerCoord.mul(0.25).floor()).mul(0.0625));
var shadowProxyMaterial = new THREE5.MeshBasicNodeMaterial();
shadowProxyMaterial.colorNode = vec4(0, 0, 0, proxyDither.add(0.01).lessThan(uProxyShadowFade).select(1, 0));
shadowProxyMaterial.alphaTest = 0.5;
var shadowProxies = new THREE5.InstancedMesh(new THREE5.BoxGeometry(1, 1, 1), shadowProxyMaterial, MAX_PROPS);
shadowProxies.instanceMatrix.setUsage(THREE5.DynamicDrawUsage);
shadowProxies.castShadow = true;
shadowProxies.frustumCulled = false;
shadowProxies.layers.set(SHADOW_PROXY_LAYER);
dirLight.shadow.camera.layers.enable(SHADOW_PROXY_LAYER);
shadowProxies.count = 1;
shadowProxies.setMatrixAt(0, tmpMatrix.makeTranslation(0, -100, 0));
scene.add(shadowProxies);
var modelHidden = new Uint8Array(MODEL_DEFS.length);
function refreshModelHidden() {
  for (const key of BUILDING_KEYS) modelHidden[MODEL[key]] = params.showBuildings ? 0 : 1;
  modelHidden[MODEL.crate] = params.showCrates ? 0 : 1;
  modelHidden[MODEL["cardboard-box"]] = params.showCardboardBoxes ? 0 : 1;
  modelHidden[MODEL["fruit-crate"]] = params.showFruitCrates ? 0 : 1;
}
var MAX_OCCLUDERS = 8;
var occluders = new BoxOccluderVolumes(MAX_OCCLUDERS);
var occluderCandidates = new TopCandidates(MAX_OCCLUDERS);
var occluderScale = new THREE5.Vector3();
function selectOccluders(alpha) {
  occluders.reset(camera.position);
  if (!params.cullEnabled || !params.occlusionEnabled || params.occluderMax === 0) return;
  occluderCandidates.reset(params.occluderMax);
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i] || modelHidden[propModels[i]]) continue;
    const model = models[propModels[i]];
    if (!model.def.occluder || propDissolving[i] || propLastLod[i] > 1) continue;
    const o = i * 7;
    const x = THREE5.MathUtils.lerp(propPrev[o], propCurr[o], alpha);
    const y = THREE5.MathUtils.lerp(propPrev[o + 1], propCurr[o + 1], alpha);
    const z = THREE5.MathUtils.lerp(propPrev[o + 2], propCurr[o + 2], alpha);
    const r = propSphereRadii[i];
    if (!cullFrustum.intersectsSphere(x, y, z, r)) continue;
    const dx = x - camera.position.x;
    const dy = y - camera.position.y;
    const dz = z - camera.position.z;
    occluderCandidates.offer(i, r / Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 1e-3));
  }
  for (let c = 0; c < occluderCandidates.count; c++) {
    const i = occluderCandidates.id(c);
    interpolateProp(i, alpha);
    occluders.addBox(
      tmpPosition,
      tmpQuaternion,
      occluderScale.set(propScales[i * 3], propScales[i * 3 + 1], propScales[i * 3 + 2]),
      models[propModels[i]].def.occluderBox,
      params.occluderShrink
    );
  }
}
function interpolateProp(i, alpha) {
  const o = i * 7;
  tmpPosition.set(
    THREE5.MathUtils.lerp(propPrev[o], propCurr[o], alpha),
    THREE5.MathUtils.lerp(propPrev[o + 1], propCurr[o + 1], alpha),
    THREE5.MathUtils.lerp(propPrev[o + 2], propCurr[o + 2], alpha)
  );
  tmpQuaternion.set(propPrev[o + 3], propPrev[o + 4], propPrev[o + 5], propPrev[o + 6]);
  tmpQuaternionB.set(propCurr[o + 3], propCurr[o + 4], propCurr[o + 5], propCurr[o + 6]);
  tmpQuaternion.slerp(tmpQuaternionB, alpha);
}
function packInstances(alpha) {
  camera.updateMatrixWorld();
  cullFrustum.update(camera, renderer.coordinateSystem);
  camera.getWorldDirection(cullCamDir);
  sunDir.subVectors(dirLight.target.position, dirLight.position).normalize();
  const shadowSweep = params.cullEnabled && params.offscreenCasters !== "cull" && params.shadows && sunDir.y < -0.05;
  refreshModelHidden();
  selectOccluders(alpha);
  cullStats.alive = aliveCount;
  cullStats.proxied = 0;
  cullStats.offscreen = 0;
  cullStats.occluded = 0;
  cullStats.lod0 = 0;
  cullStats.lod1 = 0;
  cullStats.lod2 = 0;
  const margin = params.cullMargin;
  const showWireframes = params.debug && params.showColliders;
  const lodPxPerMeter = lodPixelScale(renderer.domElement.height, camera.fov);
  const lodDownPx = params.lodPopPixels;
  const lodUpPx = lodDownPx * (1 + params.lodHysteresis);
  const lodClampRadius = params.lodHoleClampRadius * holeViewRadius;
  for (const model of models) for (const bucket of model.buckets) bucket.count = 0;
  for (let i = 0; i < propCount; i++) {
    if (!propAlive[i] || modelHidden[propModels[i]]) continue;
    if (showWireframes && propWireframes[i]) {
      interpolateProp(i, alpha);
      propWireframes[i].position.copy(tmpPosition);
      propWireframes[i].quaternion.copy(tmpQuaternion);
    }
    const o = i * 7;
    const x = THREE5.MathUtils.lerp(propPrev[o], propCurr[o], alpha);
    const y = THREE5.MathUtils.lerp(propPrev[o + 1], propCurr[o + 1], alpha);
    const z = THREE5.MathUtils.lerp(propPrev[o + 2], propCurr[o + 2], alpha);
    const r = propSphereRadii[i] + margin;
    sweepEnd.x = x;
    sweepEnd.y = y;
    sweepEnd.z = z;
    sweepEnd.r = r;
    if (shadowSweep) shadowSweepEndpoint(x, y, z, r, sunDir, sweepEnd);
    let selfOnScreen = true;
    if (params.cullEnabled) {
      if (!cullFrustum.intersectsCapsule(x, y, z, sweepEnd.x, sweepEnd.y, sweepEnd.z, r, sweepEnd.r)) {
        cullStats.offscreen++;
        continue;
      }
      if (occluders.count > 0 && occluders.segmentHidden(x, y, z, sweepEnd.x, sweepEnd.y, sweepEnd.z, r, sweepEnd.r)) {
        cullStats.occluded++;
        continue;
      }
      if (shadowSweep) selfOnScreen = cullFrustum.intersectsSphere(x, y, z, r);
      if (!selfOnScreen && params.offscreenCasters === "box" && !propDissolving[i]) {
        interpolateProp(i, alpha);
        tmpMatrix.compose(
          tmpPosition,
          tmpQuaternion,
          tmpScale.set(propScales[i * 3], propScales[i * 3 + 1], propScales[i * 3 + 2])
        );
        shadowProxies.setMatrixAt(cullStats.proxied++, tmpMatrix);
        continue;
      }
    }
    const model = models[propModels[i]];
    let lod = 0;
    if (params.lodForceCheapest) {
      lod = model.lods.length - 1;
    } else if (model.lods.length > 1 && lodDownPx > 0) {
      let sx = x;
      let sy = y;
      let sz = z;
      if (!selfOnScreen) {
        sx = sweepEnd.x;
        sy = sweepEnd.y;
        sz = sweepEnd.z;
      }
      const dx = sx - camera.position.x;
      const dy = sy - camera.position.y;
      const dz = sz - camera.position.z;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.1);
      const errPx = Math.max(propScales[i * 3], propScales[i * 3 + 1], propScales[i * 3 + 2]) * lodPxPerMeter / distance;
      lod = selectLodLevel(model.lods, propLastLod[i], errPx, lodDownPx, lodUpPx);
      if (lod > 1 && lodClampRadius > 0) {
        const hx = x - holeViewX;
        const hz = z - holeViewZ;
        const reach = lodClampRadius + propSphereRadii[i];
        if (hx * hx + hz * hz < reach * reach) lod = 1;
      }
    }
    propLastLod[i] = lod;
    const bucket = model.bucketFor[propDissolving[i]][lod];
    bucket.depths[bucket.count] = (x - camera.position.x) * cullCamDir.x + (y - camera.position.y) * cullCamDir.y + (z - camera.position.z) * cullCamDir.z;
    bucket.indices[bucket.count++] = i;
  }
  let drawn = 0;
  for (const model of models) {
    for (const bucket of model.buckets) {
      const n = bucket.count;
      drawn += n;
      cullStats[`lod${bucket.lod}`] += n;
      if (params.cullSort && n > 1) sortPackNearToFar(bucket.indices, bucket.depths, n);
      for (let s = 0; s < n; s++) {
        const i = bucket.indices[s];
        const wireframe = showWireframes ? propWireframes[i] : null;
        if (wireframe) {
          tmpPosition.copy(wireframe.position);
          tmpQuaternion.copy(wireframe.quaternion);
        } else {
          interpolateProp(i, alpha);
        }
        tmpMatrix.compose(
          tmpPosition,
          tmpQuaternion,
          tmpScale.set(propScales[i * 3], propScales[i * 3 + 1], propScales[i * 3 + 2])
        );
        for (const mesh of bucket.meshes) mesh.setMatrixAt(s, tmpMatrix);
      }
      const order = params.cullSort && n > 0 ? bucket.depths[0] : 0;
      for (const mesh of bucket.meshes) {
        mesh.visible = n > 0;
        mesh.count = n;
        mesh.renderOrder = order;
        if (n > 0) mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
  shadowProxies.count = cullStats.proxied;
  shadowProxies.visible = cullStats.proxied > 0;
  if (cullStats.proxied > 0) shadowProxies.instanceMatrix.needsUpdate = true;
  cullStats.drawn = drawn;
  cullPedestrians(shadowSweep);
}
function cullPedestrians(shadowSweep) {
  cullStats.peds = 0;
  for (const ped of pedestrians) {
    if (ped.dead) continue;
    let visible = true;
    if (params.cullEnabled) {
      const x = ped.x;
      const y = ped.y + ped.height / 2;
      const z = ped.z;
      const r = ped.height * 0.6 + params.cullMargin;
      sweepEnd.x = x;
      sweepEnd.y = y;
      sweepEnd.z = z;
      sweepEnd.r = r;
      if (shadowSweep) shadowSweepEndpoint(x, y, z, r, sunDir, sweepEnd);
      visible = cullFrustum.intersectsCapsule(x, y, z, sweepEnd.x, sweepEnd.y, sweepEnd.z, r, sweepEnd.r) && !(occluders.count > 0 && occluders.segmentHidden(x, y, z, sweepEnd.x, sweepEnd.y, sweepEnd.z, r, sweepEnd.r));
    }
    ped.root.visible = visible;
    if (visible) cullStats.peds++;
  }
}
var hudStyle = document.createElement("style");
hudStyle.textContent = `
  body { --hud-accent: ${params.hudColor}; }
  #level-hud {
    position: fixed;
    left: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 480px;
    max-width: calc(100vw - 32px);
    color: #fff;
    font-family: system-ui, sans-serif;
    pointer-events: none;
    user-select: none;
  }
  #level-badge {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: rgba(20, 17, 14, 0.78);
    border: 3px solid var(--hud-accent);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  }
  #level-badge .caption {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    opacity: 0.75;
  }
  #level-badge .value {
    font-size: 38px;
    font-weight: 800;
    line-height: 1.05;
  }
  #level-badge::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 3px solid var(--hud-accent);
    opacity: 0;
  }
  #level-track {
    position: relative;
    flex: 1;
    height: 44px;
    border-radius: 22px;
    background: rgba(20, 17, 14, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }
  #level-track::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: #fff;
    opacity: 0;
  }
  #level-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 0%;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--hud-accent) 65%, white),
      var(--hud-accent) 60%,
      color-mix(in srgb, var(--hud-accent) 82%, black)
    );
    transition: width 0.25s ease-out;
  }
  #level-label {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.55);
  }
  #level-up-text {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--hud-accent);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    opacity: 0;
  }
  #level-badge.pop { animation: badge-pop 0.6s ease; }
  #level-badge.pop::after { animation: badge-ring 0.6s ease-out; }
  #level-track.flash::before { animation: track-flash 0.5s ease-out; }
  #level-up-text.show { animation: level-up-rise 1.2s ease-out; }
  @keyframes badge-pop {
    30% { transform: scale(1.3); border-color: #fff; }
    55% { transform: scale(0.95); }
  }
  @keyframes badge-ring {
    0% { opacity: 0.9; transform: scale(1); }
    100% { opacity: 0; transform: scale(2); }
  }
  @keyframes track-flash {
    0% { opacity: 0.85; }
    100% { opacity: 0; }
  }
  @keyframes level-up-rise {
    0% { opacity: 0; transform: translateY(16px) scale(0.6); }
    15% { opacity: 1; transform: translateY(0) scale(1.15); }
    30% { transform: translateY(0) scale(1); }
    70% { opacity: 1; }
    100% { opacity: 0; transform: translateY(-34px) scale(1); }
  }
  #level-score {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 16px;
    z-index: 2;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    opacity: 0.8;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.55);
  }
  #timer-hud {
    position: fixed;
    right: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    z-index: 10;
    display: flex;
    align-items: baseline;
    gap: 10px;
    height: 44px;
    padding: 0 20px;
    border-radius: 22px;
    background: rgba(20, 17, 14, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    color: #fff;
    font-family: system-ui, sans-serif;
    line-height: 40px;
    pointer-events: none;
    user-select: none;
  }
  #timer-hud .caption {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--hud-accent);
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.55);
  }
  #timer-hud .value {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1px;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.55);
  }
  .score-pop {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 10;
    font-family: system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: 1px;
    color: var(--hud-accent);
    -webkit-text-stroke: 1.5px rgba(0, 0, 0, 0.35);
    text-shadow: 0 0 16px currentColor, 0 3px 10px rgba(0, 0, 0, 0.7);
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    animation: score-pop-rise 1s ease-out forwards;
  }
  @keyframes score-pop-rise {
    0% { opacity: 0; transform: translate(-50%, -100%) translateY(16px) scale(0.3); }
    14% { opacity: 1; transform: translate(-50%, -100%) scale(1.55); }
    30% { transform: translate(-50%, -100%) scale(1); }
    70% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, -100%) translateY(-80px) scale(1.05); }
  }
  /* Mobile (body.touch \u2014 same detection as the joystick): the joystick owns
     the lower half, so both HUD pills move to the top \u2014 level bar first,
     timer stacked below it \u2014 and the LEVEL UP text flips underneath the bar
     so it can't clip past the screen edge. */
  body.touch #level-hud {
    top: calc(16px + env(safe-area-inset-top, 0px));
    bottom: auto;
  }
  body.touch #timer-hud {
    top: calc(110px + env(safe-area-inset-top, 0px));
    bottom: auto;
  }
  body.touch #level-up-text {
    top: calc(100% + 10px);
    bottom: auto;
  }
`;
document.head.appendChild(hudStyle);
var levelHud = document.createElement("div");
levelHud.id = "level-hud";
levelHud.style.display = "none";
var levelBadge = document.createElement("div");
levelBadge.id = "level-badge";
var levelCaption = document.createElement("div");
levelCaption.className = "caption";
levelCaption.textContent = "LVL";
var levelValue = document.createElement("div");
levelValue.className = "value";
levelBadge.append(levelCaption, levelValue);
var levelTrack = document.createElement("div");
levelTrack.id = "level-track";
var levelFill = document.createElement("div");
levelFill.id = "level-fill";
var levelLabel = document.createElement("div");
levelLabel.id = "level-label";
var levelScore = document.createElement("div");
levelScore.id = "level-score";
levelTrack.append(levelFill, levelLabel, levelScore);
var levelUpText = document.createElement("div");
levelUpText.id = "level-up-text";
levelHud.append(levelBadge, levelTrack, levelUpText);
(document.getElementById("root") ?? document.body).appendChild(levelHud);
var timerHud = document.createElement("div");
timerHud.id = "timer-hud";
timerHud.style.display = "none";
var timerCaption = document.createElement("div");
timerCaption.className = "caption";
timerCaption.textContent = "TIME";
var timerValue = document.createElement("div");
timerValue.className = "value";
timerValue.textContent = "0:00.0";
timerHud.append(timerCaption, timerValue);
(document.getElementById("root") ?? document.body).appendChild(timerHud);
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, "0")}`;
}
function updateTimer() {
  const text = formatTime(levelTime);
  if (timerValue.textContent !== text) timerValue.textContent = text;
}
function applyHudVisibility() {
  levelHud.style.display = params.showHud && started ? "" : "none";
  timerHud.style.display = params.showHud && params.showTimer && started ? "" : "none";
}
function replayAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}
function celebrateLevelUp(level) {
  levelUpText.textContent = `LEVEL ${level + 1}!`;
  replayAnimation(levelBadge, "pop");
  replayAnimation(levelTrack, "flash");
  replayAnimation(levelUpText, "show");
}
var hudLevel = -1;
function updateHUD() {
  const cleared = totalProps > 0 && aliveCount === 0;
  const level = currentLevel();
  const within = score - levelStartScore(level);
  const needed = levelCost(level);
  const fillWidth = `${(cleared ? 1 : within / needed) * 100}%`;
  if (level === hudLevel) {
    levelFill.style.width = fillWidth;
  } else {
    levelFill.style.transition = "none";
    levelFill.style.width = fillWidth;
    void levelFill.offsetWidth;
    levelFill.style.transition = "";
    if (hudLevel !== -1 && level > hudLevel) celebrateLevelUp(level);
    hudLevel = level;
  }
  levelValue.textContent = `${level + 1}`;
  levelLabel.textContent = cleared ? "CITY CLEARED!" : `${within} / ${needed}`;
  levelScore.textContent = `${score} PTS`;
}
var scorePopups = [];
var popupWorldPos = new THREE5.Vector3();
function positionScorePopup(popup) {
  popupWorldPos.set(popup.x, 0, popup.z).project(camera);
  popup.el.style.left = `${(popupWorldPos.x * 0.5 + 0.5) * innerWidth + popup.jitter}px`;
  popup.el.style.top = `${(popupWorldPos.y * -0.5 + 0.5) * innerHeight}px`;
}
function spawnScorePopup(points, x = holeViewX, z = holeViewZ) {
  if (!params.showPopups) return;
  const el = document.createElement("div");
  el.className = "score-pop";
  el.textContent = `+${points}`;
  el.style.fontSize = `${Math.round(params.popupSize * Math.min(2.5, 1 + (points - 1) * params.popupGrowth))}px`;
  const popup = { el, x, z, jitter: (Math.random() - 0.5) * 48 };
  el.addEventListener("animationend", () => {
    el.remove();
    scorePopups.splice(scorePopups.indexOf(popup), 1);
  });
  positionScorePopup(popup);
  (document.getElementById("root") ?? document.body).appendChild(el);
  scorePopups.push(popup);
}
function updateScorePopups() {
  if (scorePopups.length === 0) return;
  camera.updateMatrixWorld();
  for (const popup of scorePopups) positionScorePopup(popup);
}
function clearScorePopups() {
  for (const popup of scorePopups) popup.el.remove();
  scorePopups.length = 0;
}
var clearedStyle = document.createElement("style");
clearedStyle.textContent = `
  #confetti-layer {
    position: fixed;
    inset: 0;
    z-index: 16;
    overflow: hidden;
    pointer-events: none;
  }
  .confetto {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
  }
  #cleared-overlay {
    position: fixed;
    inset: 0;
    z-index: 17;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    font-family: system-ui, sans-serif;
    text-align: center;
    pointer-events: none;
    user-select: none;
  }
  #cleared-overlay.show {
    display: flex;
  }
  #cleared-title {
    /* the .title-word letterpress layers read these \u2014 same slots as #start-title */
    --title-hungry: ${params.titleHungryColor};
    --title-manhole: ${params.titleManholeColor};
    --title-outline: ${params.titleOutlineColor};
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Luckiest Guy', 'Arial Black', system-ui, sans-serif;
    font-size: clamp(40px, 9vw, 88px);
    line-height: 0.92;
    animation: title-bob 3.8s ease-in-out infinite alternate;
  }
  #cleared-score {
    margin-top: 18px;
    font-size: clamp(30px, 5vw, 44px);
    font-weight: 900;
    letter-spacing: 2px;
    color: var(--hud-accent);
    -webkit-text-stroke: 1.5px rgba(0, 0, 0, 0.35);
    text-shadow: 0 0 18px currentColor, 0 3px 10px rgba(0, 0, 0, 0.7);
    animation: cleared-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s backwards;
  }
  #cleared-score.land { animation: score-land 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
  #cleared-time {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: clamp(18px, 3vw, 26px);
    font-weight: 900;
    letter-spacing: 2px;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    animation: cleared-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s backwards;
  }
  #cleared-time .caption {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 3px;
    color: var(--hud-accent);
  }
  #cleared-subtitle {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 4px;
    opacity: 0.92;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    animation: cleared-pop 0.5s ease-out 0.5s backwards;
  }
  /* pulse lives on the wrapper so the button's own hover scale still works */
  #next-level-wrap {
    margin-top: 26px;
    animation:
      cleared-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s backwards,
      button-hungry 1.5s ease-in-out 1.4s infinite alternate;
  }
  #cleared-hint {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1.5px;
    opacity: 0.8;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    animation: cleared-pop 0.5s ease-out 0.85s backwards;
  }
  @keyframes cleared-pop {
    from { opacity: 0; transform: scale(0.3) rotate(-4deg); }
    to { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes score-land {
    35% { transform: scale(1.35); }
    70% { transform: scale(0.94); }
  }
  @keyframes button-hungry {
    from { transform: scale(1); }
    to { transform: scale(1.08); }
  }
`;
document.head.appendChild(clearedStyle);
var confettiLayer = document.createElement("div");
confettiLayer.id = "confetti-layer";
(document.getElementById("root") ?? document.body).appendChild(confettiLayer);
var clearedOverlay = document.createElement("div");
clearedOverlay.id = "cleared-overlay";
var clearedTitle = document.createElement("div");
clearedTitle.id = "cleared-title";
for (const word of ["LEVEL", "CLEARED!"]) {
  const wordEl = document.createElement("span");
  wordEl.className = "title-word";
  wordEl.dataset.text = word;
  wordEl.textContent = word;
  clearedTitle.appendChild(wordEl);
}
var clearedScore = document.createElement("div");
clearedScore.id = "cleared-score";
var clearedTime = document.createElement("div");
clearedTime.id = "cleared-time";
var clearedTimeCaption = document.createElement("div");
clearedTimeCaption.className = "caption";
clearedTimeCaption.textContent = "TIME";
var clearedTimeValue = document.createElement("div");
clearedTime.append(clearedTimeCaption, clearedTimeValue);
var clearedSubtitle = document.createElement("div");
clearedSubtitle.id = "cleared-subtitle";
var nextLevelWrap = document.createElement("div");
nextLevelWrap.id = "next-level-wrap";
var nextLevelButton = document.createElement("button");
nextLevelButton.id = "next-level-button";
nextLevelButton.textContent = "NEXT LEVEL";
nextLevelWrap.appendChild(nextLevelButton);
var clearedHint = document.createElement("div");
clearedHint.id = "cleared-hint";
clearedHint.textContent = "ENTER for the next level \u2014 R to restart";
clearedOverlay.append(clearedTitle, clearedScore, clearedTime, clearedSubtitle, nextLevelWrap, clearedHint);
(document.getElementById("root") ?? document.body).appendChild(clearedOverlay);
var CLEARED_LINES = ["STILL HUNGRY?", "WHAT A MEAL!", "DELICIOUS!", "CITY DEVOURED!", "CHEF'S KISS!"];
function burstConfetti(intensity = 1) {
  if (!params.showConfetti) return;
  const colors = [params.hudColor, params.titleHungryColor, params.titleManholeColor, "#ffffff"];
  const count = Math.round(params.confettiCount * intensity);
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetto";
    const size = 6 + Math.random() * 8;
    el.style.width = `${size}px`;
    el.style.height = `${size * (0.4 + Math.random() * 0.7)}px`;
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    if (Math.random() < 0.25) el.style.borderRadius = "50%";
    el.style.left = `${innerWidth / 2 + (Math.random() - 0.5) * 80}px`;
    el.style.top = `${innerHeight * 0.42}px`;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const speed = (0.25 + Math.random() * 0.6) * innerHeight;
    const upX = Math.cos(angle) * speed;
    const upY = Math.sin(angle) * speed;
    const endX = upX * (1.3 + Math.random() * 0.7);
    const endY = upY + innerHeight * 1.6;
    const ax = Math.random();
    const ay = Math.random();
    const az = Math.random();
    const spin = (180 + Math.random() * 540) * (Math.random() < 0.5 ? -1 : 1);
    const anim = el.animate(
      [
        {
          transform: `translate(0, 0) rotate3d(${ax}, ${ay}, ${az}, 0deg)`,
          easing: "cubic-bezier(0.12, 0.75, 0.35, 1)"
        },
        {
          transform: `translate(${upX}px, ${upY}px) rotate3d(${ax}, ${ay}, ${az}, ${spin * 0.4}deg)`,
          offset: 0.35,
          easing: "cubic-bezier(0.45, 0.05, 0.85, 0.55)"
        },
        { transform: `translate(${endX}px, ${endY}px) rotate3d(${ax}, ${ay}, ${az}, ${spin}deg)` }
      ],
      { duration: 1500 + Math.random() * 900, delay: Math.random() * 200, fill: "both" }
    );
    anim.onfinish = () => el.remove();
    confettiLayer.appendChild(el);
  }
}
var clearedTimeout = 0;
var clearedCountRaf = 0;
var clearedShown = false;
function animateClearedScore(target) {
  cancelAnimationFrame(clearedCountRaf);
  const start = performance.now();
  const tick = (now) => {
    const t = THREE5.MathUtils.clamp((now - start - 350) / 900, 0, 1);
    clearedScore.textContent = `${Math.round(target * (1 - (1 - t) ** 3))} PTS`;
    if (t < 1) {
      clearedCountRaf = requestAnimationFrame(tick);
    } else {
      replayAnimation(clearedScore, "land");
      burstConfetti(0.35);
    }
  };
  clearedCountRaf = requestAnimationFrame(tick);
}
function scheduleLevelCleared() {
  if (clearedShown || clearedTimeout) return;
  clearedTimeout = setTimeout(showLevelCleared, params.clearedDelay * 1e3);
}
function showLevelCleared() {
  clearTimeout(clearedTimeout);
  clearedTimeout = 0;
  clearedShown = true;
  clearedScore.classList.remove("land");
  clearedScore.textContent = "0 PTS";
  clearedTimeValue.textContent = formatTime(levelTime);
  clearedSubtitle.textContent = CLEARED_LINES[Math.floor(Math.random() * CLEARED_LINES.length)];
  replayAnimation(clearedOverlay, "show");
  playSound(trumpetsSound, params.trumpetsVolume);
  burstConfetti();
  animateClearedScore(score);
}
function hideLevelCleared() {
  clearTimeout(clearedTimeout);
  cancelAnimationFrame(clearedCountRaf);
  clearedTimeout = 0;
  clearedShown = false;
  clearedOverlay.classList.remove("show");
  clearedScore.classList.remove("land");
  confettiLayer.replaceChildren();
}
function nextLevel() {
  restart();
  resetCamera();
  startGame();
}
nextLevelButton.addEventListener("click", nextLevel);
var gui = new GUI({ title: "Physics Hole", closeFolders: true });
function applyShowColliders() {
  const visible = params.debug && params.showColliders;
  for (const wireframe of colliderWireframes) {
    wireframe.visible = visible;
  }
  for (let i = 0; i < propCount; i++) {
    if (propWireframes[i]) propWireframes[i].visible = visible;
  }
}
function setDebug(v) {
  params.debug = v;
  gui.domElement.style.display = v ? "" : "none";
  stats.dom.style.display = v ? "" : "none";
  controls.enabled = v;
  applyShowColliders();
  applyNavmeshVisibility();
}
gui.add(params, "debug").name("Debug (P)").onChange(setDebug);
gui.add(params, "cameraFov", 15, 90, 1).name("Camera FOV").onChange(applyView);
gui.add(params, "cameraFollow").name("Camera Follow");
gui.add(params, "followDamping", 0.5, 10, 0.1).name("Follow Damping");
gui.add(params, "toneMapping", Object.keys(TONE_MAPPING)).name("Tonemapping").onChange(applyView);
gui.add(params, "toneMappingExposure", 0, 2, 0.01).name("Tonemap Exposure").onChange(applyView);
var inputFolder = gui.addFolder("Controls");
inputFolder.add(params, "joystickMode", ["auto", "on", "off"]).name("Touch Joystick").onChange(applyJoystick);
inputFolder.add(params, "joystickSize", 80, 240, 1).name("Joystick Size (px)").onChange(applyJoystick);
inputFolder.add(params, "joystickMargin", 0, 100, 1).name("Joystick Margin (px)").onChange(applyJoystick);
inputFolder.add(params, "joystickKnobScale", 0.25, 0.7, 0.01).name("Joystick Knob Scale").onChange(applyJoystick);
inputFolder.add(params, "joystickDeadZone", 0, 0.5, 0.01).name("Joystick Dead Zone");
inputFolder.add(params, "joystickIdleOpacity", 0.1, 1, 0.01).name("Joystick Idle Opacity").onChange(applyJoystick);
inputFolder.add(params, "gamepadDeadZone", 0, 0.5, 0.01).name("Gamepad Dead Zone");
inputFolder.add(params, "gamepadRotateSpeed", 0.2, 6, 0.1).name("Gamepad Orbit Speed");
inputFolder.add(params, "gamepadZoomSpeed", 0.1, 4, 0.05).name("Gamepad Zoom Speed");
inputFolder.add(params, "gamepadInvertX").name("Gamepad Invert X");
inputFolder.add(params, "gamepadInvertY").name("Gamepad Invert Y");
var holeFolder = gui.addFolder("Hole");
holeFolder.add(params, "holeSize", 0.5, 4, 0.05).name("Radius").onChange(applyHoleSize);
holeFolder.add(params, "coverPopVelocity", 0, 20, 0.5).name("Cover Pop Velocity");
holeFolder.add(params, "coverSpawnY", -1, 0.5, 0.01).name("Cover Spawn Y").onChange(() => {
  if (!started) seatCover(params.coverSpawnY);
});
holeFolder.add(params, "holeSizeMax", 1, 15, 0.1).name("Max Radius").onChange(() => {
  applyHoleSize();
  rebuildHole();
});
holeFolder.add(params, "holeSegments", 8, 96, 1).name("Segments").onChange(rebuildHole);
holeFolder.add(params, "holeSpeed", 2, 30, 0.5).name("Speed");
holeFolder.add(params, "holeAccel", 1, 30, 0.5).name("Acceleration");
holeFolder.add(params, "holeDepth", 1, 8, 0.5).name("Collider Depth").onChange(rebuildHole);
holeFolder.add(params, "collectDepthStart", 0.5, 20, 0.5).name("Collect Depth Start");
holeFolder.add(params, "collectDepthGrowth", 0, 4, 0.05).name("Collect Depth Growth");
holeFolder.add(params, "suction").name("Suction");
holeFolder.add(params, "suctionDownward", 0, 25, 0.5).name("Suction Downward");
holeFolder.add(params, "suctionRamp", 0.1, 3, 0.05).name("Suction Ramp");
holeFolder.add(params, "holeGrowth").name("Grow On Collect").onChange(applyHoleSize);
holeFolder.add(params, "growthEvery", 1, 100, 1).name("Level Points Step").onChange(applyHoleSize);
holeFolder.add(params, "growthFactor", 1, 1.5, 0.01).name("Growth Factor").onChange(applyHoleSize);
holeFolder.add(params, "growthFrequency", 0.5, 5, 0.1).name("Growth Frequency");
holeFolder.add(params, "growthBounce", 0, 0.95, 0.05).name("Growth Bounce");
holeFolder.add(params, "growthZoom", 0, 1.5, 0.05).name("Grow Zoom Strength");
holeFolder.add(params, "zoomDuration", 0.1, 6, 0.05).name("Grow Zoom Duration");
holeFolder.add(params, "showRim").name("Show Rim").onChange((v) => rimMesh.visible = v && started);
holeFolder.addColor(params, "rimColor").name("Rim Color").onChange((v) => rimMaterial.color.set(v));
holeFolder.add(params, "rimThickness", 0.02, 0.3, 5e-3).name("Rim Thickness").onChange(layoutRim);
var cutoutFolder = gui.addFolder("See-Through");
cutoutFolder.add(params, "cutoutEnabled").name("Enabled");
cutoutFolder.add(params, "cutoutScale", 0.5, 2.5, 0.01).name("Cone Scale");
cutoutFolder.add(params, "cutoutPadding", 0, 3, 0.05).name("Cone Padding (m)");
cutoutFolder.add(params, "cutoutSwallowScale", 0.5, 3, 0.05).name("Swallow Cutoff \xD7");
cutoutFolder.add(params, "cutoutFeather", 0.05, 4, 0.05).name("Feather (m)");
cutoutFolder.add(params, "cutoutOpacity", 0, 0.6, 0.01).name("Ghost Opacity");
cutoutFolder.add(params, "cutoutRelease", 0.05, 0.5, 0.01).name("Release Near Hole");
var cullFolder = gui.addFolder("Culling");
cullFolder.add(params, "cullEnabled").name("Enabled");
cullFolder.add(params, "cullMargin", 0, 3, 0.05).name("Sphere Margin (m)");
cullFolder.add(params, "offscreenCasters", ["box", "full", "cull"]).name("Off-Screen Casters");
cullFolder.add(params, "cullSort").name("Sort Front-To-Back");
cullFolder.add(params, "occlusionEnabled").name("Occlusion Culling");
cullFolder.add(params, "occluderMax", 0, MAX_OCCLUDERS, 1).name("Max Occluders");
cullFolder.add(params, "occluderShrink", 0.5, 1, 0.01).name("Occluder Shrink");
cullFolder.add(params, "lodPopPixels", 0, 8, 0.05).name("LOD Error (px)");
cullFolder.add(params, "lodHysteresis", 0, 0.5, 0.01).name("LOD Hysteresis");
cullFolder.add(params, "lodHoleClampRadius", 0, 4, 0.1).name("LOD Hole Clamp");
cullFolder.add(params, "lodForceCheapest").name("Force Cheapest LOD");
cullFolder.add(params, "showBuildings").name("Show Buildings");
cullFolder.add(params, "showCrates").name("Show Crates");
cullFolder.add(params, "showCardboardBoxes").name("Show Cardboard Boxes");
cullFolder.add(params, "showFruitCrates").name("Show Fruit Crates");
cullFolder.add(cullStats, "alive").name("Instances Alive").listen().disable();
cullFolder.add(cullStats, "drawn").name("Instances Drawn").listen().disable();
cullFolder.add(cullStats, "peds").name("Pedestrians Drawn").listen().disable();
cullFolder.add(cullStats, "offscreen").name("Frustum Culled").listen().disable();
cullFolder.add(cullStats, "occluded").name("Occlusion Culled").listen().disable();
cullFolder.add(cullStats, "proxied").name("Shadow Proxies").listen().disable();
cullFolder.add(cullStats, "lod0").name("LOD0 Drawn").listen().disable();
cullFolder.add(cullStats, "lod1").name("LOD1 Drawn").listen().disable();
cullFolder.add(cullStats, "lod2").name("LOD2 Drawn").listen().disable();
var scoringFolder = gui.addFolder("Scoring");
for (const def of MODEL_DEFS) {
  scoringFolder.add(params, `points_${def.key}`, 0, 60, 1).name(def.key).onChange(recomputePropPoints);
}
var hudFolder = gui.addFolder("HUD");
hudFolder.add(params, "showHud").name("Show Level Bar").onChange(applyHudVisibility);
hudFolder.add(params, "showTimer").name("Show Timer").onChange(applyHudVisibility);
hudFolder.addColor(params, "hudColor").name("Accent Color").onChange((v) => document.body.style.setProperty("--hud-accent", v));
hudFolder.addColor(params, "titleHungryColor").name('Title "Hungry"').onChange((v) => {
  startTitle.style.setProperty("--title-hungry", v);
  clearedTitle.style.setProperty("--title-hungry", v);
});
hudFolder.addColor(params, "titleManholeColor").name('Title "Manhole"').onChange((v) => {
  startTitle.style.setProperty("--title-manhole", v);
  clearedTitle.style.setProperty("--title-manhole", v);
});
hudFolder.addColor(params, "titleOutlineColor").name("Title Outline").onChange((v) => {
  startTitle.style.setProperty("--title-outline", v);
  clearedTitle.style.setProperty("--title-outline", v);
});
hudFolder.add(params, "showPopups").name("Score Popups");
hudFolder.add(params, "popupSize", 12, 72, 1).name("Popup Size");
hudFolder.add(params, "popupGrowth", 0, 0.5, 0.01).name("Popup Growth /pt");
hudFolder.add(params, "clearedDelay", 0, 3, 0.05).name("Cleared Delay (s)");
hudFolder.add(params, "showConfetti").name("Cleared Confetti");
hudFolder.add(params, "confettiCount", 20, 400, 5).name("Confetti Count");
hudFolder.add({ preview: () => celebrateLevelUp(hudLevel + 1) }, "preview").name("Preview Level Up");
hudFolder.add({ preview: () => spawnScorePopup(1 + Math.floor(Math.random() * 24)) }, "preview").name("Preview Popup");
hudFolder.add({ preview: () => showLevelCleared() }, "preview").name("Preview Level Cleared");
var soundFolder = gui.addFolder("Sound");
soundFolder.add(params, "sound").name("Sound");
soundFolder.add(params, "chimeVolume", 0, 1, 0.01).name("Chime Volume");
soundFolder.add(params, "chimePitchJitter", 0, 0.3, 0.01).name("Chime Pitch Jitter");
soundFolder.add(params, "trumpetsVolume", 0, 1, 0.01).name("Trumpets Volume");
soundFolder.add({ preview: () => playChime() }, "preview").name("Preview Chime");
soundFolder.add({ preview: () => playSound(trumpetsSound, params.trumpetsVolume) }, "preview").name("Preview Trumpets");
var cityFolder = gui.addFolder("City");
cityFolder.add(params, "buildingCount", 0, 24, 1).name("Buildings").onFinishChange(restart);
cityFolder.add(params, "treeCount", 0, 32, 1).name("Trees").onFinishChange(restart);
cityFolder.add(params, "benchCount", 0, 16, 1).name("Benches").onFinishChange(restart);
cityFolder.add(params, "hydrantCount", 0, 8, 1).name("Fire Hydrants").onFinishChange(restart);
cityFolder.add(params, "crateStackCount", 0, 32, 1).name("Box Towers").onFinishChange(restart);
cityFolder.add(params, "crateStackLevelsMin", 1, 40, 1).name("Tower Levels Min").onFinishChange(restart);
cityFolder.add(params, "crateStackLevelsMax", 1, 40, 1).name("Tower Levels Max").onFinishChange(restart);
cityFolder.add(params, "cratePyramidCount", 0, 40, 1).name("Box Pyramids").onFinishChange(restart);
cityFolder.add(params, "crateQuadCount", 0, 24, 1).name("Box Quads").onFinishChange(restart);
cityFolder.add(params, "crateBacklotCount", 0, 24, 1).name("Backlot Towers").onFinishChange(restart);
cityFolder.add(params, "crateBacklotLevelsMin", 1, 60, 1).name("Backlot Levels Min").onFinishChange(restart);
cityFolder.add(params, "crateBacklotLevelsMax", 1, 60, 1).name("Backlot Levels Max").onFinishChange(restart);
cityFolder.add(params, "globalScale", 0.5, 2, 0.05).name("Global Scale (respawns)").onFinishChange(restart);
cityFolder.add(params, "sizeVariation", 0, 0.3, 0.01).name("Size Variation").onFinishChange(restart);
cityFolder.add(params, "propFriction", 0, 1.5, 0.05).name("Friction (respawns)").onFinishChange(restart);
cityFolder.add(params, "propRestitution", 0, 1, 0.05).name("Restitution (respawns)").onFinishChange(restart);
cityFolder.add(params, "rollingResistance", 0, 0.5, 0.01).name("Rolling Resist (respawns)").onFinishChange(restart);
var pedestriansFolder = gui.addFolder("Pedestrians");
var respawnPedestrians = () => {
  spawnPedestrians();
  reattachCarAgents();
};
pedestriansFolder.add(params, "pedestrianCount", 0, 64, 1).name("Count").onFinishChange(respawnPedestrians);
pedestriansFolder.add(params, "pedestrianPoints", 0, 20, 1).name("Points");
pedestriansFolder.add(params, "pedestrianWalkSpeed", 0.2, 3, 0.05).name("Walk Speed");
pedestriansFolder.add(params, "pedestrianRunSpeed", 1, 8, 0.1).name("Run Speed");
pedestriansFolder.add(params, "pedestrianWalkStride", 0.4, 3, 0.05).name("Walk Stride (m)");
pedestriansFolder.add(params, "pedestrianRunStride", 1, 6, 0.05).name("Run Stride (m)");
pedestriansFolder.add(params, "pedestrianTurnRate", 2, 25, 0.5).name("Turn Rate");
pedestriansFolder.add(params, "pedestrianWalkAccel", 1, 20, 0.5).name("Walk Accel");
pedestriansFolder.add(params, "pedestrianRunAccel", 2, 30, 0.5).name("Run Accel");
pedestriansFolder.add(params, "pedestrianSeparationWeight", 0, 10, 0.1).name("Separation");
pedestriansFolder.add(params, "pedestrianCollisionRangeMult", 2, 30, 0.5).name("Avoid Range (\xD7radius)");
pedestriansFolder.add(params, "pedestrianAnimFade", 0.05, 1, 0.01).name("Anim Crossfade (s)");
pedestriansFolder.add(params, "pedestrianEmissive", 0, 1, 0.01).name("Emissive");
pedestriansFolder.add(params, "pedestrianFallInset", 0, 1, 0.01).name("Fall Inset (m)");
pedestriansFolder.add(params, "pedestrianFallPull", 0, 3, 0.05).name("Fall Pull");
pedestriansFolder.add(params, "panicRadius", 1, 30, 0.5).name("Panic Radius (m)");
pedestriansFolder.add(params, "panicRadiusGrowth", 0, 5, 0.1).name("Panic Radius Growth");
pedestriansFolder.add(params, "panicDuration", 0.5, 15, 0.5).name("Panic Duration (s)");
pedestriansFolder.add(params, "fleeDistance", 3, 30, 0.5).name("Flee Distance (m)");
pedestriansFolder.add(params, "fleeSpread", 0, Math.PI, 0.05).name("Flee Spread (rad)");
pedestriansFolder.add(params, "fleeReplanCooldown", 0, 3, 0.05).name("Flee Replan CD (s)");
pedestriansFolder.add(params, "pedestrianStuckSpeed", 0.05, 1, 0.01).name("Stalled Speed (m/s)");
pedestriansFolder.add(params, "stuckRepathWalk", 0.5, 6, 0.1).name("Stuck Repath Walk (s)");
pedestriansFolder.add(params, "stuckRepathRun", 0.2, 3, 0.1).name("Stuck Repath Run (s)");
pedestriansFolder.add(params, "stuckReseatAfter", 1, 8, 1).name("Re-seat After Repaths");
pedestriansFolder.add(params, "pedestrianHoverMargin", 0, 0.5, 0.01).name("Rim Fall Margin (m)");
pedestriansFolder.add(params, "pedestrianIdleSpeed", 0, 0.5, 0.01).name("Idle Below (m/s)");
pedestriansFolder.add(params, "wanderRadius", 3, 40, 0.5).name("Wander Radius (m)");
for (const def of HUMAN_DEFS) {
  pedestriansFolder.add(params, `size_${def.key}`, def.height * 0.5, def.height * 2, 0.01).name(`${def.key} height`).onFinishChange(respawnPedestrians);
}
var trafficFolder = gui.addFolder("Traffic");
trafficFolder.add(params, "carCount", 0, 12, 1).name("Driving Cars").onFinishChange(restart);
trafficFolder.add(params, "carSpawnDelay", 0, 10, 0.5).name("Spawn Delay (s)");
trafficFolder.add(params, "carRecoverDelay", 0, 10, 0.5).name("Recover Delay (s)");
trafficFolder.add(params, "carSpeed", 1, 15, 0.1).name("Speed");
trafficFolder.add(params, "carAccel", 1, 20, 0.5).name("Acceleration");
trafficFolder.add(params, "carSpookSpeed", 1, 20, 0.1).name("Spooked Speed");
trafficFolder.add(params, "carSpookAccel", 2, 30, 0.5).name("Spooked Accel");
trafficFolder.add(params, "carTurnRate", 1, 15, 0.5).name("Turn Rate");
trafficFolder.add(params, "carBrakeDistance", 1, 12, 0.1).name("Brake Distance (m)");
trafficFolder.add(params, "carBrakeWidth", 0.5, 5, 0.1).name("Brake Width (m)");
trafficFolder.add(params, "carRouteMargin", 2, 15, 0.5).name("Route Edge Margin (m)");
var navmeshFolder = gui.addFolder("Navmesh");
navmeshFolder.add(params, "navmeshCellSize", 0.08, 0.4, 0.01).name("Cell Size (m)").onFinishChange(restart);
navmeshFolder.add(params, "navmeshAgentRadius", 0.05, 0.6, 0.01).name("Agent Radius (m)").onFinishChange(restart);
navmeshFolder.add(params, "showNavmesh").name("Show Navmesh").onChange(applyNavmeshVisibility);
navmeshFolder.addColor(params, "navmeshColor").name("Pavement Color").onChange((v) => {
  navmeshDebugWalkMesh.material.color.set(v);
  navmeshDebugLines.material.color.set(v);
});
navmeshFolder.addColor(params, "navmeshRoadColor").name("Road Color").onChange((v) => navmeshDebugRoadMesh.material.color.set(v));
var modelsFolder = gui.addFolder("Models (reload)");
var saveAndReload = () => {
  location.reload();
};
modelsFolder.add(params, "modelSimplifyRatio", 0.02, 1, 0.01).name("Simplify Ratio").onFinishChange(saveAndReload);
modelsFolder.add(params, "modelTrisPerMeter", 0, 1e4, 100).name("Tris / Meter").onFinishChange(saveAndReload);
modelsFolder.add(params, "modelTrisMin", 500, 2e4, 100).name("Tris Floor").onFinishChange(saveAndReload);
modelsFolder.add(params, "modelSimplifyError", 1e-3, 0.1, 1e-3).name("Simplify Error").onFinishChange(saveAndReload);
modelsFolder.add(params, "modelSimplifyLockBorder").name("Lock Borders").onFinishChange(saveAndReload);
modelsFolder.add(params, "lodEnabled").name("LOD Chain").onFinishChange(saveAndReload);
modelsFolder.add(params, "lodRatio1", 0.05, 1, 0.01).name("LOD1 Ratio").onFinishChange(saveAndReload);
modelsFolder.add(params, "lodRatio2", 0.02, 1, 0.01).name("LOD2 Ratio").onFinishChange(saveAndReload);
modelsFolder.add(params, "lodError1", 0.01, 0.3, 5e-3).name("LOD1 Error").onFinishChange(saveAndReload);
modelsFolder.add(params, "lodError2", 0.02, 0.5, 5e-3).name("LOD2 Error").onFinishChange(saveAndReload);
modelsFolder.add(params, "lodTrisMin", 0, 2e3, 50).name("LOD Tris Floor").onFinishChange(saveAndReload);
var detailFolder = modelsFolder.addFolder("Per-Model Detail");
detailFolder.close();
for (const def of [...MODEL_DEFS, ...HUMAN_DEFS]) {
  detailFolder.add(params, `detail_${def.key}`, 0.25, 16, 0.25).name(def.key).onFinishChange(saveAndReload);
}
var lodDetailFolder = modelsFolder.addFolder("Per-Model LOD Detail");
lodDetailFolder.close();
for (const def of MODEL_DEFS) {
  lodDetailFolder.add(params, `lodDetail_${def.key}`, 0.25, 8, 0.25).name(def.key).onFinishChange(saveAndReload);
}
var sizesFolder = gui.addFolder("Prop Sizes (respawn)");
sizesFolder.close();
for (const def of MODEL_DEFS) {
  sizesFolder.add(params, `size_${def.key}`, def.height * 0.25, def.height * 3, 0.01).name(def.key).onFinishChange(() => {
    applyPropSizes();
    restart();
  });
}
var physicsFolder = gui.addFolder("Physics");
physicsFolder.add(params, "gravityY", -60, -2, 0.5).name("Gravity Y").onChange((v) => b3.b3World_SetGravity(world, { x: 0, y: v, z: 0 }));
physicsFolder.add(params, "substeps", 1, 8, 1).name("Substeps");
physicsFolder.add(params, "sleeping").name("Sleeping").onChange((v) => b3.b3World_EnableSleeping(world, v));
physicsFolder.add(params, "ccd").name("CCD").onChange((v) => b3.b3World_EnableContinuous(world, v));
physicsFolder.add(params, "speculative").name("Speculative Contacts").onChange((v) => b3.b3World_EnableSpeculative(world, v));
physicsFolder.add(params, "wakeMargin", 0, 4, 0.1).name("Wake Margin");
physicsFolder.add(params, "showColliders").name("Show Colliders").onChange(applyShowColliders);
var arenaFolder = gui.addFolder("Arena");
arenaFolder.add(params, "arenaHalf", 8, 40, 1).name("Arena Half Size").onFinishChange(() => {
  rebuildWalls();
  rebuildBoundaryPlanes();
  applyShadowCamera();
  restart();
});
arenaFolder.add(params, "walls").name("Boundary Walls").onChange(rebuildWalls);
arenaFolder.add(params, "boundaryPlanes").name("Containment Planes").onChange(rebuildBoundaryPlanes);
arenaFolder.add(params, "showBounds").name("Show Bounds").onChange(layoutBounds);
arenaFolder.addColor(params, "boundsColor").name("Bounds Color").onChange((v) => boundsMaterial.color.set(v));
arenaFolder.add(params, "boundsOpacity", 0, 1, 0.01).name("Bounds Opacity").onChange((v) => boundsMaterial.opacity = v);
arenaFolder.add(params, "boundsThickness", 0.02, 0.5, 0.01).name("Bounds Thickness").onChange(layoutBounds);
arenaFolder.add(params, "wallHeight", 0.2, 3, 0.1).name("Wall Height").onFinishChange(rebuildWalls);
arenaFolder.add(params, "wallThickness", 0.2, 2, 0.1).name("Wall Thickness").onFinishChange(rebuildWalls);
arenaFolder.addColor(params, "wallColor").name("Wall Color").onChange((v) => wallMaterial.color.set(v));
arenaFolder.add(params, "wallRoughness", 0, 1, 0.01).name("Wall Roughness").onChange((v) => wallMaterial.roughness = v);
arenaFolder.add(params, "wallFriction", 0, 1.5, 0.05).name("Wall Friction").onChange(rebuildWalls);
var streetsFolder = gui.addFolder("Streets & Ground");
streetsFolder.add(params, "roadWidth", 5, 12, 0.5).name("Road Width").onFinishChange(restart);
streetsFolder.add(params, "sidewalkWidth", 1.5, 5, 0.1).name("Sidewalk Width").onFinishChange(restart);
streetsFolder.addColor(params, "asphaltColor").name("Asphalt");
streetsFolder.addColor(params, "sidewalkColor").name("Sidewalk");
streetsFolder.addColor(params, "blockColor").name("Block Pavement");
streetsFolder.addColor(params, "markingColor").name("Road Markings");
streetsFolder.add(params, "markingIntensity", 0, 1, 0.01).name("Marking Intensity");
streetsFolder.add(params, "dashLength", 1, 8, 0.1).name("Dash Length");
streetsFolder.add(params, "centerLineWidth", 0.05, 0.6, 0.01).name("Center Line Width");
streetsFolder.add(params, "crosswalkWidth", 0.5, 4, 0.1).name("Crosswalk Width");
streetsFolder.add(params, "crosswalkOffset", 0, 3, 0.05).name("Crosswalk Offset");
streetsFolder.add(params, "zebraPitch", 0.3, 2, 0.05).name("Zebra Pitch");
streetsFolder.add(params, "tileFrequency", 0.1, 2, 0.01).name("Tile Frequency");
streetsFolder.add(params, "gridIntensity", 0, 1, 0.01).name("Tile Grid Intensity");
streetsFolder.add(params, "gridLineWidth", 0, 0.2, 5e-3).name("Tile Line Width");
streetsFolder.add(params, "groundRoughness", 0, 1, 0.01).name("Roughness").onChange((v) => groundMaterial.roughness = v);
streetsFolder.add(params, "groundFriction", 0, 1.5, 0.05).name("Friction").onChange(rebuildHole);
var shaftFolder = gui.addFolder("Shaft");
shaftFolder.add(params, "shaftNoiseEnabled").name("Noise Texturing").onChange(applyShaftNoise);
shaftFolder.add(params, "shaftNoiseTexSize", [32, 64, 128]).name("Noise Tex Size").onChange(applyNoiseTexture);
shaftFolder.add(params, "shaftNoiseTile", [4, 8, 16]).name("Noise Tile Cells").onChange(applyNoiseTexture);
shaftFolder.add(params, "shaftVisualDepth", 10, 100, 1).name("Visual Depth").onChange(applyVoidDepth);
shaftFolder.add(params, "shaftFadeDepthMin", 1, 30, 0.5).name("Fade Depth Min");
shaftFolder.add(params, "shaftFadeDepthMax", 1, 30, 0.5).name("Fade Depth Max");
shaftFolder.add(params, "shaftDisplacementAmplitude", 0, 1.5, 0.01).name("Rock Amplitude");
shaftFolder.add(params, "shaftDisplacementFrequency", 0.1, 2, 0.01).name("Rock Frequency");
shaftFolder.add(params, "shaftRadialSegments", 32, 256, 8).name("Radial Segments").onChange(rebuildShaftGeometry);
shaftFolder.addColor(params, "shaftRockColorA").name("Rock A");
shaftFolder.addColor(params, "shaftRockColorB").name("Rock B");
shaftFolder.add(params, "shaftRockFrequency", 0.1, 3, 0.01).name("Noise Frequency");
shaftFolder.add(params, "shaftStrataFrequency", 0.1, 2, 0.01).name("Strata Frequency");
shaftFolder.add(params, "shaftStrataWarp", 0, 1.5, 0.01).name("Strata Warp");
shaftFolder.add(params, "shaftCreviceIntensity", 0, 1, 0.01).name("Crevices");
shaftFolder.addColor(params, "shaftColor").name("Deep Color");
shaftFolder.addColor(params, "voidColor").name("Void Color").onChange((v) => voidMesh.material.color.set(v));
var lightFolder = gui.addFolder("Lighting");
lightFolder.addColor(params, "ambientColor").name("Ambient Color").onChange((v) => ambientLight.color.set(v));
lightFolder.add(params, "ambientIntensity", 0, 3, 0.05).name("Ambient Intensity").onChange((v) => ambientLight.intensity = v);
lightFolder.addColor(params, "sunColor").name("Sun Color").onChange((v) => dirLight.color.set(v));
lightFolder.add(params, "sunIntensity", 0, 8, 0.1).name("Sun Intensity").onChange((v) => dirLight.intensity = v);
lightFolder.addColor(params, "hemiSkyColor").name("Hemi Sky Color").onChange((v) => hemiLight.color.set(v));
lightFolder.addColor(params, "hemiGroundColor").name("Hemi Ground Color").onChange((v) => hemiLight.groundColor.set(v));
lightFolder.add(params, "hemiIntensity", 0, 3, 0.05).name("Hemi Intensity").onChange((v) => hemiLight.intensity = v);
lightFolder.add(params, "shadows").name("Shadows").onChange((v) => dirLight.castShadow = v);
lightFolder.add(params, "shadowMapSize", [1024, 2048, 4096]).name("Shadow Map Size").onChange(applyShadowMapSize);
lightFolder.add(params, "shadowBias", -5e-3, 5e-3, 1e-4).name("Shadow Bias").onChange((v) => dirLight.shadow.bias = v);
lightFolder.add(params, "shadowNormalBias", 0, 0.2, 5e-3).name("Shadow Normal Bias").onChange((v) => dirLight.shadow.normalBias = v);
lightFolder.add(params, "shadowRadius", 0, 8, 0.1).name("Shadow Radius").onChange((v) => dirLight.shadow.radius = v);
lightFolder.add(params, "shadowIntensity", 0, 1, 0.01).name("Shadow Intensity").onChange((v) => dirLight.shadow.intensity = v);
lightFolder.add(params, "shadowCameraScale", 1, 3, 0.05).name("Shadow Cam Scale").onChange(applyShadowCamera);
lightFolder.add(params, "shadowCameraNear", 0.1, 20, 0.1).name("Shadow Cam Near").onChange(applyShadowCamera);
lightFolder.add(params, "shadowCameraFar", 40, 400, 5).name("Shadow Cam Far").onChange(applyShadowCamera);
var envFolder = gui.addFolder("Environment");
envFolder.addColor(params, "bgColor").name("Background").onChange((v) => scene.background.set(v));
envFolder.addColor(params, "fogColor").name("Fog Color");
envFolder.add(params, "fogNear", 0, 200, 1).name("Fog Near");
envFolder.add(params, "fogFar", 10, 500, 1).name("Fog Far");
var postFolder = gui.addFolder("Post-Processing");
postFolder.add(params, "vignetteIntensity", 0, 1, 0.01).name("Vignette Intensity");
postFolder.add(params, "vignetteRadius", 0, 0.7, 0.01).name("Vignette Radius");
postFolder.add(params, "vignetteSmoothness", 0.05, 1, 0.01).name("Vignette Smoothness");
postFolder.add(params, "splashVignetteIntensity", 0, 1, 0.01).name("Splash Vignette Intensity");
postFolder.add(params, "splashVignetteRadius", 0, 0.7, 0.01).name("Splash Vignette Radius");
postFolder.add(params, "splashVignetteSmoothness", 0.05, 1, 0.01).name("Splash Vignette Smoothness");
postFolder.add(params, "vignetteSoftenDuration", 0.1, 5, 0.1).name("Vignette Soften Duration");
setDebug(params.debug);
applyVoidDepth();
addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  if (e.key === "p" || e.key === "P") {
    setDebug(!params.debug);
    gui.controllers[0].updateDisplay();
  }
});
rebuildWalls();
rebuildBoundaryPlanes();
restart();
for (const model of models) {
  for (const bucket of model.buckets) {
    for (const mesh of bucket.meshes) mesh.count = Math.max(mesh.count, 1);
  }
}
renderPipeline.render();
startButton.disabled = false;
startOverlay.classList.remove("loading");
var physicsTimestep = new FixedTimestep({ dt: 1 / 60, maxSteps: 1 });
var tmpCameraOffset = new THREE5.Vector3();
var tmpSpherical = new THREE5.Spherical();
var lastFrameTime = -1;
function animate(timestamp) {
  const frameDt = lastFrameTime < 0 ? 0 : Math.min((timestamp - lastFrameTime) / 1e3, 0.1);
  lastFrameTime = timestamp;
  joystick.deadZone = params.joystickDeadZone;
  gamepad.deadZone = params.gamepadDeadZone;
  gamepad.update();
  if (gamepad.justPressed(GamepadInput.SOUTH) || gamepad.justPressed(GamepadInput.START)) {
    if (clearedShown) nextLevel();
    else startGame();
  }
  if (keys.KeyR || gamepad.justPressed(GamepadInput.BACK)) {
    restart();
    resetCamera();
    keys.KeyR = false;
  }
  if (started && vignetteBlend < 1) {
    vignetteBlend = Math.min(vignetteBlend + frameDt / params.vignetteSoftenDuration, 1);
  }
  if (started && aliveCount > 0) {
    levelTime += frameDt;
    updateTimer();
  }
  if (started && carSpawnCountdown >= 0) {
    carSpawnCountdown -= frameDt;
    if (carSpawnCountdown < 0) spawnDelayedCars();
  }
  const steps = physicsTimestep.update(timestamp);
  for (let i = 0; i < steps; i++) stepPhysics(physicsTimestep.dt);
  syncProps();
  updateHoleVisuals(physicsTimestep.alpha);
  updateCrowd(frameDt);
  updatePedestrians(frameDt);
  updateTraffic(frameDt);
  if (params.cameraFollow && frameDt > 0) {
    const x = THREE5.MathUtils.damp(controls.target.x, holeViewX, params.followDamping, frameDt);
    const z = THREE5.MathUtils.damp(controls.target.z, holeViewZ, params.followDamping, frameDt);
    camera.position.x += x - controls.target.x;
    camera.position.z += z - controls.target.z;
    controls.target.x = x;
    controls.target.z = z;
  }
  if (zoomViewRadius !== cameraViewRadius) {
    const ratio = (zoomViewRadius / cameraViewRadius) ** params.growthZoom;
    cameraViewRadius = zoomViewRadius;
    tmpCameraOffset.copy(camera.position).sub(controls.target);
    camera.position.copy(controls.target).addScaledVector(tmpCameraOffset, ratio);
  }
  if (gamepad.connected && frameDt > 0) {
    const orbitX = gamepad.rx * (params.gamepadInvertX ? -1 : 1) * params.gamepadRotateSpeed * frameDt;
    const orbitY = gamepad.ry * (params.gamepadInvertY ? -1 : 1) * params.gamepadRotateSpeed * frameDt;
    const dolly = (gamepad.lt - gamepad.rt) * params.gamepadZoomSpeed * frameDt;
    if (orbitX !== 0 || orbitY !== 0 || dolly !== 0) {
      tmpCameraOffset.copy(camera.position).sub(controls.target);
      tmpSpherical.setFromVector3(tmpCameraOffset);
      tmpSpherical.theta += orbitX;
      tmpSpherical.phi = THREE5.MathUtils.clamp(
        tmpSpherical.phi + orbitY,
        controls.minPolarAngle,
        controls.maxPolarAngle
      );
      tmpSpherical.radius = THREE5.MathUtils.clamp(
        tmpSpherical.radius * Math.exp(dolly),
        controls.minDistance,
        controls.maxDistance
      );
      camera.position.setFromSpherical(tmpSpherical).add(controls.target);
    }
  }
  controls.update();
  updateCutoutCone();
  packInstances(physicsTimestep.alpha);
  updateScorePopups();
  renderPipeline.render();
  stats.update();
  renderer.resolveTimestampsAsync("render");
}
renderer.setAnimationLoop(animate);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
