import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { renderer, scene as world } from '../engine/view.js';
import { touchDevice } from '../mobile/detect.js';
import { GEO } from './textures.js';
import { clip } from '../arena/clip.js';

let target = null;
let scene = null;
let cam = null;
const stamps = [];
let used = 0;
let pending = false;

const _clear = new THREE.Color();

function build() {
  const S = CFG.arena.stain;
  const px = Math.min(touchDevice ? S.touchSize : S.size,
                      renderer.capabilities.maxTextureSize);

  target = new THREE.WebGLRenderTarget(px, px, {
    depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  // three writes a non-XR render target with no tone map and no output transform.
  target.texture.colorSpace = THREE.LinearSRGBColorSpace;

  scene = new THREE.Scene();
  scene.matrixAutoUpdate = false;

  // Overhead, so a stamp is posed with its splat's own floor transform.
  const R = CFG.arena.max;
  cam = new THREE.OrthographicCamera(-R, R, R, -R, 0, 2);
  cam.position.set(0, 1, 0);
  cam.up.set(0, 0, -1);
  cam.lookAt(0, 0, 0);

  wipe();
  buildSheet();
}

function ensure() {
  if (!target) build();
}

// R and G are dose and add; A is coverage and lays over. No named mode does both.
function stampMaterial() {
  const mat = new THREE.MeshBasicMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  // Premultiply, or a splat doses its whole square instead of its own shape.
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <colorspace_fragment>',
               'gl_FragColor.rgb *= gl_FragColor.a;\n#include <colorspace_fragment>');
  };
  mat.customProgramCacheKey = () => 'stain-stamp';
  return mat;
}

function stampAt(i) {
  let m = stamps[i];
  if (m) return m;
  m = new THREE.Mesh(GEO.splat, stampMaterial());
  m.renderOrder = i;
  m.visible = false;
  stamps[i] = m;
  scene.add(m);
  return m;
}

export function take(mesh, opacity, burn) {
  ensure();
  const S = CFG.arena.stain;
  const dose = S.dose * (burn ? S.burn.rate : 1);
  const m = stampAt(used++);
  m.visible = true;
  m.position.copy(mesh.position);
  m.rotation.copy(mesh.rotation);
  m.scale.copy(mesh.scale);
  m.material.map = mesh.material.map;
  m.material.color.setRGB(burn ? 0 : dose, burn ? dose : 0, 0);
  m.material.opacity = opacity;
  pending = true;
}

// Every stamp in one pass: a boss volley hands over dozens in a frame.
export function flush() {
  if (!pending) return;
  const wasTarget = renderer.getRenderTarget();
  const wasAuto = renderer.autoClear;
  renderer.autoClear = false;
  renderer.setRenderTarget(target);
  renderer.render(scene, cam);
  renderer.setRenderTarget(wasTarget);
  renderer.autoClear = wasAuto;

  for (let i = 0; i < used; i++) stamps[i].visible = false;
  used = 0;
  pending = false;
}

export function wipe() {
  ensure();
  for (let i = 0; i < used; i++) stamps[i].visible = false;
  used = 0;
  pending = false;

  const wasTarget = renderer.getRenderTarget();
  const wasAlpha = renderer.getClearAlpha();
  renderer.getClearColor(_clear);
  renderer.setRenderTarget(target);
  renderer.setClearColor(0x000000, 0);
  renderer.clear(true, false, false);
  renderer.setRenderTarget(wasTarget);
  renderer.setClearColor(_clear, wasAlpha);
}

const _tint = new THREE.Color();
const glsl = (hex) => {
  _tint.setHex(hex);
  return `vec3(${_tint.r.toFixed(5)}, ${_tint.g.toFixed(5)}, ${_tint.b.toFixed(5)})`;
};

function sheetMaterial() {
  const S = CFG.arena.stain;
  const mat = clip(new THREE.MeshLambertMaterial({
    map: target.texture, transparent: true, premultipliedAlpha: true,
    depthWrite: false,
  }));
  const inner = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, rend) => {
    inner?.(shader, rend);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_fragment>', `
        vec4 soaked = texture2D(map, vMapUv);
        float wetDose = soaked.r;
        float dryDose = soaked.g;
        float dose = wetDose + dryDose;
        float burnt = dryDose / max(dose, 1e-5);

        float deep = pow(clamp(dose / ${S.soak.toFixed(4)}, 0.0, 1.0), ${S.curve.toFixed(3)});
        vec3 wetTint = mix(${glsl(S.blood.thin)}, ${glsl(S.blood.deep)}, deep);
        float wetLay = min(soaked.a * mix(${S.thin.toFixed(4)}, ${S.deep.toFixed(4)}, deep),
                           ${S.ceiling.toFixed(4)});

        // Off dryDose, not coverage: a cluster of scorches saturates coverage flat.
        float thick = 1.0 - exp(-dryDose * ${S.burn.bite.toFixed(2)});
        float charred = clamp(dryDose / ${S.burn.soak.toFixed(4)}, 0.0, 1.0);
        vec3 dryTint = mix(mix(${glsl(S.burn.thin)}, ${glsl(S.burn.deep)},
                               min(charred / ${S.burn.ashAt.toFixed(4)}, 1.0)),
                           ${glsl(S.burn.ash)},
                           smoothstep(${S.burn.ashAt.toFixed(4)}, 1.0, charred));
        float dryLay = soaked.a * thick * ${S.burn.ceiling.toFixed(4)};

        vec3 tint = mix(wetTint, dryTint, burnt);
        float lay = mix(wetLay, dryLay, burnt);
        diffuseColor = vec4(tint * lay, lay);`);
  };
  mat.customProgramCacheKey = () => 'arena-cut-stain';
  return mat;
}

// A circle's own UVs already run x and z across the field — the stamp camera's
// very mapping — so the sheet needs no coordinates of its own.
function buildSheet() {
  const sheet = new THREE.Mesh(new THREE.CircleGeometry(CFG.arena.max, 96), sheetMaterial());
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.y = CFG.arena.stain.y;
  sheet.renderOrder = CFG.arena.stain.order;
  sheet.receiveShadow = true;
  world.add(sheet);
}
