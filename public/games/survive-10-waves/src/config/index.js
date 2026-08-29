import { MAP } from './map.js';
import { COMBAT } from './combat.js';
import { BUGS } from './bugs.js';
import { ATTACKS } from './attacks.js';
import { BOSS } from './boss.js';
import { META } from './meta.js';
import { GUNMODS } from './gunmods/index.js';

export const CFG = { ...MAP, ...COMBAT, ...BUGS, ...ATTACKS, ...BOSS, ...META, ...GUNMODS };

const sources = { MAP, COMBAT, BUGS, ATTACKS, BOSS, META, GUNMODS };
const seen = new Map();
for (const [name, group] of Object.entries(sources)) {
  for (const key of Object.keys(group)) {
    if (seen.has(key)) throw new Error(`CFG.${key} is defined in both ${seen.get(key)} and ${name}`);
    seen.set(key, name);
  }
}

export { ANIM, ARM_POSE, BONE_NAMES } from './anim.js';
export { BUG_TYPES } from './species.js';
export { TRACKS, MENU_TRACK, WAVE_TRACKS, SPECIAL_TRACK, OFF_SHUFFLE } from './tracks.js';
export { STORY } from './story.js';
export { SECTORS } from './sectors.js';
export { SPECIAL } from './special.js';
export { CREDITS, SOUNDTRACK_HEAD, SOUNDTRACK_LINK, THANKS, DEDICATION } from './credits.js';
export { TESTIMONIALS, TESTIMONIALS_HEAD } from './testimonials.js';
export { AVATAR_ROWS } from './avatars.js';
