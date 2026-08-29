import { volume } from '../engine/volume.js';

const SLIDERS = [
  { kind: 'music', id: 'vol-music' },
  { kind: 'sfx', id: 'vol-sfx' },
];

const pct = (v) => `${Math.round(v * 100)}%`;

export function init() {
  for (const { kind, id } of SLIDERS) {
    const input = document.getElementById(id);
    if (!input) continue;
    const val = input.parentElement.querySelector('.vol-val');
    input.oninput = () => volume.set(kind, parseFloat(input.value));
    // A focused slider swallows the keyboard, and Escape is how the screen is left.
    input.onpointerup = () => input.blur();
    volume.watch((v) => { input.value = v[kind]; val.textContent = pct(v[kind]); });
  }
}
