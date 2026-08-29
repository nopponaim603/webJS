// The animals themselves: how they move, how they die, and what a level does
// to them. What they do to you is in attacks.js and boss.js.
export const BUGS = {
  bugModel: 'models/bug.glb',
  bugAnim: {
    legSwing: 0.95,
    legLift: 1.0,
    tipCurl: 0.45,
    bodyBob: 0.015,
    bobRadius: 0.85,
    fallbackBob: 0.05,
    attackGap: 0.85,
    knockDecay: 9,
    separationPush: 6,
    mountReach: 1.6,
    healthBar: { max: 400, wide: 2.2, thick: 0.16, lift: 0.55, alpha: 0.95,
                 backAlpha: 0.5, back: 0x101a20, full: 0x62d980,
                 hurt: 0xffc53d, dying: 0xff5a4a,
                 labels: 28, labelLift: 0.5, labelSize: 11, labelRange: 34 },
    // A bug nobody can see is still a bug: it walks, bites and shoots. What it
    // does not do is turn its legs over, pulse its glow, or move the model the
    // camera is not pointed at — and a footfall out of frame is neither heard nor
    // seen. `margin` is how far outside the frame that starts, in world units,
    // plus `span` of the animal's own size so a boss keeps its shadow.
    offscreen: { margin: 6, span: 2 },
    // How long a bug keeps the waypoint it was given before working out a fresh
    // way round the walls. Walls do not move, so planning every frame bought
    // nothing and cost two thousand searches a frame. Arriving at a waypoint
    // plans again at once whatever this says, and the beat is jittered so the
    // whole field does not think on the same frame.
    replan: 0.3,
    biteReach: 0.25,
    biteKnock: -14,
    // A drone hovers, so a walker that wants one has to leave the ground for it.
    // `reach` is the highest it can take a machine from, grown with the animal:
    // anything flying above that is out of its world altogether. The leap arcs
    // over `time` and lands its bite at the top of it, and `slack` is how far
    // the machine may slide out from over it in that beat and still be bitten.
    // It is the jaws that are aimed, not the belly — `bite` is how far up the
    // body they sit — and `least` floors the arc at that share of the animal's
    // own height, so a big one leaps rather than reaching up on its toes.
    snap: { reach: 4.6, least: 1.0, bite: 0.8, time: 0.45, pitch: 0.55, slack: 1.2 },
    strideScale: 3.0,
    maxCycleRate: 3.2,
    turnRate: 4.5,
    turnStride: 1.15,
    massExp: 3,
    // How much of a shove a bug takes, off the size its species hatches at:
    // `ref` is the size that takes all of it, and nothing is ever quite
    // immovable. A rifle knocks a runner back a stride and barely rocks the
    // boss. Growth counts too, but far more gently than being born big.
    push: { ref: 0.85, byRadius: 2, byGrow: 0.5, floor: 0.02 },
    // The nudge a hit puts through a bug: how far it leans off the shot and how
    // long it takes to come back level. `angle` is what a bug of `ref` radius
    // gets; bigger animals take less of it, down to `floor` — a boss shrugs a
    // rifle round off, but nothing is ever hit and stands perfectly still.
    flinch: { time: 0.16, angle: 0.04, crit: 1.8,
              ref: 0.85, byRadius: 0.5, floor: 0.3 },
    // How far off the bearing to its goal a bug is willing to plant the next
    // step. Widened on each failed try, so a boxed-in bug still finds a way out.
    hopWander: 0.4,
    hop: { dist: 3, time: 1.6, align: 0.3 },
    // What a throw does to the animal doing it: how far it tips, how much of
    // it comes off the ground on the wind-up, what the head and the front pair
    // add. Read from -1 wound back to +1 followed through.
    throw: { pitch: 0.32, rise: 0.55, head: 0.6, paw: 1.25, sweep: 0.55 },
  },
  // What a bug heavy enough to be felt leaves at every footfall: a puff off each
  // foot as it plants, and a tremor in the camera from the whole animal.
  stomp: {
    puffs: 6,
    foot: 0.25,
    spread: 0.5,
    dirt: 4,
    grit: 0.9,
    // Lit, not painted on: the colour is what the light does to it, so the
    // brown is picked bright enough to still read as earth once shaded.
    smoke: { speed: 2.0, life: 0.8, size: 0.75, grow: 2.8,
             rise: 3.0, y: 1.0, color: 0xb08a5a, opacity: 0.55 },
    shake: { power: 0.24, range: 24 },
    // Pitched down from the sample it borrows, and further by how grown the
    // animal is: a bigger foot lands lower.
    sfx: { rate: [0.56, 0.66] },
  },
  bugDeath: {
    knockDecay: 6,
    gravity: 26,
    flip: 0.28,
    hop: 0.42,
    twitch: 0.5,
    legCurl: 1.35,
    settle: 0.85,
    sink: 1.3,
    sinkDepth: 0.15,
    maxCorpses: 28,
    sizeTime: 0.6,
    block: 0.85,
    styles: [
      { key: 'flip', weight: 4, roll: Math.PI, pitch: 0, curl: 1.0, hop: 1.0, tumble: 0 },
      { key: 'side', weight: 3, roll: Math.PI * 0.6, pitch: 0.14, curl: 1.15, hop: 0.65, tumble: 0 },
      { key: 'collapse', weight: 3, roll: 0.2, pitch: 0.34, curl: 0.5, hop: 0.12, tumble: 0 },
      { key: 'tumble', weight: 2, roll: Math.PI, pitch: 0, curl: 1.1, hop: 1.7, tumble: 1 },
    ],
  },
  bugBlood: 0x8a5326,
  bugBrightness: 1.0,
  // A multiplier a level rather than one rate compounding: the climb from 1 to 5
  // is steeper at the start than at the end, and no single rate says that.
  // Species rates ride on top, as a share added a level.
  evolve: {
    hp:     [1, 2.9, 8.39, 24.64, 72.59, 175, 347, 686, 1358, 2686],
    damage: [1, 1.63, 2.66, 4.33, 7.05, 11.5, 18.7, 30.5, 49.7, 81],
    range:  [1, 1.08, 1.18, 1.28, 1.38, 1.50, 1.63, 1.77, 1.92, 2.08],
    speed:  [1, 1.02, 1.05, 1.09, 1.13, 1.18, 1.24, 1.31, 1.40, 1.50],
    size:   [1, 1.10, 1.21, 1.34, 1.48, 1.63, 1.79, 1.98, 2.18, 2.40],
    rate:   [1, 1.05, 1.11, 1.16, 1.22, 1.28, 1.34, 1.41, 1.48, 1.56],
    // What a level is worth, set here rather than read off health: a bug that is
    // harder to kill is not automatically worth more, and this is the curve the
    // purse — and so the module tree's prices — is balanced against.
    coins:  [1, 1.70, 2.90, 4.96, 8.52, 13.23, 18.63, 26.19, 36.85, 51.83],
    // What a levelled animal wears. The first levels wear nothing — a wave-one
    // grunt is a plain animal — and from `from` up it is a rung a level: `dim`
    // takes the shell's own colour down, `rough` takes its gloss in, and the
    // veins under it light in `color` at `light`, breathing at `beat` over
    // `swell` of themselves. It is meant to be noticed on the second look
    // rather than the first: the whole ladder stays inside one ember, and none
    // of it burns bright enough to wash out to white. An animal that came with
    // markings of its own keeps their colour, and a rung is added to the heat
    // it already had rather than replacing it.
    skin: {
      from: 4,
      seed: 12,
      rungs: [
        { dim: 0.98, rough: 0.99, color: 0xff3a12, light: 0.14, beat: 0,   swell: 0 },
        { dim: 0.96, rough: 0.97, color: 0xff4014, light: 0.20, beat: 0,   swell: 0 },
        { dim: 0.94, rough: 0.95, color: 0xff4616, light: 0.28, beat: 0,   swell: 0 },
        { dim: 0.91, rough: 0.92, color: 0xff4d18, light: 0.38, beat: 1.1, swell: 0.10 },
        { dim: 0.88, rough: 0.89, color: 0xff551b, light: 0.50, beat: 1.3, swell: 0.14 },
        { dim: 0.85, rough: 0.86, color: 0xff5d1e, light: 0.64, beat: 1.5, swell: 0.18 },
        { dim: 0.82, rough: 0.83, color: 0xff6622, light: 0.80, beat: 1.7, swell: 0.22 },
      ],
    },
    species: {
      runner:  { speed: 0.025, range: 0.048 },
      tank:    { hp: 0.062, size: -0.003, range: 0.081, riders: 0.222 },
      spitter: { range: 0.032, pool: 0.154 },
      brooder: { range: 0.016, boomerangs: 0.111, throwSpeed: 0.034 },
      impaler: { range: 0.032, spike: 0.154 },
      vulture: { size: -0.054, lane: 0.059 },
    },
  },
  // What a boss's death is worth watching: the camera goes to where it fell, it
  // empties its purse over the ground for `time`, and the camera comes back.
  // The coins are counted out in denominations rather than paid as a sum, so
  // what lands reads as a shower rather than a pile. `travel` caps each leg of
  // the trip, so a camera that cannot reach its mark never strands the run.
  bossFall: {
    ease: 1.6,
    arrive: 1.5,
    travel: 4,
    time: 5,
    spread: 16,
    inset: 3,
    ones: 100,
    tens: 50,
    // The trip is not the player's to walk out of: they are held where they
    // stand for as long as the camera is elsewhere, and nothing may touch them
    // while they cannot answer for themselves.
    hold: 0.2,
    detune: 0.12,
  },
  spawn: {
    maxAlive: 4000,
    // A phase opens every hole it has and then stands back: `groups` of them at
    // most, one every `groupGap`, each feeding at most `group.max` bugs.
    maxPhases: 4,
    groups: 10,
    // The late waves are drawn as a shape rather than filled to a count: from
    // `from` on, the last phase opens `holes` holes of `per` bugs and the phases
    // before it open their share of that width, so a wave widens as it runs.
    // Both climb a step every `every` waves, and what the wave fields is
    // whatever that shape carries.
    late: { from: 16, every: 4, holes: 4, holeStep: 1, per: 40, perStep: 10 },
    // Where a phase is meant to arrive in fewer, deeper holes than its share
    // would open on its own: wave, then phase, then how many holes it gets. A
    // phase named here opens exactly that many, however deep they have to be.
    phaseGroups: { 15: { 1: 3, 2: 3, 3: 3 } },
    // The deepest a hole may be on a named wave, whatever its width would ask
    // for: the count is shared back down the wave rather than piling into one.
    phaseDepth: { 15: 40 },
    groupGap: [1, 3],
    phaseGap: 3,
    // A phase hands over as soon as the fight has thinned to this many, rather
    // than making the player walk the map for the last of them. The wave itself
    // still ends on an empty floor: the handover is between phases, not out of
    // the last one.
    handover: 5,
    // Quiet at the top of a wave, long enough to ride up out of the pad and
    // walk off it before the first mark is on the ground.
    waveDelay: 3,
    inset: 1.5,
    // Small, because the mark is the fair warning: it may land near you, but
    // never on you, and never without time to walk off it.
    clearOfPlayer: 7,
    wallClear: 1.2,
    apart: 5.0,
    // A late wave arrives as a few enormous breaches rather than as a queue of
    // small ones, so the group climbs faster than the count does and the number
    // of holes a phase opens grows slowly — until `max`, where the holes stop
    // getting deeper and the phase starts opening more of them instead.
    group: { first: 3, perWave: 3, max: 100 },
    breach: 2.85,
    // How many times a normal hole wide the boss's is.
    bossBreach: 5,
    bossWarn: 3,
    warn: {
      time: 1.3,
      puffEvery: 0.05,
      spread: 0.9,
      grit: 16,
      burst: 12,
      burstPuffs: 6,
      stain: 7,
      smoke: { speed: 1.4, rise: 2.4, y: 0.12, size: 0.5, grow: 2.4,
               life: 1.2, opacity: 0.4, color: 0x3d3125 },
    },
    emerge: { time: 0.8, window: [2, 5], jitter: 0.7, depth: 1.3, wobble: 0.5,
              shudder: 26, grit: 9 },
    // Bursts punching up through the hole while the bugs climb. `window` is the
    // share of the whole breach each one lands in, so they are spread across the
    // climb rather than stacked on the mark.
    quake: {
      count: [2, 4],
      window: [0.12, 0.92],
      dirt: 18,
      puffs: 8,
      // Where in the hole a burst goes off, and how wide its own cloud is, both
      // as a share of the hole radius: each one lands somewhere else in the
      // ground that is breaking, and throws from there rather than from a spot
      // every burst shares.
      spot: 1,
      cloud: 0.45,
      // Felt harder and from further out than a grenade: it is the ground
      // itself going, not something landing on it.
      shake: { power: 0.7, range: 30 },
      smoke: { speed: 2.8, rise: 3.6, y: 0.14, size: 0.7, grow: 2.9,
               life: 1.6, opacity: 0.5, color: 0x3d3125 },
    },
  },
  // Only so many bugs may work the mark at once. The rest hold the ground they
  // climbed out of: a bug spawns owning the floor `home` around its hole, and
  // stands down to wander it until a place opens up. `giveUp` is the leash — a
  // bug closer than this comes for you whether or not there is a place free,
  // since walking away from someone standing over you reads as a bug that has
  // not seen them. `stick` is how much nearer a bug already chasing counts as
  // when the places are handed out, and `recheck` how often they are.
  horde: {
    chasers: 40,
    // The ground a bug holds when it stands down: `spread` hole radii across,
    // so a hole that fed a hundred is milled over by a hundred and a hole that
    // fed three is not. `home` is the fallback for a bug that never came out of
    // one at all.
    spread: 3,
    home: 30,
    giveUp: 20,
    stick: 0.75,
    recheck: 0.5,
    dwell: [1.5, 4],
    arrive: 1.5,
  },
  waves: {
    first: 24,
    growth: 1.22,
    cap: 4000,
    clearDelay: 0.8,
    countByWave: { 1: 10 },
    // Which level a wave fields. The curve is bent to pass through both points
    // the design cares about: `midLevel` by `midWave`, the last level of the
    // evolve tables by `peak`, and the same bug every wave after that.
    // `ahead` is the share of a wave that arrives at the next wave's level,
    // rolled per bug; it does nothing on waves the curve holds flat.
    // The opening waves are written out rather than curved: what a player meets
    // in their first ten minutes is a designed run of levels, not the tail of a
    // formula. The curve picks up where `early` ends, and is shaped to arrive at
    // `midLevel` by `midWave` so it carries on from the last of them.
    levels: { early: [1, 1, 2, 3, 3, 4, 4, 5, 6, 7],
              peak: 15, midWave: 10, midLevel: 7, ahead: [0.05, 0.10] },
    // Which waves end with a boss, and how many walk out. A boss phase is the
    // wave's last and takes the place of one of its regular phases: what the
    // wave fields is shared out over the phases that are left.
    bosses: { 10: 1, 15: 1 },
    // Where the level tables run out, the waves keep going: from `from` on,
    // every wave adds `per` to what the bugs hit for and what they can take.
    surge: { from: 16, per: 0.05 },
  },
  bugVoice: { pitchExp: -0.35, gainExp: 0.30, jitter: 0.07 },
};
