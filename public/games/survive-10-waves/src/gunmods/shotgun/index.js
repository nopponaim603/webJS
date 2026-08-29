import { makeKit } from '../shared/kit.js';
import * as slug from './slug.js';

export const MODS = [slug];

const kit = makeKit(MODS);

export const {
  rateMult, damageMult, plan, tag, shot, stepBullet, endBullet, hit, killed,
  grenadeFired, stepGrenade, grenadeBlast, charging, beam, beamHit,
  chargeWindow, chargeRelief, slowOn, amplifyOn, update, clear,
} = kit;
