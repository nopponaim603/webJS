// Wave 14: the one wave the special-wave track drives. Each named part of the
// music holds its loop until the group it released is dead, so the score waits
// for the player rather than the other way round.
//
// A part may also carry `drops: ['damageAmp']` to lay items on the floor as it
// opens, and `drones: 2` to lend the player machines for its length — they are
// sent home when the part ends. Neither is used yet; the wave asks for bugs,
// coins and ground.
//
// `at` is seconds after that part began — the part loops, so it is not a
// position in the track. Groups sharing an `at` are one push.
//
// A part with a `handover` ignores `at` as a trigger: its pushes are released
// one at a time, each waiting until fewer than that many of its bugs are left
// standing, for as long as the player needs. `at` still orders them, and is
// what the part falls back to being paced by if the handover is taken off.
// Bars come first: nothing paced by the fight goes out while the part still has
// a bar-anchored group owing, or it would fire over the empty floor it opens on.
// A group built with `onBar` is released on the beat instead: `at: Infinity`
// keeps the clock from ever reaching it, and the bar landing is what lets it
// out. The part loops, so the bar comes round again — it is fired once. A
// fourth entry holds it back that many seconds past the bar, which is how
// several groups ride one bar without arriving on top of each other.
//
// `hold` is how many bars the part must sound before it
// may be called clear, which is what stops a part with no roster being skipped
// before it is heard. `species: null` rolls the wave's own mix.

const groups = (...spec) =>
  spec.map(([at, count, species = null, after = 0, gift = null]) =>
    ({ at, after, count, species, gift }));

const onBar = (...spec) =>
  spec.map(([bar, count, species = null, after = 0, gift = null]) =>
    ({ bar, after, count, species, gift, at: Infinity }));

// Flown in from off the board, and kept for the rest of the wave rather than
// lent for a stretch of it.
const BEACON = { id: 'droneCall', seconds: 45, entry: true, keep: true };

// A run of single holes, `gap` apart and each somewhere else on the floor: the
// same count arriving as a scatter rather than as a crowd. `when` is whatever
// lets it out — `{ bar }` for a bar landing, `{ at }` for a place in the order
// a handover works through.
const scatter = (when, n, species, gap) =>
  Array.from({ length: n }, (_, i) =>
    ({ at: Infinity, ...when, after: i * gap, count: 1, species, gift: null }));

// Carriers, put down within sight of the player rather than wherever the spawn
// picker happened to look: an item that is never found was never given. `near`
// is the band around them it may open in — far enough not to be underfoot.
const couriers = (when, species, gifts, near = [7, 15]) =>
  gifts.map((gift) =>
    ({ at: Infinity, after: 0, count: 1, species, gift, near, ...when }));

// One hole at each corner of the floor, out at `r` of whatever the ring is by
// then, so a part can come at the player from every side at once instead of
// from wherever the spawn picker happened to look.
const corners = (at, count, species, r = 0.9) =>
  [45, 135, 225, 315].map((deg) =>
    ({ at, after: 0, count, species, gift: null, deg, r }));

export const SPECIAL = {
  wave: 14,
  level: 10,
  order: ['intro', 'warmup', 'precombat1', 'combat1', 'rest', 'combat2', 'end'],
  // What a scripted carrier is sent out holding — one bug of the group has it,
  // however many are sent. These run far longer than the catalog says: the parts
  // are long, and a thirty-second buff picked up in one is spent well before the
  // push it was meant for arrives. A gift may name its own `seconds` instead.
  gift: { seconds: 60 },
  // The sector whose machines the wave flies at their cap once its beacons have
  // been taken. A loan for the rest of the wave, never written to the save.
  lend: 'A',
  // The items that are not owed to killing anything: each on a clock of its own,
  // laid somewhere on the floor every `every` seconds for the whole wave. `not`
  // holds one back while that effect is already running — half of nothing is
  // nothing — and it lands the moment the effect drops rather than being lost.
  clocks: [
    { every: 60, id: 'plating' },
    { every: 45, id: 'healthRegen', own: true },
    { every: 50, id: 'damageAmp' },
  ],
  // What a part falls back on whenever its own floor runs dry — waiting on a bar
  // that has not come round, or on an exit the music has not reached. One every
  // `every` seconds while the part has fewer than `keep` of anything standing
  // and no more than `most` of these already out. An empty floor is the one
  // thing a part must not be, and a runner keeps the player moving without
  // rebuilding the fight they just won.
  spill: { every: 2, keep: 5, most: 2, species: 'runner' },
  // The opening. The track has a lead-in before bar 1, and the player spends it
  // in the dark on a floor that is already going. `from` is the ring while the
  // screen is black; bar 1 opens it out to the wave's own full size over `grow`
  // seconds and holds it hot for the whole sweep. Seconds, except `camera` and
  // `sound`, which are levels.
  open: {
    from: 10, grow: 72,
    fade: 10, dawn: 15,
    // The floor goes for as long as the ring is opening — it is the ring moving
    // that is shaking it — and runs down over `hush` once the ring lands.
    camera: 0.09, sound: 1, hush: 10, cool: 1.5,
    // The rim struck on every beat and falling away over `fall`, so the ring
    // reads as being driven by the track rather than lit beside it.
    pulse: { depth: 1, fall: 0.34 },
    // The camera sits on the player in the dark and is let out, in a straight
    // line, to the zoom the wave would have had anyway — over `grow`, so it is
    // still backing off for exactly as long as there is ring still arriving.
    close: 0.45,
    // Thrown up for as long as the floor is shaking: over the small floor while
    // the ring is still, then hugging the edge once it starts opening. `rim` is
    // the band of the current radius the edge smoke sits in.
    smoke: {
      every: [0.12, 0.4], size: [3, 6], rim: [0.86, 1],
      puff: { speed: 1.6, life: 2.6, size: 0.8, grow: 2.6,
              rise: 1.8, y: 1.2, color: 0x7d736a, opacity: 0.42 },
    },
  },
  // No part carries a radius: the ring opens once, in the intro, and every part
  // after it fights on the whole floor. Asking for less would shrink the ring,
  // and walls are not culled by radius — a shrunk ring leaves solid air.
  parts: {
    intro:   { hold: 2,
      groups: onBar([1, 5, 'runner', 0, { id: 'hazardPay', last: true }]) },
    // The four small holes are on the beat; the ten-strong ones that follow are
    // paced by the fight, each waiting out the last until only five of it are
    // still standing.
    warmup:  { hold: 4, handover: 5, groups: [
      ...onBar([5, 3, 'grunt'], [6, 3, 'grunt'], [7, 3, 'grunt'], [8, 3, 'grunt']),
      ...onBar([13, 10, 'grunt']),
      ...groups([0, 10, 'bomber'], [1, 10, 'spitter'], [2, 10, 'brooder']),
    ] },
    // Bars 25 to 28, and nothing on the floor but the four couriers. No filler
    // either: the quiet is the point, and the part is not done until the Aegis
    // is in hand — the other three may be left lying.
    precombat1: { hold: 4, handover: 5, spill: false,
      awaits: 'invuln',
      groups: [
        ...couriers({ at: 0, after: 1.5, floor: 1 }, 'runner',
                    ['damageAmp', { id: 'invuln', seconds: 100 },
                     'overclock', 'energy']),
      ] },
    // The siege opens a window rather than a wall: for `seconds`, the part is
    // kept stocked. Once it drops below `low` it is refilled in whole holes of
    // `count` up to `aim` — a level to hold rather than a number to hit, so it
    // never opens a hole that would put the floor past the mark. It ends on the
    // clock, not on the floor clearing, and nothing paced by the fight goes out
    // until it has run.
    combat1: { hold: 8, handover: 5,
      // Bars 29 to 32 — four bars of runners, running out exactly as the siege
      // on bar 33 opens the floor up.
      stream: { bar: 29, every: 0.5, seconds: 12, each: [[1, 'runner']] },
      siege: { bar: 33, seconds: 36, low: 100, aim: 150, count: 20, pay: 0.25 },
      groups: [
        // Held back until the siege has run out. The medkit waits again on top of
        // that: one picked up under a buff already running is half spent.
        ...groups([0, 15], [0, 15, null, 1],
                  [0, 15, null, 2, { id: 'healthRegen', own: true, wait: true }]),
        // And one last hole once that has thinned out too.
        ...groups([1, 20]),
      ] },
    // Ends on the beacons rather than on a body count: the couriers come out
    // three seconds after the floor is finally clear, and the part is not done
    // until what they were carrying is in hand.
    rest:    { hold: 4, handover: 5, awaits: 'droneCall', groups: [
      ...scatter({ bar: 60 }, 15, 'vulture', 0.3),
      ...scatter({ at: 0 }, 15, 'brooder', 0.3),
      ...corners(1, 1, 'impaler'),
      ...couriers({ at: 2, after: 3, floor: 1 }, 'runner',
                  [BEACON, BEACON, BEACON, BEACON]),
    ] },
    // Bar 87 hands out beacons; in sector A the machines they call up fly with
    // the whole drone branch at its cap, lent for as long as they are in the air.
    // Bar 88 is a drip, and the first kills out of it are already paid for.
    combat2: { hold: 8, handover: 5,
      // Bar 89 for twenty-four seconds, which is three seconds past the siege
      // opening on bar 97: the drip is still coming out under the first of it.
      stream: { bar: 89, every: 0.5, seconds: 24,
                each: [[1, 'runner'], [1, 'vulture']],
                bounty: [{ id: 'invuln', seconds: 100 }, 'damageAmp',
                         'overclock', 'energy'] },
      siege: { bar: 97, seconds: 36, low: 200, aim: 300, count: 20, pay: 0.25 },
      groups: [
        // What the siege leaves behind, and the last of the wave's fighting.
        ...groups([0, 10], [0, 10]),
      ] },
    // No bugs: for `seconds` the whole floor is laid with coins on a `step`
    // grid, one at a time, and the pad waits for the music rather than for a
    // floor to empty. `value` is what each is worth — one, so they are all the
    // plain coin and there is something to pick up everywhere.
    end:     { hold: 4, coins: { seconds: 10, value: 1, step: 2 }, groups: [] },
  },
};
