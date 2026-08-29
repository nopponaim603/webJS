import { CFG } from '../../config/index.js';
import { has, pair, pairUp, pairStep, frac, pct, units, secs, round } from '../shared/curve.js';

const C = () => CFG.gunmods.lance;


// An even fan has no beam down the middle, and the middle is the one the gun
// has already fired by the time the module runs: even counts spend a beam
// doubling it instead of widening the fan.
const oddUp = (n) => (n % 2 ? n : n + 1);

export const prism = {
  id: 'lzPrism',
  on: () => has('lzPrism'),
  beams: () => oddUp(Math.max(1, pairStep('lzPrism', C().prism.beams))),
  spread: () => pair('lzPrism', C().prism.spread),
  share: () => pair('lzPrism', C().prism.share),
  taper: () => pair('lzPrism', C().prism.taper),
  look: () => C().prism.look,
  grade: () => frac('lzPrism'),
};


export const rift = {
  id: 'lzRift',
  on: () => has('lzRift'),
  pull: () => pair('lzRift', C().rift.pull),
  reach: () => pair('lzRift', C().rift.reach),
  life: () => pair('lzRift', C().rift.life),
  damage: () => pairUp('lzRift', C().rift.damage),
  bite: () => pair('lzRift', C().rift.bite),
  tick: () => C().rift.tick,
  look: () => C().rift.look,
  grade: () => frac('lzRift'),
};



export const STATS = {
  lzPrism: [
    { label: 'Beams', read: () => prism.beams(), fmt: round },
    { label: 'Fan width', read: () => prism.spread(), fmt: (v) => `${v.toFixed(0)} deg` },
    { label: 'Damage a beam', read: () => prism.share(), fmt: pct },
    { label: 'Damage across the fan', read: () => prism.share() * prism.beams(), fmt: pct },
  ],
  lzRift: [
    { label: 'Pull', read: () => rift.pull(), fmt: (v) => `${v.toFixed(0)}/s` },
    { label: 'Pull reach', read: () => rift.reach(), fmt: units },
    { label: 'Rift lasts', read: () => rift.life(), fmt: secs },
    { label: 'Burn per second', read: () => rift.damage(), fmt: round },
    { label: 'Seam width', read: () => rift.bite(), fmt: units },
  ],
};

export const KITS = [prism, rift];
