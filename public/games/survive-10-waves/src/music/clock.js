import { parseSections } from './sections.js';
import { SpecialWave, SCRIPT, GRID, DURATION } from './specialwave.js';

// The part table both clocks run on, derived once from the same script the
// audio engine plays. A part holds inside its loop section until it is marked
// done; a part with no loop runs out and finishes, which is what the outro does.
export function readScript() {
  const beat = 60 / GRID.bpm;
  const bar = beat * GRID.per;
  const cut = parseSections(SCRIPT, {
    bars: Math.ceil((DURATION - GRID.start) / bar),
    per: GRID.per,
    barStart: GRID.start,
    barLength: bar,
    beatLength: beat,
  });
  if (cut.bad.length) {
    const first = cut.bad[0];
    throw new Error(`loop script line ${first.n}: ${first.why}`);
  }
  const parts = cut.parts.map((p, i) => {
    const ends = cut.parts[i + 1] ? cut.parts[i + 1].t : DURATION;
    return { ...p, ends, loop: cut.loops.find((l) => l.from >= p.t - 1e-6 && l.from < ends - 1e-6) };
  });
  return { beat, bar, parts };
}

// Seconds a part has been sounding, not seconds into the track: a part loops, so
// the position wraps while the time it has been up does not. Content is written
// against the second one.
export function silentClock(onEvent) {
  const table = readScript();
  const done = new Set();
  let now = 0;
  let since = 0;
  let here = null;
  let mark = null;
  let live = false;
  let over = false;

  const partAt = (t) => {
    let cur = null;
    for (const p of table.parts) if (p.t <= t + 1e-6 && (!cur || p.t > cur.t)) cur = p;
    return cur;
  };
  const nextOpen = (from) => table.parts.find((p) => p.t > from + 1e-6 && !done.has(p.name));
  const finish = () => { over = true; live = false; onEvent({ kind: 'finish' }); };

  const enter = (part) => {
    here = part.name;
    since = 0;
    onEvent({ kind: 'part', name: here });
  };

  function update(dt) {
    if (!live || over) return;
    if (here === null) {
      const first = partAt(now);
      if (!first) return;
      enter(first);
    }
    now += dt;
    since += dt;

    // Hold on the part we are in, not on wherever the clock has drifted to: a
    // part that has not been cleared must loop rather than fall into the next.
    const cur = table.parts.find((p) => p.name === here);
    if (cur.loop && now >= cur.loop.to) now -= cur.loop.to - cur.loop.from;
    else if (now >= cur.ends) { finish(); return; }

    const b = Math.floor((now - GRID.start) / table.beat);
    if (b === mark || b < 0) return;
    mark = b;
    onEvent({ kind: 'beat' });
    if (b % GRID.per === 0) onEvent({ kind: 'bar', bar: Math.floor(b / GRID.per) + 1 });
  }

  const spotAt = (t) => {
    const i = Math.floor((t - GRID.start) / table.beat);
    return i < 0 ? { bar: 0, beat: 0, time: t }
      : { bar: Math.floor(i / GRID.per) + 1, beat: (i % GRID.per) + 1, time: t };
  };

  return {
    parts: () => table.parts.map((p) => p.name),
    part: () => here,
    where: () => spotAt(now),
    done: () => [...done],
    secsInto: () => since,
    barsInto: () => since / table.bar,
    time: () => now,
    playing: () => live && !over,
    finished: () => over,
    markDone(name) {
      if (done.has(name) || over) return;
      done.add(name);
      const open = nextOpen(now);
      if (!open) { finish(); return; }
      now = open.t;
      enter(open);
    },
    start(from = 0) {
      done.clear();
      now = from; since = 0; here = null; mark = null; live = true; over = false;
    },
    stop() { live = false; },
    pause() { live = false; },
    resume() { if (!over) live = true; },
    update,
  };
}


// The same questions, answered by the real track. Pause is a stop and a restart
// from where it left off — a hard cut, which is what a pause already does to
// everything else in the game.
export function audioClock(music, onEvent) {
  let at = 0;
  music.onPartStart = (name) => onEvent({ kind: 'part', name });
  music.onBeat = () => onEvent({ kind: 'beat' });
  music.onBar = (spot) => onEvent({ kind: 'bar', bar: spot.bar });
  music.onFinish = () => onEvent({ kind: 'finish' });
  return {
    parts: () => music.parts,
    part: () => music.part,
    where: () => music.where,
    done: () => [...music.finished],
    secsInto: () => music.sincePart(),
    barsInto: () => music.sincePart() / ((60 / GRID.bpm) * GRID.per),
    time: () => music.time,
    playing: () => music.playing,
    finished: () => music.spent,
    markDone: (name) => music.markDone(name),
    start(from = 0) { at = from; music.reset(); music.play(from); },
    stop() { at = 0; music.stop(); },
    pause() { at = music.time; music.stop(); },
    resume() { if (!music.spent) music.play(at); },
    update() {},
  };
}

// The track if it is ready and the game can play it, silence otherwise. A
// silent clock can be swapped for a real one while the opening part is still
// up; after that the wave plays out on whichever it started with.
export function openClock({ music, onEvent }) {
  return music ? audioClock(music, onEvent) : silentClock(onEvent);
}
