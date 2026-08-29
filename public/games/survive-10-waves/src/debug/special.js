import * as special from '../game/special.js';

const FIELDS = ['part', 'position', 'in part', 'groups', 'bugs', 'waiting on', 'cleared'];

// What the part on screen is still holding out for. The music cannot move on
// until this reads clear, so it is the first thing to look at when a part loops
// longer than it should.
function waitingOn(p) {
  if (p.finished) return p.over ? 'music ended · wave over' : 'music ended';
  if (!p.part) return 'starting';
  if (p.asked) return `an exit · ${p.mine} spilling`;
  if (p.stream > 0) return `stream · ${p.stream.toFixed(1)}s left`;
  if (p.siege > 0) return `siege · ${p.siege.toFixed(1)}s left`;
  if (p.fired < p.groups) return `group ${p.fired + 1} of ${p.groups}`;
  if (p.barsInto < p.hold) return `${(p.hold - p.barsInto).toFixed(1)} more bars`;
  if (p.mine > 0) return `${p.mine} bug${p.mine === 1 ? '' : 's'} alive`;
  return 'nothing — waiting for an exit';
}

export function build() {
  const el = document.createElement('div');
  el.appendChild(Object.assign(document.createElement('div'),
    { className: 'dbg-sec', textContent: 'SPECIAL WAVE' }));

  const out = {};
  for (const name of FIELDS) {
    const row = document.createElement('div');
    row.className = 'dbg-row';
    row.appendChild(Object.assign(document.createElement('span'),
      { className: 'dbg-lbl', textContent: name }));
    out[name] = row.appendChild(document.createElement('span'));
    el.appendChild(row);
  }

  function paint() {
    const p = special.probe();
    if (!p) {
      out.part.textContent = 'not running';
      for (const name of FIELDS) if (name !== 'part') out[name].textContent = '';
      return;
    }
    out.part.textContent = `${p.part || '—'} · step ${p.step}/${p.steps} · ${p.clock}`;
    out.position.textContent = `bar ${p.bar}.${p.beat} · ${p.time.toFixed(1)}s`;
    out['in part'].textContent =
      `${p.secsInto.toFixed(1)}s · ${p.barsInto.toFixed(1)} bars (hold ${p.hold})`;
    out.groups.textContent = `${p.fired}/${p.groups} released`
      + (p.coined ? ` · ${p.coined} coins` : '');
    out.bugs.textContent = `${p.mine} this part · ${p.standing} tagged`;
    out['waiting on'].textContent = waitingOn(p);
    out.cleared.textContent = p.done.length ? p.done.join(', ') : 'none';
  }

  return { el, paint };
}
