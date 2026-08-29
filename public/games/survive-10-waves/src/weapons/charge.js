import { CFG } from '../config/index.js';
import * as modules from '../modules/index.js';
import * as loadout from './loadout.js';
import { hintHTML } from '../ui/swaptip.js';

function noteFor(p, cooling) {
  if (cooling) return 'GUN OVERHEATED';
  if (p.dryNote > 0) return 'RECHARGING';
  if (p.chargeShort > 0) return 'HOLD LONGER';
  return '';
}

// The way out of an empty gun, said only when there is one: with nothing else
// usable in the rack, `next` hands back the slot it was given. Said here every
// time it is true — an empty gun is a question being asked now, where the strip
// in the corner is only teaching the control once.
function hintFor(p, note) {
  if (note !== 'RECHARGING') return '';
  const slot = loadout.slotOf(p.gun);
  return loadout.next(slot) === slot ? '' : hintHTML;
}

// One ring reads as readiness either way: winding up while you hold, and the
// shot coming back the rest of the time.
export function readout(p) {
  const gun = CFG.guns[p.gun];
  const charges = p.guns[p.gun].charges;
  const max = modules.gunCharges(gun);
  const L = CFG.laser;
  // The heat belongs to the lance, so the ring only wears it while the lance is
  // the gun in hand: swapping away leaves it cooling out of sight.
  const winding = !!gun.charge && p.charge > 0;
  const cooling = !!gun.charge && p.heat > 0;

  const meter = winding
    ? { fill: Math.min(1, p.charge / L.overheat), max: 1, warn: p.charge > L.overheat - L.warn }
    : cooling
      ? { fill: 1 - p.heat / L.cooldown, max: 1, warn: true }
      : { fill: charges, max, warn: charges < gun.cost };

  const note = noteFor(p, cooling);

  return {
    gun,
    ...meter,
    show: winding || cooling || p.gauge > 0 || charges < max - 0.001,
    dry: p.dryFx > 0,
    pulse: p.firePulse / CFG.crosshair.firePulse,
    wind: winding,
    note,
    hint: hintFor(p, note),
  };
}
