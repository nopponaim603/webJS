import { arcPath } from '../ui/chargearc.js';

// Hugging the top-left of the fire button: the thumb sits on the bottom-right
// of it, and a gauge under the thumb is a gauge nobody reads.
export const ARC = { radius: 44, from: 200, to: 70 };

export const arcSpan = (ARC.from - ARC.to) * Math.PI / 180;

function markup() {
  const d = arcPath(ARC.radius, ARC.from, ARC.to);
  return `
    <div id="pad-stick">
      <div class="stick-base"><i class="stick-knob"></i></div>
    </div>
    <div id="pad-actions">
      <button id="pad-swap" class="pad-btn">
        <svg class="gico" viewBox="0 0 24 24"></svg>
        <span class="pad-tag">SWAP</span>
      </button>
      <button id="pad-fire" class="pad-btn">
        <svg class="pad-arc" viewBox="0 0 100 100">
          <path class="track" d="${d}" />
          <path class="fill" d="${d}" />
        </svg>
        <span class="pad-tag">FIRE</span>
      </button>
      <button id="pad-dash" class="pad-btn">
        <svg class="gico" viewBox="0 0 24 24">
          <path d="M4.4 6.3 10.6 12l-6.2 5.7" />
          <path d="M12.4 6.3 18.6 12l-6.2 5.7" />
        </svg>
        <span class="pad-tag">DASH</span>
      </button>
    </div>
    <button id="pad-pause" class="pad-btn">II</button>
    <div id="pad-demo"><b>DEMO MODE</b> &mdash; FULL GAME ON DESKTOP</div>`;
}

export function build() {
  const layer = document.createElement('div');
  layer.id = 'pad';
  layer.innerHTML = markup();
  document.getElementById('ui').appendChild(layer);

  const pick = (sel) => layer.querySelector(sel);
  return {
    zone: pick('#pad-stick'),
    base: pick('.stick-base'),
    knob: pick('.stick-knob'),
    fire: pick('#pad-fire'),
    arc: pick('.pad-arc'),
    swap: pick('#pad-swap'),
    swapIcon: pick('#pad-swap .gico'),
    dash: pick('#pad-dash'),
    pause: pick('#pad-pause'),
  };
}
