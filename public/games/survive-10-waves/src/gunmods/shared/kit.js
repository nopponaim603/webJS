// A gun's branch is a handful of modules that each answer for themselves. This
// is the wiring that lets the registry ask the branch one question and have
// every module in it heard, without four identical files of fan-out.

const first = (mods, name, args) => {
  for (const m of mods) {
    if (!m[name]) continue;
    const v = m[name](...args);
    if (v !== undefined && v !== false) return v;
  }
  return undefined;
};

const any = (mods, name, args) => {
  let taken = false;
  for (const m of mods) if (m[name] && m[name](...args)) taken = true;
  return taken;
};

const every = (mods, name, args) => {
  for (const m of mods) if (m[name]) m[name](...args);
};

const total = (mods, name, args) => mods.reduce(
  (n, m) => n + (m[name] ? m[name](...args) || 0 : 0), 0,
);

export function makeKit(mods) {
  return {
    plan: (...a) => first(mods, 'plan', a),
    tag: (...a) => every(mods, 'tag', a),
    shot: (...a) => every(mods, 'shot', a),
    stepBullet: (...a) => any(mods, 'stepBullet', a),
    endBullet: (...a) => every(mods, 'endBullet', a),
    hit: (...a) => every(mods, 'hit', a),
    killed: (...a) => every(mods, 'killed', a),
    grenadeFired: (...a) => every(mods, 'grenadeFired', a),
    grenadeBlast: (...a) => any(mods, 'grenadeBlast', a),
    beam: (...a) => every(mods, 'beam', a),
    slowOn: (...a) => total(mods, 'slowOn', a),
    update: (...a) => every(mods, 'update', a),
    clear: (...a) => every(mods, 'clear', a),
  };
}
