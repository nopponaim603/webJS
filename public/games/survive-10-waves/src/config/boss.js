// The boss: which level has learnt what, and every move it owns. Kept apart
// from the mobs' attacks because a boss is balanced against the fight it is,
// not against the curve the rest of the roster climbs.
export const BOSS = {
  // A boss is not the same animal at every level. `unlock` is which level has
  // learnt which attack — one with no entry here it has always had. The rest are
  // ceilings on what an attack's own config rolls, read off a sparse ladder: a
  // level takes the last rung at or below it, so the top rung is the attack at
  // full strength and only the levels where something changes need an entry.
  boss: {
    unlock: { acidrush: 9, spill: 9 },
    // How many it throws at a level, rolled out of that level's own range.
    bones: { 1: [1, 1], 9: [2, 2], 10: [2, 3] },
    boneSpeed: { 1: 15, 9: 18, 10: 22 },
    bombers: { 1: [1, 1], 7: [3, 4], 8: [3, 5], 9: [4, 6], 10: [5, 8] },
    holes: { 1: 1, 7: 2, 10: 3 },
    // How many climb out of each of those holes.
    broodSize: { 1: [5, 10], 7: [24, 24], 10: [10, 10] },
    // How far the bars of a player-centred figure run, as a share of the length
    // they have at full growth: a young boss walls off a stretch of ground round
    // you, a grown one walls off the map.
    fieldSpan: { 1: 0.3, 9: 0.6, 10: 1 },
    // What a wounded boss is worth: under `below` of its health every cooldown
    // it has runs at this share of its length, the bite included.
    rage: { below: 0.4, cooldowns: 0.7 },
    // The least time between one attack ending and the next starting, so two
    // never chain without a beat to move in. Hurt, it gives you less of one.
    rest: { below: 0.5, high: 0.5, low: 0.2 },
    // The slam is a wounded animal's move: it does not bring its whole weight
    // down until it is under this share of its health.
    slamAt: 0.6,
  },
  // The boss lowers its head and runs you down. Read by rush.js, the same as the
  // tank's charge: what makes it a different move is that nothing rides it,
  // nothing turns it, and the walls in its way come to nothing.
  bossrush: {
    distance: 46,
    minRange: 12,
    cooldown: 8,
    // Two flat seconds of planting and aiming, with the lane drawn the whole
    // time: at 60 units a second there is no outrunning the charge once it is
    // loose, so getting off the line has to happen before it starts.
    gather: [2, 2],
    alwaysWarn: true,
    // The jetpack hovers well under the top of this animal: flying over a charge
    // works against a tank, and against the boss it only moves where it lands.
    hitsAloft: true,
    call: 0,
    maxRiders: 0,
    maxRiderLength: 0,
    speed: 60,
    time: 2.2,
    // Every attack the boss has costs a share of what its bite costs, so the
    // whole kit moves together when the bite is retuned.
    share: 0.3,
    eject: 0,
    ejectSpread: 0,
    shove: 26,
    seat: { lat: 0, fwd: 0, back: 0, lift: 0, climb: 0, arc: 0, pitch: 0 },
    dust: { every: 0.03, step: 0.22, speed: 6.5, life: 0.9, size: 0.7, grow: 3.0,
            rise: 0.6, y: 0.3, color: 0x9a8b72, opacity: 0.5 },
    impact: { count: 14, size: 1.2, speed: 13 },
    burst: { reach: 1.6, puffs: 16, cloud: 0.3, dirt: 12,
             smoke: { speed: 6.5, life: 0.9, size: 0.7, grow: 2.6,
                      rise: 3.2, y: 1.0, color: 0xb08a5a, opacity: 0.6 },
             shake: { power: 0.85, range: 32 },
             sfxRate: 0.44 },
    shake: { power: 0.95, range: 34 },
  },
  // The same charge, dragging its gut: it wets the ground it crosses, in a
  // strip the width of the lane it drew. Everything else is the dry one's.
  acidrush: {
    distance: 46,
    minRange: 12,
    cooldown: 8,
    // Two flat seconds of planting and aiming, with the lane drawn the whole
    // time: at 60 units a second there is no outrunning the charge once it is
    // loose, so getting off the line has to happen before it starts.
    gather: [2, 2],
    alwaysWarn: true,
    hitsAloft: true,
    call: 0,
    maxRiders: 0,
    maxRiderLength: 0,
    speed: 60,
    time: 2.2,
    // Every attack the boss has costs a share of what its bite costs, so the
    // whole kit moves together when the bite is retuned.
    share: 0.3,
    eject: 0,
    ejectSpread: 0,
    shove: 26,
    seat: { lat: 0, fwd: 0, back: 0, lift: 0, climb: 0, arc: 0, pitch: 0 },
    dust: { every: 0.03, step: 0.22, speed: 6.5, life: 0.9, size: 0.7, grow: 3.0,
            rise: 0.6, y: 0.3, color: 0x9a8b72, opacity: 0.5 },
    impact: { count: 14, size: 1.2, speed: 13 },
    burst: { reach: 1.6, puffs: 16, cloud: 0.3, dirt: 12,
             smoke: { speed: 6.5, life: 0.9, size: 0.7, grow: 2.6,
                      rise: 3.2, y: 1.0, color: 0xb08a5a, opacity: 0.6 },
             shake: { power: 0.85, range: 32 },
             sfxRate: 0.44 },
    shake: { power: 0.95, range: 34 },
    // `step` and `wide` are both in body radii, so the trail is exactly as wide
    // as the lane and laid close enough behind itself to be unbroken.
    acid: { step: 0.9, wide: 1, blobs: 2, burn: 0.3, tick: 0.8, life: [4.5, 5.5] },
  },
  // The boss plants itself and empties its gut over the arena. It cannot chase
  // while it does: the ground it leaves behind is what moves you.
  spill: {
    range: 40,
    cooldown: [20, 30],
    windup: 0.7,
    time: [3, 3],
    recover: 0.8,
    // The gap between one gob and the next: the field arrives a pool at a time,
    // nearest the player first, rather than all at once.
    every: [0.05, 0.05],
    radius: 50,
    // The share of the circle the pools take, and the least clean ground ever
    // left between two of them. `cover` sets how far apart they sit; `gap` is
    // the floor under that, so asking for a coverage that would seal the field
    // off gets the widest spacing that still leaves a lane.
    cover: 0.35,
    gap: 3,
    inset: 3,
    blobs: 1,
    grow: 5,
    // Per tick, and pools overlap by design: every pool you stand in burns you
    // on its own clock, so a slow tick is what keeps a field this wide a hazard
    // to cross rather than a floor that kills on contact.
    burn: 0.3,
    tick: 0.8,
    // How long a pool burns, fade included. The field still has to clear before
    // the next spill or the arena silts up with acid nobody threw this time, and
    // at this length there is only a beat in it: the last gob lands 3s in and
    // dies at 13, against a shortest gap of 14.8 to the next pour.
    pool: [10, 10],
    // One clock for the whole volley, so three dozen gobs leave together and
    // land together instead of trickling down.
    flight: [1.1, 0],
    beads: 4,
    // Up on the back pair: how far the body tips back, how much of it that puts
    // in the air, and which rows leave the ground. `raise` is per row from the
    // front, and the front pair work the air while it pours.
    rear: 0.75,
    // Enough to keep the back pair on the floor: tipping back about the body's
    // own origin drives them under it otherwise.
    lift: 3.2,
    stands: 2,
    raise: [1.5, 0.85],
    flail: 0.45,
    flailSweep: 0.3,
    flailRate: 6.5,
    headUp: 0.7,
    headWag: 0.3,
    headRate: 8,
    swayRate: 7,
    swing: 1.1,
    sfxRate: 0.55,
  },
  // The spill's quick cousin: a tight ring of small pools thrown round the
  // player's feet rather than the arena emptied over them. Same acid, same
  // planted stance — there is simply less of it, and it is over sooner.
  smallSpill: {
    range: 26,
    cooldown: [6, 9],
    windup: 0.45,
    time: [1.0, 1.4],
    recover: 0.5,
    every: [0.05, 0.05],
    radius: 14,
    // Thinner than the full spill's coverage on purpose: the pools are small
    // enough that packing them to the same share would leave lanes narrower
    // than the ones a boss-wide field leaves.
    cover: 0.26,
    gap: 1.6,
    inset: 3,
    blobs: 1,
    grow: 2,
    burn: 0.3,
    tick: 0.8,
    pool: [3, 4],
    flight: [0.7, 0],
    beads: 4,
    rear: 0.4,
    lift: 1.6,
    stands: 2,
    raise: [0.9, 0.5],
    flail: 0.3,
    flailSweep: 0.2,
    flailRate: 7.5,
    headUp: 0.45,
    headWag: 0.25,
    headRate: 9,
    swayRate: 8,
    swing: 0.7,
    sfxRate: 0.7,
  },
  // It throws live bombers overarm. They tumble the whole way — nothing about
  // being thrown is under their control — and go off on the ground they land
  // on, which is ringed from the moment they leave.
  toss: {
    range: 40,
    cooldown: [8, 12],
    windup: 0.5,
    count: [5, 8],
    gap: 0.5,
    recover: 0.4,
    flight: 1.3,
    arc: 9,
    spin: [3, 9],
    spread: 12,
    inset: 3,
    size: 1.6,
    share: 0.3,
    // Rung whether or not the augur is bought: four to six live bombs in the
    // air is not something to find out about on landing.
    alwaysWarn: true,
    mark: { color: 0xff5a3c, opacity: 0.55, dim: 0.35, ease: 12, pulse: 9 },
  },
  // A bone thrown at head height that comes after you until it is stopped. It
  // is not dodged, it is answered: outrun it into a wall, or shoot it down.
  // `hp` is another species' whole body at a level, so what it takes to break
  // is a figure the player already knows.
  hurl: {
    range: 44,
    cooldown: [20, 25],
    windup: 0.5,
    recover: 0.35,
    // Faster than anything the player can run at, even geared: it is answered
    // by cover or by gunfire, never by legging it.
    speed: 22,
    turn: 1.5,
    size: 3.5,
    share: 0.3,
    // A share of what the thrower itself has, so it is always worth the same
    // few seconds of fire however grown the boss is.
    hp: 0.02,
    // Two or three out of one wind-up, a beat apart and fanned off the line.
    count: [2, 3],
    gap: 0.2,
    fan: 1.1,
  },
  // The jab between the slams: head and front pair only, the boss keeping its
  // footing throughout, and spikes coming up wherever you are standing.
  smallSlam: {
    range: 22,
    cooldown: [5, 10],
    windup: 0.45,
    strike: 0.1,
    recover: 0.35,
    raise: 1.5,
    drive: 0.45,
    // How much of the legs' swing the head takes. Negative because the head
    // bone pitches the other way to a leg lifting.
    headShare: 0.45,
    // Holes torn open by the landing: the first under the foot that came down,
    // the rest `at` units off the player. Whatever climbs out is rolled the way
    // a wave rolls it, so the rarities are the wave's, not the boss's.
    breach: { holes: 3, count: [5, 10], at: 20, scale: 0.8 },
    // The burst carries the whole arrival — dust, soil, the jolt and the boom.
    // Under the full slam's, over a footfall's: the front pair landing is still
    // the boss putting a good part of itself into the ground.
    burst: { reach: 1.1, puffs: 14, cloud: 0.35, dirt: 10,
             smoke: { speed: 5.0, life: 0.85, size: 0.8, grow: 2.8,
                      rise: 2.6, y: 0.9, color: 0xb08a5a, opacity: 0.55 },
             shake: { power: 0.6, range: 28 },
             sfxRate: 0.6 },
  },
  // The boss rears back and brings its whole front down. `opening` is how far
  // past the ring it will start from, so it commits while you are still walking
  // in rather than only when you are already under it.
  slam: {
    opening: 3,
    cooldown: [4.5, 7.5],
    windup: 0.8,
    drop: 0.13,
    recover: 0.55,
    rear: 1.7,
    rearPitch: 0.5,
    radius: 9,
    share: 0.3,
    // What the floor does about it: one of two map-wide spike figures, thrown
    // from where the boss stands out to the rim. `density` thins the shafts —
    // standing a field this wide at an impaler's density would want tens of
    // thousands of them.
    field: {
      patterns: ['rings', 'rays', 'cross', 'pincer'],
      density: 0.45,
      share: 0.3,
      // The two map-wide figures answer each other. A boss that has learnt both
      // throws one and, this often, the other follows it a beat later — thrown
      // from where the first was, so the second reads as the same move landing
      // twice rather than a fresh attack.
      combo: { chance: 0.3, delay: 1, pairs: { rings: 'rays', rays: 'rings' } },
    },
    markHold: 0.12,
    markEase: 12,
    markOpacity: 0.55,
    markColor: 0x9fd8ff,
    puffs: 22,
    cloud: 0.22,
    dirt: 14,
    smoke: { speed: 7.0, life: 0.95, size: 0.7, grow: 2.6,
             rise: 3.4, y: 1.0, color: 0xb08a5a, opacity: 0.6 },
    shake: { power: 0.9, range: 34 },
    sfxRate: 0.42,
  },
};
