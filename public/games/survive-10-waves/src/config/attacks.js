// What the mobs do. One block an attack, named for the module that reads it.
export const ATTACKS = {
  spit: {
    thickness: 0.095,
    beads: 12,
    tailTime: 0.13,
    maxTail: 3.0,
    spacing: 1.7,
    tailTaper: 0.22,
    wobble: 0.28,
    flight: 0.95,
    gravity: 22,
    life: 3.0,
    aim: {
      memory: 0.24,
      velMemory: 0.1,
      maxLead: 1.0,
      jitter: 1.2,
      loose: 0.55, firm: 0.92,
    },
    aimHeight: 0.9,
    splashDamage: 0.5,
    range: 15,
    minRange: 5.5,
    cooldown: 2.1,
    windup: 0.45,
    rearPitch: 0.5,
    lungePitch: 0.42,
    lungeTime: 0.28,
    headBone: 'Bone_005',
    flow: 1.6,
    // `edge` is how much of the paint's own alpha counts as acid: the splat is
    // drawn with a soft rim, and the ground burns where it reads as covered
    // rather than wherever the texture is not quite transparent.
    // `inset` draws the burning ground in from the paint, so clipping the edge
    // of a pool costs nothing and only walking into it burns. `grip` is how
    // much of the player's own width is probed against it.
    // `burnAlpha` is the least of its painted alpha a pool can be showing and
    // still burn: ground faded past that is a stain seeing itself out, and
    // walking through it costs nothing.
    pool: { radius: 1.6, life: 4.5, damage: 7, tick: 0.45, edge: 96,
            inset: 0.85, grip: 0.25, burnAlpha: 0.4 },
    // The berth anything dodging gives a gob's marked landing spot.
    dodge: 2.2,
    boil: {
      every: [0.05, 0.13],
      size: [0.17, 0.4],
      swell: [0.2, 0.46],
      burst: 0.13,
      squash: 0.62,
      spread: 0.85,
      popSmoke: 0.22,
      smokeEvery: [0.3, 0.62],
      smokeSize: [0.55, 1.15],
      smokeRise: [0.9, 1.7],
      smokeDrift: 0.5,
      smokeGrow: 1.5,
      smokeLife: [0.75, 1.4],
      smokeColor: 0x9ad152,
      smokeOpacity: 0.26,
    },
    mark: { color: 0x8fd93c, opacity: 0.38, hold: 0.1, ease: 10,
            pulse: 7.5, dim: 0.4 },
  },
  dive: {
    // Each bird takes a lasting ring and height from the jitter, then breathes
    // around it: half the spread is which bird it is, half is the drift.
    cruise: [7, 14],
    ring: [11, 32],
    breathe: 1.4,
    // Scales the ring point to the bird's own speed and radius, so it circles
    // with the point rather than overhauling it and cutting the corner in.
    spin: 1,
    drift: 0.7,
    bob: 0.4,
    climbRate: 2.2,
    turn: 2.5,
    tilt: 0.22,
    maxTilt: 0.5,
    bankPer: 0.5,
    maxBank: 0.7,
    cooldown: [5, 8],
    // Crossfade between the bundled clips. Only the modelled bird uses it; the
    // primitive one is hand-posed and has nothing to fade between.
    clipFade: 0.25,
    onPlayer: 4,
    perchCheck: 1.2,
    // The stoop, as a multiple of the bird's own cruising speed, so a levelled
    // bird dives as much faster as it flies.
    speedMult: 3,
    launchMin: 12,
    // How far it carries on past the spot it aimed at, so the stoop runs through
    // you rather than stopping on you.
    over: 14,
    // A multiple of the corridor the strike is taken in, so the mark drawn and
    // the ground that hurts are the same width.
    laneWide: 1.0,
    lane: { color: 0xffb14a, opacity: 0.34, y: 0.06, hold: 0.12, ease: 12, pulse: 9 },
    telegraph: 1.0,
    entryRun: 15,
    leadK: 0.5,
    swoopK: 0.55,
    climb: 5,
    entryEase: 1.15,
    entryTurn: 9,
    // The other way in: a ring flown round where you stand rather than a line
    // through it. It never aims at you — it takes the ground you would run to.
    sweep: {
      // A bird flies one lane until it has the levels for the rest: the ring
      // comes in at `at`, and the crossing figure not until `essAt`.
      at: 7,
      essAt: 9,
      chance: 0.45,
      radius: [8, 12],
      // Kept off the bird's own distance, so there is always a run in to the
      // head of the ring rather than a turn on the spot.
      gap: 4,
      // Never past a half: further round and the ring closes behind you, which
      // is a cage rather than a corner.
      span: [130, 180],
      speed: 26,
      // Half of those curves bend twice instead: an S laid across the ground in
      // front of you, the two bends meeting where it brushes past.
      ess: 0.5,
      essRadius: [6, 9],
      essSpan: [70, 110],
      // How close the crossing comes. Wide enough that standing still is never
      // hit — the corner is the ground either side of it.
      pass: [4, 7],
    },
    strike: 3.0,
    hitPad: 0.3,
    knock: 9,
    flap: 5.5,
    flapAmp: 0.5,
    dihedral: 0.16,
    tuck: 0.5,
  },
  pounce: {
    range: 11,
    minRange: 3.0,
    arcOfFire: 0.7,
    cooldown: [2.4, 4.0],
    windup: 0.5,
    markHold: 0.12,
    markEase: 12,
    markOpacity: 0.5,
    markColor: 0xe0c766,
    crouch: 0.22,
    crouchPitch: 0.35,
    time: 0.42,
    arc: 2.6,
    pitch: 0.45,
    lead: 0.22,
    damage: 11,
    hitPad: 0.35,
    hitHeight: 1.1,
    knock: 9,
  },
  spikes: {
    // Which level has learnt to throw which shape. A shape with no entry here
    // is open from the first level.
    unlock: { laneAlong: 7, laneAcross: 7, halo: 8, scatter: 9, rings: 10, rays: 10 },
    range: 17,
    minRange: 7,
    keeps: true,
    cooldown: 3.8,
    windup: 0.55,
    radius: 3.2,
    telegraph: 1.05,
    hint: { time: 0.5, out: 0.3, ease: 0.25 },
    shake: { power: 0.6, range: 26 },
    markLow: 0,
    markHigh: 0.34,
    markEase: 2.8,
    bite: 0.3,
    contact: 0.6,
    dirtSpots: 26,
    dirtShare: 0.35,
    dirtPuffs: 3,
    dirtPower: 0.75,
    thud: { rate: 0.62, gain: 0.55 },
    crunch: { rate: 1.35, gain: 0.7 },
    shriek: { freq: 320, dur: 0.16, gain: 0.05, slide: 900 },
    damage: 24,
    count: 34,
    // Sized for the boss's map-wide fields: an impaler's pattern is a handful
    // of zones and a few dozen spikes, but a ray field is a hundred zones and a
    // ring field wants thousands of shafts to read as a fence.
    maxCount: 5200,
    maxZones: 160,
    halo: { core: 0.5, inner: 2.15, outer: 2.55 },
    lane: { wide: 0.42, long: 2.4 },
    // The two thrown round the player rather than out from the boss, sized as
    // shares of the arena's radius: `long` at 1 runs a bar the full width of the
    // map, and `apart` is how far off the player each half of the pincer sits —
    // the corridor left down the middle is that gap less `wide`.
    cross: { wide: 0.08, long: 1 },
    pincer: { wide: 0.07, long: 1, apart: 0.12 },
    scatter: { count: [3, 5], spread: [0.9, 2.1], size: [0.45, 0.7], stagger: 0.45 },
    // How thick each fence is, and how much clean ground is left between two of
    // them — the same figure, so a ring and the lane after it are one stride
    // each. `stagger` is how long the wave takes to reach the next ring out.
    rings: { width: 12, gap: 12, stagger: 0.167 },
    // `step` is how long each rectangle in a ray is — they butt end to end, so
    // it is also how far each break runs before the next opens — and `wide` is
    // half the lane's width.
    rays: { lines: [6, 8], step: 10, wide: 5, stagger: 0.12 },
    height: 1.7,
    rise: 0.11,
    hold: 0.5,
    sink: 0.4,
    color: 0x9d8cc4,
    markColor: 0xc79cff,
    tipGlow: 0.9,
  },
  brood: {
    range: 20,
    minRange: 13,
    keeps: true,
    cooldown: 3.4,
    windup: 0.55,
    count: 2,
  },
  rush: {
    distance: 30,
    minRange: 14,
    cooldown: 9,
    gather: [1.8, 2.5],
    call: 10,
    maxRiders: 6,
    maxRiderLength: 2,
    speed: 26,
    time: 2.0,
    damage: 40,
    eject: 15,
    ejectSpread: 1.5,
    shove: 20,
    seat: { lat: 0.42, fwd: 0.55, back: -0.5, lift: 0.92, climb: 0.45,
            arc: 0.55, pitch: 0.6 },
    lane: {
      color: 0x4ea6ff,
      sheen: 0xcfe8ff,
      alpha: 0.85,
      // Where the lane starts, as a share of the opacity it reaches the moment
      // the tank commits. The climb between the two is the tell.
      start: 0.08,
      spacing: 1.25,
      perStep: 3,
      fill: 0.36,
      width: 2.6,
      jitter: 0.85,
      size: 1.45,
      grow: 3.2,
      wither: 2.2,
      die: 0.45,
    },
    dust: { every: 0.04, step: 0.16, speed: 4.5, life: 0.75, size: 0.42, grow: 2.8,
            rise: 0.5, y: 0.28, color: 0x9a8b72, opacity: 0.44 },
    impact: { count: 9, size: 0.8, speed: 9 },
    shake: { power: 0.75, range: 24 },
  },
  // A grown tank stops coming at you on its own. It plants, calls everything
  // small enough near it in, and throws the whole load over your head: the pile
  // lands as far past you as the tank is short of you, on the same line, so what
  // was in front of you a moment ago is now behind you as well.
  fling: {
    // Which level of tank has worked it out. Below this it only charges.
    learntAt: 6,
    range: 34,
    minRange: 9,
    cooldown: [15, 22],
    // How wide it calls from, and the fewest answers worth planting for.
    call: 26,
    least: 3,
    // The longest it will stand there calling, and the load that is worth
    // throwing before the time is up: a crowd that answers fast is thrown fast.
    gather: 4,
    enough: 8,
    max: 15,
    // A tank cannot pick up another tank: this is the longest body it can lift.
    maxLength: 2.4,
    reach: 1.4,
    // Aim is rolled once for the volley, somewhere inside a 40-degree window
    // behind the player; each body then gets its own spot within `pile` of it,
    // fanned so no two come down on the same ground.
    spreadDeg: 20,
    pile: 4.5,
    pileVary: [0.8, 1.2],
    inset: 2.5,
    gap: [0.05, 0.24],
    flight: [0.95, 1.35],
    arc: 9,
    arcVary: [0.85, 1.2],
    spin: [-7, 7],
    recover: 0.55,
    markLife: 3.4,
    hold: { perRing: 7, hug: 1.05, gap: 1.7, stagger: 0.45,
            lift: 0.35, bob: 0.22, bobRate: 5.5, spin: 0.7 },
    // What a body coming down out of the sky costs, as a share of what that same
    // body's bite costs, plus the shove that scatters the pile as it lands.
    impact: { radius: 2.4, damage: 0.6, knock: 9, grit: 4 },
    mark: { color: 0xff8a4c, opacity: 0.5, dim: 0.45, pulse: 3.4, ease: 6 },
    alwaysWarn: false,
  },
  boomerang: {
    speed: 20,
    spawn: [1.2, 3.2],
    launchDeg: 45,
    bow: 1.25,
    through: 0.82,
    pace: [0.85, 1.2],
    vary: { deg: 14, bow: 0.3, through: 0.05 },
    thread: { points: 34, height: 1.5, color: 0x7fe0ff, opacity: 0.5, y: 0.02, ease: 11 },
    damage: [2, 3],
    hp: 4,
    radius: 0.42,
    shotRadius: 0.5,
    // How wide a berth anything dodging one gives it, and how far up its own
    // path it is read: a bone is dodged by leaving the ground it is heading for,
    // not the ground it is over.
    dodge: 2.4,
    look: 5,
    lookStep: 0.12,
    model: 'models/boomerang.glb',
    size: 0.95,
    height: 1.15,
    bob: 0.22,
    spin: 13,
    tilt: 0.3,
  },
};
