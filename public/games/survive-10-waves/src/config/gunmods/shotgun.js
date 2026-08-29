// The shotgun's branch is pressure: every so many shells the pattern collapses
// into one round that goes through the front rank and puts it on the floor.
// Drawn in ember and brass, close to the pellet's own orange.
export const SHOTGUN_MODS = {
  slug: {
    // Every so many shells the pattern collapses into one: a solid round that
    // goes through the front rank. A fixed count, so what a level buys is the
    // slug hitting harder rather than arriving more often.
    every: 5,
    // The one number the module owns, as a multiple of the shell it was made
    // from: half of one at the first level, two and a half at the last.
    // Everything else about the round — how far it carries, what it keeps
    // through a body, how hard it shoves — is the gun's, so a slug is the
    // shotgun's own shell rather than a second weapon wearing its name.
    // Multiples rather than steps, the climb the gun's own damage makes.
    damage: { base: 0.5, cap: 2.5 },
    // A slug is the shell's pellets fused into one round, so when its run is
    // over it comes apart again into the same pellets carrying the same weight
    // the slug was.
    // `spray` is how far off its spoke a pellet may leave, as a share of the gap
    // between spokes — enough that a ring of ten does not read as a diagram.
    burst: { spray: 0.5 },
    scale: 2.8,
    shake: { power: 0.4, range: 12 },
    look: {
      body: 0xffb066, bloom: 0xff9d3d, core: 0xfff0d8, width: 0.34, life: 0.24,
      muzzle: 0xffd8a0, muzzleTo: 2.4, muzzleLife: 0.2,
      ringColor: 0xffb066, ringLife: 0.24, ringTo: 2.6,
      dustColor: 0xb08a5a, brass: 0x8a6f45, tint: 0xffd8a0,
      // How far the round runs between one puff off the floor and the next.
      wakeEvery: 2.4,
    },
    sfx: 'sg_slug',
  },
};
