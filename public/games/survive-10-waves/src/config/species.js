export const BUG_TYPES = [
  { key: 'grunt',   hp: 34,  speed: 4.2, radius: 0.85, scale: 1.00, damage: 9,  color: 0x7cc576, minWave: 1, weight: 10, voice: 1.00, killSfx: 'kill_grunt' },
  { key: 'runner',  hp: 22,  speed: 8.0, radius: 0.62, scale: 0.72, damage: 6,  color: 0xe0c766, minWave: 2, weight: 7, voice: 1.06, killSfx: 'kill_runner',
    turnRate: 11, leap: 'pounce' },
  { key: 'tank',    hp: 130, speed: 2.5, radius: 1.45, scale: 1.7, damage: 22, color: 0x8f6ad6, minWave: 3, weight: 1, maxPerHole: 1, voice: 0.94, killSfx: 'kill_tank', coins: 3,
    hop: { dist: 4, time: 3.0, align: 0.45 }, turnRate: 2.8, charge: 'rush', fling: true },
  { key: 'spitter', hp: 48,  speed: 5.2, radius: 0.95, scale: 1.15, damage: 13, color: 0xe2705c, minWave: 4, weight: 4, voice: 1.02, killSfx: 'kill_spitter', ranged: true, tint: [0.55, 1.45, 0.42] },
  { key: 'brooder', hp: 44,  speed: 6.8, radius: 0.9, scale: 1.05, damage: 8,
    color: 0x8fa8cc, minWave: 5, weight: 2, voice: 1.04, killSfx: 'kill_spitter',
    ranged: true, attack: 'brood', projectile: 'boomerang',
    hop: { dist: 6, time: 2.2, align: 0.25 }, turnRate: 9,
    tint: [0.55, 0.82, 1.75] },
  { key: 'bomber',  hp: 26,  speed: 9.4, radius: 0.66, scale: 0.80, damage: 5,  color: 0xff5a3c, minWave: 6, weight: 1, voice: 1.12, killSfx: 'kill_runner',
    tint: [2.2, 0.42, 0.34],
    hop: { dist: 2.5, time: 1.2, align: 0.32 }, turnRate: 12,
    // It does not wait to be shot: close enough for the blast to reach the
    // player and it lights itself. See bug/fuse.js. The radius is set from the
    // top of the ladder rather than the bottom: it rides `evolve.range`, which
    // is 2.08 by level 10, and 11u there is the circle the arena is built for.
    fuse: true,
    burst: { radius: 5.29, damage: 26, edge: 0.35, knock: 12 },
    glow: { color: 0xff2a14, size: 1.35, rate: 7.5, min: 0.35 } },
  { key: 'vulture',  hp: 30,  speed: 13, radius: 0.7, scale: 0.9, damage: 16, color: 0xd8a83c, minWave: 7, weight: 1, voice: 1.22, killSfx: 'kill_runner', coins: 2,
    // Modelled, and posed by the Flying and Dive clips it ships with. Sized by
    // wingspan rather than the usual footprint fit: a bird is its wings.
    // Nose down 20 degrees: the modelled bird's neutral pose looks up, and level
    // flight should not read as a climb.
    fly: true, turnRate: 5, model: 'models/vulture.glb', wingspan: 5.6, modelTilt: 0.349,
    // Shipped at 0.56 roughness, which reads as wet plastic beside the rest of
    // the arena. Matched to the feathers the procedural bird wore.
    surface: { roughness: 0.92, metalness: 0 } },
  { key: 'impaler', hp: 62, speed: 4.6, radius: 1.0, scale: 1.25, damage: 8,
    color: 0x7d5aa8, minWave: 8, weight: 2, voice: 0.96, killSfx: 'kill_spitter', coins: 2,
    // Everything it does comes up out of the floor, which is no use against
    // something flying over it: it does not waste a pattern on a machine.
    ignoresDrones: true,
    ranged: true, attack: 'spikes', projectile: 'spikes',
    hop: { dist: 4, time: 2.0, align: 0.3 }, turnRate: 7,
    tint: [1.25, 0.72, 1.65] },
  // Sized by body length rather than footprint, and kept out of the wave roll
  // until there is an encounter to field it: debug spawns it.
  { key: 'boss', hp: 13800, speed: 5.5, radius: 5.8, scale: 1.0, damage: 27,
    color: 0x6f7fd8, minWave: 99, weight: 0, maxPerHole: 1, voice: 0.78,
    killSfx: 'kill_tank', coins: 12,
    // Stated a level at a time rather than climbed off the shared table: a boss
    // is balanced against the fight it is, and the mobs' curve is far too steep
    // to carry it from one encounter to the next. `hp` above is level 1 of this.
    hpBy: [13800, 34600, 86600, 220000, 560000, 1170000,
           2000000, 3420000, 5850000, 10000000],
    // Its size is read the same way, off the shared curve until the top: the
    // grown boss is trimmed rather than climbing to the 2.40 the table hands out.
    sizeBy: [1, 1.10, 1.21, 1.34, 1.48, 1.63, 1.79, 1.98, 2.18, 2.04],
    length: 13, turnRate: 1.6, throughWalls: true, stomp: true, kit: true, finale: true,
    slam: true, smallSlam: true, spill: true, smallSpill: true,
    hurl: true, toss: true,
    charge: ['bossrush', 'acidrush'],
    hop: { dist: 10, time: 2.2, align: 0.7, wander: 0.1 },
    tint: [0.72, 0.86, 1.35],
    skin: { opacity: 0.4, seed: 47, glow: { color: 0x6cf2ff, intensity: 1.3 } } },
];
