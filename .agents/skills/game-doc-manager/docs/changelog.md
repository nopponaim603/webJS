---
title: "Documentation Changelog"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Game Dev Team (via game-doc-manager skill)"
status: "Active"
tags:
  - documentation
---
# Documentation Changelog


---

## 2026-07-28 — Tiny Dungeon Survivor (G017): Combat Rebalance & New Docs

**Author:** Game Dev Team (via game-doc-manager skill)
**Game:** `tiny-dungeon-roguelike` (G017)

### Summary

A single extended session of gameplay fixes and rebalancing for Tiny Dungeon Survivor, moving from "one shared upgrade pool" toward class-locked kits, plus a bug fix, a new skill, and full GDD documentation to match. No version-control commits were made during the session; this entry logs the work as one batch.

### Bug Fixes
- **Knight orbit blade "hits once" bug**: the per-enemy hit-cooldown check captured a stale `time` value in a closure created once per blade, so the cooldown comparison was always `0 < 400` after the first hit — permanently blocking further damage. Fixed to read the live `this.time.now` each check.

### Gameplay Changes — `public/games/tiny-dungeon-roguelike/game.js`
- **Dungeon floor generation**: replaced a deterministic diagonal-stripe tile formula with a seeded PRNG (`mulberry32`) and weighted tile selection (~93% main floor / ~7% variants), removing the visible repeating pattern while staying reproducible via `mapSeed`.
- **Class stat rebalance**: widened the gap between Knight (tankiest/slowest), Wizard (squishiest/highest burst), and Rogue (fastest/medium HP); rebalanced weapon base damage to match.
- **Difficulty pacing**: monster population cap, enemy HP, and enemy-variety unlocks now scale with player level in addition to elapsed time; added periodic "Swarm Wave" mob-rush events with a directional cone spawn and screen-flash telegraph.
- **Audio**: added a throttle (`SoundManager.canPlay`) so `playHit`/`playShoot`/`playPickup` can't stack dozens of overlapping copies when many hits land in one tick.
- **Knight**: replaced Orbiting Blades as the starting weapon with a new **Melee Slash** — an auto-aimed 130° cone swing whose range grows with level; Orbiting Blades became Knight's second (pickable) weapon, and its ring radius and blade size (with matching hitbox) now also grow with level.
- **Wizard vs. Rogue fire-rate identity**: each weapon moved to its own independent timer instead of one shared tick — Fireball is slow-but-hard (1400ms, damage ↑), Darts is fast-but-short-range (400ms, projectile lifetime ↓).
- **New skill — Critical Knife**: a thrown-knife attack with a per-level-growing crit chance (capped 80%) and a per-level-shrinking attack delay (capped 250ms); crits render a `CRIT!` label and a gold-tinted Frame 62 sparkle VFX on the enemy.
- **Class-locked upgrade pools**: weapon upgrade cards are now restricted per class (`classId` filter in `UpgradeModalScene`) — Knight: Melee + Orbit, Wizard: Fireball + Lightning, Rogue: Critical Knife + Poison Darts. Stat-boost cards remain universal.
- **Rogue weapon swap**: Critical Knife is now Rogue's starting weapon; Poison Darts became the second weapon, redesigned from a full-circle spread into a single-target staggered volley aimed at the nearest enemy, and tinted poison-green.
- **Chain Lightning rebalance**: narrowed to a 260px strike radius (was screen-wide) and slowed to a dedicated 1600ms timer (was the shared 800ms tick); each bolt now splashes nearby enemies via a shared `dealSplashDamage()` helper using the same level-scaling formula as Fireball's blast.
- **Fireball splash**: fireballs now explode on impact, damaging every enemy within a growing blast radius (and matching growing visual size) instead of only the one enemy they collided with.
- **HUD skill tray**: `UIScene` now shows an icon + pick-count chip for every upgrade card the player owns, tracked via `player.upgradeCounts`.

### Files Created
#### GDD (Game Design) — `docs/gdd/games/tiny-dungeon-roguelike/`
- `technical-floor-generation.md` — seeded-RNG floor tile generation mechanic
- `level-design-monster-spawning.md` — difficulty pacing, spawn formulas, Swarm Wave design
- `level-design-character-growth.md` — XP curve, class-locked upgrade pool, per-weapon scaling curves for all 6 weapons

### Files Updated
- `docs/gdd/games/tiny-dungeon-roguelike/spec.md` — hero stat table, items/VFX table, and gameplay-rules section kept in sync with every change above across the session

---

## 2026-07-27 — Initial Documentation Suite Created

**Author:** Game Dev Team (via game-doc-manager skill)

### Files Created

#### GDD (Game Design)
- `docs/gdd/concept/G008-card-memory-match-concept.md` — Game concept & architecture for G008
- `docs/gdd/mechanics/G008-card-memory-match-mechanics.md` — Core mechanics for G008
- `docs/gdd/art/G008-card-memory-match-art.md` — Art direction for G008

#### Sprint Planning
- `docs/sprints/sprint-01.md` — Sprint 01 plan for Card Memory Match (G008)
- `docs/sprints/sprint-02.md` — Sprint 02 plan for Pixel Shmup (G009) + Pico-8 Platformer (G010)

#### User Stories
- `docs/sprints/user-stories/US-08-01.md` through `US-08-07.md` — 7 stories for G008
- `docs/sprints/user-stories/US-09-01.md` through `US-09-06.md` — 6 stories for G009
- `docs/sprints/user-stories/US-10-01.md` through `US-10-07.md` — 7 stories for G010

#### Agile Management
- `docs/agile/01-product-backlog.md` — Full product backlog
- `docs/agile/02-sprint-planning.md` — Sprint planning & roadmap

#### Project Index
- `docs/index.md` — Project index
- `docs/changelog.md` — This file (document update log)
- `docs/wiki/wiki.md` — Knowledge hub

---

## Summary

| Category | Files | Status |
|----------|-------|--------|
| GDD | 3 files | ✅ Complete for G008 |
| User Stories | 20 files | ✅ All created |
| Sprint Plans | 2 files | ✅ Sprints 01 & 02 |
| Agile Docs | 4 files | ✅ Backlog, Planning, Index, Changelog |
| Wiki | 1 file | ✅ Created |

**Total Documentation Created:** 30+ files across all categories