// `location.reload(true)` has not forced anything for years — the flag is
// ignored. What does work is asking for every URL the page fetched again with
// `cache: 'reload'`, which skips the cache on the way out AND replaces what is
// stored, so the reload that follows finds fresh copies waiting.
const HTTP = /^https?:/;

const urlsLoaded = () => {
  const urls = new Set([location.href]);
  for (const e of performance.getEntriesByType('resource')) {
    if (HTTP.test(e.name)) urls.add(e.name);
  }
  return [...urls];
};

const refetch = (url) => fetch(url, {
  cache: 'reload',
  // Anything off-site (the three.js CDN) has no CORS headers for us, and an
  // opaque response refreshes the entry just the same.
  mode: new URL(url, location.href).origin === location.origin ? 'same-origin' : 'no-cors',
}).catch(() => {});

async function wipeCaches() {
  if (!self.caches) return;
  for (const key of await caches.keys()) await caches.delete(key);
  if (!navigator.serviceWorker) return;
  for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
}

export async function hardReload(onProgress = () => {}) {
  const urls = urlsLoaded();
  let done = 0;
  await Promise.all(urls.map((url) => refetch(url).then(() => onProgress(++done, urls.length))));
  await wipeCaches();
  location.reload();
}

export function init() {
  const button = document.getElementById('btn-refresh');
  if (!button) return;
  const label = button.textContent;
  button.onclick = async () => {
    button.disabled = true;
    await hardReload((done, all) => { button.textContent = `CLEARING ${done}/${all}`; });
    button.textContent = label;
    button.disabled = false;
  };
}
