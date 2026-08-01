# Sprint 02 — Pixel Shmup + Pico-8 Platformer (G009 + G010)

**Sprint Duration:** 2026-07-31 → 2026-08-07 (7 working days)  
**Games:** Pixel Shmup (`pixel-shmup`) + Pico-8 Platformer (`pico-platformer`)  
**Engines:** Phaser 3 (Pixel Shmup) / Phaser 3 (Pico Platformer)  
**Status:** In Progress  

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

## User Stories — Pico-8 Platformer (G010)

### Story 1 — Basic Mechanics (Priority: P0)
- **As** a player, I want to move my character with keyboard (WASD/arrows) and jump.
- **As** a player, I want to run, jump, and land on platforms.
- **Acceptance Criteria:**
  - Keyboard controls (WASD/arrows)
  - Jump with Space or Up arrow
  - Character animation (idle, run, jump)
  - Gravity applied correctly
  - Land on platforms, not through them

### Story 2 — World Design (Priority: P0)
- **As** a player, I want to see a 20×20 block world with platforms, blocks, and obstacles.
- **As** a player, I want to collect coins and avoid enemies.
- **Acceptance Criteria:**
  - 20×20 grid-based world
  - Blocks as walls/platforms
  - Coins scattered for collection (score +10 each)
  - Enemies patrol on platforms (game over if touched)
  - Obstacles (spikes, pits) that cause game over

### Story 3 — Win/Lose (Priority: P0)
- **As** a player, I want to see a result screen when I win or lose.
- **Acceptance Criteria:**
  - **Win:** Collect all coins (or reach exit) → Victory modal with score
  - **Lose:** Touch enemy/spike/fall off → Game Over modal
  - Show final score in modal
  - Option to replay

### Story 4 — UI & Controls (Priority: P1)
- **As** a player, I want a clear UI with score and level progress.
- **Acceptance Criteria:**
  - Score counter (top-left)
  - Coin counter (top-right)
  - Level progress bar (bottom)
  - Pause button (P key)
  - Responsive design

---

## Acceptance Criteria (All Stories)

| # | Criteria | Verification |
|---|----------|-------------|
| 1 | Pixel Shmup: Move + shoot + dodge | Functional |
| 2 | Pixel Shmup: 3 enemy types | Visual check |
| 3 | Pixel Shmup: Wave progression | Functional |
| 4 | Pixel Shmup: Win/Lose modal | Visual check |
| 5 | Pico Platformer: Move + jump + run | Functional |
| 6 | Pico Platformer: Collect coins | Functional |
| 7 | Pico Platformer: Win/Lose modal | Visual check |
| 8 | Both games on Vercel | URL check |
| 9 | Code names + build numbers | Code review |

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