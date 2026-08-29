import { CFG } from '../../config/index.js';
import { has, pair, pairStep, frac, pct, units, secs, round } from '../shared/curve.js';

const C = () => CFG.gunmods.launcher;




export const well = {
  id: 'lnWell',
  on: () => has('lnWell'),
  chance: () => C().well.chance,
  pull: () => pair('lnWell', C().well.pull),
  reach: () => pair('lnWell', C().well.reach),
  hold: () => pair('lnWell', C().well.hold),
  spread: () => C().well.spread,
  look: () => C().well.look,
  grade: () => frac('lnWell'),
};


export const emp = {
  id: 'lnEmp',
  on: () => has('lnEmp'),
  chance: () => pair('lnEmp', C().emp.chance),
  radius: () => pair('lnEmp', C().emp.radius),
  life: () => pair('lnEmp', C().emp.life),
  slow: () => pair('lnEmp', C().emp.slow),
  damage: () => pair('lnEmp', C().emp.damage),
  tick: () => C().emp.tick,
  jumps: () => Math.max(1, pairStep('lnEmp', C().emp.jumps)),
  look: () => C().emp.look,
  grade: () => frac('lnEmp'),
};

export const STATS = {
  lnWell: [
    { label: 'Implode chance', read: () => well.chance(), fmt: pct, single: true },
    { label: 'Pull strength', read: () => well.pull(), fmt: (v) => `${v.toFixed(0)}/s` },
    { label: 'Pull range', read: () => well.reach(), fmt: units },
    { label: 'Duration', read: () => well.hold(), fmt: secs },
  ],
  lnEmp: [
    { label: 'Field chance', read: () => emp.chance(), fmt: pct },
    { label: 'Field radius', read: () => emp.radius(), fmt: units },
    { label: 'Duration', read: () => emp.life(), fmt: secs },
    { label: 'Slow', read: () => emp.slow(), fmt: pct },
    { label: 'Damage per tick', read: () => emp.damage(), fmt: pct },
    { label: 'Arc targets', read: () => emp.jumps(), fmt: round },
  ],
};

export const KITS = [well, emp];
