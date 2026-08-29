export const MAP = {
  arena: {
    max: 80,
    // `step` is how much wider each wave is, and `max` only ever caps it. Deriving
    // the step from `max` instead would make lowering the cap shrink every wave
    // below it rather than just the ones that ran past it.
    first: 30, step: 6.3, growTime: 0.9,
    // A wave that runs long has the ground taken off it: the floor closes in at
    // a steady pace until only the last stand is left to fight on.
    collapse: {
      after: 300, floor: 25, rate: 0.55,
      // The rim is the arena's own edge lit up rather than a second ring laid
      // over it: what is eating the ground has to be the ground's boundary.
      heat: 0xff4a1e, rimWidth: 1.9, flash: 1.9, flashTime: 0.7,
      // What the rim is struck to on the beat, and how far past white it is
      // driven getting there. Straight across the channels this time, not round
      // the hues: red to yellow the short way is red, orange, yellow, which is
      // the swing you can actually see.
      strike: 0xffe066, punch: 1.1,
      // One clock for the whole thing: the rim swells on it, the sonar is
      // struck on it, and the warning on screen breathes to the same period.
      beat: 2.0, pulse: 0.95,
      shake: 0.075,
      shards: { rate: 30, life: 2.6, size: 2.6, out: 3.2, gravity: 24, spin: 7 },
      dust: { rate: 16, life: 1.7, size: 4.2, fall: 2.6, out: 1.4,
              color: 0x8a7360, opacity: 0.42 },
    },
    wallHeight: 3.2,
    // How far inside the ring an obstacle has to sit. Walls and rocks are solid,
    // so one straddling the boundary is served up sliced in half.
    obstacleEdge: 5,
    terrain: 'assets/terrain-2.webp',
    normal: null,
    tileWorldSize: 32.4,
    bumpScale: 1.35,
    roughness: 0.95,
    tint: 0xffffff,
    showGrid: false,
    vignette: 0,
    // What the ground remembers of the wave. A splat that has finished settling
    // is painted into this once and its mesh given up, so blood and scorch cost
    // one texture fetch on the floor however much of it there is.
    stain: {
      // Whole-field, so the layer never re-projects when the ring steps out.
      // 2048 over 160 units is 12.8 texels a unit; 4096 sharpens it and costs 64MB.
      size: 2048,
      touchSize: 1024,
      // Where in a splat's fade-out the mesh hands over, painted at the alpha it
      // was wearing that frame so the swap is invisible.
      settle: 0.6,
      // Coverage fills up after two splats. Dose keeps counting past that.
      dose: 0.16,
      soak: 0.5,
      // Bent so the first few deaths barely move off `thin`. Straight, a lone
      // bug leaves a mark darker than the splat that made it.
      curve: 1.6,
      thin: 1.0,
      deep: 1.32,
      ceiling: 0.94,
      // Blood thin is `bugBlood` at the tone a splat dries to, so the first mark
      // matches the splat that made it.
      blood: { thin: 0x472e1a, deep: 0x0e0704 },
      // Soot is a film laid on the ground, so it keeps its own lower ceiling:
      // the terrain reads through however long a spot has been shelled. Past
      // `ashAt` the char lightens, or heavy bombing flattens to one dead black.
      burn: {
        thin: 0x3a2c20, deep: 0x120d09, ash: 0x6b6259,
        ceiling: 0.58,
        // Scorches are big and arrive seven at a time; at the splat's rate one
        // grenade runs the channel to its stop.
        rate: 0.25,
        bite: 16,
        soak: 0.8, ashAt: 0.72,
      },
      // Over the ground dressing, under the live splats, under the cloud shadow.
      y: 0.030,
      order: 0,
    },
  },
  walls: {
    height: 3.2,
    sink: 0.4,
    chamfer: 0.2,
    color: 0xffffff,
    texture: 'assets/wall.jpg',
    normalMap: 'assets/wall_normal.jpg',
    roughnessMap: 'assets/wall_rough.jpg',
    tileWorldSize: 4.0,
    normalStrength: 1.1,
    // No leg of a move may be longer than this. A body that covers more ground
    // in one frame than a block is deep steps clean over it, and a push that
    // finds it already past the middle of the block sends it out the far side —
    // so the move is walked in legs this long instead of jumped. Keep it under
    // half the thinnest wall plus the player's radius.
    maxStep: 0.9,
    boxes: [],
    segments: {
      seed: 31,
      // A little over what the arena holds at this gap: asking for far more only
      // burns attempts, asking for less leaves room unused.
      count: 20,
      clear: 10,
      length: { min: 12, max: 40 },
      arm: { min: 7, max: 18 },
      // Thinner than the minimum and a wall is a blade: it reads as scenery
      // rather than cover, and there is barely more of it than there is of the
      // player trying to hide behind it.
      thick: { min: 1.8, max: 3.0 },
      bias: 1,
      gap: 18,
      shapes: { bar: 5, ell: 3, tee: 2, yoke: 2, step: 2 },
    },
  },
  extraction: {
    // `radius` is the middle of the pad you have to be standing on for it to
    // charge; `outer` is the whole machine, which you step up onto.
    radius: 2.55,
    outer: 4.25,
    hold: 1.73,
    deathWait: 3.0,
    decay: 1.05,
    arrowDist: 2.6,
    // Deeper than the player is tall: the floor has to close over their head.
    sinkDepth: 4.6,
    lights: 24,
  },
  scatter: {
    enabled: true,
    seed: 7,
    clear: 6,
    blockAbove: 0.18,
    patches: {
      clusters: 53,
      perCluster: 7,
      spread: 7,
      min: 2.2, max: 7.0,
    },
    tint: {
      grass: 0x6b7541,
      moss: 0x4c5636,
      gravel: 0x8b8478,
      path: 0xffffff,
    },
    opacity: { grass: 0.68, moss: 0.62, gravel: 0.58, path: 0.75 },
    path: { width: 3.6, steps: 54, wander: 15, forks: 1, speed: 1.15, walkable: 0.55 },
    rocks: { count: 20, min: 0.3, max: 0.95, color: 0xa9a49c },
    boulders: { count: 4, min: 1.5, max: 2.4, block: 0.62, color: 0xa9a49c },
    pathTexture: 'assets/path.jpg',
    rockTexture: 'assets/rock.jpg',
    rockNormal: 'assets/rock_normal.jpg',
    regions: {
      count: 10,
      min: 22, max: 40,
      opacity: 0.22,
      tints: [0x6f7b4a, 0x8d7f60, 0x5c6550],
    },
    tufts: { count: 2450, min: 0.26, max: 0.45, color: 0x74853f },
    clouds: {
      enabled: true,
      tileWorldSize: 150,
      strength: 0.3,
      color: 0x1d2a33,
      wind: [2.2, 1.3],
      y: 0.09,
    },
  },
  sun: { elevation: 30, azimuth: 56, distance: 44 },
  sky: {
    background: 0x05070a,
    hemiSky: 0x88aaff,
    hemiGround: 0x0a1410,
    hemiIntensity: 0.55,
    sunColor: 0xfff2dd,
    sunIntensity: 3.0,
    exposure: 1.05,
  },
  camera: {
    height: 30, back: 18.5, fov: 50,
    // What a hit adds is decided by whatever hit you; this is only how the
    // camera carries it — how far it throws, and how fast it lets go.
    shake: { reach: 1.5, lift: 0.4, decay: 2.6, max: 1 },
    // The view opens out over the run: what a module used to buy, the waves now
    // hand out. `ceiling.from` is also the floor no ceiling may drop below.
    // `focus` is how close the camera is pulled while the pad has the player,
    // and `focusRate` how fast it goes both ways. `flight` rides on top of
    // whatever the player has set, for as long as the jetpack is lit.
    zoom: { min: 0.3, ceiling: { from: 1.0, to: 1.7, by: 20 },
            speed: 0.0012, smooth: 18, waveTime: 1.0,
            focus: 0.55, focusRate: 2.4, flight: 1.3, flightRate: 2.6 },
    // The window shape a zoom of 1 is worth, and how far in a wider one may be
    // pulled to pay for the width it gains. A phone held upright has almost no
    // width to give at all, so `portrait` buys the ground back by standing the
    // camera further off.
    fit: { ref: 16 / 9, min: 0.5, portrait: 1.65 },
  },
};
