import { MODULE_TREE } from './moduletree.js';
import { SFX } from './sfx.js';

export const META = {
  ...MODULE_TREE,
  ...SFX,
  touch: {
    stickRadius: 62,
    deadzone: 0.16,
    doubleTapMs: 300,
    dashArmMs: 350,
    dashPush: 0.55,
  },
  // The line under the player that answers a key they just pressed. `drop` is how
  // far below their feet it sits, in pixels.
  note: { time: 1.4, fade: 0.4, drop: 52 },
  // A line hung off something in the world. `lift` is how far above it the
  // bubble floats, in metres, so it clears the machine rather than the screen.
  bubble: { time: 8, fade: 0.7, lift: 0.85 },
  // `branch` is a ring and a half of `gap` — the walk in modules/layout.js
  // prices a link at that ratio, so the two only ever move together.
  moduleRing: { first: 90, gap: 28, clear: 44, branch: 42 },
  // A ring costs `perRing` times the one inside it, out to `softAt` — a ring
  // index, so 14 is level 15 of a module rooted at the middle. Past it the step
  // is `perRingSoft`, which is `1 + mission.endless.per` on purpose: an endless
  // rung then costs exactly what it pays, and since a wave's coins and its bugs
  // both ride the same `waves.surge`, the tail is a level treadmill rather than
  // a wall. The seam is continuous: the soft rate multiplies on top of the rings
  // already climbed, it does not start the price again.
  modulePrice: { base: 10, perRing: 1.666, softAt: 14, perRingSoft: 1.115 },
  coins: {
    radius: 0.34, thickness: 0.09,
    tilt: 1.0,
    // Thrown hard and pulled down hard. A coin is a small heavy thing, and the
    // read comes from how quickly it leaves and how quickly it is done: a slow
    // arc off a dying bug looks like paper, whatever the coin is made of. The
    // burst is wider than it was and the hang is a fraction of it — see
    // `gravity`, which the two of these are set against.
    pop: 15,
    popUp: 22,
    // How wide a pile is thrown. `spreadAt` is the number of coins the plain
    // `pop` is the right throw for; a bigger pile is thrown further by the root
    // of how much bigger, so what lands thins out instead of stacking up.
    spreadAt: 6,
    spreadMax: 2.6,
    armTime: 0.4,
    // Far heavier than a real 26 would be, and deliberately. The throw is tossed
    // to about the player's own height and is on the floor in three quarters of
    // a second: the weight is in how hard it comes back down, not in how little
    // it goes up, so the arc can be a real one without reading as paper.
    gravity: 82,
    rest: 0.22,
    hover: 0.62,
    riseEase: 4.5,
    bob: 0.12,
    bobRate: 2.4,
    tiltWobble: 0.14,
    spin: 3.2,
    // Reach grows with the run, not with a module: by the waves that bury the
    // floor in coins, the sweep is wide enough to keep up with them.
    magnet: { from: 4, to: 12, by: 15 },
    chaseSpeed: 12,
    chaseAccel: 60,
    chaseMax: 56,
    pickup: 0.95,
    takeTime: 0.16,
    // The sample is half a second long and swells again a quarter of the way
    // in, so `stagger` is what lets one chime ring out before the next lands:
    // tighter than this and a pile is a tone rather than a run. `lead` is how
    // far ahead the run may be booked, and so how long it keeps ringing once
    // the coins are gone: a pile walked into is swallowed in a couple of
    // frames, and a run that cannot outlive them rings three times and stops.
    chime: { stagger: 0.05, detune: 0.05, lead: 0.75 },
    // The floor budget. A wave can put three hundred bodies down at once and
    // every one of them pays in several coins, so this is counted in coins, not
    // in kills. Past it the furthest give way, `evict` of the floor at a time:
    // making room one coin at a time would cost a scan of the whole floor for
    // every coin dropped, and a wave that buries it drops thousands.
    max: 5000,
    evict: 0.02,
    // A pile is paid in denominations so a big drop is a scatter of coins rather
    // than hundreds of objects. Biggest first — drop() takes from the top — and
    // the first `plainFirst` of any drop is always paid in ones, so a kill reads
    // as a shower on the ground rather than a single fat coin.
    plainFirst: 15,
    kinds: [
      { value: 500, size: 1.55, glow: true, rate: 0.72 },
      { value: 50, size: 1.55, glow: false, rate: 0.82 },
      { value: 10, size: 1, glow: true, rate: 0.92 },
      { value: 1, size: 1, glow: false, rate: 1 },
    ],
    glow: { color: 0xffe9a0, emissive: 0xffb43c, intensity: 1.4,
            halo: 2.4, opacity: 0.55, pulse: 0.14, pulseRate: 3.2 },
  },
  // What a boss leaves behind — the key on one wave, a drone on another. It
  // hangs high enough to be read over a floor buried in coins, and the beam
  // standing over it is what carries across the arena.
  bossDrop: {
    rest: 0.6,
    hover: 2.1,
    riseEase: 2.2,
    // Arriving and leaving. A drop pops in over `drop.time`, overshooting its
    // size and spinning down into its idle turn; a pickup lifts `take.rise` at
    // the player, winding up and shrinking away over `take.time`.
    drop: { time: 0.45, spin: 7 },
    take: { time: 0.3, rise: 2.2, spin: 11 },
    bob: 0.18,
    bobRate: 1.7,
    spin: 1.3,
    reach: 3.2,
    droneScale: 0.85,
    color: 0x62ff9d,
    emissive: 0x14c65c,
    halo: { size: 3, color: 0xa6ffc7, opacity: 0.7, pulse: 0.1, pulseRate: 2.4 },
    pool: { size: 5, color: 0x4dff97, opacity: 0.45, pulse: 0.08, pulseRate: 1.7 },
    beam: { radius: 1.25, flare: 1.5, height: 7, color: 0x58ffa2,
            opacity: 0.34, pulse: 0.22, pulseRate: 1.5, spin: 0.4 },
    arrow: { dist: 3.6, y: 0.62, size: 1, color: 0x7dffb4 },
  },
  // Loot a wave leaves on the floor. There is no magnet on it the way there is
  // on a coin: an item sits where it fell and is taken by walking onto it, so
  // going for one is a decision made under fire rather than a reward that
  // catches up with you. `perWave` is a budget rolled fresh for every wave.
  items: {
    chance: 0.03,
    perWave: [1, 2],
    // A wave may keep its own purse. The last one of a sector is a long fight
    // whose boss calls up brood that pays nothing, so the floor makes up for it.
    byWave: { 15: [6, 8] },
    // From `from` on the floor pays more: `count` at `from`, and `step` more of
    // them every `every` waves after it. A wave named in `byWave` still wins.
    late: { from: 16, every: 3, count: [3, 4], step: 1 },
    maxOut: 2,
    // Middle to middle, and a little more than the two bodies: a step wide of an
    // item still takes it, so a pickup is never a thing you have to aim at while
    // something is chasing you. Nothing like the coin magnet — an item is walked
    // to, and this is only the grace on arriving.
    touch: 3.5,
    // Ground an item may be left on: `apart` from the next one, `clear` of any
    // wall it would hide behind, and `rim` inside the arena's edge. `tries` is
    // how many rings out from the kill it will look before giving up on one.
    apart: 3,
    clear: 2,
    rim: 3.5,
    tries: 4,
    // What an effect wears while it runs: a column of light round the player,
    // in the colour of the item that started it. `beat` is how fast it breathes
    // and `cap` how far over the head it stands.
    aura: { radius: 1.35, cap: 1.2, glow: 0.1, rim: 0.26, beat: 3.2, swell: 0.05 },
    // The ground a field item has covered, drawn round the player it is carried
    // by: one soft wash out to its own reach, breathing slowly so it reads as
    // running rather than painted on.
    field: { fill: 0.16, y: 0.045, beat: 2.4, swell: 0.03 },
    // The pointer to the nearest one, borrowed from the boss's drop for the same
    // reason: what you have to walk to is off screen more often than not. It is
    // put away once you are within `near` of the thing itself.
    arrow: { dist: 3.2, y: 0.62, size: 0.8, near: 7 },
    // What an item the catalog marks wears on top of all that: a wider column,
    // a bigger halo and a swell of its own on `rate`, and a pointer that
    // outranks every other drop on the floor however close they are.
    mark: { halo: 1.3, beam: 1.25, swell: 0.16, rate: 6.5 },
    // Both are the middle of the body, and it stands `model.size` tall: much
    // below half of that at rest and its foot is through the floor.
    rest: 0.75,
    hover: 1.3,
    riseEase: 2.2,
    // Arriving and leaving. A drop pops in over `drop.time`, overshooting its
    // size and spinning down into its idle turn; a pickup lifts `take.rise` at
    // the player, winding up and shrinking away over `take.time`.
    drop: { time: 0.45, spin: 7 },
    take: { time: 0.3, rise: 2.2, spin: 11 },
    bob: 0.18,
    bobRate: 1.9,
    // The body that lies on the floor: a real thing that takes the sun and
    // throws a shadow, turning where it fell. `size` is how tall it stands
    // whatever shape the catalog gives it, so every item is the same weight of
    // thing on the ground.
    model: { size: 1.2, emissive: 0.45 },
    spin: 0.9,
    // Everything wears the item's own colour: what is lying there is legible
    // from across the arena before the card ever names it.
    halo: { size: 6.4, opacity: 0.8, pulse: 0.12, pulseRate: 2.6 },
    // The column round it. `bands` is how many rungs of light are in the tube
    // at once and `scroll` how fast they climb it.
    // Wider than the icon and taller than it rides, so the item is inside the
    // column rather than wearing it as a belt.
    beam: { radius: 2.2, height: 5, opacity: 0.5, pulse: 0.16, pulseRate: 1.6,
            spin: 0.7, bands: 2, scroll: 0.42 },
  },
  payout: {
    trips: 16,
    lead: 0.16,
    spacing: 0.05,
    flight: 0.45,
    throw: 430,
    arc: 110,
    jitter: 18,
    roll: 20,
    fill: 0.42,
    bankFlight: 0.5,
    bankFade: 0.3,
    pop: 0.22,
    popEase: 11,
    chime: { rate: 0.98, rise: 0.55, gain: 0.7 },
  },
  // `horizon` is how far the wave board reads ahead of the mission: the waves
  // past the last one cleared are shown locked rather than left out.
  // Once it is cleared the bench stops running out: the modules the catalog
  // marks `endless` keep selling levels for ever, at the same price step and a
  // flat `per` a level on the one number they are bought for.
  mission: { waves: 10, horizon: 15, rewards: { 10: 'key', 15: 'drone' },
             endless: { per: 0.115 } },
  // The drone the mission has not paid out yet, flown once across the end of the
  // last mission wave so the objective on the screen after it is a machine
  // rather than a word. Nothing here joins the flight the player owns: the scene
  // flies its own prop and takes it away again.
  // `stand` is how far out it holds while it shoots, `eye` where it comes down
  // to speak, and `lead` how far beyond both it enters and leaves.
  flyby: {
    hold: 0.2,
    ease: 2.6,
    arrive: 0.8,
    scale: 1,
    high: 13,
    lead: 16,
    stand: 8.5,
    eye: 2.6,
    turn: 5.5,
    zoom: 0.74,
    shots: 12,
    shotGap: 0.075,
    shotSpread: 5.5,
    shotShake: 0.13,
    shotRange: 15,
    glow: { color: 0x7dd3fc, size: 1.9 },
    times: { in: 1.5, strafe: 1.15, hover: 2.1, out: 1.1, back: 1.1 },
  },
  // How the health bar grows with the bar behind it. At the health a run starts
  // on it is the width the stylesheet gives it, and at `full` it is as wide as
  // the screen allows; `curve` is how it gets there, a root rather than a line
  // so the first upgrades are worth looking at and the last ones still have
  // somewhere to go.
  hpBar: { full: 5000, curve: 0.5 },
  // The whole arena on a disc in the corner, drawn only once the augur is deep
  // enough to have earned it. Every measure is in CSS pixels; how big the disc
  // is drawn belongs to the stylesheet, and `size` is only what is assumed if
  // the canvas cannot be measured yet.
  minimap: {
    size: 168,
    inset: 7,
    every: 0.05,
    ground: 'rgba(6,12,17,.62)',
    ring: 'rgba(125,211,252,.55)',
    ringWidth: 1.5,
    wall: 'rgba(148,163,178,.45)',
    bugSize: 1.6,
    bossSize: 4,
    drone: '#7fd4ff',
    droneSize: 2,
    padColor: '#62ff9d',
    padSize: 3,
    player: { color: '#ffffff', nose: 6, tail: 4 },
  },
  story: {
    rate: 34,
    perKey: 2,
    lineGap: 0.45,
    // Pitch jitter on the keystroke, so a line of them reads as a machine typing
    // rather than one sample on repeat.
    keyDetune: 0.16,
    // Only reached when a sample failed to load.
    synth: {
      tick: { freq: 470, spread: 110, dur: 0.02, gain: 0.025 },
      line: { freq: 660, type: 'square', dur: 0.06, gain: 0.04, slide: 180 },
    },
  },
  // Which elements speak, and what they fall back to if a sample never loaded.
  // Anything not listed here is silent on purpose: the tree's nodes have a chime
  // and a refusal of their own, and the developer panels are tools.
  ui: {
    // The rack's slots answer like buttons, so they are delegated like buttons:
    // hovering one and picking a gun up out of it need nothing of their own.
    selector: '.btn, .btn-fullscreen, #mod-stats-tab, #btn-refresh, #btn-credits, .gun-slot, .wp-wave, .wp-deep-card',
    synth: {
      hover: { freq: 540, type: 'square', dur: 0.03, gain: 0.02 },
      click: { freq: 320, type: 'square', dur: 0.1, gain: 0.05, slide: 300 },
      treeHover: { freq: 720, type: 'square', dur: 0.02, gain: 0.015 },
      treeBuy: { freq: 420, type: 'square', dur: 0.12, gain: 0.05, slide: 260 },
      deny: { freq: 180, type: 'square', dur: 0.07, gain: 0.04 },
      gunArrive: { freq: 300, type: 'square', dur: 0.2, gain: 0.06, slide: 720 },
      travelTick: { freq: 470, type: 'square', dur: 0.06, gain: 0.035, slide: 170 },
      // The card arriving, and the same card dropping back into the strip: one
      // rises into the room, the other falls into its slot.
      travelCard: { freq: 300, type: 'square', dur: 0.28, gain: 0.055, slide: 620 },
      travelFly: { freq: 780, type: 'square', dur: 0.34, gain: 0.05, slide: -560 },
      travelOpen: { freq: 240, type: 'square', dur: 0.34, gain: 0.06, slide: 820 },
      travelDone: { freq: 720, type: 'square', dur: 0.12, gain: 0.045, slide: 340 },
      // The bench re-seating on the sector picked.
      sectorGo: { freq: 220, type: 'square', dur: 0.2, gain: 0.055, slide: 300 },
      // The seal on the sector ahead giving, and then giving way.
      sectorCrack: { freq: 150, type: 'square', dur: 0.16, gain: 0.055, slide: -60 },
      sectorOpen: { freq: 190, type: 'square', dur: 0.5, gain: 0.07, slide: 700 },
    },
  },
  // A gun bought at the bench flies from the node that paid for it into the slot
  // it will be carried in. The rack sits in a corner the player has no reason to
  // be watching when a purchase lands, so the gun goes there in front of them.
  gunFly: { flight: 0.85, arc: 170, swell: 0.5, spin: 0.5 },
  // The beat that introduces travel, in seconds from the start of it. The sector
  // is dealt to the middle of the screen at `scale`, held until `hold`, and is
  // home by `land` — `fly` is the trip itself, and the two have to agree. The
  // rest of the bar comes on a card every `card` behind it, and the board's
  // button opens last, since it is the half the player acts on.
  travel: { scale: 3.4, hold: 1.25, fly: 0.7, land: 1.95, card: 0.1,
            unlock: 2.65, badge: 3.2, end: 4.15 },
  // A sector opening, in seconds from the start of it. The seal strains first,
  // gives at `open`, and the card is left alone from `end`. Read against the
  // card's own animations in travel.css, which have to agree with these.
  sectorOpen: { open: 0.55, end: 2.2 },
  reveal: { frame: 0.35, hold: 0.32, settle: 0.12, tree: 0.45,
            repair: { read: 0.55, hold: 0.9 } },
  menu: {
    bug: 'tank',
    heroAt: [0, 0], bugAt: [4.4, 2.2],
    lookAt: [2.0, 1.15, 1.0],
    dist: 9.5, height: 3.1, bearing: -0.55,
    // Where the pair sit in the frame, in clip space: left of centre, and the
    // panel takes the rest. Below `wideAt` the layout stacks and they centre.
    at: [-0.42, -0.08], wideAt: 1.1,
    drift: { rate: 0.22, sweep: 0.16, lift: 0.35 },
    idle: { sway: 0.06, swayRate: 0.8, lift: 0.03 },
  },
  damageNumbers: {
    enabled: true,
    max: 40,
    life: 0.8,
    rise: 2.2,
    drift: 1.4,
    spread: 0.55,
    size: 15, killSize: 23,
  },
  // preload pulls the whole playlist down in the background once the first
  // track is playing. It is 225MB of wav, so it is a real cost per visitor.
  music: { play: 0.55, menu: 0.5, specialLift: 1.2, fadeRate: 2.2, preload: true },
  // In world units at the default zoom, and scaled with the camera from there.
  // `max` reaches past the screen corner on purpose: the falloff is quadratic,
  // so a source sitting exactly on the edge of the range is already silent.
  sfxFalloff: { ref: 5, max: 75, panWidth: 28, pan: 0.75 },
};
