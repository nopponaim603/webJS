// Where the frame goes, by section. Off unless something asks: the probes cost a
// timestamp each, which only pays for itself while a benchmark is reading them.
let on = false;
let frames = 0;
const spent = new Map();
const open = [];

export const profiling = () => on;

export function reset() {
  spent.clear();
  frames = 0;
}

export function profile(v = true) {
  on = v;
  if (v) reset();
}

export function begin(label) {
  if (on) open.push(label, performance.now());
}

export function end() {
  if (!on) return;
  const at = open.pop();
  const label = open.pop();
  spent.set(label, (spent.get(label) || 0) + performance.now() - at);
}

export function frame() {
  if (on) frames += 1;
}

export function report() {
  const per = Math.max(1, frames);
  const ms = {};
  for (const [label, total] of spent) ms[label] = +(total / per).toFixed(3);
  return { frames, ms };
}
