import * as rifle from './rifle.js';
import * as shotgun from './shotgun.js';
import * as lance from './lance.js';
import * as launcher from './launcher.js';

export { rifle, shotgun, lance, launcher };

// Which gun each branch belongs to, so the bench and the demo page can group a
// module without a table of their own to fall out of date.
export const BY_GUN = { rifle, shotgun, lance, launcher };

export const GUNMOD_STATS = {
  ...rifle.STATS, ...shotgun.STATS, ...lance.STATS, ...launcher.STATS,
};
