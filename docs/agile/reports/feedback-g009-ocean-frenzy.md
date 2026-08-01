# Development Feedback & Audit Report — G009 Ocean Frenzy

**Date:** 2026-08-01  
**Target Component:** `public/games/ocean-frenzy/` (G009: Ocean Frenzy)  
**Related Documents:** [spec.md](../../gdd/planning/ocean-frenzy/spec.md), [01-product-backlog.md](../01-product-backlog.md)  
**Status:** 🟡 Action Required (Incomplete Implementation & Spec Mismatches)

---

## 🎯 Executive Summary

A comprehensive code and documentation audit was conducted for **G009: Ocean Frenzy** (`public/games/ocean-frenzy/`). While the core gameplay (steering, prey eating, size scaling, level evolution, lives system, procedural Web Audio synthesizer, glassmorphic HUD, particle effects, and high score persistence) is fully functional and playable, several features specified in the Game Design Document (GDD) were **omitted or incorrectly mapped during development**.

---

## ⚠️ 1. Missing Features (GDD Spec vs. Code Implementation)

The following mechanics outlined in the design spec ([docs/gdd/planning/ocean-frenzy/spec.md](../../gdd/planning/ocean-frenzy/spec.md)) are missing from [game.js](../../../public/games/ocean-frenzy/game.js):

| Feature | GDD Spec Requirement | Current Implementation State | Impact Level |
|---|---|---|:---:|
| **Jellyfish Hazard** (`jellyfish`) | Spawns poisonous jellyfish (`fishTile_101.png`). Colliding slows player movement for 3 seconds with a sawtooth sting audio effect. | 🔴 **Missing**. Not declared in `PREDATOR_CONFIG` or spawner loops. | **Medium** |
| **Speed Boost Power-Up** (`bubble_item`) | Spawns floating bubble items (`fishTile_105.png`). Collecting grants temporary speed boost (+50% speed) for 5 seconds. | 🔴 **Missing**. No power-up item group or duration timer exists in `game.js`. | **Medium** |

---

## 🔍 2. Asset & Path Mismatches

1. **Asset Filenames & Keys**:
   - **GDD Spec:** Refers to Kenney tile names (e.g., `fishTile_073.png`, `fishTile_079.png`, `fishTile_090.png`).
   - **Source Code:** Uses descriptive alias filenames (e.g., `fish_blue.png`, `fish_red.png`, `fish_grey_long_a.png`) located in `assets/kenney_fish-pack_2/PNG/Default/`.
   - *Recommendation:* Update [spec.md](../../gdd/planning/ocean-frenzy/spec.md) Asset Catalog table to reflect actual asset names stored in the repository.

2. **Asset Preloading Relative Paths**:
   - `game.js` uses relative prefix `const BASE = 'assets/kenney_fish-pack_2/PNG/Default/';`.
   - *Note:* While functional when running stand-alone from `public/games/ocean-frenzy/index.html`, ensure asset paths resolve properly if loaded via root modal iframe components.

---

## 📋 3. Agile Process & Documentation Discrepancies

1. **GDD Index Status Out of Date**:
   - In [docs/gdd/planning/index.md](../../gdd/planning/index.md), G009 is still marked as `⏳ Proposed`.
   - *Action Item:* Move `spec.md` from `docs/gdd/planning/ocean-frenzy/` to `docs/gdd/games/ocean-frenzy/` and update its status to `🟢 Released / Active`.

2. **Missing User Stories & Sprint Entries**:
   - G009 code was added in commit `3249f37`, but no corresponding User Stories (`US-09-XX`) were logged in `docs/agile/user-stories/` nor updated in `docs/agile/01-product-backlog.md`.
   - *Action Item:* Create User Stories for G009 core mechanics and sprint log entry to maintain Agile document traceability.

---

## 🛠️ 4. Recommended Action Items for Technical Correction

- [ ] **Implement Jellyfish Hazard:** Add Jellyfish obstacle spawning logic, collision handler, slow-down debuff state, and audio effect in `game.js`.
- [ ] **Implement Speed Boost Item:** Add bubble item spawn, collection handler, temporary speed multiplier timer, and HUD notification.
- [ ] **Update GDD Spec Asset Table:** Synchronize filenames in `spec.md` with actual asset names in `public/games/ocean-frenzy/assets/`.
- [ ] **Promote G009 Document Status:** Move `docs/gdd/planning/ocean-frenzy/spec.md` to `docs/gdd/games/ocean-frenzy/spec.md` and update index pages.
- [ ] **Create Agile User Stories:** Draft User Stories `US-09-01` through `US-09-04` covering G009 features.
