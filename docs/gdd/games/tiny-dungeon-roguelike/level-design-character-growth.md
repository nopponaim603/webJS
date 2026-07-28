# 📈 Level Design: Player Character Growth per Class

**Game:** Tiny Dungeon Survivor (`tiny-dungeon-roguelike`)
**File:** [`public/games/tiny-dungeon-roguelike/game.js`](../../../../public/games/tiny-dungeon-roguelike/game.js)
**Key sections:** `HERO_CLASSES`, `UPGRADE_POOL`, `MainGameScene.levelUp()`, `.fireAutoWeapons()`, `.updateOrbitBlades()`
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
| 🔥 Fireball Spell | `skills.fireball += 1` | Linear, uncapped | See §4.2 |
| ⚔️ Orbiting Blades | `skills.orbit += 1` | Linear, uncapped | See §4.1 |
| 🗡️ Poison Darts | `skills.darts += 1` | Linear, uncapped | See §4.3 |
| ⚡ Chain Lightning | `skills.lightning += 1` | Linear, uncapped | See §4.4 |
| ❤️ Max HP +30% | `maxHp += 30`, heal `+30` instantly | Flat, additive per pick | Larger relative gain for low-HP classes |
| 👟 Movement Speed +20% | `speedBonus += 0.2` (starts at `1.0`) | Additive to multiplier | 3rd pick → `speedBonus = 1.6` (+60% over base, not compounding) |
| 💥 Attack Power +25% | `damageMult += 0.25` (starts at `1.0`) | Additive to multiplier | Applies to **all** weapons the player owns, not just the starting one |
| 🧛 Vampiric Drain | `vampireChance += 0.15` | Additive probability | Rolled once per kill in `damageEnemy()` |

`damageMult` and `speedBonus` are shared multipliers applied at read-time (`proj.damage = BASE * this.player.damageMult`, `currentSpeed = this.player.speed * this.player.speedBonus`) — a single `damage_boost` pick buffs every weapon the player has simultaneously, which matters once a class has drawn a second or third weapon card (see §5).

---

## 4. Per-Weapon Scaling Curves

Each weapon's *skill level* (`player.skills.<weapon>`) increases by 1 per matching card drawn. Base damage constants already reflect the [class rebalance pass](spec.md#21-player-characters-ฮีโร่ผู้เล่น) (Knight/orbit ↑, Wizard/fireball ↑, Rogue/darts ↓ per-hit + more projectiles).

### 4.1 Orbiting Blades — Knight's signature (`updateOrbitBlades`)

```js
const orbitCount = this.player.skills.orbit;   // 1 blade per skill level
this.damageEnemy(enemy, 20 * this.player.damageMult); // per hit, 400ms cooldown PER ENEMY
```

| Skill Level | Blades | Dmg/hit | Per-target cap (dmg per 400ms cd) |
|:---:|:---:|:---:|:---:|
| 1 | 1 | 20×`dmg` | 20×`dmg` |
| 2 | 2 | 20×`dmg` | 20×`dmg` (unchanged — see note) |
| 3 | 3 | 20×`dmg` | 20×`dmg` |
| 5 | 5 | 20×`dmg` | 20×`dmg` |

**Important growth nuance**: the 400ms hit cooldown (`enemy.lastOrbitHitTime`) is tracked **per enemy**, not per blade — so adding blades does *not* multiply damage against a single target standing still. What it buys instead is **angular coverage**: with `N` blades spaced `2π/N` apart, more enemies around the Knight get caught in a swing simultaneously. This is intentionally a **crowd-coverage** growth axis, matching Knight's tanky, stand-in-the-middle identity — more blades reward the Knight for being surrounded, not for facing a single boss.

### 4.2 Fireball Spell — Wizard's signature (`fireAutoWeapons` §1)

```js
for (let i = 0; i < this.player.skills.fireball; i++) { /* one shot, 120ms apart */ }
proj.damage = 42 * this.player.damageMult;
```

All shots in a volley target whatever `getNearestEnemy()` returns at cast time (fired every 800ms tick).

| Skill Level | Shots/volley | Dmg/shot | Dmg/volley (same target) |
|:---:|:---:|:---:|:---:|
| 1 | 1 | 42×`dmg` | 42×`dmg` |
| 2 | 2 | 42×`dmg` | 84×`dmg` |
| 3 | 3 | 42×`dmg` | 126×`dmg` |
| 4 | 4 | 42×`dmg` | 168×`dmg` |

**Growth axis: single-target burst.** Every level stacks the *entire* volley onto the same nearest enemy, so Fireball scales as pure focused DPS — fitting the Wizard's glass-cannon identity (lowest HP baseline, meant to delete priority targets from range before they close the distance).

### 4.3 Poison Darts — Rogue's signature (`fireAutoWeapons` §2)

```js
const dartCount = 4 + (this.player.skills.darts - 1) * 2; // full-circle spread
proj.damage = 13 * this.player.damageMult;
```

| Skill Level | Darts/volley | Dmg/dart | Total volley dmg (if all connect) |
|:---:|:---:|:---:|:---:|
| 1 | 4 | 13×`dmg` | 52×`dmg` |
| 2 | 6 | 13×`dmg` | 78×`dmg` |
| 3 | 8 | 13×`dmg` | 104×`dmg` |
| 4 | 10 | 13×`dmg` | 130×`dmg` |

**Growth axis: spread/crowd poke.** Darts fire in a full 360° ring, so more levels mean a denser ring rather than more damage on any one enemy — this pairs with Rogue's highest movement speed, encouraging a kite-through-the-middle-of-a-crowd playstyle rather than either Knight's stand-and-tank or Wizard's snipe-from-max-range.

### 4.4 Chain Lightning — universal 4th weapon (no starting class)

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
| **Knight** | 150 HP / 95 spd, Orbit Lv1 | Orbit + ❤️ HP + 💥 Dmg | Orbit rewards standing in a crowd; more HP lets the Knight tank longer to make that coverage matter, and `damageMult` buffs the blades directly |
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
| Orbit per-enemy cooldown | `updateOrbitBlades` | `400ms` | Shorter = more blades start mattering for single-target DPS too |
| Fireball stagger | `fireAutoWeapons` §1 | `120ms` between shots | Visual/timing only, does not change total volley damage |
| Darts base count | `fireAutoWeapons` §2 | `4 + (lvl-1)*2` | Denser ring per level |
| Lightning targets/level | `fireAutoWeapons` §3 | `lvl * 2` | More simultaneous nuke targets per level |

---

## Related Documents
- [Game Spec](spec.md)
- [Technical Note: Dungeon Floor Generation](technical-floor-generation.md)
- [Level Design: Monster Spawning & Difficulty Pacing](level-design-monster-spawning.md)
- [Project Index](../../index.md)
