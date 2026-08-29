import { state } from '../core/world.js';

// A wave is only saved when it starts, so leaving mid-wave throws it away.
// Pausing counts: a backgrounded tab pauses itself, and closing it is the most
// likely way out of a run.
const MID_WAVE = new Set(['playing', 'paused']);

// The message is the browser's own; every one of them ignores what a page
// passes here.
function ask(e) {
  if (!MID_WAVE.has(state.mode)) return;
  e.preventDefault();
  e.returnValue = '';
}

export function init() {
  addEventListener('beforeunload', ask);
}
