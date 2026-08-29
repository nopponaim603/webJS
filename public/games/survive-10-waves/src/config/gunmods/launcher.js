// The launcher's branch is ground control: it decides what the crowd is
// standing in when the shell goes off, and what the ground is like afterwards.
// Drawn in the shell's amber, with the well's violet as the one cold thing.
export const LAUNCHER_MODS = {
  well: {
    // The shell folds inward before it goes off. Every animal near it is dragged
    // onto the point first, so the blast that follows lands on a pile — and the
    // player has that same beat to get clear of it. The pile is the whole of
    // what the module is worth: it adds no damage of its own, and every shell
    // rolls the same odds, so levels buy the reach of the drag rather than how
    // often it happens.
    chance: 0.1,
    pull: { base: 8, cap: 23 },
    reach: { base: 4.5, cap: 22.5 },
    hold: { base: 0.5, cap: 1 },
    spread: 1.15,
    look: {
      core: 0x120620, edge: 0xa46bff, ring: 0xd8a8ff,
      lens: 0.3, threadCount: 9, threadWidth: 0.09, threadEvery: 0.055,
      motesEvery: 0.024, moteColor: 0xd8a8ff,
      // The pull edge and the horizon are drawn as short arcs on their own
      // phases: one long ring reads as a painted decal, a dozen overlapping
      // ones read as a surface that is turning.
      rimSegments: 11, hornSegments: 9, rimEvery: 0.075,
      rimWidth: 0.42, rimLife: 0.19,
      // Ground torn off the rim, warm against the violet so the well reads as
      // something doing work rather than as a light on the grass.
      gritEvery: 0.03, gritColor: 0xffb877, gritCore: 0xfff0d0,
      snapColor: 0xe0c8ff, snapCore: 0xffffff, snapLife: 0.4, snapTo: 1.5,
      spokeCount: 9, spokeWidth: 0.34, spokeLife: 0.3,
      sparkColor: 0xffd6a0, sparkCore: 0xfff2dc, rubble: 0x4a423a,
      dust: { every: 0.055, speed: 6, rise: 0.35, size: 0.26, grow: 1.6,
              life: 0.4, opacity: 0.24, y: 0.14, color: 0x6b5f52 },
    },
    sfx: 'ln_well',
  },
  emp: {
    // The other half of a blast: the field it leaves. Nothing in it moves at
    // its own speed, and the charge walks between whatever is standing in it.
    chance: { base: 0.4, cap: 1 },
    radius: { base: 4.6, cap: 8 },
    life: { base: 2, cap: 4 },
    slow: { base: 0.25, cap: 0.8 },
    // A share of the shell that left the field, on napalm's own clock: the
    // field has to keep up with a launcher that has been levelled.
    damage: { base: 0.12, cap: 0.28 },
    tick: 0.4,
    jumps: { base: 2, cap: 8 },
    // Ground already fielded is fed rather than fielded twice: four domes on
    // one floor is a white patch nobody can see the fight through.
    merge: 1,
    look: {
      field: 0x2fb4ff, edge: 0x8fd8ff, core: 0xffffff,
      // The edge is a fence rather than a ring: posts on fixed bearings with
      // the wire strung tight between them, and the charge crackling down one
      // span at a time. It does not turn — an edge that goes round reads as a
      // portal, and a fence is a thing somebody put there. Everything is
      // renewed at about the rate it dies, so the whole line buzzes.
      posts: 11, postStep: 4, postLift: 0.62, postSize: 0.3,
      postEvery: 0.15, postLife: 0.3,
      wireWidth: 0.15, wireEvery: 0.2, wireLife: 0.3, wireOpacity: 0.62,
      crackleEvery: 0.1, crackleWidth: 0.24, crackleLife: 0.15, crackleKink: 0.16,
      arcEvery: 0.15, arcWidth: 0.3, arcLife: 0.2, arcKink: 0.28,
      motesEvery: 0.07, moteColor: 0x9fe4ff,
      // Fried metal, not more of the field's own light: a cool effect only
      // reads as heat when something warm is thrown out of it.
      sparkColor: 0xffb877, sparkCore: 0xfff0d8, scrap: 0x555f68,
      // The floor of the field is a tint on the ground, not a lamp under it,
      // and the rim is only the line the fence is standing on.
      fill: 0.07, rimOpacity: 0.2,
      popLife: 0.4, popTo: 1.35,
    },
    sfx: 'ln_emp',
  },
};
