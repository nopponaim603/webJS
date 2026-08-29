import { makeKit } from '../shared/kit.js';
import * as prism from './prism.js';
import * as rift from './rift.js';

export const MODS = [prism, rift];

const kit = makeKit(MODS);

export const {
  rateMult, damageMult, plan, tag, shot, stepBullet, endBullet, hit, killed,
  grenadeFired, stepGrenade, grenadeBlast, charging, beam, beamHit,
  chargeWindow, chargeRelief, slowOn, amplifyOn, update, clear,
} = kit;
