import { CFG } from '../../config/index.js';
import { has, pair, pairStep, frac, pct, plus, units, round } from '../shared/curve.js';

const C = () => CFG.gunmods.rifle;



export const rail = {
  id: 'rfRail',
  on: () => has('rfRail'),
  every: () => C().rail.every,
  damage: () => pair('rfRail', C().rail.damage),
  reach: () => pair('rfRail', C().rail.reach),
  width: () => pair('rfRail', C().rail.width),
  retain: () => pair('rfRail', C().rail.retain),
  knock: () => pair('rfRail', C().rail.knock),
  look: () => C().rail.look,
  grade: () => frac('rfRail'),
};

export const seeker = {
  id: 'rfSeeker',
  on: () => has('rfSeeker'),
  count: () => Math.max(1, pairStep('rfSeeker', C().seeker.count)),
  // What a shot is worth once the darts it throws are counted in, which is the
  // only number that says whether the module is pulling its weight.
  volley: () => seeker.count() * seeker.share() * seeker.chance(),
  share: () => pair('rfSeeker', C().seeker.share),
  chance: () => pair('rfSeeker', C().seeker.chance),
  speed: () => pair('rfSeeker', C().seeker.speed),
  turn: () => pair('rfSeeker', C().seeker.turn),
  reach: () => pair('rfSeeker', C().seeker.reach),
  loft: () => pair('rfSeeker', C().seeker.loft),
  life: () => C().seeker.life,
  look: () => C().seeker.look,
  grade: () => frac('rfSeeker'),
};



export const STATS = {
  rfRail: [
    { label: 'Fires every', read: () => rail.every(), fmt: (v) => `${v} rounds`, single: true },
    { label: 'Slug damage', read: () => rail.damage(), fmt: (v) => `${v.toFixed(1)}x` },
    { label: 'Slug range', read: () => rail.reach(), fmt: units },
    { label: 'Damage kept per pierce', read: () => rail.retain(), fmt: pct },
  ],
  rfSeeker: [
    { label: 'Darts per shot', read: () => seeker.count(), fmt: round },
    { label: 'Split chance', read: () => seeker.chance(), fmt: pct },
    { label: 'Dart damage', read: () => seeker.share(), fmt: pct },
    { label: 'Added damage per shot', read: () => seeker.volley(), fmt: plus },
    { label: 'Dart range', read: () => seeker.reach(), fmt: units },
    { label: 'Arc height', read: () => seeker.loft(), fmt: units },
  ],
};

export const KITS = [rail, seeker];
