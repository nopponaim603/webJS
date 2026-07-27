# Sprint 01 — Card Memory Match (G008)

**Sprint Duration:** 2026-07-28 → 2026-07-31 (4 working days)  
**Game:** Card Memory Match (`card-memory`)  
**Engine:** Phaser 2D  
**Status:** Design Complete → In Progress  

---

## Sprint Goal

พัฒนา Card Memory Match ให้ play-ready ใน popup modal ให้สมบูรณ์แบบ:

- ✅ สุ่มการ์ด 8 คู่ (16 ใบ)
- ✅ เปิดการ์ด 2 ใบต่อครั้ง
- ✅ Match → ล็อคไม่สั่ง | Mismatch → พลิกกลับ
- ✅ Victory/Lose modal
- ✅ แสดง build number
- ✅ Responsive
- ✅ Push to GitHub + deploy Vercel

---

## User Stories

### Story 1 — Game Initialization (Priority: P0)
- **As** a player, I want to see a grid of 16 face-down cards when the game starts.
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

### Story 7 — Build & Deploy (Priority: P0)
- **As** a developer, I want the game deployed to Vercel with build number.
- **Acceptance Criteria:**
  - `public/games/card-memory/` created
  - Files: `index.html`, `game.js`
  - Code names in page.js
  - `git add, commit, push` to GitHub
  - Vercel deploy succeeds
  - Game accessible at `/games/card-memory/index.html`

---

## Acceptance Criteria (All Stories)

| # | Criteria | Verification |
|---|----------|-------------|
| 1 | 16 cards grid (4×4) with 8 pairs | Visual check |
| 2 | Click to flip 2 cards max | Functional test |
| 3 | Match locks, mismatch flips back | Functional test |
| 4 | Win/Lose modal with time | Visual check |
| 5 | Score + Moves display | Visual check |
| 6 | Works on mobile + desktop | Responsive test |
| 7 | Deployed + accessible URL | URL check |

---

## Dependencies

| Dependency | Status |
|-----------|--------|
| Kenney Playing Cards Pack assets | ✅ Available |
| GDD spec (card-memory) | ✅ Created |
| GameHub UI (GameModal) | ✅ Ready |
| Git repo (web_gamedevjs-hub) | ✅ Ready |

---

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset path issues (assets not loading in iframe) | High | Use root-relative paths `/assets/...` |
| Non-fast-forward git push | High | Merge origin/master before push |
| Card flip animation lag on mobile | Medium | Use CSS 3D transform, not Phaser tween |

---

## Notes

- ใช้ asset จาก `public/assets/kenney_playing-cards-pack/`
- ใช้สไตล์การ์ดป๊อก (Hearts, Diamonds, Clubs, Spades)
- ทำให้ง่าย แต่ครบจบ: flip, match, lock, win/lose, replay