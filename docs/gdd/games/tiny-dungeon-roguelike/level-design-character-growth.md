# 📈 Level Design: Player Character Growth per Class

**Game:** Tiny Dungeon Survivor (`tiny-dungeon-roguelike`)
**File:** [`public/games/tiny-dungeon-roguelike/game.js`](../../../../public/games/tiny-dungeon-roguelike/game.js)
**Key sections:** `HERO_CLASSES`, `UPGRADE_POOL`, `MainGameScene.levelUp()`, `.fireMeleeWeapon()`, `.fireFireballWeapon()`, `.fireDartsWeapon()`, `.fireLightningWeapon()`, `.performMeleeAttack()`, `.updateOrbitBlades()`
**Last Updated:** 2026-07-28

---

## 1. Design Goal

All three classes level up through **one shared growth engine** — the same XP curve, the same pool of 8 upgrade cards, the same random-3-of-8 offer at every level-up. Classes do **not** get class-exclusive upgrades or a different XP curve.

Class identity instead comes from three levers layered on top of that shared engine:

1. **Different starting baseline** (`maxHp`, `speed` in `HERO_CLASSES`) — the flat bonuses from cards land on a different foundation per class.
2. **A free head start on one weapon** — each class begins at skill level 1 in its signature weapon, while the other two weapons start at 0 and must be drawn as upgrade cards from scratch.
3. **Each weapon type scales along a different axis** (coverage vs. single-target burst vs. spread vs. multi-target nuke) — so the same card pool grows each class in a different practical direction even though the numbers are class-agnostic.

---

## 2. Shared XP & Level Curve

```js
this.xpToNextLevel = 10;       // init()
// on level-up:
this.xp -= this.xpToNextLevel;
this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4);
```

Identical for every class — XP requirement grows ×1.4 per level, uncapped:

| Level-up | XP required | Cumulative XP |
|:---:|:---:|:---:|
| 1 → 2 | 10 | 10 |
| 2 → 3 | 14 | 24 |
| 3 → 4 | 19 | 43 |
| 4 → 5 | 26 | 69 |
| 5 → 6 | 36 | 105 |
| 6 → 7 | 50 | 155 |
| 7 → 8 | 70 | 225 |
| 8 → 9 | 98 | 323 |
| 9 → 10 | 137 | 460 |
| 10 → 11 | 191 | 651 |

Each level-up pauses `MainGameScene`, launches `UpgradeModalScene`, and offers **3 random cards** drawn from the 8-card `UPGRADE_POOL` (`Phaser.Utils.Array.Shuffle([...UPGRADE_POOL]).slice(0, 3)`) — every class draws from the exact same deck.

Note: `this.level` also feeds directly into monster difficulty (population cap, enemy HP, swarm frequency) — see [Level Design: Monster Spawning & Difficulty Pacing](level-design-monster-spawning.md). Leveling up faster makes the *player* stronger but also raises the threat curve, so growth and difficulty are coupled by design.

---

## 3. Universal Upgrade Pool (class-agnostic)

| Card | Effect | Stacking Formula | Notes |
|---|---|---|---|
| 🌀 Cleave Slash | `skills.melee += 1` | Linear, uncapped | See §4.1 |
| 🔥 Fireball Spell | `skills.fireball += 1` | Linear, uncapped | See §4.2 |
| 🗡️ Poison Darts | `skills.darts += 1` | Linear, uncapped | See §4.3 |
| ⚔️ Orbiting Blades | `skills.orbit += 1` | Linear, uncapped | See §4.4 |
| ⚡ Chain Lightning | `skills.lightning += 1` | Linear, uncapped | See §4.5 |
| ❤️ Max HP +30% | `maxHp += 30`, heal `+30` instantly | Flat, additive per pick | Larger relative gain for low-HP classes |
| 👟 Movement Speed +20% | `speedBonus += 0.2` (starts at `1.0`) | Additive to multiplier | 3rd pick → `speedBonus = 1.6` (+60% over base, not compounding) |
| 💥 Attack Power +25% | `damageMult += 0.25` (starts at `1.0`) | Additive to multiplier | Applies to **all** weapons the player owns, not just the starting one |
| 🧛 Vampiric Drain | `vampireChance += 0.15` | Additive probability | Rolled once per kill in `damageEnemy()` |

`damageMult` and `speedBonus` are shared multipliers applied at read-time (`proj.damage = BASE * this.player.damageMult`, `currentSpeed = this.player.speed * this.player.speedBonus`) — a single `damage_boost` pick buffs every weapon the player has simultaneously, which matters once a class has drawn a second or third weapon card (see §5).

---

## 4. Per-Weapon Scaling Curves

Each weapon's *skill level* (`player.skills.<weapon>`) increases by 1 per matching card drawn. Base damage constants already reflect the [class rebalance pass](spec.md#21-player-characters-ฮีโร่ผู้เล่น) (Knight/orbit ↑, Wizard/fireball ↑, Rogue/darts ↓ per-hit + more projectiles).

### 4.1 Melee Slash — Knight's signature (`performMeleeAttack`)

```js
const meleeRange = 70 + (this.player.skills.melee - 1) * 15; // reach grows per level
const arcHalfWidth = Phaser.Math.DegToRad(65);                // fixed 130° total cone
const facingAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearestEnemy.x, nearestEnemy.y);
this.damageEnemy(enemy, 30 * this.player.damageMult); // per enemy inside range + cone, every 800ms tick
```

The swing auto-aims at whatever `getNearestEnemy()` returns (same helper Fireball uses), then hits **every** enemy simultaneously within `meleeRange` **and** inside a fixed 130° cone centered on that direction — no per-enemy cooldown bookkeeping, unlike the old Orbiting Blades design.

| Skill Level | Range | Cone Width | Dmg/hit (all enemies in cone) |
|:---:|:---:|:---:|:---:|
| 1 | 70px | 130° (fixed) | 30×`dmg` |
| 2 | 85px | 130° (fixed) | 30×`dmg` |
| 3 | 100px | 130° (fixed) | 30×`dmg` |
| 4 | 115px | 130° (fixed) | 30×`dmg` |

**Growth axis: reach, not width or per-hit damage.** The 130° cone angle is a fixed characteristic of the attack (per design brief), so each level instead extends `meleeRange` by `15px` — letting the Knight threaten a wider ring of close-quarters space as levels stack, while every enemy caught in the swing takes the same flat `30 × damageMult` regardless of how many are hit. This keeps Knight's identity as "safe to stand in the middle of a crowd" without needing Orbiting Blades' continuous-collision model.

### 4.2 Fireball Spell — Wizard's signature (`fireFireballWeapon`)

```js
for (let i = 0; i < this.player.skills.fireball; i++) { /* one shot, 120ms apart */ }
proj.damage = 65 * this.player.damageMult;
```

All shots in a volley target whatever `getNearestEnemy()` returns at cast time. Unlike the other three weapons, Fireball has its **own dedicated timer at a slower 1400ms cadence** (`fireFireballWeapon`, vs. the 800ms shared by Melee/Lightning and the 400ms of Darts) — this is the mechanical expression of "ยิงแรงแต่ยิงช้า" (hits hard, fires slow).

| Skill Level | Shots/volley | Dmg/shot | Dmg/volley (same target) | Sustained DPS (single target) |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 65×`dmg` | 65×`dmg` | ~46.4×`dmg`/s |
| 2 | 2 | 65×`dmg` | 130×`dmg` | ~92.9×`dmg`/s |
| 3 | 3 | 65×`dmg` | 195×`dmg` | ~139.3×`dmg`/s |
| 4 | 4 | 65×`dmg` | 260×`dmg` | ~185.7×`dmg`/s |

**Growth axis: single-target burst.** Every level stacks the *entire* volley onto the same nearest enemy, so Fireball scales as pure focused burst — fitting the Wizard's glass-cannon identity (lowest HP baseline, longest cooldown, biggest single hit): a Wizard commits to a slow windup, then deletes a priority target before it closes the distance.

### 4.3 Poison Darts — Rogue's signature (`fireDartsWeapon`)

```js
const dartCount = 4 + (this.player.skills.darts - 1) * 2; // full-circle spread
proj.damage = 10 * this.player.damageMult;
this.time.delayedCall(550, () => proj.destroy()); // short lifetime = short range
```

Darts have their **own dedicated timer at a faster 400ms cadence** (`fireDartsWeapon`, twice as often as the 800ms shared by Melee/Lightning) and a short `550ms` projectile lifetime — at the dart's `220px/s` travel speed that caps effective range at roughly **120px**, about a third of the old 330px range. This is the mechanical expression of "โจมตีเร็วแต่ระยะสั้น" (attacks fast, but short range).

| Skill Level | Darts/volley | Dmg/dart | Total volley dmg (if all connect) | Effective range |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 4 | 10×`dmg` | 40×`dmg` | ~120px |
| 2 | 6 | 10×`dmg` | 60×`dmg` | ~120px |
| 3 | 8 | 10×`dmg` | 80×`dmg` | ~120px |
| 4 | 10 | 10×`dmg` | 100×`dmg` | ~120px |

**Growth axis: spread/crowd poke, traded against range.** Darts fire in a full 360° ring at high frequency, so more levels mean a denser ring rather than more damage on any one enemy — but every dart fizzles out close to the Rogue, so the payoff only lands if the Rogue's speed advantage is used to stay inside that short bubble. This pairs with Rogue's highest movement speed, encouraging a kite-through-the-middle-of-a-crowd playstyle rather than either Knight's reach-based Melee Slash or Wizard's snipe-from-max-range.

### 4.4 Orbiting Blades — universal pickup, no starting class (`updateOrbitBlades`)

```js
const orbitCount = this.player.skills.orbit;   // 1 blade per skill level
this.damageEnemy(enemy, 20 * this.player.damageMult); // per hit, 400ms cooldown PER ENEMY
```

Since the Knight's signature moved to Melee Slash (§4.1), Orbiting Blades is now a card any class can draw from scratch — a continuous, always-on ring of blades rather than a periodic swing.

| Skill Level | Blades | Dmg/hit | Per-target cap (dmg per 400ms cd) |
|:---:|:---:|:---:|:---:|
| 1 | 1 | 20×`dmg` | 20×`dmg` |
| 2 | 2 | 20×`dmg` | 20×`dmg` (unchanged — see note) |
| 3 | 3 | 20×`dmg` | 20×`dmg` |
| 5 | 5 | 20×`dmg` | 20×`dmg` |

**Important growth nuance**: the 400ms hit cooldown (`enemy.lastOrbitHitTime`) is tracked **per enemy**, not per blade — so adding blades does *not* multiply damage against a single target standing still. What it buys instead is **angular coverage**: with `N` blades spaced `2π/N` apart, more enemies around the player get caught in a swing simultaneously — a full 360° passive alternative to Melee Slash's directional, auto-aimed 130° swing.

### 4.5 Chain Lightning — universal pickup, no starting class (`fireLightningWeapon`)

```js
const targetCount = Math.min(this.player.skills.lightning * 2, activeEnemies.length);
this.damageEnemy(enemy, 40 * this.player.damageMult); // per bolt, instant
```

| Skill Level | Random targets hit | Dmg/bolt | Total dmg (if enough enemies present) |
|:---:|:---:|:---:|:---:|
| 1 | 2 | 40×`dmg` | 80×`dmg` |
| 2 | 4 | 40×`dmg` | 160×`dmg` |
| 3 | 6 | 40×`dmg` | 240×`dmg` |

No class starts with Lightning — it must be drawn as a card by any of the three, at which point it becomes the highest raw total-damage weapon per level (multi-target nuke), available equally to all classes as a build-defining pickup.

---

## 5. Class Growth Arcs

Because the upgrade pool is shared, "build diversity" comes from which cards a run happens to offer and which the player chooses — any class *can* end up wielding all four weapons. The table below describes the growth path each class's starting baseline naturally leans toward, not a hard restriction.

| Class | Starting Baseline | Natural Growth Priority | Why |
|---|---|---|---|
| **Knight** | 150 HP / 95 spd, Melee Lv1 | 🌀 Cleave Slash + ❤️ HP + 💥 Dmg | Melee Slash rewards standing in a crowd within its 130° cone; more HP lets the Knight tank longer to make that reach matter, and `damageMult` buffs the swing directly |
| **Wizard** | 65 HP / 125 spd, Fireball Lv1 | Fireball + 💥 Dmg + ❤️ HP | Fireball's growth is pure single-target burst — `damageMult` scales it hardest of any weapon; HP is a safety net for the lowest baseline in the game |
| **Rogue** | 100 HP / 165 spd, Darts Lv1 | Darts + 👟 Speed + 🧛 Vampire | Darts' spread growth pairs with the fastest movement speed to hit-and-run through packs; Vampiric Drain sustains a playstyle built on staying in contact briefly rather than tanking or kiting at max range |

A run that draws unfavorable cards (e.g. a Wizard offered no `damage_boost` for several levels) is expected — the shared pool means no class is guaranteed its "ideal" curve every run, which is the intended roguelite variance.

---

## 6. Tuning Reference

| Constant | Location | Current Value | Effect of Increasing |
|---|---|:---:|---|
| XP curve growth rate | `levelUp()` | `×1.4` | Slower/faster leveling pace over a run |
| Base XP requirement | `init()` | `10` | Shifts the whole curve up/down uniformly |
| `hp_boost` amount | `UPGRADE_POOL` | `+30` flat | Bigger relative gain for low-HP classes (Wizard) |
| `speed_boost` amount | `UPGRADE_POOL` | `+0.2` to `speedBonus` | Rogue benefits most in absolute px/s terms (highest base speed) |
| `damage_boost` amount | `UPGRADE_POOL` | `+0.25` to `damageMult` | Scales hardest on high base-damage weapons (Fireball, Lightning) |
| `vampire_boost` amount | `UPGRADE_POOL` | `+0.15` chance | Sustain scales with kill rate, favors spread weapons (Darts, Lightning) |
| Melee range per level | `performMeleeAttack` | `70 + (lvl-1)*15` px | Bigger threat radius per level, cone width unaffected |
| Melee cone width | `performMeleeAttack` | `130°` (fixed) | Wider = easier to hit spread-out enemies; not currently level-scaled |
| Melee fire rate | timer in `create()` | `800ms` | Faster = more frequent crowd cleaves |
| Fireball fire rate | timer in `create()` | `1400ms` | The "slow" half of Wizard's slow/hard trade-off — lower = less of a glass-cannon burst weapon |
| Fireball dmg/shot | `fireFireballWeapon` | `65` | The "hard" half of Wizard's slow/hard trade-off |
| Fireball stagger | `fireFireballWeapon` | `120ms` between shots | Visual/timing only, does not change total volley damage |
| Darts fire rate | timer in `create()` | `400ms` | The "fast" half of Rogue's fast/short-range trade-off — higher = less spammy |
| Darts projectile lifetime | `fireDartsWeapon` | `550ms` (→ ~120px range at 220px/s) | The "short range" half of Rogue's trade-off — higher = darts reach further |
| Darts base count | `fireDartsWeapon` | `4 + (lvl-1)*2` | Denser ring per level |
| Orbit per-enemy cooldown | `updateOrbitBlades` | `400ms` | Shorter = more blades start mattering for single-target DPS too |
| Lightning fire rate | timer in `create()` | `800ms` | Unchanged — not part of this pass |
| Lightning targets/level | `fireLightningWeapon` | `lvl * 2` | More simultaneous nuke targets per level |

---

## Related Documents
- [Game Spec](spec.md)
- [Technical Note: Dungeon Floor Generation](technical-floor-generation.md)
- [Level Design: Monster Spawning & Difficulty Pacing](level-design-monster-spawning.md)
- [Project Index](../../index.md)
