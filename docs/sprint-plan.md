---
title: "📋 Sprint Planning & User Stories — Card Memory Match (G008)"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "In Progress"
tags:
  - documentation
---

# 📋 Sprint Planning & User Stories — Card Memory Match (G008)

**Sprint Duration:** 2026-07-28 → 2026-08-04 (4 working days)  
**Game:** Card Memory Match (`card-memory`)  
**Engine:** Phaser 2D  
**Status:** In Progress  

---

## Sprint 03 Goals & Summary (G017 - Tiny Dungeon Survivor)

| Game / Feature | Status | Sprint |
|------|--------|--------|
| 🗡️ Tiny Dungeon Survivor (Action Roguelike) | ✅ Completed | Sprint 03 |

### Deliverables & User Stories
- ✅ **US-17-01 (P0)**: Hero Selection & Boot Engine (Knight, Wizard, Rogue)
- ✅ **US-17-02 (P0)**: Top-Down Movement & Dual Controls (WASD / Touch Joystick)
- ✅ **US-17-03 (P0)**: Auto-Attacks & Weapons Engine (Orbiting Blades, Fireball, Darts, Lightning)
- ✅ **US-17-04 (P0)**: Roguelike Card Upgrade Modal System (Pause Game & Pick 1 of 3 Skill Cards)
- ✅ **US-17-05 (P1)**: Dynamic HUD (HP, XP, Level, Kills, Timer) & GameOver Summary

---

## User Stories

### Story 1 — Game Initialization (Priority: P0)
- **As** a player, I want a grid of 16 face-down cards when the game starts.
- **As** a player, I want the cards to be randomly shuffled.
- **Acceptance Criteria:**
  - Grid 4×4 with 8 pairs (16 cards)
  - Each pair uses the same card from Kenney Playing Cards Pack
  - Cards are face-down at start
  - Cards are randomly shuffled (Fisher-Yates algorithm)

### Story 2 — Card Flip Mechanic (Priority: P0)
- **As** a player, I want to click a card to flip it and reveal its face.
- **As** a player, I want to flip exactly 2 cards per turn.
- **Acceptance Criteria:**
  - Click card → flip animation (CSS 3D transform or Phaser tween)
  - Only 2 cards can be flipped at a time
  - Cannot click same card twice
  - Cannot click a card while another card is being checked

### Story 3 — Match Logic (Priority: P0)
- **As** a player, I want matched cards to stay face-up permanently.
- **As** a player, I want mismatched cards to flip back after a short delay.
- **Acceptance Criteria:**
  - Match: cards stay face-up, score increments
  - Mismatch: cards flip back after 800ms
  - Score counter updates in real-time

### Story 4 — Win/Lose Conditions (Priority: P0)
- **As** a player, I want to see a result screen when I win or lose.
- **Acceptance Criteria:**
  - **Win:** All 8 pairs matched → show victory modal with time elapsed
  - **Lose:** Player cannot make more moves → show game over modal
  - Show option to replay

### Story 5 — Game Controls & UI (Priority: P1)
- **As** a player, I want a clear game UI with score, moves counter, and timer.
- **As** a player, I want a restart button to play again.
- **Acceptance Criteria:**
  - Score display
  - Moves counter
  - Timer (optional)
  - Restart button
  - Consistent with hub styling (dark theme)

### Story 6 — Responsive Design (Priority: P2)
- **As** a player, I want the game to work on mobile and desktop.
- **Acceptance Criteria:**
  - Cards scale properly on small screens
  - Touch-friendly (click area ≥ 44px)
  - Grid reflows on different screen sizes

### Story 7 — Pixel Shmup: Basic Mechanics (Priority: P0)
- **As** a player, I want a vertical shoot-'em-up with wave progression.
- **Acceptance Criteria:**
  - Move with mouse/touch
  - Auto-shoot with cooldown
  - 3 enemy types (basic, fast, tank)
  - 3 asteroid types (small, medium, large)

### Story 8 — Pixel Shmup: Score & Difficulty (Priority: P0)
- **As** a player, I want the game to get harder as I score more.
- **Acceptance Criteria:**
  - Score-based wave progression
  - Enemy speed increases +20% per wave
  - New enemy types unlock at higher waves
  - Win/Lose modal

### Story 9 — Pico-8 Platformer: Level Generation (Priority: P0)
- **As** a player, I want a randomly generated 3D platformer level.
- **Acceptance Criteria:**
  - Platform grid 20×20 with 3D blocks
  - Coins spawn randomly on platforms
  - Enemies spawn with patrol path
  - Flag spawns at the edge

### Story 10 — Pico-8 Platformer: Player Movement (Priority: P0)
- **As** a player, I want to move my character with WASD/Arrow Keys.
- **As** a player, I want to double jump and see the animation.
- **Acceptance Criteria:**
  - Keyboard controls (WASD or Arrow Keys)
  - Touch controls (D-Pad + Jump button)
  - Double jump mechanic with air ring particle
  - Ground check via raycast (5 rays)

### Story 11 — Pico-8 Platformer: Interactions (Priority: P0)
- **As** a player, I want to collect coins, bump blocks, and defeat enemies.
- **Acceptance Criteria:**
  - Collect coin → +100 pts (360° rotation)
  - Bump block → spawn coin, +500 pts
  - Destroy brick → +200 pts
  - Fall off → Game Over

### Story 12 — Pico-8 Platformer: Win/Lose (Priority: P0)
- **As** a player, I want to see Victory when I reach the flag.
- **As** a player, I want to see Game Over when I fall off the map.
- **Acceptance Criteria:**
  - Victory modal when reaching flag
  - Game Over modal when falling off (y < -12)
  - Score counter displayed

### Story 13 — Deployment (Priority: P0)
- **As** a developer, I want both games deployed to Vercel.
- **Acceptance Criteria:**
  - Code names in page.js
  - Build number in modal
  - Git push + Vercel deploy
  - Accessible URLs

---

## Acceptance Criteria

| # | Criteria | Verification |
|---|----------|-------------|
| 1 | 16 cards grid (4×4) with 8 pairs | Visual check |
| 2 | Click to flip 2 cards max | Functional test |
| 3 | Match locks, mismatch flips back | Functional test |
| 4 | Win/Lose modal with time | Visual check |
| 5 | Score + Moves display | Visual check |
| 6 | Works on mobile + desktop | Responsive test |
| 7 | 3D Platformer: WASD + double jump | Functional |
| 8 | 3D Platformer: Collect coins | Functional |
| 9 | 3D Platformer: Victory + Game Over | Functional |
| 10 | Pixel Shmup: Move + shoot + enemies | Functional |
| 11 | Pixel Shmup: Wave progression | Functional |
| 12 | Both games on Vercel | URL check |
| 13 | Code names + build numbers | Code review |

---

## Dependencies

| Dependency | Status |
|-----------|--------|
| Card Memory Match GDD | ✅ Created |
| Pixel Shmup GDD | ✅ Created |
| Pico-8 Platformer GDD | ✅ Created |
| Kenney Playing Cards Pack | ✅ Available |
| Kenney Pixel Shmup | ✅ Available |
| Kenney Pico-8 Platformer | ✅ Available |
| Hub UI (GameModal) | ✅ Ready |

---

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset path issues (assets not loading in iframe) | High | Use root-relative paths `/assets/...` |
| Non-fast-forward git push | High | Merge origin/master before push |
| 3D Platformer performance on mobile | High | Optimize mesh count, use low poly models |
| Pixel Shmup collision detection | Medium | Use simple AABB collision |
| Asset loading on slow connections | Medium | Preload with progress bar |
| Card flip animation lag on mobile | Medium | Use CSS 3D transform, not Phaser tween |

---

## Notes

- 3D Platformer: ใช้ Kenney Starter-Kit-3D-Platformer + Babylon.js
- Pixel Shmup: ใช้ Kenney Pixel-Shmup + Phaser 3
- Card Memory: ใช้ Kenney Playing Cards Pack + Phaser 2D
- ทำให้ง่าย แต่ครบจบ: flip, match, lock, win/lose, replay