import { makeKit } from '../shared/kit.js';
import * as well from './well.js';
import * as emp from './emp.js';

export const MODS = [well, emp];

const kit = makeKit(MODS);

export const {
  rateMult, damageMult, plan, tag, shot, stepBullet, endBullet, hit, killed,
  grenadeFired, stepGrenade, grenadeBlast, charging, beam, beamHit,
  chargeWindow, chargeRelief, slowOn, amplifyOn, update, clear,
} = kit;
