# 📈 Level Design: Player Character Growth per Class

**Game:** Tiny Dungeon Survivor (`tiny-dungeon-roguelike`)
**File:** [`public/games/tiny-dungeon-roguelike/game.js`](../../../../public/games/tiny-dungeon-roguelike/game.js)
**Key sections:** `HERO_CLASSES`, `UPGRADE_POOL`, `MainGameScene.levelUp()`, `.fireMeleeWeapon()`, `.fireFireballWeapon()`, `.fireDartsWeapon()`, `.fireLightningWeapon()`, `.fireKnifeWeapon()`, `.performMeleeAttack()`, `.updateOrbitBlades()`, `.damageEnemy()`
**Last Updated:** 2026-07-28

---

## 1. Design Goal

All three classes level up through the same XP curve and draw from the same 4 stat-boost cards (HP/Speed/Damage/Vampire) — but **weapon cards are class-exclusive**: each class has a locked pair of two weapons, and can never draw a weapon card belonging to another class. There is no cross-class hybridization; a Knight will never end up slinging Fireballs.

| Class | Locked Weapon Pair |
|---|---|
| **Knight** | 🌀 Cleave Slash (starting) + ⚔️ Orbiting Blades |
| **Wizard** | 🔥 Fireball Spell (starting) + ⚡ Chain Lightning |
| **Rogue** | 🔪 Critical Knife (starting) + 🗡️ Poison Darts |

Class identity comes from three levers:

1. **Different starting baseline** (`maxHp`, `speed` in `HERO_CLASSES`) — the flat bonuses from stat cards land on a different foundation per class.
2. **A free head start on one weapon, plus a guaranteed second** — each class begins at skill level 1 in its signature weapon, and its other weapon (starting at 0) is the *only* extra weapon card that will ever appear in its level-up offers — never diluted by, or competing against, the other four classes' weapon cards.
3. **The two weapons in a class's pair scale along deliberately different axes** (e.g. Knight's reach-based cone vs. always-on 360° ring; Wizard's slow-hard single-target nuke vs. instant multi-target nuke; Rogue's gambler's crit throw vs. fast-short-range spread) — so investing in "the other weapon" always feels like a distinct playstyle, not a numerical clone of the starting one.

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

Each level-up pauses `MainGameScene`, launches `UpgradeModalScene`, and offers **3 random cards**. The deck is filtered per class before shuffling:

```js
const availablePool = UPGRADE_POOL.filter(card => !card.classId || card.classId === mainScene.heroId);
const choices = Phaser.Utils.Array.Shuffle([...availablePool]).slice(0, 3);
```

Cards with no `classId` (the 4 stat boosts) are always eligible; cards with a `classId` only appear for the matching `heroId`. Each class therefore draws from a **6-card personal deck** (its 2 weapons + the 4 universal stat boosts), not the full 10-card pool.

Note: `this.level` also feeds directly into monster difficulty (population cap, enemy HP, swarm frequency) — see [Level Design: Monster Spawning & Difficulty Pacing](level-design-monster-spawning.md). Leveling up faster makes the *player* stronger but also raises the threat curve, so growth and difficulty are coupled by design.

---

## 3. Upgrade Pool: Class-Locked Weapons + Universal Stat Boosts

| Card | `classId` | Effect | Stacking Formula | Notes |
|---|:---:|---|---|---|
| 🌀 Cleave Slash | `knight` | `skills.melee += 1` | Linear, uncapped | See §4.1 |
| ⚔️ Orbiting Blades | `knight` | `skills.orbit += 1` | Linear, uncapped | See §4.4 |
| 🔥 Fireball Spell | `wizard` | `skills.fireball += 1` | Linear, uncapped | See §4.2 |
| ⚡ Chain Lightning | `wizard` | `skills.lightning += 1` | Linear, uncapped | See §4.5 |
| 🗡️ Poison Darts | `rogue` | `skills.darts += 1` | Linear, uncapped | See §4.3 |
| 🔪 Critical Knife | `rogue` | `skills.knife += 1` | Linear, uncapped | See §4.6 |
| ❤️ Max HP +30% | *(none)* | `maxHp += 30`, heal `+30` instantly | Flat, additive per pick | Universal. Larger relative gain for low-HP classes |
| 👟 Movement Speed +20% | *(none)* | `speedBonus += 0.2` (starts at `1.0`) | Additive to multiplier | Universal. 3rd pick → `speedBonus = 1.6` (+60% over base, not compounding) |
| 💥 Attack Power +25% | *(none)* | `damageMult += 0.25` (starts at `1.0`) | Additive to multiplier | Universal. Applies to **both** of the class's weapons at once |
| 🧛 Vampiric Drain | *(none)* | `vampireChance += 0.15` | Additive probability | Universal. Rolled once per kill in `damageEnemy()` |

`damageMult` and `speedBonus` are shared multipliers applied at read-time (`proj.damage = BASE * this.player.damageMult`, `currentSpeed = this.player.speed * this.player.speedBonus`) — a single `damage_boost` pick buffs both of the player's class-locked weapons simultaneously (see §5).

---

## 4. Per-Weapon Scaling Curves

Each weapon's *skill level* (`player.skills.<weapon>`) increases by 1 per matching card drawn. Base damage constants already reflect the [class rebalance pass](spec.md#21-player-characters-ฮีโร่ผู้เล่น) (Knight/orbit ↑, Wizard/fireball ↑, Rogue/darts ↓ per-hit + more projectiles). Every weapon below is now gated by `classId` (§3) — only the owning class will ever be offered its card.

### 4.1 Melee Slash — Knight's starting weapon (`performMeleeAttack`)

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

### 4.2 Fireball Spell — Wizard's starting weapon (`fireFireballWeapon`)

```js
for (let i = 0; i < this.player.skills.fireball; i++) { /* one shot, 120ms apart */ }
proj.damage = 65 * this.player.damageMult;
```

All shots in a volley target whatever `getNearestEnemy()` returns at cast time. Fireball has its **own dedicated timer at a slower 1400ms cadence** (`fireFireballWeapon`, vs. the 800ms baseline of Melee and the 400ms of Darts) — this is the mechanical expression of "ยิงแรงแต่ยิงช้า" (hits hard, fires slow).

| Skill Level | Shots/volley | Dmg/shot | Dmg/volley (same target) | Sustained DPS (single target) |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 65×`dmg` | 65×`dmg` | ~46.4×`dmg`/s |
| 2 | 2 | 65×`dmg` | 130×`dmg` | ~92.9×`dmg`/s |
| 3 | 3 | 65×`dmg` | 195×`dmg` | ~139.3×`dmg`/s |
| 4 | 4 | 65×`dmg` | 260×`dmg` | ~185.7×`dmg`/s |

**Growth axis: single-target burst.** Every level stacks the *entire* volley onto the same nearest enemy, so Fireball scales as pure focused burst — fitting the Wizard's glass-cannon identity (lowest HP baseline, longest cooldown, biggest single hit): a Wizard commits to a slow windup, then deletes a priority target before it closes the distance.

### 4.3 Poison Darts — Rogue's second weapon, starts at 0 (`fireDartsWeapon`)

```js
const dartCount = 4 + (this.player.skills.darts - 1) * 2; // full-circle spread
proj.damage = 10 * this.player.damageMult;
this.time.delayedCall(550, () => proj.destroy()); // short lifetime = short range
```

Darts have their **own dedicated timer at a faster 400ms cadence** (`fireDartsWeapon`, twice as often as the 800ms baseline of Melee) and a short `550ms` projectile lifetime — at the dart's `220px/s` travel speed that caps effective range at roughly **120px**, about a third of the old 330px range. This is the mechanical expression of "โจมตีเร็วแต่ระยะสั้น" (attacks fast, but short range).

| Skill Level | Darts/volley | Dmg/dart | Total volley dmg (if all connect) | Effective range |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 4 | 10×`dmg` | 40×`dmg` | ~120px |
| 2 | 6 | 10×`dmg` | 60×`dmg` | ~120px |
| 3 | 8 | 10×`dmg` | 80×`dmg` | ~120px |
| 4 | 10 | 10×`dmg` | 100×`dmg` | ~120px |

**Growth axis: spread/crowd poke, traded against range.** Darts fire in a full 360° ring at high frequency, so more levels mean a denser ring rather than more damage on any one enemy — but every dart fizzles out close to the Rogue, so the payoff only lands if the Rogue's speed advantage is used to stay inside that short bubble. This pairs with Rogue's highest movement speed, encouraging a kite-through-the-middle-of-a-crowd playstyle rather than either Knight's reach-based Melee Slash or Wizard's snipe-from-max-range.

### 4.4 Orbiting Blades — Knight's second weapon, starts at 0 (`updateOrbitBlades`)

```js
const orbitCount = this.player.skills.orbit;   // 1 blade per skill level
this.damageEnemy(enemy, 20 * this.player.damageMult); // per hit, 400ms cooldown PER ENEMY
```

Locked to `classId: 'knight'` — only Knight ever sees this card, and only Knight starts at `skills.orbit = 0` needing to draw it. It's the second half of Knight's kit alongside Melee Slash (§4.1): a continuous, always-on 360° ring rather than a periodic directional swing, giving the Knight a passive-coverage option distinct from Melee's active-aimed cone.

| Skill Level | Blades | Dmg/hit | Per-target cap (dmg per 400ms cd) |
|:---:|:---:|:---:|:---:|
| 1 | 1 | 20×`dmg` | 20×`dmg` |
| 2 | 2 | 20×`dmg` | 20×`dmg` (unchanged — see note) |
| 3 | 3 | 20×`dmg` | 20×`dmg` |
| 5 | 5 | 20×`dmg` | 20×`dmg` |

**Important growth nuance**: the 400ms hit cooldown (`enemy.lastOrbitHitTime`) is tracked **per enemy**, not per blade — so adding blades does *not* multiply damage against a single target standing still. What it buys instead is **angular coverage**: with `N` blades spaced `2π/N` apart, more enemies around the player get caught in a swing simultaneously — a full 360° passive alternative to Melee Slash's directional, auto-aimed 130° swing.

### 4.5 Chain Lightning — Wizard's second weapon, starts at 0 (`fireLightningWeapon`)

```js
const strikeRadius = 260; // narrowed from "anywhere on screen" to a radius around the player
const nearbyEnemies = this.enemies.getChildren().filter(e =>
    e.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y) <= strikeRadius
);
const targetCount = Math.min(this.player.skills.lightning, nearbyEnemies.length); // 1 target/level, not 2
this.damageEnemy(enemy, 40 * this.player.damageMult); // per bolt, instant
```

Lightning also has its **own dedicated timer at a slower 1600ms cadence** (double the 800ms "normal" tier shared by Melee/Orbit) — narrower scope traded for a longer cooldown between strikes.

| Skill Level | Targets hit (within 260px) | Dmg/bolt | Total dmg (if enough nearby enemies) |
|:---:|:---:|:---:|:---:|
| 1 | 1 | 40×`dmg` | 40×`dmg` |
| 2 | 2 | 40×`dmg` | 80×`dmg` |
| 3 | 3 | 40×`dmg` | 120×`dmg` |

Locked to `classId: 'wizard'` — the second half of Wizard's kit alongside Fireball (§4.2). Where Fireball is a slow single-target nuke on a long cooldown, Lightning is instant and multi-target, giving the Wizard an answer to a small nearby cluster instead of only a lone priority target — but no longer a screen-wide panic button: it only reaches enemies within `260px` of the player, and only 1 per level (down from 2), on the slowest fire rate of the two.

### 4.6 Critical Knife — Rogue's starting weapon (`fireKnifeWeapon`)

```js
const critChance = Math.min(0.2 + (this.player.skills.knife - 1) * 0.1, 0.8);
const isCrit = Math.random() < critChance;
proj.damage = (isCrit ? 22 * 2 : 22) * this.player.damageMult;
```

A single knife thrown at the nearest enemy every 700ms, sharing the `poison_dart` sprite (Frame 104) visually but behaving as its own weapon — one precise throw instead of a circular spread. On a critical hit, `damageEnemy()` renders a `CRIT!` floating label and a fading gold-tinted **Frame 62 sparkle** (`crit_spark`) over the enemy, in addition to the normal hit flash and damage text.

| Skill Level | Crit Chance | Normal Dmg | Crit Dmg (2×) | Expected Dmg/throw |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 20% | 22×`dmg` | 44×`dmg` | 26.4×`dmg` |
| 2 | 30% | 22×`dmg` | 44×`dmg` | 28.6×`dmg` |
| 4 | 50% | 22×`dmg` | 44×`dmg` | 33.0×`dmg` |
| 7 | 80% (cap) | 22×`dmg` | 44×`dmg` | 39.6×`dmg` |

**Growth axis: crit chance, not damage or count.** Unlike every other weapon, a Critical Knife level-up doesn't add projectiles, range, or a flat damage bump — it raises the odds of the existing 2× multiplier landing, capped at 80% so a throw is never fully guaranteed to crit. Locked to `classId: 'rogue'` — paired with Poison Darts (§4.3) as Rogue's kit: Knife is a single volatile long-range gamble, while Darts is reliable, wide, close-range chip damage, giving the Rogue a high-variance (crit) option from the start and a low-risk (spread) option to grow into.

---

## 5. Class Growth Arcs

Weapon cards are locked (§3), so "build diversity" no longer comes from *which weapons* a class ends up with — that's fixed at 2 per class from the start. It instead comes from **how a run's random 3-of-6 offers pace the split between a class's two weapons and its 4 universal stat boosts**. Every class eventually has access to its full kit; the only open question each run is the order and ratio it arrives in.

| Class | Locked Kit | Starting Baseline | Natural Growth Priority | Why |
|---|---|---|---|---|
| **Knight** | 🌀 Cleave Slash + ⚔️ Orbiting Blades | 150 HP / 95 spd, Melee Lv1 | Cleave Slash + Orbiting Blades + ❤️ HP | Melee rewards standing in a crowd within its cone; Orbit adds passive 360° coverage for whatever the cone missed; more HP lets the Knight tank long enough for both to matter |
| **Wizard** | 🔥 Fireball Spell + ⚡ Chain Lightning | 65 HP / 125 spd, Fireball Lv1 | Fireball + 💥 Dmg + Lightning | Fireball's growth is pure single-target burst that `damageMult` scales hardest; Lightning covers the crowd-control gap Fireball leaves; HP is a safety net for the lowest baseline in the game |
| **Rogue** | 🔪 Critical Knife + 🗡️ Poison Darts | 100 HP / 165 spd, Knife Lv1 | Critical Knife + 👟 Speed + Poison Darts | Critical Knife's crit-chance growth pairs with the fastest movement speed to hit-and-run, gambling on burst while repositioning; Poison Darts adds a reliable close-range spread once the Rogue commits to diving into a crowd |

Because each class's deck is only 6 cards (2 weapons + 4 stat boosts) instead of the old 10-card shared pool, a class reaches "has drawn everything at least once" much faster — variance now lives in *ordering* (does Wizard see Lightning at level 3 or level 8?) rather than in *whether* a class ever sees its second weapon at all.

---

## 6. Tuning Reference

| Constant | Location | Current Value | Effect of Increasing |
|---|---|:---:|---|
| XP curve growth rate | `levelUp()` | `×1.4` | Slower/faster leveling pace over a run |
| Base XP requirement | `init()` | `10` | Shifts the whole curve up/down uniformly |
| Weapon card class-lock | `card.classId` in `UPGRADE_POOL`, filtered in `UpgradeModalScene.create()` | 1 owning class per weapon card | Removing a `classId` returns that weapon to the universal pool (pre-this-pass behavior); reassigning it changes which class it's locked to |
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
| Lightning fire rate | timer in `create()` | `1600ms` | Slower than the 800ms "normal" tier by design — lower makes Lightning less of a commitment |
| Lightning strike radius | `fireLightningWeapon` | `260px` | Narrowed AoE — higher widens it back toward the old screen-wide behavior |
| Lightning targets/level | `fireLightningWeapon` | `lvl` (was `lvl * 2`) | Fewer simultaneous nuke targets per level than before this pass |
| Knife fire rate | timer in `create()` | `700ms` | Faster = more crit rolls per second |
| Knife crit chance per level | `fireKnifeWeapon` | `0.2 + (lvl-1)*0.1`, capped `0.8` | Higher cap = crits become closer to guaranteed at max level |
| Knife dmg (normal / crit) | `fireKnifeWeapon` | `22` / `44` (2×) | Raising the multiplier makes high-level Knife swingier, not just stronger |

---

## Related Documents
- [Game Spec](spec.md)
- [Technical Note: Dungeon Floor Generation](technical-floor-generation.md)
- [Level Design: Monster Spawning & Difficulty Pacing](level-design-monster-spawning.md)
- [Project Index](../../index.md)
