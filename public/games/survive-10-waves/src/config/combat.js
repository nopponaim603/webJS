import * as THREE from 'three';

export const COMBAT = {
  player: {
    model: 'models/sentinel_rigged.glb',
    armIK: true,
    emissiveScale: 0.5,
    gunLength: 1.0,
    height: 3.4,
    speed: 11, radius: 0.75, maxHealth: 100, heft: 20,
    death: {
      time: 0.62,
      forward: 0.3,
      lift: 0.42,
      roll: 0.35,
      bounce: 0.13,
      bounceRate: 15,
      settle: 7,
      limp: 4.5,
      gunDrop: 0.18,
    },
    grace: 0.35,
    heavyHurtShare: 0.5,
    aimHeight: 1.0,
    coneDeg: 5,
    swapTime: 0.25,
    rechargeDelay: 1.0,
    swapDip: 1.25,
    fireRate: 6.0,
    // The dash is a multiple of the run rather than a speed of its own, so a
    // player who has bought legs dashes further as well as running faster.
    dashMult: 2.3, dashTime: 0.16,
    // One tank behind both moves: dash it dry and there is nothing left to fly
    // on, and a flight that outlasts it puts you back on the floor. `delay` is
    // how long the refill waits after anything is spent.
    // `dash` and `fly` are what each costs before that module's own first level
    // takes its cut, so the level that buys the move leaves it costing a whole
    // tank: one dash, or one second in the air, and every level after buys more
    // of them.
    // `strike` is the thunder drop's cut of the tank, as a share of the whole:
    // whatever the battery is worth, the drop is always the same bite of it.
    energy: { tank: 100, regen: 18, delay: 0.8, dash: 110, fly: 116, strike: 0.35 },
    // A column of light standing on the ground under the player. `cap` is how
    // far over their head it closes, as a share of their height — the rest of
    // its length is however high the jetpack is holding them.
    // Orange, and heavy enough to read at a glance: the seconds nothing can
    // touch you are the seconds you take the fight somewhere, and a column you
    // have to look for is one you spend the dash squinting at.
    // A cage of hexagons and pentagons round the player, swinging between the
    // two colours on `beat` rather than breathing on one. `radius` is the shell
    // across, in world units — it has to clear a body 3.4 tall and 0.75 wide, so
    // it is a shade under two. `cap` stretches it upright (one is a sphere),
    // `rise` is where its middle sits up the player, `spin` how fast it turns.
    // `machine` is the same cage round every drone in the air, as a multiple of
    // that machine's own radius: the Aegis covers the flight, not only the pilot.
    shield: { color: 0xff8a1e, hot: 0xffe066, radius: 2.05, cap: 1, rise: 0.5,
              glow: 0.16, rim: 0.9, beat: 7, spin: 0.5, fade: 0.35, machine: 1.5 },
    wake: {
      color: 0xbfe9ff,
      width: 1.3,
      taper: 0.28,
      y: 0.32,
      streakY: [0.95, 1.75],
      streakX: 0.52,
      life: 0.45,
      carry: 0.16,
      tailExtend: 3.2,
      fadePow: 1.0,
      points: 40,
    },
    dashFireLock: 0.5,
    jetpack: {
      // How high a flight hovers, in world units. Stated outright rather than
      // read off the wall tops: it is well over them now, and the number that
      // matters is how the arena reads from up there.
      height: 9,
      // The shortest burn worth starting, in seconds. Lifting off on less than
      // this is a stutter rather than a flight, so the key is refused instead.
      least: 0.25,
      rise: 9,
      fall: 13,
      boost: 1.3,
      // How far it leans at full speed and how quickly the lean follows the
      // velocity, the drone's own numbers pulled in a little: a body is not a
      // machine and reads as falling long before half a radian.
      tilt: { most: 0.32, ease: 6 },
      // Two sines that do not divide into each other, so the float never lands
      // in the same place twice.
      bob: { amp: 0.2, rate: 2.2, second: { rate: 0.43, amp: 0.6 } },
      // `rake` tips the burn back off the legs: a jet pointed straight down out
      // of a pack worn on the back comes out through the calves.
      flame: { color: 0xff7a1c, core: 0xffd48a, hot: 0xffc46a, length: 1.9,
               width: 0.3, rake: 0.38, flare: 6, churn: 11, glow: 3.4 },
      // The burn lighting the ground it is standing off. `drop` is how far below
      // the pack it sits, as a share of the player's height, so the light is in
      // the exhaust rather than inside their back. `keepFree` leaves lights in
      // the pool for the blasts, which are the ones that must never be missed.
      light: { color: 0xff8a2a, intensity: 16, distance: 14, drop: 0.24, keepFree: 3 },
      // `kick` is the shove of leaving the ground and of meeting it again;
      // `hum` is the engine itself, held under the camera for as long as it
      // burns and small enough to be felt rather than seen.
      shake: { kick: 0.5, hum: 0.05 },
      // What the burn leaves on the floor it pushed off. Take-off only: by the
      // time the feet come back down the jet has already been shut off.
      scorch: { size: 2.4, tint: 0x2b2118, life: 7, fadeIn: 0.3 },
      smoke: { every: 0.035, speed: 3.2, life: 0.9, size: 0.42, grow: 4.2,
               rise: -2.4, color: 0x8d8f94, opacity: 0.4 },
      // The floor answering the thrust, thrown once as the feet leave it and
      // again as they land. `spread` is how far out of the player's own width
      // the ring is laid.
      dust: { count: 18, spread: 2.6, speed: 8, life: 1.1, size: 0.8, grow: 4,
              rise: 0.7, y: 0.15, color: 0x9a8b72, opacity: 0.55 },
      voice: { rate: 0.92, swell: 0.3 },
      // Legs hang off a body, they are not bolted to it. `follow` is how quickly
      // they catch up with it, and what they are still short of is what swings
      // them: `at` is the shortfall worth a full `most`, and the spring is what
      // makes it a swing rather than a lean — soft enough to overshoot once and
      // settle. `idle` keeps a still hover from freezing solid.
      dangle: { follow: 4, at: 12, most: 0.45, stiff: 42, damp: 7,
                idle: { amp: 0.05, rate: 0.7 } },
    },
    gunOffset: { pos: new THREE.Vector3(0, 0.04, 0.08), rot: [0, 0, 0] },
    holdOffset: new THREE.Vector3(-0.1, 0.315, 0.255),
    gripOffset: new THREE.Vector3(0.105, -0.11, 0.325),
    triggerOffset: new THREE.Vector3(-0.045, -0.11, 0.125),
  },
  // The charge the pack leaves behind as it lifts off. It is the player's own
  // machine, so it never bites the hand that dropped it: `selfDamage` is zero at
  // the call site rather than a number here.
  // The near miss, made visible and audible. `from` is how much of the band the
  // ring already covers when it opens, so it reads as light running outward
  // rather than as a circle appearing whole.
  graze: {
    ring: { life: 0.6, from: 0.2, alpha: 1.35, color: 0x9dffd0,
            snap: 0.3, snapFrom: 2.1, snapAlpha: 1.1,
            flash: 0.3, spark: 3.4, sparkAlpha: 1.5,
            grit: 12, gritSpeed: 7, gritLife: 0.34 },
    sound: { rate: [0.96, 1.06], gain: 1 },
    // The screen answers it too, briefly: the same overlay a hit uses, the other
    // way round in colour and gone twice as fast.
    veil: { alpha: 0.5, ms: 130 },
  },

  // The escape, told apart from the graze by its colour and its place: this one
  // is said over the ground the player left, not the ground they held.
  dodge: {
    span: 2.6, color: 0x9fd6f0, rate: [1.12, 1.24],
  },

  // The guns answering three near misses in a row: the same ring the dodges use,
  // wider and in the charge's own gold so it reads as the guns rather than as a
  // fourth dodge.
  adrenaline: { span: 5.5, color: 0xffd970, rate: 1,
                // One step a banked charge, so the bank can be counted by ear.
                bankRate: [1, 1.12, 1.25, 1.4, 1.57],
                // The motes riding round the player, one a banked charge.
                // `fade` is the last share of a charge's life, over which its
                // mote dims and shrinks rather than simply going out.
                mote: { radius: 1.25, height: 0.62, size: 0.85, spin: 1.9,
                        fade: 0.3, pop: 2.6, popTime: 0.28 } },

  // The budget a bug carries for both Nerve and Reflex together, and the light
  // it wears while it still has one. A single spitter left alive at the end of a
  // wave is a threat to dodge, not a well to drink from.
  nearmiss: {
    perBug: 3,
    // What each near miss after the first is worth on top of its module's own
    // share, for as long as the run of them holds. Stringing them together is
    // the skill the pair is really selling.
    step: 0.005,
    // The dots down a bug's spine. Everything but the colour is a share of the
    // bug's own size, so a tank wears the same marking a runner does at the
    // scale it is built at. `spine` is where the line starts and ends behind the
    // middle, and `squash` flattens each dot into the hide.
    // Measured off the body's own length: `size` is the dot radius, `run` how
    // much of the back the row covers, `nudge` how far forward of the middle it
    // is centred, and `lift` how far clear of the hide it floats.
    // Burnt into the emissive sheet, so `size` is a share of that sheet rather
    // than of the animal. `run` is how much of the back the row covers and
    // `nudge` how far forward of the middle it is centred; `glow` is what the
    // dots burn at on a bug whose level lights nothing of its own.
    dots: { color: 0xff4014, size: 0.045, run: 0.26, nudge: 0.06, glow: 0.9 },
  },

  jetBomb: {
    fuse: 2,
    edge: 0.45,
    knock: 26,
    // The share of its own damage the blast takes off whoever set it and off
    // any machine over it. A charge dropped at your feet with a two second fuse
    // is a thing you are meant to leave, and one that could not touch you was
    // not asking you to. In line with the grenade, which is the other explosive
    // the player can stand in.
    selfShare: 0.4,
    color: 0x2f3a45,
    mark: 0xffb24a,
    markOpacity: 0.4,
    lamp: 0.55,
    spin: 1.4,
    // The fuse counted out loud. The gap closes as the fuse runs down, so the
    // last half second is a rattle rather than a beat, and every beep is a
    // flash of the lamp and of the light it throws on the floor.
    beep: { slow: 0.42, fast: 0.07, flash: 0.13,
            freq: 680, rise: 620, dur: 0.05, gain: 0.05 },
    light: { color: 0xffb24a, intensity: 24, distance: 9, keepFree: 2 },
  },
  // The thunder drop: the mark, the dive, and the field the ground answers with.
  // What lights a bomber and what it looks like while it burns. `arm` is the
  // share of its own blast radius the player has to be inside for it to commit,
  // and `time` the beat they then have to get out of that circle.
  bomberFuse: {
    arm: 0.8,
    time: 0.85,
    // Stepping back out puts it out. Measured past the reach that lit it, and
    // followed by a beat before it may light again, so a player walking the
    // edge of the circle does not make it stutter on and off.
    letGo: 1.15,
    relight: 0.4,
    // How much wider it swells over the fuse, and how much faster its own glow
    // beats by the end of it.
    swell: 0.45,
    pulse: { rate: 9, gain: 3 },
    // Rung whether or not the augur is bought: a lit bomber is not something to
    // find out about from the blast.
    alwaysWarn: true,
    ring: { color: 0xff5a3c, opacity: 0.6, dim: 0.3, pulse: 11 },
    sfx: 'bugAttack',
  },

  jetStrike: {
    markColor: 0x8fd8ff,
    denyColor: 0xff5a4a,
    markOpacity: 0.5,
    castColor: 0x4ea6ff,
    castOpacity: 0.22,
    markBeat: 7,
    shortNote: 'NOT ENOUGH ENERGY',
    // The dive is a speed, not a time, so a mark thrown across the arena takes
    // longer to reach than one under your feet — but never less than `leastDive`,
    // or a drop at your own toes has no fall to read.
    diveSpeed: 90,
    leastDive: 0.18,
    // What the rim takes, as a share of what the middle takes: the field is
    // hardest under the boots, and standing at the edge of it is worth something.
    edge: 0.6,
    // The shove, and never more of it than the room a body has left before the
    // arena ring: nothing is thrown through the wall it is being thrown at.
    knock: 138,
    shake: 0.9,
    // Cover for the moment of the landing: whatever was standing on the spot is
    // thrown clear of it, and the player should not trade a hit for that.
    cover: 0.6,
    // What the player wears while Kickstart is running, in the field's own blue
    // rather than the Autoloader's red: the same effect, but plainly bought
    // rather than picked up.
    kickColor: 0x6fc8ff,
    wave: {
      time: 0.32,
      color: 0x6fc8ff,
      rim: 0xbfe9ff,
      sheet: 0.5,
      wallOpacity: 0.45,
      tall: 3.2,
      coreSize: 7,
      coreLift: 1.2,
      light: 90,
      keepFree: 2,
      arcs: 3,
      arcEvery: 0.04,
      arcLift: 2.4,
      dust: { count: 5, every: 0.05, speed: 9, life: 0.9, size: 0.7, grow: 3.4,
              rise: 0.8, y: 0.2, color: 0x9a8b72, opacity: 0.5 },
      // What the floor keeps of the landing, and what it throws up off it.
      // `spread` is how much of the field the burns are scattered over.
      scorch: { count: 7, size: 2.6, spread: 0.65, tint: 0x2b2118, life: 7,
                fadeIn: 0.25 },
      // Many small clouds rather than one big one, so `puff` is a size in units
      // rather than a share of the field: the smoke is the same weight whether
      // the field is six across or thirty.
      smoke: { count: 26, puff: 1, spread: 0.75, speed: 2.8, life: 1.5, size: 0.8,
               grow: 2.4, rise: 1, y: 0.25, color: 0x8d8f94, opacity: 0.45 },
    },
  },
  crit: {
    chance: 0.01,
    multiplier: 3,
    flash: {
      color: 0xff2a1e,
      time: 0.14,
      intensity: 1.5,
    },
  },
  // Touch has no pointer to aim with, so the gun picks the target itself.
  autoAim: {
    range: 48,
    // Kept between the player and a lobbed shot, on top of that shot's blast.
    blastClear: 2,
    turnRate: 15,
    // How much closer a rival has to be before the aim leaves its target.
    stickiness: 0.75,
  },
  crosshair: {
    gaugeAfterShot: 0.6,
    gaugeAfterSwap: 1.4,
    dryHold: 0.4,
    firePulse: 0.12,
    firePulseAmp: 0.45,
    chargeDrop: -14,
    noteTime: 1.1,
  },
  gunSlots: 4,
  guns: [
    {
      id: 'rifle', name: 'PULSE RIFLE', projectile: 'bullet',
      desc: 'Steady and cheap. The gun the modules are tuned around.',
      icon: '<path d="M3 10h15v3H3z"/><path d="M18 11.5h3.5"/><path d="M8.5 13l-1.5 4"/><path d="M12.5 13v3.5"/>',
      model: 'models/rifle.glb',
      crosshair: 'cross',
      aimSight: true,
      mod: 'rfGun',
      mods: { pierce: 'rfPierce', chain: 'rfChain', rail: 'rfRail', seeker: 'rfSeeker' },
      damage: 17,
      range: 60,
      fireRate: 6.0,
      charges: 20,
      recovery: 3,
      cost: 1,
    },
    {
      id: 'shotgun', name: 'SCATTER GUN', projectile: 'bullet',
      desc: 'Damage that only arrives if you are close enough for the pattern.',
      icon: '<path d="M3 10h12v4H3z"/><path d="M15 10.8h6"/><path d="M15 13.2h6"/><path d="M8 14l-1.5 3.5"/>',
      model: 'models/shotgun.glb',
      modelLength: 0.78,
      crosshair: 'spread',
      look: 'pellet',
      sfx: 'shotgun',
      damage: 15.6,
      pellets: 10,
      stagger: 0.055,
      spreadDeg: 22.5,
      range: 20,
      rangeJitter: 0.3,
      unlock: 'sgGun',
      mod: 'sgGun',
      mods: { knock: 'sgKnock', pierce: 'sgPierce', reach: 'sgReach', slug: 'sgSlug' },
      fireRate: 1.4,
      charges: 8,
      recovery: 1.84,
      cost: 1,
    },
    {
      id: 'laser', name: 'LANCE', projectile: 'beam',
      desc: 'Hold to wind up, let go to cut. Runs through everything, and cooks you along with itself if you hold too long.',
      icon: '<path d="M2 12h13"/><path d="M15 9.5h5v5h-5z"/><path d="M6 9v6M10 8.5v7"/>',
      model: 'models/lance-gun.glb',
      crosshair: 'lance',
      charge: true,
      unlock: 'lzGun',
      mod: 'lzGun',
      mods: { bounce: 'lzBounce', prism: 'lzPrism', rift: 'lzRift' },
      damage: 50,
      fireRate: 1.1,
      charges: 1,
      fixedCharges: true,
      recovery: 0.7,
      cost: 1,
    },
    {
      id: 'launcher', name: 'GRENADE LAUNCHER', projectile: 'grenade',
      desc: 'Arcs over cover. Weak on one bug, decisive on a crowd.',
      icon: '<path d="M3 12h11v4H3z"/><path d="M14 13.5h4"/><path d="M7 16l-1.5 3.5"/><path d="M4.5 9c4-5.5 12-5.5 16 0"/>',
      model: 'models/launcher.glb',
      modelLength: 0.86,
      crosshair: 'circle',
      aimClear: true,
      semi: true,
      mod: 'lnGun',
      mods: { count: 'lnCount', napalm: 'napalm', well: 'lnWell', emp: 'lnEmp' },
      damage: 30,
      fireRate: 1.0,
      charges: 2,
      // With lnGun's `recov`, bent to hand over 0.3/s at level 1 and 0.7/s at 10.
      recovery: 0.273,
      cost: 1,
    },
  ],
  napalm: {
    life: 5.0,
    tick: 0.4,
    spread: 1.15,
    selfShare: 0.35,
    color: 0xff6a1e,
    scorch: 0x3a1c10,
    fire: {
      // Flame height at the module's first level, as a share of its last.
      small: 0.45,
      // Parcels a second per unit of pool. Too few and it reads as separate
      // little flames rather than one fire.
      flameRate: 4,
      flameLife: 0.85,
      tall: 0.7,
      // Parcel size as a share of the flame, and how far it swells before dying.
      seed: 0.2,
      grow: 2.3,
      // All in units of the pool, so a wide pool burns tall. Buoyancy is the
      // push a parcel keeps while hot, and is what stretches the flame.
      born: 0.1,
      rise: 1.2,
      buoyancy: 1.8,
      spread: 0.45,
      wander: 1.1,
      swirl: 7.0,
      spin: 1.8,
      opacity: 0.18,
      // Where in a parcel's life it has gone white -> orange; the rest to red.
      ramp: 0.34,
      fade: 1.5,
      hot: 0xfff0d0,
      mid: 0xff9e2c,
      cool: 0xd42b06,
      fadeIn: 0.3,
      fadeOut: 1.1,
      ember: 0xffb43c,
      emberEvery: 0.1,
      smokeEvery: 0.34,
      glow: { color: 0xff7420, size: 1.5, opacity: 0.55 },
      light: { color: 0xff8a30, intensity: 26, distance: 15 },
      smoke: { speed: 0.9, life: 1.6, size: 0.5, grow: 2.6, rise: 1.6,
               y: 1.0, color: 0x2b2420, opacity: 0.3 },
    },
  },
  // How an explosion is felt: `full` is the blast radius that shakes at full
  // power, `reach` how many radii out it carries.
  blast: { shake: { power: 0.55, full: 3.6, reach: 5 } },
  grenade: {
    range: 18,
    fanDeg: 13,
    turnJitter: 0.09,
    scatter: 0.55,
    maxScatter: 2.0,
    maxFan: 4.5,
    depthSpread: 0.18,
    maxDepth: 4.0,
    depthJitter: 0.25,
    stagger: 0.07,
    speed: 24,
    minFlight: 0.3,
    maxFlight: 2.4,
    gravity: 30,
    radius: 0.3,
    splash: 3.75,
    edge: 0.4,
    knock: 14,
    selfDamage: 0.4,
    armDistance: 1.5,
    life: 4,
    trail: {
      every: 0.03,
      life: 0.34,
      drift: 0.9,
      color: 0xff9a3c,
    },
    puffs: {
      fire: {
        count: 9,
        speed: 7.5,
        life: 0.34,
        size: 0.55,
        grow: 2.4,
        y: 0.5,
        hot: 0xffe2b0,
        cool: 0xff4d12,
      },
      smoke: {
        count: 7,
        speed: 3.4,
        life: 1.15,
        size: 0.6,
        grow: 3.0,
        rise: 1.2,
        y: 0.7,
        color: 0x241f1b,
        opacity: 0.5,
      },
    },
    light: { color: 0xff8a2a, intensity: 12, distance: 12 },
    blastLight: { color: 0xffd8a0, intensity: 180, distance: 34, life: 0.3 },
    flash: {
      color: 0xfff0cf,
      scale: 1.8,
      from: 0.35,
      life: 0.22,
      core: { color: 0xffffff, from: 0.25, scale: 1.0, life: 0.1 },
    },
  },
  laser: {
    width: 0.55,
    coreWidth: 0.4,
    height: 1.0,
    range: 260,
    // It runs through the whole line: what limits it is the damage it keeps.
    retain: 0.95,
    minHit: 2,
    minCharge: 0.22,
    fullCharge: 1.1,
    overheat: 1.8,
    warn: 0.45,
    cooldown: 4.8,
    selfBurn: 0.05,
    maxDamage: 50,
    chargeCurve: 47.86,
    widthGain: 3,
    life: 0.22,
    color: 0xff3860,
    core: 0xffe6ef,
    bounceRetain: 0.72,
    sightWidth: 0.07,
    sightOpacity: 0.55,
    chargeColor: 0x9a5cff,
    coilSize: 2.1,
    coilRate: 9,
    coilLight: 30,
    coilReach: 10,
    coilSparks: 14,
    whineFrom: 90,
    whineTo: 760,
    whineGain: 0.045,
  },
  chain: {
    // The bolt the rifle throws is crooked; `beam` is the straight one the
    // drone's arc draws instead. Both are the same ribbon, drawn twice — the
    // second pass is the core, narrower and brighter than the glow round it.
    beam: { jitter: 0, width: 0.5, coreWidth: 0.34, life: 0.13,
            color: 0xff3860, core: 0xffe6ef },
    chance: 0.10,
    chanceCap: 0.45,
    range: 8.5,
    damage: 0.55,
    falloff: 0.78,
    minDamage: 1,
    jumpDelay: 0.085,
    life: 0.2,
    segments: 8,
    jitter: 0.7,
    width: 0.42,
    color: 0xbde8ff,
    height: 2.8,
  },
  // A machine that keeps the player's shoulder and shoots what it can reach.
  // It is not a bug and takes no damage: what it costs is the ground it has to
  // keep off, since it reads the same warnings the player does.
  drone: {
    // A machine called up by an item flies out rather than being taken off the
    // board: it climbs away over `time` and is gone. Nothing broke, so nothing
    // is written down and nothing is thrown.
    leave: { time: 1.1, climb: 26, spin: 5 },
    // Called up from off the board rather than handed over on the spot: it
    // crosses in from `out` past the ring, takes station `ring` off the player
    // and flies a lap of them for `circle` seconds before it looks for anything
    // to shoot. The clock only runs once it has caught up, so a machine still
    // crossing the floor has not arrived.
    // `cue` is what it says while it circles and `every` how often — a machine
    // reporting in on its way round, so a flight arriving is heard as well as
    // seen. Faster than the idle chatter it settles into once it is fighting.
    arrive: { out: 34, ring: 7, speed: 26, spin: 2.2, circle: 3,
              cue: 'Idle', every: [0.55, 1.2] },
    // The singularity. How far it reaches, what the pile burns for and how often
    // it comes round are the module's own numbers, in the catalog; this is only
    // what the attack does. It is used the moment it is off cooldown and there
    // is anything at all to take, so `least` is a floor rather than a wait.
    // The rest is the look of the collapse: the ring closing on the floor, the
    // dust dragged in over it, and the light in the middle of it.
    void: { least: 1, most: 30, retry: 0.3,
            // The drone spends `cast` standing off and holding a line on the
            // spot before anything moves, then `pull` dragging everything it
            // caught into it — the same two seconds whether the crowd was
            // underfoot or out at the rim — and the bomb lands the moment the
            // pile does. The fire it leaves is `pool` of the ground it took.
            cast: 1, pull: 2, pool: 1 / 3,
            // What it does to what is standing on it: a drag toward the middle
            // and nothing else. `draw` is the speed that drag settles at on a
            // light animal — a heavy one is shifted less — and it is a pull, not
            // a hold: everything it has keeps walking, turning and biting the
            // whole time, and anything that wanders in gets the same treatment.
            // Set against the reach and the pull: a light animal standing at the
            // rim has to be able to cross most of it before the bomb lands, or
            // the well is a mark on the floor rather than a pile.
            draw: 18,
            lift: 0.7, spin: 11, glow: 0xff3860, halo: 5.5,
            // The whole floor it has hold of is lit, not only its edge: `fill`
            // is the wash over the ground and `ring` the rim that bounds it.
            fill: { color: 0xff2f52, opacity: 0.3, y: 0.05 },
            ring: { color: 0xff6a86, shut: 0.12, opacity: 0.55, y: 0.06 },
            light: { color: 0xff4060, intensity: 26, distance: 16 },
            // The line the drone holds on the spot while it winds up, and the
            // column standing out of the spot for as long as it is pulling.
            aim: { width: 0.16, color: 0xff3860, opacity: 0.75 },
            sky: { width: 0.7, height: 30, color: 0xff3860, opacity: 0.5 },
            dust: { every: 0.028, speed: 7.5, life: 0.5, size: 0.32, grow: 0.5,
                    rise: 0.4, y: 0.5, color: 0xff5570, opacity: 0.5 } },
    // The bombing run: a line the machine flies itself, laying charges out of
    // its own belly as it crosses the ground it has marked. `fall` is how long
    // one takes to reach the floor from the height it was let go at.
    // How long it waits between runs is the module's, not the machine's — see
    // modules/catalog.js. `retry` is the beat it takes when it asks for a run
    // and is turned away: no target, no room, or ground already spoken for.
    bombs: { retry: 0.4,
             // The lane is centred on what the machine is shooting and lights
             // up the moment it is called, so the ground is marked while it
             // flies for the head of it. `warn` is the least that beat may be,
             // `lineup` the most it will spend getting there before giving the
             // run up, `grip` how far out the pass takes over — it is flown into
             // rather than stopped on — and `settle` how quickly whatever is
             // left between the machine and the line is flown out.
             warn: 0.6, lineup: 3, grip: 6, settle: 12,
             // The pass is flown at `dash` times its own speed, so a machine
             // with better thrusters lays the same line in less time.
             dash: 2,
             // A charge falls under `gravity` from the height it was let go at,
             // and the pass is flown high enough that the fall lasts as long as
             // the machine needs to be `clear` of its own blast when it lands.
             // Whatever is left over it flies out straight: `outrun` is that
             // run-out as a share of the lane.
             gravity: 30, clear: 1.5, outrun: 0.25,
             fade: 0.5, blink: 9,
             // How low it flies the pass, as a share of the height it holds the
             // rest of the time: a stoop onto the lane, not a dive at it. The
             // charges leave the machine, so this is the height they fall from.
             stoop: 0.9,
             // How far off the line a charge may tumble on the way down, as a
             // share of its own blast: what lands is scattered along the lane
             // rather than laid down it in a row of dots. The lane is drawn as
             // wide as this makes the ground it takes, so a generous scatter is
             // paid for in a mark far wider than any one blast.
             spread: 0.3,
             most: 24,
             // What a charge does to its own side, as a share of what it does
             // to a bug: the lane is marked in red for the player as much as for
             // what is standing in it, and the flight is in the blast too — a
             // machine hanging over the lane is bombed like anything else, and a
             // bomber that stops flying is bombed by its own charges.
             selfShare: 0.25,
             edge: 0.45, knock: 11,
             shell: 0x2b3035, spin: 5.5,
             lane: { color: 0xff2a3d, opacity: 0.5, y: 0.05 } },
    size: 0.42,
    // How much wider it stands for every level of plating: armour you can see,
    // and held small enough that a maxed machine still reads as a machine.
    swell: 0.03,
    color: 0xdde2e6,
    trim: 0x2b3035,
    eye: 0x4be544,
    // How far over the wall tops it sits, as a share of their height: it has to
    // clear them to see over them, and to be plainly out of reach of the ground.
    overWall: 1.2,
    bob: 0.25,
    bobRate: 1.7,
    // How much further it rides up and down with nothing to shoot at. Held so
    // the bottom of the swing still clears the wall tops: it is breathing, not
    // dropping in behind cover.
    bobIdle: 1.25,
    standoff: 4.2,
    // Escorting is a band, not a circle: how far out it may drift from the
    // nearest station, and how many rings it is offered on the way there. One
    // machine sits on your shoulder; six spread back through it.
    loose: 3.2,
    bands: 5,
    drift: 0.5,
    speed: 13,
    chase: 3.4,
    ease: 9,
    // How much ground it leaves round anything claimed, and how many stations
    // round the ring it will try before settling for the one it has.
    clear: 2.2,
    // The least ground between two of them: they hold their own airspace, so a
    // flight reads as a flight rather than one thick machine.
    apart: 3.2,
    // How close another machine has to be to count as flying with this one,
    // which is what the swarm modules pay out on. A machine wears one band for
    // every bonus the flight is paying it, stacked up the hull so two of them
    // read as two. Sizes are in `size`, like the rest of the model.
    swarm: 30,
    rings: {
      radius: 2.15, tube: 0.075, arc: 1.62, lift: -0.55, gap: 0.5,
      opacity: 0.72, spin: 1.5,
      colors: { damage: 0xff7a3d, speed: 0x62ff9d, shield: 0x7fd4ff },
    },
    // And the room it leaves round anything with a mouth, over and above that
    // animal's own width: it is shot at from outside biting distance, and it
    // does not fly through one to get anywhere either.
    mind: 3.5,
    shy: 2.5,
    tries: 12,
    // How far inside the rim it is held: it flies, so the arena's own walls do
    // nothing to keep it on the map.
    inset: 2,
    // What it sees with no cannon levels bought. Every level of the cannon sets
    // the reach outright from there — see modules/catalog.js.
    range: 15,
    // How far out it looks for work, as a multiple of that reach: it goes to a
    // fight rather than waiting for one to walk into the beam, and closes the
    // rest of the way before the gun says anything.
    seek: 2,
    // The closest it will work a bug from: far enough that a bite never
    // reaches. It is the near edge of a band, not a ring — the far edge is
    // `hold` of whatever its reach has grown to, and it prefers the far edge,
    // since nothing standing off is being bitten.
    engage: 7,
    hold: 0.85,
    fireGap: 0.32,
    damage: 9,
    // Its gun is a beam, not a round: hitscan, so `range` is the whole of what
    // it can reach. Drawn twice like every other beam in the game — a wide red
    // glow with a near-white core inside it — and stopped `floor` off the
    // ground when nothing on the way took it.
    beam: { width: 0.16, coreWidth: 0.4, life: 0.08, floor: 0.15,
            color: 0xff2233, core: 0xffd9de },
    // It can be broken, and anything that would rather bite it than the player
    // is welcome to try: what it buys is the seconds it stands between them.
    // Three quarters of what the player carries, and its plating climbs at the
    // same rate theirs does, so it stays three quarters of them at every level.
    hp: 75,

    // Standing guard with nothing to shoot: it turns to watch a new bearing
    // every so often, and chatters to itself between times.
    watch: [2.2, 5.5],
    watchTurn: 2.4,
    // How fast it can bring the barrel round, and how close to lined up it has
    // to be before there is a shot. A target across the field costs it the
    // swing; one it is already facing costs it nothing.
    aimTurn: 4.5,
    aimed: 0.16,
    // How far it leans at full speed, and how quickly the lean follows the
    // velocity. Half a radian is a hard dive; anything more reads as a fall.
    tilt: { most: 0.42, ease: 7 },
    // The lamp on its back. Every cue it speaks is also a colour and a rhythm,
    // so what it is doing can be read from behind with the sound off: green for
    // nothing wrong, amber for looking, red for something found, blue for a
    // change of mind. `beats` alternate lit and dark, starting lit.
    led: {
      off: 0.06,
      rest: { color: 0x2f6d85, rate: 1.4, low: 0.18, lift: 0.5 },
      cues: {
        Idle:    { color: 0x4fe07a, beats: [0.10, 0.16, 0.10] },
        Lookout: { color: 0xffb14a, beats: [0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.2] },
        Attack:  { color: 0xff3b25, beats: [0.06, 0.05, 0.06, 0.05, 0.06, 0.05, 0.28] },
        Switch:  { color: 0x4cc9f0, beats: [0.07, 0.06, 0.07] },
        Hurt:    { color: 0xff2a14, beats: [0.04, 0.03, 0.04, 0.03, 0.04, 0.03, 0.04, 0.03, 0.35] },
      },
    },

    // What it says, how many turns of phrase it has for each, and how often it
    // pipes up unprompted.
    voice: { idleEvery: [5, 11], Idle: 3, Attack: 3, Switch: 3, Hurt: 2 },
  },

  bullet: {
    speed: 62, life: 1.6, radius: 0.28, thickness: 0.14, damage: 10, spread: 0.3,
    // The first level of the module has to be felt on its own, so buying it
    // pays `knockBase` up front and every level after adds `knockPer`.
    knockBase: 30,
    knockPer: 10,
    minDamage: 1,
    remain: 0.5,
    halfAt: 70,
  },
};
