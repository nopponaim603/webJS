---
title: "🧱 Technical Note: Dungeon Floor Generation"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
  - tiny-dungeon-roguelike
---

# 🧱 Technical Note: Dungeon Floor Generation

**Game:** Tiny Dungeon Survivor (`tiny-dungeon-roguelike`)
**File:** [`public/games/tiny-dungeon-roguelike/game.js`](../../../../public/games/tiny-dungeon-roguelike/game.js)
**Function:** `MainGameScene.createDungeonArena(mapW, mapH)`
**Last Updated:** 2026-07-28

---

## 1. Overview

The dungeon floor is not a hand-painted tilemap — it's generated procedurally every time `MainGameScene.create()` runs, by tiling the arena in a grid and stamping either a wall tile (border) or one of several floor tile variants (interior) at each cell.

Two problems existed in the original implementation and were fixed in this pass:

1. **Visible repeating pattern** — floor variant was chosen with a deterministic formula based on cell coordinates, producing a diagonal-stripe pattern that read as "too orderly" for a natural dungeon floor.
2. **Uncontrolled variant ratio** — once randomized, the naive fix picked all 3 floor tiles with equal (~33%) probability, which still looked noisy/busy rather than like a floor with occasional wear/detail tiles.

Both are addressed by combining a **seeded PRNG** with a **weighted tile pick**.

---

## 2. Grid Layout

```js
createDungeonArena(mapW, mapH) {
    const tileSize = 16 * 2; // 16px source tile, rendered at 2x scale = 32px
    const cols = Math.ceil(mapW / tileSize);
    const rows = Math.ceil(mapH / tileSize);
    ...
}
```

- The arena is `MAP_WIDTH × MAP_HEIGHT` = `1400 × 1400` world units.
- Each tile occupies a `32×32` world-unit cell (16px source art scaled 2x).
- The outer ring (`r === 0 || r === rows-1 || c === 0 || c === cols-1`) is always rendered as **Wall** (`frame 14`) to form the arena border that `physics.world.setBounds` and `player.setCollideWorldBounds` rely on.
- Every interior cell gets a **floor tile** chosen by the algorithm below.

---

## 3. Seeded PRNG (mulberry32)

```js
function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
```

- A minimal, fast 32-bit seeded generator returning floats in `[0, 1)`.
- Given the same seed, it always produces the same sequence of numbers — this makes the floor layout **reproducible**, unlike `Math.random()` which cannot be replayed or debugged.
- The seed is generated once per run in `MainGameScene.init(data)`:

```js
this.mapSeed = data.mapSeed || ((Math.random() * 0xFFFFFFFF) >>> 0);
```

  - Passing an explicit `mapSeed` into `scene.start('MainGameScene', { heroId, mapSeed })` will regenerate the exact same floor layout — useful for bug reports or sharing a specific dungeon layout.
  - Omitting it (the default gameplay path) rolls a fresh random seed every run.

---

## 4. Weighted Floor Tile Selection

```js
const rng = mulberry32(this.mapSeed);

const mainFloor = 48;
const variantFloors = [42, 49];
const variantChance = 0.07; // ~7% combined chance for a variant tile

const pickFloorFrame = () => {
    if (rng() < variantChance) {
        return variantFloors[Math.floor(rng() * variantFloors.length)];
    }
    return mainFloor;
};
```

| Tile | Frame | Role | Approx. Frequency |
|---|:---:|---|:---:|
| Main Dungeon Floor | 48 | Base floor, should dominate the arena | ~93% |
| Carved Pattern Floor | 42 | Detail/variety tile | ~3.5% |
| Dark Cobblestone Floor | 49 | Detail/variety tile | ~3.5% |

The two-step roll (`rng() < variantChance`, then a second `rng()` to pick which variant) keeps the **combined** variant probability locked to a single tunable constant (`variantChance`) instead of splitting probability mass evenly across all tiles. This guarantees the floor reads as "one consistent floor material with occasional detail," rather than a checkerboard of equally-common tiles.

To change the ratio, only `variantChance` needs to change — e.g. `0.05` for a cleaner floor, `0.10` for a busier one.

---

## 5. Why Not Just `Math.random()`?

Using `Math.random()` directly would solve the "too orderly" problem but not reproducibility — every playthrough (and every bug report) would show a different, non-replayable floor. Seeding a PRNG with a stored `mapSeed` keeps the benefits of both:

- **Looks random** to the player (no visible grid pattern).
- **Is deterministic** for a given seed (debuggable, shareable, testable).

---

## Related Documents
- [Game Spec](spec.md)
- [Project Index](../../index.md)
