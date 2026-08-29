import * as THREE from 'three';
import { applySky } from '../../engine/view.js';
import { manager } from '../../core/loading.js';
import * as ground from '../ground.js';
import * as walls from '../walls.js';
import * as rocks from '../rocks.js';
import * as scatter from '../scatter.js';
import { configure, current, names, THEME_URLS } from './index.js';

const loader = new THREE.TextureLoader();

// Every theme comes down with the first load, so a sector reached later needs
// nothing from the network. Only this pass reports to the loading bar: a swap
// mid-run has its own bar and must not drive the boot screen's.
const boot = new THREE.TextureLoader(manager);
for (const name of names()) {
  for (const url of THEME_URLS(name)) boot.load(url, undefined, undefined, () => {});
}

// Warmed into the cache before the swap, so applying a theme never shows a
// wall or a floor with no map on it while an image is still in flight.
export function preload(next, onProgress = () => {}) {
  if (!next || next === current()) return Promise.resolve();
  const urls = THEME_URLS(next);
  let done = 0;
  return Promise.all(urls.map((url) => loader.loadAsync(url)
    .catch(() => null)
    .finally(() => onProgress(++done / urls.length))));
}

// Rocks release their cached textures before scatter rebuilds, because that
// rebuild is what loads the next theme's set. Wall meshes are rebuilt by
// scatter's segment pass, so retexture only swaps the material.
export function apply(next) {
  if (next === current()) return;
  configure(next);
  applySky();
  ground.retexture();
  walls.retexture();
  rocks.retexture();
  scatter.build();
}
