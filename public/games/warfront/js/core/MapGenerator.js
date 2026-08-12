/**
 * @file MapGenerator.js
 * @description Seeded procedural island terrain generator (value noise + coastal falloff)
 * and symmetric 4-quadrant spawn point placement.
 * @module core/MapGenerator
 */

/**
 * Deterministic PRNG (mulberry32). Same seed always produces the same map,
 * which keeps matches reproducible/shareable via a seed number.
 * @param {number} seed
 * @returns {function(): number} Function returning floats in [0, 1)
 */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Build a single bilinear-interpolated value-noise layer at a given cell size.
 * @param {number} width
 * @param {number} height
 * @param {function(): number} rand
 * @param {number} cellSize
 * @returns {Float32Array} Values roughly in [0, 1]
 */
function buildValueNoiseLayer(width, height, rand, cellSize) {
  const gw = Math.ceil(width / cellSize) + 2;
  const gh = Math.ceil(height / cellSize) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx = x / cellSize;
      const gy = y / cellSize;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const tx = smoothstep(gx - x0), ty = smoothstep(gy - y0);
      const v00 = grid[y0 * gw + x0];
      const v10 = grid[y0 * gw + x0 + 1];
      const v01 = grid[(y0 + 1) * gw + x0];
      const v11 = grid[(y0 + 1) * gw + x0 + 1];
      const top = v00 + (v10 - v00) * tx;
      const bottom = v01 + (v11 - v01) * tx;
      out[y * width + x] = top + (bottom - top) * ty;
    }
  }
  return out;
}

/**
 * Combine several octaves of value noise into a single elevation field.
 * @param {number} width
 * @param {number} height
 * @param {function(): number} rand
 * @returns {Float32Array} Elevation values roughly in [0, 1]
 */
function generateElevation(width, height, rand) {
  const octaves = [
    { cellSize: Math.max(4, Math.round(width / 3)), weight: 0.5 },
    { cellSize: Math.max(3, Math.round(width / 6)), weight: 0.3 },
    { cellSize: Math.max(2, Math.round(width / 12)), weight: 0.2 },
  ];

  const elevation = new Float32Array(width * height);
  let totalWeight = 0;
  for (const { cellSize, weight } of octaves) {
    const layer = buildValueNoiseLayer(width, height, rand, cellSize);
    for (let i = 0; i < elevation.length; i++) elevation[i] += layer[i] * weight;
    totalWeight += weight;
  }
  for (let i = 0; i < elevation.length; i++) elevation[i] /= totalWeight;
  return elevation;
}

/**
 * Force a coastal ring of water around the map edges by pulling elevation
 * toward 0 within `marginRatio` of each border, leaving the interior untouched.
 * @param {Float32Array} elevation
 * @param {number} width
 * @param {number} height
 * @param {number} marginRatio
 */
function applyCoastalFalloff(elevation, width, height, marginRatio = 0.1) {
  const marginX = Math.max(1, width * marginRatio);
  const marginY = Math.max(1, height * marginRatio);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const edgeFactor = Math.min(
        1,
        Math.min(x, width - 1 - x) / marginX,
        Math.min(y, height - 1 - y) / marginY
      );
      const t = 1 - smoothstep(edgeFactor); // 1 at the border, 0 once safely inland
      const idx = y * width + x;
      elevation[idx] = elevation[idx] * (1 - t);
    }
  }
}

/**
 * Guarantee each spawn point sits on solid, conquerable land by nudging
 * elevation upward in a smooth disc around it (blended, not hard-stamped).
 * @param {Float32Array} elevation
 * @param {number} width
 * @param {number} height
 * @param {{x:number,y:number}[]} spawnPoints
 * @param {number} radius
 * @param {number} target
 */
function boostSpawnAreas(elevation, width, height, spawnPoints, radius = 3, target = 0.55) {
  for (const { x: sx, y: sy } of spawnPoints) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = sx + dx, y = sy + dy;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;
        const idx = y * width + x;
        const boost = target * smoothstep(1 - dist / radius);
        elevation[idx] = Math.max(elevation[idx], boost);
      }
    }
  }
}

/**
 * Elevation thresholds mapped to DEFAULT_TILE_TYPES ids in TileMap.js
 * (0 Deep Water, 1 Coastal Water, 2 Plains, 3 Highlands, 4 Mountain).
 */
const THRESHOLDS = { deepWater: 0.24, coastalWater: 0.3, plains: 0.68, highlands: 0.82 };

function classify(elevation) {
  if (elevation < THRESHOLDS.deepWater) return 0;
  if (elevation < THRESHOLDS.coastalWater) return 1;
  if (elevation < THRESHOLDS.plains) return 2;
  if (elevation < THRESHOLDS.highlands) return 3;
  return 4;
}

/**
 * Procedural Island Map Generator
 */
export class MapGenerator {
  /**
   * Generate a tile grid and 4 symmetric spawn points guaranteed to sit on
   * a single connected landmass.
   * @param {number} width
   * @param {number} height
   * @param {number} [seed] - Defaults to a random seed if omitted.
   * @returns {{tiles: Uint8Array, spawnPoints: {x:number,y:number}[], seed: number}}
   */
  static generate(width, height, seed = Math.floor(Math.random() * 0xffffffff)) {
    const rand = mulberry32(seed);
    const elevation = generateElevation(width, height, rand);
    applyCoastalFalloff(elevation, width, height);

    const spawnPoints = [
      { x: Math.floor(width * 0.25), y: Math.floor(height * 0.25) },
      { x: Math.floor(width * 0.75), y: Math.floor(height * 0.25) },
      { x: Math.floor(width * 0.25), y: Math.floor(height * 0.75) },
      { x: Math.floor(width * 0.75), y: Math.floor(height * 0.75) },
    ];

    boostSpawnAreas(elevation, width, height, spawnPoints, 3, 0.55);

    const tiles = new Uint8Array(width * height);
    for (let i = 0; i < elevation.length; i++) {
      tiles[i] = classify(elevation[i]);
    }

    return { tiles, spawnPoints, seed };
  }
}
