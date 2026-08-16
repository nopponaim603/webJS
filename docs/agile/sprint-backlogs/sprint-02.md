---
title: "Sprint 02 — Pixel Shmup + Pico-8 Platformer (G009 + G010)"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "In Progress"
tags:
  - agile
  - sprint
---
# Sprint 02 — Pixel Shmup + Pico-8 Platformer (G009 + G010)

**Sprint Duration:** 2026-07-31 → 2026-08-07 (7 working days)  
**Games:** Pixel Shmup (`pixel-shmup`) + Pico-8 Platformer (`pico-platformer`)  
**Engines:** Phaser 3 (Pixel Shmup) / Phaser 3 (Pico Platformer)  

---

## Sprint Goal

พัฒนา 2 เกมใหม่:

- **Pixel Shmup (G009):** 2D Shoot 'em up แบบคลาสสิก 3 enemy types + asteroid dodging
- **Pico Platformer (G010):** Side-scrolling platformer แบบ Pico-8 สไตล์

---

## User Stories — Pixel Shmup (G009)

### Story 1 — Basic Mechanics (Priority: P0)
- **As** a player, I want to move my ship with mouse/touch and shoot with automatic fire or key press.
- **As** a player, I want to dodge incoming enemies and asteroids.
- **Acceptance Criteria:**
  - Ship movement follows mouse/touch position
  - Auto-shoot with cooldown (or space key to shoot)
  - Enemy ships move toward player or in patterns
  - Asteroids float across screen
  - Score increases with enemy/asteroid destroyed

### Story 2 — Enemies & Wave System (Priority: P0)
- **As** a player, I want 3 enemy types: Basic, Fast, and Tank.
- **As** a player, I want the game to get harder with wave progression.
- **Acceptance Criteria:**
  - **Basic:** Standard speed, shoots occasionally
  - **Fast:** Quick movement, no shooting
  - **Tank:** Slow, high HP, shoots 3 bullets spread
  - Wave system: every 100 pts → new wave → faster enemies
  - All enemies defeated → wave complete

### Story 3 — Win/Lose (Priority: P0)
- **As** a player, I want to see a result screen when I win or lose.
- **Acceptance Criteria:**
  - **Win:** Score 500+ and clear all waves
  - **Lose:** Health reaches 0 (hit by 5 enemy bullets/asteroids)
  - Show Victory/Game Over modal with final score
  - Option to replay

### Story 4 — UI & Controls (Priority: P1)
- **As** a player, I want a clear UI with score, health bar, and wave indicator.
- **Acceptance Criteria:**
  - Score counter (top-right)
  - Health bar (top-left)
  - Wave indicator (center-top)
  - Pause button (P key or touch)
  - Responsive design

---

## User Stories — Dice Quest Board Game (G010)

### Story 1 — Core Monopoly Board & Pawns (Priority: P0)
- **As** a player, I want to see a 28-tile circular Monopoly-style board and pawns for 4 players (1 Player + 3 AI).
- **Acceptance Criteria:**
  - 28 tiles placed in circular math layout
  - 4 colored pawns placed on tile positions
  - HUD header displaying player money and properties count

### Story 2 — Dice Rolling & Movement (Priority: P0)
- **As** a player, I want to roll a pair of red dice with animation and Web Audio SFX to move around the board.
- **Acceptance Criteria:**
  - 3D red dice roll animation with audio feedback
  - Player pawn advances step by step along board tiles
  - Pass GO money bonus (+$200) applied on completing a full lap

### Story 3 — Tile Rules, Rent & Chance Cards (Priority: P0)
- **As** a player, I want tile events for buying properties, paying rent to opponents, chancing cards, paying taxes, and visiting Jail / Free Parking.
- **Acceptance Criteria:**
  - Buy unowned properties / Pay rent to owner
  - Random chance card events (bonus money, penalty, warp)
  - Income / Luxury Tax collection & Free Parking pot pool
  - Jail sentence logic (3 turns lock)

### Story 4 — Win/Lose & UI (Priority: P1)
- **As** a player, I want to see victory / game over modals and live log box.
- **Acceptance Criteria:**
  - Bankruptcy tracking when player funds drop below zero
  - Victory modal when all AI opponents go bankrupt or target funds achieved
  - Replay button resets board state
  - Glassmorphism HUD & log tracking box

---

## Acceptance Criteria (All Stories)

| # | Criteria | Verification | Status |
|---|----------|-------------|:---:|
| 1 | Pixel Shmup / Ocean Frenzy: Move + shoot + dodge | Functional | 🟢 DONE |
| 2 | Pixel Shmup / Ocean Frenzy: 3 enemy types & Wave progression | Functional | 🟢 DONE |
| 3 | Dice Quest: Circular board layout & 4 pawns | Visual check | 🟢 DONE |
| 4 | Dice Quest: Roll 3D red dice with sound FX | Functional | 🟢 DONE |
| 5 | Dice Quest: Property buying, rent & chance cards | Functional | 🟢 DONE |
| 6 | Dice Quest: Victory / Game Over modal & reset | Functional | 🟢 DONE |
| 7 | WebJS Hub Integration | URL check | 🟢 DONE |

---

## Dependencies

| Dependency | Status |
|-----------|--------|
| Pixel Shmup GDD | ✅ Created |
| Pico Platformer GDD | ✅ Created |
| Kenney Pixel Shmup assets | ✅ Available |
| Kenney Pico-8 Platformer assets | ✅ Available |
| Hub UI (GameModal) | ✅ Ready |
| Phaser 3 setup | ✅ Ready |

---

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset path issues in iframe | High | Use root-relative `/assets/...` paths |
| Non-fast-forward git push | High | Merge origin/master before push |
| Mobile performance | Medium | Use CSS transforms, not WebGL effects |
| Collision detection bugs | Medium | Use grid-based collision for platformer |

---

## Notes

- Pixel Shmup: ใช้ Kenney Simple Space assets (CC0)
- Pico Platformer: ใช้ Kenney Pico-8 assets (CC0)
- ทำให้ง่าย: simple controls, clear UI, no complexity