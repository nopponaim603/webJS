const WAS = 'bugblaster.';
const NOW = 'survive10.';

// The game was renamed after saves were already in the browser. Anything still
// under the old name is moved across the first time it is asked for, and the old
// key is dropped, so a run in progress survives and the old name goes with it.
// Delete this once no one is running a build older than the rename.
function carryOver(key) {
  if (!key.startsWith(NOW)) return;
  const was = WAS + key.slice(NOW.length);
  const raw = localStorage.getItem(was);
  if (raw === null) return;
  if (localStorage.getItem(key) === null) localStorage.setItem(key, raw);
  localStorage.removeItem(was);
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function load(key) {
  try {
    carryOver(key);
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export function forget(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
