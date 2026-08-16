---
title: "🍦 Sprint 08: Ice Cream Town — Core Match-3 Engine"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "Planning"
tags:
  - agile
  - sprint
---

# 🍦 Sprint 08: Ice Cream Town — Core Match-3 Engine

**Sprint Name:** Ice Cream Town — Core Match-3 Mechanics
**Sprint ID:** sprint-08
**Start Date:** 2026-07-29
**End Date:** 2026-08-12 (2 weeks)
**Status:** Planning

---

## 1. Sprint Goal

สร้างกลไก Match-3 Mini Game ที่สมบูรณ์สำหรับเกม Ice Cream Town ด้วย Phaser 3 — รวมถึงการเลือก/สับวัตถุ การตรวจจับ match การถ่วงถ่วงแรง การทำคะแนน และการผ่านด่านที่ 1-30

---

## 2. Key Deliverables

| # | Deliverable | สำเร็จแล้ว |
|---|------------|----------|
| 1 | Basic 7×7 match-3 grid with tile rendering | [ ] |
| 2 | Ball swap mechanics (tap-to-select + tap-to-swap) | [ ] |
| 3 | Match detection algorithm (3+ in a row) | [ ] |
| 4 | Gravity + cascade system (balls fall + refill) | [ ] |
| 5 | Score system with combos & chain reactions | [ ] |
| 6 | Level progression (Level 1 → 30+) with difficulty scaling | [ ] |
| 7 | Win/Lose conditions (target score / moves limit) | [ ] |
| 8 | Special ball system (Striped, Wrapped, Color Bomb) | [ ] |
| 9 | Ice Cream flavor system (10 flavors with visual states) | [ ] |
| 10 | Particle effects (match sparkles, pop effects) | [ ] |
| 11 | Level complete / failed screens with results | [ ] |
| 12 | Responsive layout (desktop + mobile touch) | [ ] |

---

## 3. Sprint Breakdown by Week

### Week 1: Foundation (2026-07-29 → 2026-08-04)

| Day | Focus | Deliverable |
|-----|-------|------------|
| D1 | Project setup & Phaser 3 scene structure | BootScene, MenuScene, asset loading |
| D2 | Match-3 grid rendering (7×7 tile system) | US-08-01: Grid Display |
| D3 | Ball selection & swap mechanics | US-08-02: Ball Selection & Swap |
| D4 | Match detection (3+ horizontal + vertical) | US-08-03: Match Detection |
| D5 | Gravity + cascade (fall + refill) | US-08-04: Gravity & Cascade |

### Week 2: Polish & Progression (2026-08-05 → 2026-08-12)

| Day | Focus | Deliverable |
|-----|-------|------------|
| D6 | Scoring system + combos | US-08-05: Scoring & Combos |
| D7 | Win/Lose conditions + level complete screen | US-08-06: Win/Lose & Results |
| D8 | Special balls (Striped, Wrapped, Color Bomb) | US-08-07: Special Balls |
| D9 | Ice cream flavors (10 colors) + unlock system | US-08-08: Flavor System |
| D10 | Level progression (30+ levels with scaling) | US-08-09: Level Progression |
| D11 | Mobile touch controls + responsive design | US-08-10: Mobile & Responsive |
| D2 | Polish, testing, bug fixes | US-08-11: Polish & Testing |

---

## 4. User Stories

### Sprint 08 User Stories (11 stories)

| US ID | Story | Priority | Est. |
|-------|-------|----------|------|
| US-08-01 | As a player, I want to see a 7×7 match-3 grid with ice cream ball tiles | P0 | 2 |
| US-08-02 | As a player, I can tap to select a ball and tap an adjacent tile to swap | P0 | 3 |
| US-08-03 | As a player, I want 3+ matching balls to be detected and cleared | P0 | 3 |
| US-08-04 | As a player, I want balls to fall and new ones to spawn when tiles are cleared | P0 | 2 |
| US-08-05 | As a player, I want a score counter that shows points and combos | P0 | 2 |
| US-08-06 | As a player, I want to see win/lose screens based on score target and moves | P0 | 2 |
| US-08-07 | As a player, I want special balls (Striped, Wrapped, Color Bomb) for big combos | P1 | 4 |
| US-08-08 | As a player, I want 10 ice cream flavors with unique colors | P1 | 3 |
| US-08-09 | As a player, I want progressive levels (30+) with increasing difficulty | P0 | 3 |
| US-08-10 | As a player on mobile, I want touch-optimized controls | P0 | 2 |
| US-08-11 | As a player, I want polish (particles, animations, sound effects) | P2 | 3 |

---

## 5. Technical Tasks

| # | Task | Est. | Notes |
|---|------|------|-------|
| T1 | Set up Phaser 3 project with BootScene and MenuScene | 4h | Scene management, asset pipeline |
| T2 | Create 7×7 grid rendering system with Phaser Groups | 4h | Tile rendering, ball sprites |
| T3 | Implement ball selection (highlight) + swap animation | 6h | Tap-to-select, adjacent swap, swap validation |
| T4 | Build match detection algorithm (horizontal + vertical, 3+) | 6h | Check all rows/columns, mark matches |
| T5 | Implement gravity + cascade (fill gaps, refill top) | 4h | Gravity tween, tile refill, chain reaction check |
| T6 | Add score system with combos multiplier | 3h | Score tracking, combo counter, UI display |
| T7 | Win/Lose conditions + level complete screen with 3-star rating | 4h | Target score check, moves counter, results modal |
| T8 | Special ball system (4-match = striped, L-shape = bomb, 5+ = color bomb) | 8h | Visual states, activation effects |
| T9 | 10 ice cream flavors with color tinting + unlock progression | 4h | Color mapping, flavor unlock logic |
| T10 | Level progression (30 levels with difficulty scaling) | 6h | Grid size, moves limit, target score per level |
| T11 | Mobile touch controls (tap + drag) + responsive scaling | 4h | Touch input, viewport scaling |
| T12 | Particle effects + animations for matches | 3h | Sparkle particles, pop animations |
| T13 | Sound effects (match, swap, win, lose, combo) | 2h | Web Audio API, Phaser Sound Manager |
| T14 | LocalStorage save/load for level progress | 2h | Game state persistence |

**Total Estimated Effort:** ~63 hours (2 weeks, 1 developer)

---

## 6. Acceptance Criteria

| Criteria | Description |
|----------|------------|
| ✅ **Grid Renders** | 7×7 grid renders correctly on desktop and mobile (responsive) |
| ✅ **Swap Works** | Player can tap 2 adjacent tiles to swap them; invalid swaps revert |
| ✅ **Match Detection** | 3+ matching tiles are detected and cleared every turn |
| ✅ **Gravity Works** | Tiles fall down to fill gaps after clears; new tiles spawn at top |
| ✅ **Chain Reactions** | Cascade continues until no new matches are found |
| ✅ **Scoring** | Score updates correctly with combo multiplier; displays on screen |
| ✅ **Win Condition** | Level completes when target score is reached (3-star rating) |
| ✅ **Lose Condition** | Level fails when moves run out before target score |
| ✅ **Special Balls** | Striped/Wrapped/Color Bomb activate correctly on match |
| ✅ **10 Flavors** | 10 ice cream flavors visible with unique colors |
| ✅ **30 Levels** | 30 levels playable with progressive difficulty |
| ✅ **Mobile Touch** | Touch controls work on mobile (tap + drag) |
| ✅ **No Crashes** | No game crashes or unhandled exceptions during gameplay |

---

## 7. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Match detection performance on mobile | Gameplay lag | Optimize with spatial hashing; limit checks to selected row/col |
| Cascade chain too long (infinite loop) | Game freeze | Max chain depth of 10; force clear if no match found |
| Asset loading slow on 3G | Long boot time | Sprite sheet generation; lazy-load levels |
| Swap validation edge cases | Glitched board | Extensive unit tests for edge cases (swap with same color, swap at edges) |

---

## 8. Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Phaser 3.85+ | ✅ Available | Latest stable release |
| Kenney Puzzle Pack 2 | ✅ Available | Ball sprites (10 colors × 10 sizes) |
| Kenney Boardgame Pack | ✅ Available | Game pieces, chips, cards |
| Kenney Fish Pack 2 | ✅ Available | HUD numbers, bubbles |
| No server/backend | ✅ | LocalStorage save system |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| **Load time** | < 2 seconds (4G) |
| **FPS** | 60 FPS on desktop, 30+ FPS on mid-range mobile |
| **Match detection** | < 50ms |
| **Touch response** | < 100ms |
| **Levels completable** | 30+ levels |
| **No crash rate** | 99.9% (no unhandled exceptions) |
