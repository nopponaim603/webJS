// The lance's branch is geometry: it splits the beam across a fan, and it
// leaves the cut it made open behind it. Drawn in the beam's own pink-red with
// the charge's violet behind it.
export const LANCE_MODS = {
  prism: {
    // The lens splits what comes out of it. The fan is fired from the same
    // muzzle on the same trigger, so a wound charge is spent across all of it
    // rather than multiplied by it.
    // Beams across the fan, counting the one down the middle, and what each of
    // them keeps of the charge. The product is what the gun actually throws, so
    // the pair is tuned together: a shade over one beam's worth at the first
    // level, and three at the last.
    beams: { base: 3, cap: 7 },
    // Under about fifteen degrees the fan does not separate inside what the
    // camera shows: three beams leave the muzzle as one band.
    spread: { base: 16, cap: 34 },
    share: { base: 0.35, cap: 0.43 },
    // The outer beams are thinner than the one down the middle, and more so the
    // wider the fan gets: seven quads at the centre beam's width overlap into
    // one magenta wash instead of reading as blades.
    taper: { base: 0.74, cap: 0.62 },
    look: {
      color: 0xff3860, core: 0xffe6ef, edge: 0xc86bff,
      lensSize: 1.15, lensLife: 0.17, lensColor: 0xd8a8ff,
      splitLife: 0.13, grit: 0x8a7a92,
    },
    sfx: 'lz_prism',
  },
  rift: {
    // The line the beam cut does not close: for a moment it pulls everything
    // near it onto the cut, which turns the lance from a shot into a shape the
    // fight has to move around.
    pull: { base: 8, cap: 30 },
    reach: { base: 2.5, cap: 6.5 },
    life: { base: 0.9, cap: 2.6 },
    damage: { base: 30, cap: 800 },
    // The seam itself: what is dragged in from `reach` only burns once it is on
    // this much of the cut, so the pull is the threat and the line is the cost.
    bite: { base: 1.1, cap: 2.4 },
    tick: 0.3,
    look: {
      core: 0x1a0a1e, edge: 0xc86bff, glow: 0xff3860,
      // What the seam does to a body on it, and the only warm thing in a violet
      // effect: a cook that is the same colour as the cut cannot be seen on it.
      ember: 0xff9a3c,
      threads: 11, threadLife: 0.26, threadWidth: 0.26,
      motesEvery: 0.045, moteColor: 0xe0b0ff,
      // Debris is floor, and floor at this size is a solid cube on grass: any
      // lift in the hex reads as a violet sticker rather than as rubble.
      dust: 0x2b1f26,
      // The lit edge is laid in short pieces down each side. Two quads the whole
      // length of the cut are rails, and rails are not a tear.
      edgeEvery: 2.2,
    },
    sfx: 'lz_rift',
  },
};
