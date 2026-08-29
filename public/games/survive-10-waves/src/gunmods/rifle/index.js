import { makeKit } from '../shared/kit.js';
import * as rail from './rail.js';
import * as seeker from './seeker.js';

export const MODS = [rail, seeker];

const kit = makeKit(MODS);

export const {
  rateMult, damageMult, plan, tag, shot, stepBullet, endBullet, hit, killed,
  grenadeFired, stepGrenade, grenadeBlast, charging, beam, beamHit,
  chargeWindow, chargeRelief, slowOn, amplifyOn, update, clear,
} = kit;
