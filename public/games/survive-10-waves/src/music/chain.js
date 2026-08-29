const AHEAD = 0.35;
const TICK = 40;
const LATE = 0.05;
const POINTS = 128;
const POP = 0.02;

function ramp(rising) {
  const c = new Float32Array(POINTS);
  for (let i = 0; i < POINTS; i++) {
    const p = i / (POINTS - 1);
    c[i] = Math.cos((rising ? 1 - p : p) * Math.PI / 2);
  }
  return c;
}
const UP = ramp(true);
const DOWN = ramp(false);
const tag = s => s.label;

export function initChain({ buffer, plan, parts, crossfade, rig }) {
  let ctx = null;
  let out = null;
  let timer = null;
  let running = false;
  let cursor = 0;
  let nextAt = 0;
  let firstPass = true;
  let passes = [];
  let line = [];
  let live = [];
  let done = new Set();
  let armed = false;
  let nextHead = 0;
  let pendingRise = 0;
  let runNow = null;
  let enterAt = null;
  let leaving = null;
  let arrive = null;
  let armedAt = null;

  const span = () => buffer().duration;
  const loops = () => plan().loops.filter(s => !done.has(tag(s)));
  const soonest = (items, after) =>
    items.filter(i => i.t > after + 1e-6).reduce((m, i) => Math.min(m, i.t), Infinity);

  function partStartAt(t) {
    let cur = null;
    for (const p of parts()) if (p.t <= t + 1e-6 && (!cur || p.t > cur.t)) cur = p;
    return cur ? cur.t : null;
  }

  function partDone(t) {
    let cur = null;
    for (const p of parts()) if (p.t <= t + 1e-6 && (!cur || p.t > cur.t)) cur = p;
    return !!(cur && cur.done);
  }

  function nextSkipped(t) {
    let best = Infinity;
    for (const p of parts()) if (p.t > t + 1e-6 && p.done) best = Math.min(best, p.t);
    return best;
  }

  function targetAfter(t) {
    const list = parts();
    if (!list.length) return soonest(plan().entries, t);
    const open = list.find(p => p.t > t + 1e-6 && !p.done);
    if (open) return open.t;
    const last = list[list.length - 1];
    return last && last.t > t + 1e-6 ? last.t : Infinity;
  }

  function exitAfter(t) {
    let best = null;
    for (const e of plan().exits) if (e.t > t + 1e-6 && (!best || e.t < best.t)) best = e;
    return best;
  }

  function landing(t, via) {
    const sec = plan().loops.find(s => Math.abs(s.from - t) < 1e-6 && !done.has(tag(s)));
    const shape = (via && via.mode) || null;
    if (shape) {
      const want = via.cross === null || via.cross === undefined ? crossfade() : via.cross;
      const x = shape === 'hard' ? 0 : Math.max(0, want);
      const h = shape === 'head' ? x : shape === 'tail' ? 0 : x / 2;
      return { h, r: x, sec, forced: true };
    }
    if (sec) { const e = edges(sec); return { h: e.lead, r: e.cross || e.soft, sec }; }
    const x = Math.max(0, crossfade());
    return { h: x / 2, r: x, sec: null };
  }

  function edges(sec) {
    const len = sec.to - sec.from;
    const want = sec.cross === null || sec.cross === undefined ? crossfade() : sec.cross;
    const x = Math.max(0, Math.min(want, len));
    const lead = sec.mode === 'head' ? x : sec.mode === 'both' ? x / 2 : 0;
    const run = sec.mode === 'tail' ? x : sec.mode === 'both' ? x / 2 : 0;
    const soft = sec.mode === 'fade' ? Math.max(POP, Math.min(x, len / 2)) : POP;
    return { len, lead, run, cross: lead + run, soft };
  }

  function voice(at, head, tail, rise, fallAt, fallFor) {
    const src = ctx.createBufferSource();
    src.buffer = buffer();
    const gain = ctx.createGain();
    src.connect(gain).connect(out);
    const dur = tail - head;
    if (rise > 0) {
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.setValueCurveAtTime(UP, at, rise);
    } else {
      gain.gain.setValueAtTime(1, at);
    }
    gain.gain.setValueAtTime(1, at + rise);
    if (fallFor > 0 && fallAt >= rise) gain.gain.setValueCurveAtTime(DOWN, at + fallAt, fallFor);
    src.start(at, head, dur);
    src.stop(at + dur + 0.01);
    const made = { src, gain, at, head, tail };
    live.push(made);
    src.onended = () => { live = live.filter(v => v !== made); };
    return made;
  }

  function insideExit(sec) {
    const hit = plan().exits
      .filter(x => x.t > sec.from + 1e-6 && x.t <= sec.to + 1e-6)
      .reduce((m, x) => Math.min(m, x.t), Infinity);
    return hit;
  }

  function schedulePartial(sec, exit, via) {
    const target = targetAfter(exit);
    if (target === Infinity) return false;
    const e = edges(sec);
    const land = landing(target, via);
    arrive = land.sec && land.forced ? { h: land.h, r: land.r } : null;
    const inside = firstPass && enterAt !== null
      && enterAt > sec.from + 1e-6 && enterAt < exit - land.h - 0.02;
    const head = Math.max(0, inside ? enterAt : (firstPass ? sec.from : sec.from - e.lead));
    const rise = firstPass ? 0 : (e.cross || e.soft);
    const fallAt = (exit - land.h) - head;
    if (fallAt <= rise + 0.01) return false;
    const startAt = nextAt;
    enterAt = null;
    voice(startAt, head, Math.min(span(), exit - land.h + land.r), rise, fallAt, land.r);
    line.push({ at: startAt + (sec.from - head), from: sec.from, to: exit });
    done.add(tag(sec));
    leaving = { label: sec.label, until: startAt + (exit - head) };
    nextAt = startAt + fallAt;
    nextHead = target - land.h;
    cursor = target;
    pendingRise = land.sec ? 0 : land.r;
    firstPass = !land.sec;
    armed = false;
    passes = [];
    runNow = null;
    return true;
  }

  function schedulePass(sec) {
    if (armed || partDone(sec.from)) {
      const exit = insideExit(sec);
      if (exit !== Infinity && schedulePartial(sec, exit, exitAfter(sec.from))) return;
    }
    const e = edges(sec);
    const tail = Math.min(span(), sec.to + e.run);
    const fallFor = e.cross || e.soft;
    const lead = arrive ? arrive.h : e.lead;
    const rise = firstPass ? 0 : (arrive ? arrive.r : fallFor);
    const inside = firstPass && enterAt !== null
      && enterAt > sec.from + 1e-6 && enterAt < sec.to - fallFor - 0.02;
    const head = Math.max(0, inside ? enterAt : (firstPass ? sec.from : sec.from - lead));
    enterAt = null;
    arrive = null;
    const coreAt = nextAt + (sec.from - head);
    const made = voice(nextAt, head, tail, rise, (tail - fallFor) - head, fallFor);
    runNow = null;
    const entry = { at: coreAt, from: sec.from, to: sec.to };
    passes.push({ sec, made, coreAt, coreEnd: coreAt + e.len, entry });
    line.push(entry);
    nextAt = coreAt + e.len - e.lead;
    firstPass = false;
  }

  function scheduleRun() {
    if (partDone(cursor)) {
      const skipTo = targetAfter(cursor);
      if (skipTo !== Infinity) {
        const r = Math.max(0, crossfade());
        const endWall = runNow ? runNow.made.at + (runNow.entry.to - runNow.made.head) : 0;
        if (runNow && r > 0 && endWall - r > ctx.currentTime + 0.03) {
          runNow.made.gain.gain.setValueCurveAtTime(DOWN, endWall - r, r);
          nextAt = endWall - r;
          nextHead = Math.max(0, skipTo - r);
          pendingRise = r;
        } else {
          nextHead = skipTo;
          pendingRise = 0;
        }
        cursor = skipTo;
        firstPass = true;
        runNow = null;
        return;
      }
    }
    const toLoop = soonest(loops().map(s => ({ t: s.from })), cursor);
    // An arming belongs to the part that asked to leave. Read here rather than
    // trusted from pump(): the cursor crosses into the next part mid-pump, and
    // an arming carried over would be spent on the first exit it finds there.
    const hot = (armed && armedAt === partStartAt(cursor)) || partDone(cursor);
    const toExit = hot ? soonest(plan().exits, cursor) : Infinity;
    const toSkip = nextSkipped(cursor);
    const cut = Math.min(toExit, toSkip);
    let target = Infinity;
    let jump = cut < toLoop && cut < span();
    const via = jump ? (toSkip <= toExit ? { mode: 'head' } : exitAfter(cursor)) : null;
    if (jump) {
      target = targetAfter(cut);
      if (target === Infinity) { jump = false; armed = false; }
    }
    const stop = Math.min(span(), toLoop, jump ? cut : Infinity);
    if (stop <= cursor + 1e-4) { cursor = span(); return; }
    const core = nextAt + (cursor - nextHead);
    enterAt = null;
    if (!jump) {
      const made = voice(nextAt, nextHead, stop, pendingRise, 0, 0);
      const entry = { at: core, from: cursor, to: stop };
      line.push(entry);
      runNow = { made, entry };
      nextAt += stop - nextHead;
      nextHead = stop;
      cursor = stop;
      pendingRise = 0;
      firstPass = true;
      passes = [];
      return;
    }
    const land = landing(target, via);
    arrive = land.sec && land.forced ? { h: land.h, r: land.r } : null;
    const tail = Math.min(span(), stop - land.h + land.r);
    voice(nextAt, nextHead, tail, pendingRise, (stop - land.h) - nextHead, land.r);
    line.push({ at: core, from: cursor, to: stop });
    nextAt += (stop - land.h) - nextHead;
    nextHead = target - land.h;
    cursor = target;
    pendingRise = land.sec ? 0 : land.r;
    firstPass = !land.sec;
    armed = false;
    passes = [];
  }

  function pump() {
    if (!running || !ctx) return;
    let guard = 0;
    while (nextAt < ctx.currentTime + AHEAD && cursor < span() - 1e-4 && guard++ < 24) {
      if (armed && armedAt !== partStartAt(cursor)) armed = false;
      // A stalled main thread leaves the frontier behind the clock, and a voice
      // scheduled in the past is pinned to now — collapsing its fade-in onto the
      // level that follows it, which the engine refuses.
      nextAt = Math.max(nextAt, ctx.currentTime + LATE);
      const sec = partDone(cursor) ? null
        : loops().find(s => cursor >= s.from - 1e-6 && cursor < s.to - 1e-6);
      if (sec) schedulePass(sec); else scheduleRun();
    }
    line = line.filter(s => s.at + (s.to - s.from) > ctx.currentTime - 2);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    running = false;
    for (const v of live) { try { v.src.stop(); } catch (e) { /* finished */ } }
    live = [];
    passes = [];
    line = [];
    leaving = null;
  }

  function start(at) {
    stop();
    if (!buffer()) return false;
    const gear = rig();
    if (!gear) return false;
    ctx = gear.ac;
    out = gear.gain;
    done = new Set();
    armed = false;
    pendingRise = 0;
    runNow = null;
    leaving = null;
    arrive = null;
    armedAt = null;
    cursor = Math.max(0, Math.min(at, span() - 0.05));
    nextHead = cursor;
    enterAt = cursor;
    nextAt = ctx.currentTime + 0.08;
    firstPass = true;
    running = true;
    pump();
    timer = setInterval(pump, TICK);
    return true;
  }

  function cutAtExit(made, entry, limit, sec) {
    const now = ctx.currentTime;
    const via = exitAfter(position());
    const exit = via ? via.t : Infinity;
    if (exit === Infinity || exit > limit + 1e-6) return false;
    const target = targetAfter(exit);
    if (target === Infinity) return false;
    const land = landing(target, via);
    arrive = land.sec && land.forced ? { h: land.h, r: land.r } : null;
    const cutAt = made.at + ((exit - land.h) - made.head);
    if (cutAt <= now + 0.06) return false;
    const g = made.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + 0.02);
    if (land.r > 0) g.setValueCurveAtTime(DOWN, cutAt, land.r);
    try { made.src.stop(cutAt + land.r + 0.01); } catch (err) { /* gone */ }
    entry.to = exit;
    if (sec) {
      done.add(tag(sec));
      leaving = { label: sec.label, until: made.at + (exit - made.head) };
    }
    runNow = null;
    passes = [];
    nextAt = cutAt;
    nextHead = target - land.h;
    cursor = target;
    pendingRise = land.sec ? 0 : land.r;
    firstPass = !land.sec;
    armed = false;
    pump();
    return true;
  }

  function next() {
    if (!running) return null;
    armed = true;
    armedAt = partStartAt(position());
    if (!passes.length) {
      if (runNow) cutAtExit(runNow.made, runNow.entry, runNow.entry.to, null);
      return null;
    }
    const now = ctx.currentTime;
    let cur = null;
    for (const p of passes) if (p.coreAt <= now + 0.02 && (!cur || p.coreAt > cur.coreAt)) cur = p;
    if (!cur) cur = passes[0];
    for (const p of passes) if (p !== cur) { try { p.made.src.stop(); } catch (e) { /* gone */ } }
    if (cutAtExit(cur.made, cur.entry, cur.sec.to, cur.sec)) return cur.sec;
    const g = cur.made.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + 0.02);
    done.add(tag(cur.sec));
    armed = false;
    const tail = cur.made.tail;
    const wallEnd = cur.made.at + (tail - cur.made.head);
    const skipTo = partDone(tail) ? targetAfter(tail) : Infinity;
    if (skipTo !== Infinity) {
      const land = landing(skipTo, { mode: 'head' });
      const from = wallEnd - land.r;
      if (land.r > 0 && from > now + 0.03) g.setValueCurveAtTime(DOWN, from, land.r);
      arrive = land.sec ? { h: land.h, r: land.r } : null;
      leaving = { label: cur.sec.label, until: wallEnd };
      nextAt = Math.max(now, from);
      nextHead = skipTo - land.h;
      cursor = skipTo;
      pendingRise = land.sec ? 0 : land.r;
      firstPass = !land.sec;
      passes = [];
      pump();
      return cur.sec;
    }
    cur.entry.to = tail;
    cursor = tail;
    nextHead = cursor;
    pendingRise = 0;
    nextAt = wallEnd;
    firstPass = true;
    passes = [];
    pump();
    return cur.sec;
  }

  function position() {
    if (!running || !ctx) return cursor;
    const now = ctx.currentTime;
    let best = null;
    let soon = null;
    for (const s of line) {
      if (s.at <= now && now < s.at + (s.to - s.from) && (!best || s.at > best.at)) best = s;
      else if (s.at > now && (!soon || s.at < soon.at)) soon = s;
    }
    if (best) return best.from + (now - best.at);
    // Nothing sounding yet: the answer is where the next voice comes in, not
    // `cursor` — the scheduler runs a lookahead ahead of the playhead and often
    // a whole section ahead of it, so `cursor` would report the track as being
    // somewhere it has not reached. Only once there is nothing left to come is
    // the frontier the truth, which is how the end of the track is noticed.
    return soon ? soon.from : cursor;
  }

  function looping() {
    if (!running || !ctx) return null;
    const now = ctx.currentTime;
    let cur = null;
    for (const p of passes) if (p.coreAt <= now && (!cur || p.coreAt > cur.coreAt)) cur = p;
    return cur ? cur.sec : null;
  }

  const bowing = () => (running && leaving && ctx.currentTime < leaving.until ? leaving.label : null);

  return { start, stop, next, position, looping, leaving: bowing,
           armed: () => armed && running && !!exitAfter(position()),
           playing: () => running };
}
