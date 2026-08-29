// The rifle's branch is reach: one slug that empties the line it is fired down,
// and darts for whatever the line could not get to. Drawn in the gun's own amber
// with the arc's cold blue underneath.
export const RIFLE_MODS = {
  rail: {
    // Every tenth round the gun stops being a rifle: one slug, straight
    // through the field, with a shock along the line it cut. The cadence never
    // moves — levels buy what the slug does, not how often it comes.
    every: 10,
    damage: { base: 2, cap: 8 },
    reach: { base: 46, cap: 95 },
    width: { base: 0.55, cap: 1.7 },
    // What it keeps through each body it goes through.
    retain: { base: 0.72, cap: 1 },
    knock: { base: 6, cap: 22 },
    shake: { power: 0.5, range: 22 },
    look: {
      beam: 0xcfe9ff, core: 0xffffff, life: 0.3,
      // The ring thrown off the muzzle, and the dust lifted off the ground the
      // slug ran over.
      muzzle: 0xdff2ff, muzzleTo: 4.2, muzzleLife: 0.26,
      dustEvery: 2.4, dustColor: 0x6a7278,
      scar: 0x9fd8ff, scarLife: 0.34,
    },
    sfx: 'rf_rail',
  },
  seeker: {
    // The rifle's air attack: darts that loft off the barrel and come down on
    // whatever the round could not reach.
    count: { base: 1, cap: 4 },
    share: { base: 0.35, cap: 0.45 },
    chance: { base: 0.20, cap: 0.35 },
    speed: { base: 24, cap: 44 },
    turn: { base: 4.0, cap: 11 },
    reach: { base: 22, cap: 46 },
    // How high over the barrel the arc tops out, which is what puts a dart over
    // the front rank rather than into it.
    loft: { base: 2.4, cap: 5.6 },
    life: 2.4,
    // How fast a dart climbs to its cruise, how hard it is pulled back down on
    // the far side, the share of full speed it leaves the barrel with, how wide
    // a volley fans, and how close is close enough to go off.
    rise: 9,
    dive: 5,
    launch: 0.35,
    fan: 0.4,
    bite: 0.55,
    look: {
      body: 0xffa62b, core: 0xffffff, flame: 0xff5c0a,
      trailEvery: 0.015, trailLife: 0.24, size: 0.46,
      hitColor: 0xff9420, hitLife: 0.18, hitTo: 1.9,
      // The dart is a lit solid, not a glow: it has to still be a shape when it
      // is over a body and the light behind it is gone. A volley lands several
      // at once on the same knot, so the burn it leaves is kept faint and short
      // — at full opacity they stack into one black hole in the floor.
      scorch: 0x241a12, scorchLife: 0.38,
    },
    sfx: 'rf_seeker',
  },
};
