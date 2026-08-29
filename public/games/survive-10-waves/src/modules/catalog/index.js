// Every module the bench can sell: what it is called, what it says on the card,
// and the numbers its levels climb by. Where each one sits in the tree is
// CFG.moduleTree's business, and what its numbers do is index.js's.
// `endless` names the one number that keeps climbing past the table, on the
// modules that never run out once the mission's last wave is cleared.
import { PLAYER_MODULES } from './player.js';
import { GUN_MODULES } from './guns.js';
import { DRONE_MODULES } from './drone.js';

export const MODULES = [...GUN_MODULES, ...PLAYER_MODULES, ...DRONE_MODULES];
