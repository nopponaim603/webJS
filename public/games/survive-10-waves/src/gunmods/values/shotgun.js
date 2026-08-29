import { CFG } from '../../config/index.js';
import * as modules from '../../modules/index.js';
import { has, pairUp, frac } from '../shared/curve.js';

const C = () => CFG.gunmods.shotgun;

// The shotgun's own damage a second, which is what the branch's shares and
// multiples are priced against: ten pellets a shell, at the rate it cycles.
const SHOTGUN = CFG.guns[1];
const shellDamage = () => SHOTGUN.damage * SHOTGUN.pellets;
const gunPerSecond = () => shellDamage() * SHOTGUN.fireRate;




export const slug = {
  id: 'sgSlug',
  on: () => has('sgSlug'),
  every: () => C().slug.every,
  damage: () => pairUp('sgSlug', C().slug.damage),
  hit: () => shellDamage() * pairUp('sgSlug', C().slug.damage),
  // Read off the gun, not the module: what a slug comes apart into is whatever
  // the shotgun would have thrown that shot, its own levels counted in.
  burstPellets: () => modules.gunPellets(SHOTGUN),
  grade: () => frac('sgSlug'),
};



export const STATS = {
  sgSlug: [
    { label: 'Slug damage', read: () => slug.damage(), fmt: (v) => `${v.toFixed(1)}x` },
  ],
};

export const KITS = [slug];
