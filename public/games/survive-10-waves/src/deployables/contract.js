/**
 * The deployable contract, version 1.
 *
 * A deployable is a self-assembling structure usable from any three.js
 * project. Its module exports a factory that takes the host's THREE (so the
 * file itself never imports three and works with any version or bundler):
 *
 *   createThing({ THREE, playSound?, speed? }) -> Deployable
 *
 * The factory is also the module's default export, so a tool can load a model
 * file without knowing its name; a model file imports nothing but this
 * runtime, by relative path. The optional fx callback receives
 * { clock, dt, playing, clip, time } each update — clip/time are the posed
 * clip, so emissives can die while posed in 'destroyed'.
 *
 * The factory describes itself declaratively and hands the description to
 * createRig(), which returns the Deployable every host and debugger can rely
 * on:
 *
 *   api          contract version number
 *   name         the deployable's name
 *   root         Object3D to add to any scene
 *   parts        [{ name, group, index, object, explode }] — every part named
 *   clips        { [clipName]: { name, sequences: [Sequence] } } — raw,
 *                inspectable timing data
 *   duration(clip)            authored seconds at speed 1
 *   play(clip, { onDone?, from? })  play a clip, from `from` seconds (default 0)
 *   stop()                    freeze where it is
 *   playing()                 clip name or null
 *   clip() / time()           current pose, for timeline UIs
 *   update(dt) -> bool        advance playback and idle fx; true while playing
 *   setTime(clip, t)          scrub to an absolute time, silently
 *   setSpeed(k)               master multiplier over every duration and stagger
 *   setExplode(k)             explosion view, 0 assembled .. 1 apart
 *   setPartEnabled(name, on) / partEnabled(name)
 *   setSoundEnabled(name, on) / soundEnabled(name)
 *   setMuted(on)
 *   partOf(object3d)          hit object -> owning part, for hover
 *   dispose()                 free geometry, materials and textures
 *
 * Sequence: { name, part, at, dur, ease, channels: [{ target, from, to }],
 *             appear?, vanish?, sound?: { id, rate?, gain?, at? } }
 * `target` is one of position|rotation|scale dot x|y|z; values are absolute in
 * the part's local space. `appear` shows the part at the sequence start,
 * `vanish` hides it at the end. `sound.at` is a 0..1 fraction of the sequence,
 * fired through playSound({ id, rate, gain, part, sequence }) only during
 * play(), never while scrubbing. Every sound rides a movement: a sequence
 * carrying a sound must animate at least one channel with from !== to —
 * a clunk with nothing moving is a contract violation. Hang a final lock on a
 * real seating motion (the part presses a few hundredths into its socket).
 * `sound.id` must be one of SOUND_IDS — six ids, each backed by one recording
 * in ./sounds/ (see sounds.js) — and nothing else; hosts play those samples
 * (or their own copies of them), with the procedural synth as offline
 * fallback. seq() and ch() below are authoring sugar for exactly these two
 * shapes.
 */

export const CONTRACT_VERSION = 1;

export const EASE = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  gravity: (t) => t * t,
};

export const SOUND_IDS = ['heavy', 'piece', 'small', 'servo', 'stow', 'lock'];

export const seq = (name, part, at, dur, channels, extra = {}) =>
  ({ name, part, at, dur, ease: 'easeInOut', channels, ...extra });
export const ch = (target, from, to) => ({ target, from, to });

const TARGETS = [];
for (const prop of ['position', 'rotation', 'scale']) {
  for (const axis of ['x', 'y', 'z']) TARGETS.push(`${prop}.${axis}`);
}

const seqEnd = (s) => s.at + s.dur;
const clipLength = (clip) => Math.max(...clip.sequences.map(seqEnd));

function compileClip(clip, partsByName) {
  const tracks = new Map();
  const cues = [];
  for (const seq of clip.sequences) {
    const part = partsByName.get(seq.part);
    if (!part) continue;
    let entry = tracks.get(seq.part);
    if (!entry) {
      entry = { part, channels: new Map(), appearAt: -Infinity, vanishAt: Infinity };
      tracks.set(seq.part, entry);
    }
    for (const ch of seq.channels) {
      const spans = entry.channels.get(ch.target) || [];
      spans.push({ at: seq.at, dur: seq.dur, ease: EASE[seq.ease] || EASE.easeInOut,
                   from: ch.from, to: ch.to });
      spans.sort((a, b) => a.at - b.at);
      entry.channels.set(ch.target, spans);
    }
    if (seq.appear) {
      entry.appearAt = entry.appearAt === -Infinity ? seq.at : Math.min(entry.appearAt, seq.at);
    }
    if (seq.vanish) {
      entry.vanishAt = entry.vanishAt === Infinity ? seqEnd(seq) : Math.max(entry.vanishAt, seqEnd(seq));
    }
    if (seq.sound) {
      cues.push({ t: seq.at + (seq.sound.at ?? 1) * seq.dur, part: seq.part,
                  sequence: seq.name, id: seq.sound.id,
                  rate: seq.sound.rate ?? 1, gain: seq.sound.gain ?? 1 });
    }
  }
  cues.sort((a, b) => a.t - b.t);
  return { tracks, cues, length: clipLength(clip) };
}

function spanValue(spans, t) {
  let v = spans[0].from;
  for (const s of spans) {
    if (t < s.at) break;
    v = t >= s.at + s.dur ? s.to : s.from + (s.to - s.from) * s.ease((t - s.at) / s.dur);
  }
  return v;
}

export function createRig({ name, root, parts, clips, fx = null, playSound = null }) {
  const partsByName = new Map(parts.map((p) => [p.name, p]));
  const roots = new Map(parts.map((p) => [p.object, p]));
  const homes = new Map();
  for (const p of parts) {
    const home = {};
    for (const target of TARGETS) {
      const [prop, axis] = target.split('.');
      home[target] = p.object[prop][axis];
    }
    homes.set(p.name, home);
  }

  const compiled = {};
  for (const [clipName, clip] of Object.entries(clips)) {
    compiled[clipName] = compileClip(clip, partsByName);
  }

  const disabled = new Set();
  const silenced = new Set();
  let speed = 1;
  let explode = 0;
  let muted = false;
  let clock = 0;
  let run = null;
  let pose = { clip: Object.keys(clips)[0], t: 0 };

  function applyPose(clipName, t) {
    const c = compiled[clipName];
    for (const p of parts) {
      const home = homes.get(p.name);
      const track = c.tracks.get(p.name);
      for (const target of TARGETS) {
        const spans = track && track.channels.get(target);
        const [prop, axis] = target.split('.');
        p.object[prop][axis] = spans ? spanValue(spans, t) : home[target];
      }
      if (explode > 0 && p.explode) {
        p.object.position.x += p.explode[0] * explode;
        p.object.position.y += p.explode[1] * explode;
        p.object.position.z += p.explode[2] * explode;
      }
      const born = !track || t >= track.appearAt;
      const gone = track ? t >= track.vanishAt : false;
      p.object.visible = !disabled.has(p.name) && born && !gone;
    }
    pose = { clip: clipName, t };
  }

  function fireCues(c, from, to) {
    if (!playSound || muted) return;
    for (const cue of c.cues) {
      if (cue.t <= from || cue.t > to) continue;
      if (silenced.has(cue.part) || disabled.has(cue.part)) continue;
      playSound({ id: cue.id, rate: cue.rate, gain: cue.gain,
                  part: cue.part, sequence: cue.sequence });
    }
  }

  applyPose(pose.clip, 0);

  return {
    api: CONTRACT_VERSION,
    name,
    root,
    parts,
    clips,
    duration: (clipName) => compiled[clipName].length,
    play(clipName, { onDone, from = 0 } = {}) {
      if (!compiled[clipName]) return;
      const t0 = Math.max(0, Math.min(compiled[clipName].length, from));
      run = { clip: clipName, t: t0, onDone };
      applyPose(clipName, t0);
      fireCues(compiled[clipName], t0 - 1e-6, t0);
    },
    stop() { run = null; },
    playing: () => (run ? run.clip : null),
    clip: () => pose.clip,
    time: () => pose.t,
    update(dt) {
      clock += dt;
      if (run) {
        const c = compiled[run.clip];
        const from = run.t;
        run.t = Math.min(c.length, run.t + dt * speed);
        applyPose(run.clip, run.t);
        fireCues(c, from, run.t);
        if (run.t >= c.length) {
          const done = run.onDone;
          run = null;
          if (done) done();
        }
      }
      if (fx) fx({ clock, dt, playing: run ? run.clip : null, clip: pose.clip, time: pose.t });
      return !!run;
    },
    setTime(clipName, t) {
      if (!compiled[clipName]) return;
      run = null;
      applyPose(clipName, Math.max(0, Math.min(compiled[clipName].length, t)));
    },
    setSpeed(k) { speed = Math.max(0.05, k); },
    setExplode(k) { explode = Math.max(0, k); applyPose(pose.clip, pose.t); },
    setPartEnabled(partName, on) {
      if (on) disabled.delete(partName); else disabled.add(partName);
      applyPose(pose.clip, pose.t);
    },
    partEnabled: (partName) => !disabled.has(partName),
    setSoundEnabled(partName, on) {
      if (on) silenced.delete(partName); else silenced.add(partName);
    },
    soundEnabled: (partName) => !silenced.has(partName),
    setMuted(on) { muted = on; },
    partOf(object) {
      for (let o = object; o; o = o.parent) {
        const p = roots.get(o);
        if (p) return p;
      }
      return null;
    },
    dispose() {
      const freed = new Set();
      root.traverse((o) => {
        if (o.geometry && !freed.has(o.geometry)) { freed.add(o.geometry); o.geometry.dispose(); }
        for (const m of [].concat(o.material || [])) {
          if (freed.has(m)) continue;
          freed.add(m);
          if (m.map) m.map.dispose();
          if (m.emissiveMap) m.emissiveMap.dispose();
          m.dispose();
        }
      });
      if (root.parent) root.parent.remove(root);
    },
  };
}

export function listSounds(deployable) {
  const byId = new Map();
  for (const clip of Object.values(deployable.clips)) {
    for (const seq of clip.sequences) {
      if (!seq.sound) continue;
      const parts = byId.get(seq.sound.id) || new Set();
      parts.add(seq.part);
      byId.set(seq.sound.id, parts);
    }
  }
  return [...byId].map(([id, parts]) => ({ id, parts: [...parts] }));
}

const METHODS = ['duration', 'play', 'stop', 'playing', 'clip', 'time', 'update',
                 'setTime', 'setSpeed', 'setExplode', 'setPartEnabled', 'partEnabled',
                 'setSoundEnabled', 'soundEnabled', 'setMuted', 'partOf', 'dispose'];

export function validateDeployable(d) {
  const bad = [];
  if (!d || typeof d !== 'object') return ['not an object'];
  if (d.api !== CONTRACT_VERSION) bad.push(`api ${d.api}, expected ${CONTRACT_VERSION}`);
  if (typeof d.name !== 'string' || !d.name) bad.push('missing name');
  if (!d.root || typeof d.root.add !== 'function') bad.push('root is not an Object3D');
  for (const m of METHODS) {
    if (typeof d[m] !== 'function') bad.push(`missing method ${m}()`);
  }
  const names = new Set();
  if (!Array.isArray(d.parts) || !d.parts.length) {
    bad.push('parts must be a non-empty array');
  } else {
    for (const p of d.parts) {
      if (!p.name) bad.push('part with no name');
      else if (names.has(p.name)) bad.push(`duplicate part name ${p.name}`);
      names.add(p.name);
      if (!p.group) bad.push(`part ${p.name} has no group`);
      if (!p.object || typeof p.object.traverse !== 'function') {
        bad.push(`part ${p.name} has no object`);
      }
    }
  }
  const clipNames = Object.keys(d.clips || {});
  if (!clipNames.length) bad.push('no clips');
  for (const clipName of clipNames) {
    const clip = d.clips[clipName];
    if (!Array.isArray(clip.sequences) || !clip.sequences.length) {
      bad.push(`clip ${clipName} has no sequences`);
      continue;
    }
    for (const seq of clip.sequences) {
      const where = `${clipName}/${seq.name || '?'}`;
      if (!seq.name) bad.push(`unnamed sequence in ${clipName}`);
      if (!names.has(seq.part)) bad.push(`${where} targets unknown part ${seq.part}`);
      if (!(seq.dur > 0)) bad.push(`${where} has no duration`);
      if (!(seq.at >= 0)) bad.push(`${where} has a negative start`);
      if (seq.ease && !EASE[seq.ease]) bad.push(`${where} uses unknown ease ${seq.ease}`);
      for (const ch of seq.channels || []) {
        if (!TARGETS.includes(ch.target)) bad.push(`${where} animates unknown target ${ch.target}`);
      }
      if (seq.sound && !(seq.channels || []).some((c) => c.from !== c.to)) {
        bad.push(`${where} plays a sound with no movement`);
      }
      if (seq.sound && !SOUND_IDS.includes(seq.sound.id)) {
        bad.push(`${where} uses unknown sound ${seq.sound.id}`);
      }
    }
  }
  return bad;
}
