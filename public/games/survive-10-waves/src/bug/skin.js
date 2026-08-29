import * as THREE from 'three';
import { CFG } from '../config/index.js';

const SHEET = 512;

// How a sheet is cut out of the field: `scale` how big the shapes come out,
// `bands` how many veins the field is cut into, and `sharp` how fine each one
// is drawn. What an animal with markings of its own wears is a network.
const MARKINGS = { scale: 1, bands: 1.2, sharp: 6.5 };
// What a level hands out is a few long cracks over the same ground — a third of
// the veins at a third of the ink. These are grunts, not the thing at the end
// of the wave, and a network on one reads as a costume.
const VEINS = { scale: 0.32, bands: 0.5, sharp: 30 };

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return [cv, cv.getContext('2d')];
}

function field(x, y, seed) {
  const a = Math.sin(x * 0.075 + Math.sin(y * 0.035 + seed) * 4.1);
  const b = Math.sin(y * 0.060 + Math.sin(x * 0.042 - seed) * 3.7);
  const c = Math.sin((x - y) * 0.031 + a * b * 2.6);
  return (a + b + c) / 3;
}

function strangeSheet(seed, cut, flat = 0) {
  const [cv, g] = canvas(SHEET, SHEET);
  const img = g.createImageData(SHEET, SHEET);
  const d = img.data;
  for (let y = 0; y < SHEET; y++) {
    for (let x = 0; x < SHEET; x++) {
      const v = field(x * cut.scale, y * cut.scale, seed);
      const ridge = 1 - Math.min(1, Math.abs(Math.sin(v * Math.PI * cut.bands)) * cut.sharp);
      const tone = flat || (v > 0 ? 255 : 0);
      const i = (y * SHEET + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = tone;
      d[i + 3] = ridge * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return cv;
}

// The veins alone, white on black: an emissive map is read as how much light
// leaves each texel, so the skin between them must be pure black.
function veinSheet(seed, cut) {
  const [cv, g] = canvas(SHEET, SHEET);
  g.fillStyle = '#000';
  g.fillRect(0, 0, SHEET, SHEET);
  g.drawImage(strangeSheet(seed, cut, 255), 0, 0);
  return cv;
}

// The dots the near-miss budget is worn as, burnt into the same sheet the veins
// are: an emissive map is the only thing on a bug that is genuinely painted on
// the hide rather than hung above it. One sheet a count, so what changes when a
// bug pays is which texture the material points at.
const dotted = new Map();

function dotSheet(base, uvs, n) {
  const [cv, g] = canvas(base.width, base.height);
  g.drawImage(base, 0, 0);
  g.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const uv = uvs[i];
    if (!uv) continue;
    g.beginPath();
    g.arc(uv.u * base.width, uv.v * base.height,
          Math.max(2, uv.r * base.width), 0, Math.PI * 2);
    g.fill();
  }
  return cv;
}

// Built once a species and kept: the row never moves, only how much of it is
// still lit. Burnt into the vein sheet rather than onto one of its own, so an
// animal carrying a row lights it with whatever already lights its network — one
// family of sheets a species instead of two.
export function dotSheets(type, uvs, cap) {
  const key = type.key;
  if (dotted.has(key)) return dotted.get(key);
  const base = baseVeinCanvas(type);
  const like = (made.get(type.key) || {}).veins || ladderVeins();
  // Nothing is built for an empty row: a bug with none left is handed the sheet
  // it was born with rather than a copy of it with nothing drawn on.
  const sheets = [null];
  for (let n = 1; n <= cap; n++) {
    const tex = new THREE.CanvasTexture(dotSheet(base, uvs, n));
    tex.colorSpace = like.colorSpace;
    tex.wrapS = like.wrapS;
    tex.wrapT = like.wrapT;
    tex.flipY = like.flipY;
    sheets.push(tex);
  }
  dotted.set(key, sheets);
  return sheets;
}


function sheetTexture(cv, like) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = like.colorSpace;
  tex.wrapS = like.wrapS;
  tex.wrapT = like.wrapT;
  // The sheet is painted in the model's own UVs: it must be handed to the GPU
  // the same way up as the map it sits beside.
  tex.flipY = like.flipY;
  return tex;
}

const made = new Map();
const veinCanvas = new Map();

// The sheet a species' veins are drawn on, kept so anything else that wants to
// burn a mark into the same map starts from what is already there.
function baseVeinCanvas(type) {
  const key = type.skin ? type.key : '*';
  if (!veinCanvas.has(key)) {
    veinCanvas.set(key, type.skin
      ? veinSheet(type.skin.seed || 1, MARKINGS)
      : veinSheet(CFG.evolve.skin.seed, VEINS));
  }
  return veinCanvas.get(key);
}

function sheetsFor(type, map) {
  if (made.has(type.key)) return made.get(type.key);

  const { width, height } = map.image;
  const [cv, g] = canvas(width, height);
  g.drawImage(map.image, 0, 0, width, height);
  g.globalAlpha = type.skin.opacity;
  g.drawImage(strangeSheet(type.skin.seed || 1, MARKINGS), 0, 0, width, height);

  const skin = {
    map: sheetTexture(cv, map),
    veins: sheetTexture(baseVeinCanvas(type), map),
  };
  made.set(type.key, skin);
  return skin;
}

let ladder = null;

// One sheet of veins for the whole roster: what a level changes is how hot they
// burn, never where they run. A sheet a species would cost a megabyte and a
// dropped frame each to buy a difference nobody would go looking for.
function ladderVeins() {
  if (ladder) return ladder;
  ladder = new THREE.CanvasTexture(veinSheet(CFG.evolve.skin.seed, VEINS));
  ladder.colorSpace = THREE.SRGBColorSpace;
  ladder.wrapS = ladder.wrapT = THREE.RepeatWrapping;
  // glTF hands its maps over unflipped, and these are painted in the same UVs.
  ladder.flipY = false;
  return ladder;
}

let white = null;

// A crit lights the whole animal, not the veins in it. Swapping the map for a
// white one says that; dropping the map would say it too, and recompile the
// shader every time somebody lands a headshot.
export function flare() {
  if (white) return white;
  const [cv, g] = canvas(1, 1);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 1, 1);
  white = new THREE.CanvasTexture(cv);
  white.colorSpace = THREE.SRGBColorSpace;
  return white;
}

// Every animal is given the veins at birth and none of them are lit: what a
// level does is turn them up, which is a number rather than a new program.
export function paint(type, material) {
  if (!type.skin) {
    material.emissiveMap = ladderVeins();
    material.emissiveIntensity = 0;
    material.needsUpdate = true;
    return;
  }
  if (!material.map || !material.map.image) return;

  const sheets = sheetsFor(type, material.map);
  material.map = sheets.map;
  material.emissiveMap = sheets.veins;

  const glow = type.skin.glow;
  material.emissive.setHex(glow ? glow.color : 0);
  material.emissiveIntensity = glow ? glow.intensity : 0;
  // A map the cloned material did not ship with: without this it keeps the
  // program it was compiled with and the veins never light.
  material.needsUpdate = true;
}

// What the animal shipped as, before a level had a say in it. Everything wear()
// works out is read off these, so a model handed back to the pool at level ten
// does not come out of it again still wearing level ten.
export function remember(material) {
  const u = material.userData;
  u.baseColor = material.color.clone();
  u.baseRough = material.roughness;
  u.veins = material.emissiveMap || null;
  u.baseEmissive = material.emissive ? material.emissive.getHex() : 0;
  u.baseEmissiveIntensity = material.emissiveIntensity ?? 1;
}

const rungOf = (level) => {
  const S = CFG.evolve.skin;
  const at = (level || 1) - S.from;
  return at < 0 ? null : S.rungs[Math.min(at, S.rungs.length - 1)];
};

export function wear(model, type, level) {
  const rung = rungOf(level);
  const own = (type.skin && type.skin.glow) || null;
  const color = own ? own.color : (rung ? rung.color : 0);
  const heat = rung ? rung.light : 0;
  const light = own ? own.intensity * (1 + heat) : heat;

  for (const m of model.parts.materials || []) {
    if (!m.emissive) continue;
    const u = m.userData;
    m.color.copy(u.baseColor).multiplyScalar(rung ? rung.dim : 1);
    m.roughness = u.baseRough * (rung ? rung.rough : 1);
    m.emissiveMap = u.veins;
    m.emissive.setHex(color);
    m.emissiveIntensity = light;
    u.baseEmissive = color;
    u.baseEmissiveIntensity = light;
  }
}

// The veins breathe, on the rungs high enough to have a pulse at all. A crit
// owns the emissive for as long as it burns, so nothing here touches it.
export function beat(bug, dt) {
  const rung = rungOf(bug.level);
  if (!rung || !rung.beat || bug.flash > 0) return;

  bug.vein += dt * rung.beat;
  const k = 1 - rung.swell * (0.5 - 0.5 * Math.cos(bug.vein));
  for (const m of bug.model.parts.materials || []) {
    if (m.emissive) m.emissiveIntensity = m.userData.baseEmissiveIntensity * k;
  }
}
