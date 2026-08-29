import { CFG } from '../config/index.js';

// Simple Analytics, names only — the second metadata argument is not available
// to us, so anything worth knowing has to be part of the name. Names take
// alphanumerics and underscores, and are lowercased at the far end anyway.
const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);

// Wave numbers are padded because the dashboard lists names alphabetically, and
// wave_10 sorting between wave_01 and wave_02 makes the list unreadable. The
// tail past the last official wave has no ceiling, so it all reports as one
// name rather than as an event per wave nobody will ever read.
export const waveTag = (n) => (n > CFG.mission.horizon ? 'wave_endless'
  : `wave_${String(Math.max(0, n | 0)).padStart(2, '0')}`);

export const slug = (text) => String(text || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export function track(name) {
  if (LOCAL || typeof window.sa_event !== 'function') return;
  window.sa_event(slug(name));
}
