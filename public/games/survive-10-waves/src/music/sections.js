const SPOT = '(\\d+)(?:\\.(\\d+))?';
const RANGE = new RegExp(`^\\[?\\s*${SPOT}\\s*[-–—]\\s*${SPOT}`
  + `\\s*(?::\\s*([a-z -]+?)\\s*)?(?::\\s*(\\d+)\\s*)?\\]?$`, 'i');
const POINT = new RegExp(`^\\[?\\s*${SPOT}\\s*:\\s*(exit|entry)`
  + `\\s*(?::\\s*([a-z -]+?)\\s*)?(?::\\s*(\\d+)\\s*)?\\]?$`, 'i');
const PART = /^--\s*(.+?)\s*--$/;
const MODES = {
  blend: 'both', both: 'both', 'blend-both': 'both',
  head: 'head', 'head-blend': 'head',
  tail: 'tail', 'tail-blend': 'tail',
  fade: 'fade', hard: 'hard', plain: 'hard',
};
const LONGEST = 8000;

export function parseSections(text, { bars, per, barStart, barLength, beatLength }) {
  const loops = [];
  const parts = [];
  let afterLoop = null;
  const exits = [];
  const entries = [];
  const bad = [];

  const opens = (bar, beat) => barStart + (bar - 1) * barLength + ((beat || 1) - 1) * beatLength;
  const closes = (bar, beat) => (beat ? opens(bar, beat) + beatLength : barStart + bar * barLength);
  const name = (bar, beat) => (beat ? `${bar}.${beat}` : `${bar}`);
  const legal = (bar, beat) => bar >= 1 && bar <= bars && (!beat || (beat >= 1 && beat <= per));

  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) return;
    const n = i + 1;

    const part = PART.exec(line);
    if (part) {
      if (parts.length && afterLoop === null) {
        bad.push({ n, why: 'a part must follow a loop' });
        return;
      }
      parts.push({ name: part[1], t: parts.length ? afterLoop : 0 });
      afterLoop = null;
      return;
    }

    const point = POINT.exec(line);
    if (point) {
      const bar = +point[1];
      const beat = point[2] ? +point[2] : 0;
      if (!legal(bar, beat)) { bad.push({ n, why: `bars 1-${bars}, beats 1-${per}` }); return; }
      const shape = point[4] ? MODES[point[4].toLowerCase().trim()] : null;
      if (point[4] && !shape) { bad.push({ n, why: `unknown mode "${point[4]}"` }); return; }
      const jumpMs = point[5] === undefined ? null : +point[5];
      if (jumpMs !== null && jumpMs > LONGEST) {
        bad.push({ n, why: `${LONGEST}ms is the longest crossfade` });
        return;
      }
      const spot = { label: name(bar, beat), mode: shape, ms: jumpMs,
                     cross: jumpMs === null ? null : jumpMs / 1000 };
      if (point[3].toLowerCase() === 'exit') exits.push({ ...spot, t: closes(bar, beat) });
      else entries.push({ ...spot, t: opens(bar, beat) });
      return;
    }

    const span = RANGE.exec(line);
    if (!span) { bad.push({ n, why: 'expected [25-28: blend], [98.3-102: head], 19:exit or 20.1:entry' }); return; }
    const aBar = +span[1];
    const aBeat = span[2] ? +span[2] : 0;
    const bBar = +span[3];
    const bBeat = span[4] ? +span[4] : 0;
    const mode = MODES[(span[5] || 'blend').toLowerCase().trim()];
    if (!mode) { bad.push({ n, why: `unknown mode "${span[5]}"` }); return; }
    const ms = span[6] === undefined ? null : +span[6];
    if (ms !== null && ms > LONGEST) { bad.push({ n, why: `${LONGEST}ms is the longest crossfade` }); return; }
    if (!legal(aBar, aBeat) || !legal(bBar, bBeat)) {
      bad.push({ n, why: `bars 1-${bars}, beats 1-${per}` });
      return;
    }
    const from = opens(aBar, aBeat);
    const to = closes(bBar, bBeat);
    if (to <= from) { bad.push({ n, why: 'the end comes before the start' }); return; }
    loops.push({ label: `${name(aBar, aBeat)}-${name(bBar, bBeat)}`, mode, from, to,
                 cross: ms === null ? null : ms / 1000, ms });
    afterLoop = to;
  });

  loops.sort((x, y) => x.from - y.from);
  for (let i = 1; i < loops.length; i++) {
    if (loops[i].from < loops[i - 1].to) bad.push({ n: 0, why: `${loops[i].label} overlaps` });
  }
  const add = t => {
    if (!entries.some(e => Math.abs(e.t - t) < 1e-6)) entries.push({ t, implied: true });
  };
  for (const l of loops) add(l.to);
  exits.sort((x, y) => x.t - y.t);
  entries.sort((x, y) => x.t - y.t);
  parts.sort((x, y) => x.t - y.t);
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].t <= parts[i - 1].t) bad.push({ n: 0, why: `part "${parts[i].name}" has no room` });
  }
  return { loops, exits, entries, parts, bad };
}
