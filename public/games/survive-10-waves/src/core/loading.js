import * as THREE from 'three';

// On, because terrain textures are loaded twice: once to warm them before a
// wave starts, then again by the material that ends up using them.
THREE.Cache.enabled = true;

export const manager = new THREE.LoadingManager();

const SEAL = '__boot__';
// Held until boot() has finished queueing, or onLoad fires on the first asset home.
manager.itemStart(SEAL);

const PATIENCE = 90000;

const onProgressCbs = [];
const onReadyCbs = [];
let ready = false;

function finish() {
  if (ready) return;
  ready = true;
  for (const cb of onReadyCbs) cb();
}

manager.onProgress = (url, loaded, total) => {
  for (const cb of onProgressCbs) cb(loaded / Math.max(1, total));
};

manager.onLoad = finish;

manager.onError = (url) => console.warn(`asset failed to load: ${url} — using the fallback`);

export function track(url, promise) {
  manager.itemStart(url);
  return promise.finally(() => manager.itemEnd(url));
}

// The wave board wears the sector shots as CSS backgrounds, which are not
// fetched until the board is first built. Decoding one here is what puts it in
// the cache in time.
export function trackImage(url) {
  return track(url, new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = url;
  }));
}

export function onProgress(cb) { onProgressCbs.push(cb); }

export function onReady(cb) {
  if (ready) cb();
  else onReadyCbs.push(cb);
}

export function seal() {
  setTimeout(() => {
    if (!ready) {
      console.warn(`assets still loading after ${PATIENCE / 1000}s — starting on what arrived`);
    }
    finish();
  }, PATIENCE);
  manager.itemEnd(SEAL);
}
