import * as modules from '../modules/index.js';
import { state } from '../core/world.js';

// Every item a wave can leave on the floor: what it is called, what the card
// says about it, and the numbers its effect runs on. What the effect does is
// effects.js's business, and `effect` names it rather than `id` doing — so two
// items can share one behaviour and differ only in their numbers.
// `offer` is what an item is waiting on to be worth finding at all. An item
// without one is always on the table.
// `hint` is the line the effect bar reads out mid-fight, so it is short enough
// to take in at a glance. It is handed the item and quotes its own numbers back
// rather than spelling them out, so the readout cannot drift from what the item
// actually does — the bar beside it is already the clock, so it says no seconds.
const gain = (mult) => `+${Math.round((mult - 1) * 100)}%`;
const cut = (mult) => `−${Math.round((1 - mult) * 100)}%`;
export const ITEMS = [
  {
    id: 'healthRegen',
    name: 'Medkit',
    blurb: 'Recovers 25% of maximum health over twenty-five seconds. It stops '
         + 'the moment you take a hit, or when the wave is over.',
    hint: (i) => `Restores ${Math.round(i.share * 100)}% health · Don’t get hit`,
    effect: 'regen',
    shape: 'medkit',
    share: 0.25,
    seconds: 25,
    // Heavier than the rest: guns and the tank refill between waves and health
    // does not, so this is the only way a run gets any of it back. A share of
    // the roll rather than a chance of its own, so what it comes to depends on
    // how much else the run has put on the table.
    weight: 2,
    color: 0x7ee0a1,
    icon: '<path d="M12 20.5C12 20.5 4.5 15.5 4.5 10.6A4.2 4.2 0 0 1 12 8.4'
        + 'A4.2 4.2 0 0 1 19.5 10.6C19.5 15.5 12 20.5 12 20.5z"/>'
        + '<path d="M12 11v4M10 13h4"/>',
  },
  {
    id: 'damageAmp',
    name: 'Havoc',
    blurb: 'Everything you fire hits twice as hard for thirty seconds.',
    hint: (i) => `All damage ${gain(i.mult)}`,
    effect: 'damage',
    shape: 'round',
    mult: 2,
    seconds: 30,
    weight: 1,
    color: 0xff8a3d,
    icon: '<path d="M12 3.6 5.4 10.2M12 3.6l6.6 6.6"/>'
        + '<path d="M12 10.4 5.4 17M12 10.4l6.6 6.6"/>'
        + '<path d="M7 20.9h10"/>',
  },
  {
    id: 'invuln',
    name: 'Aegis',
    blurb: 'Nothing can touch you for fifteen seconds.',
    hint: () => 'Immune to all damage',
    effect: 'invuln',
    shape: 'shield',
    seconds: 15,
    weight: 1,
    color: 0x3dff5e,
    mark: true,
    icon: '<path d="M12 3.2 5.2 6.1v5.4c0 4.2 2.9 7.4 6.8 9.3'
        + 'c3.9-1.9 6.8-5.1 6.8-9.3V6.1z"/>'
        + '<path d="M9.2 12.1l2 2 3.6-3.9"/>',
  },
  {
    id: 'energy',
    name: 'Reactor',
    blurb: 'Dash and fly all you like for twenty seconds: the tank pays for '
         + 'nothing.',
    hint: () => 'Unlimited energy',
    effect: 'energy',
    shape: 'battery',
    seconds: 20,
    weight: 1,
    offer: () => modules.hasDash() || modules.hasJetpack(),
    color: 0x4cc9f0,
    icon: '<path d="M13.2 3.2 6.4 13.1h4.6l-.6 7.6 7-10.1h-4.7z"/>',
  },
  {
    id: 'speed',
    name: 'Afterburner',
    blurb: 'You run a third again as fast for twenty seconds.',
    hint: (i) => `Move speed ${gain(i.mult)}`,
    effect: 'speed',
    shape: 'booster',
    mult: 1.3,
    seconds: 20,
    weight: 1,
    color: 0xb388ff,
    icon: '<path d="M4.4 6.3 10.6 12l-6.2 5.7"/>'
        + '<path d="M12.4 6.3 18.6 12l-6.2 5.7"/>',
  },
  {
    id: 'overclock',
    name: 'Overclock',
    blurb: 'Every gun fires free for fifteen seconds: no shot spends a charge, '
         + 'and the rack stays full however long you hold the trigger.',
    hint: () => 'Unlimited bullets',
    effect: 'ammo',
    shape: 'drum',
    seconds: 15,
    weight: 1,
    color: 0xff5ec8,
    icon: '<path d="M17.4 8.2c3.5 0 3.5 7.6 0 7.6-3.5 0-4.9-7.6-8.8-7.6'
        + '-3.2 0-3.2 7.6 0 7.6 3.9 0 5.3-7.6 8.8-7.6z"/>',
  },
  {
    id: 'fireRate',
    name: 'Autoloader',
    blurb: 'Every gun cycles three quarters again as fast for twenty seconds. '
         + 'What it costs is charges: the rack empties as fast as the shots '
         + 'leave it.',
    hint: (i) => `Fire rate ${gain(i.mult)}`,
    effect: 'rate',
    shape: 'spool',
    mult: 1.75,
    seconds: 20,
    weight: 1,
    color: 0xff4646,
    icon: '<path d="M19.2 12A7.2 7.2 0 1 1 17.1 6.9"/>'
        + '<path d="M17.4 3.2v3.9h-3.9"/>',
  },
  {
    id: 'droneMend',
    name: 'Field Bay',
    blurb: 'A repair field thirty metres out, carried wherever you go for a '
         + 'full minute: every machine flying inside it is put back together a '
         + 'hundredth of itself a second.',
    hint: (i) => `Drones mend ${Math.round(i.perSecond * 100)}%/s within range`,
    effect: 'mend',
    shape: 'bay',
    perSecond: 0.01,
    radius: 30,
    seconds: 60,
    // Nothing to mend is nothing to find: the field is on the table for a run
    // that flies machines at all, whether or not any of them are in the air at
    // this moment — a flight wiped out mid-wave is exactly when it stops
    // dropping otherwise, and it is back whole on the next one.
    offer: () => state.drones > 0,
    weight: 1,
    color: 0x5ad2c8,
    icon: '<circle cx="12" cy="12" r="8.4"/><path d="M12 8v8M8 12h8"/>',
  },
  {
    id: 'droneCall',
    name: 'Beacon',
    blurb: 'Calls in one more machine for thirty seconds. A second beacon calls '
         + 'in another rather than replacing the first, and puts both back on a '
         + 'full clock. They climb out when it runs down, and nothing that '
         + 'happens to them is charged to you.',
    hint: (i) => `+${i.count} drone support`,
    effect: 'support',
    shape: 'drone',
    count: 1,
    seconds: 30,
    // Only to a run that flies machines at all — not to one with any of them in
    // the air right now, since a flight shot to pieces is exactly when another
    // is worth most.
    offer: () => state.drones > 0,
    weight: 1,
    color: 0xffd166,
    icon: '<path d="M12 20.4v-9.2"/><circle cx="12" cy="8.6" r="2.1"/>'
        + '<path d="M7.6 12.2a6.2 6.2 0 0 1 0-7.2"/>'
        + '<path d="M16.4 12.2a6.2 6.2 0 0 0 0-7.2"/>'
        + '<path d="M8.4 20.4h7.2"/>',
  },
  {
    id: 'plating',
    name: 'Plating',
    blurb: 'Half of everything that reaches you for twenty-five seconds. It '
         + 'does not care how hard the hit was, and unlike a shield it is still '
         + 'there after one lands.',
    hint: (i) => `Damage taken ${cut(i.mult)}`,
    effect: 'soak',
    shape: 'plate',
    mult: 0.5,
    seconds: 25,
    weight: 1,
    color: 0xcfd8e3,
    icon: '<path d="M12 3.4 4.6 6.6 12 9.8l7.4-3.2z"/>'
        + '<path d="M4.6 11.2 12 14.4l7.4-3.2"/>'
        + '<path d="M4.6 15.8 12 19l7.4-3.2"/>',
  },
  {
    id: 'hazardPay',
    name: 'Hazard Pay',
    blurb: 'Everything you kill for thirty seconds is worth twice the coins. '
         + 'The only item whose clock running out leaves you with anything.',
    hint: (i) => `Coin payout ${gain(i.mult)}`,
    effect: 'pay',
    shape: 'coin',
    mult: 2,
    seconds: 30,
    weight: 1,
    color: 0xd4e157,
    icon: '<path d="M5.6 7.4a6.4 2.2 0 1 0 12.8 0a6.4 2.2 0 1 0-12.8 0"/>'
        + '<path d="M5.6 7.4v3.6c0 1.2 2.9 2.2 6.4 2.2s6.4-1 6.4-2.2V7.4"/>'
        + '<path d="M5.6 11v3.6c0 1.2 2.9 2.2 6.4 2.2s6.4-1 6.4-2.2V11"/>',
  },
];
