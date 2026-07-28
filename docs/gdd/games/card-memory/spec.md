# 🃏 Card Memory Match — Game Design Document & Dev Specs

**Code Name:** `card-memory` (G008)  
**Game ID:** `card-memory`  
**Engine:** Phaser 2D  
**Assets:** Kenney Playing Cards Pack  
**Version:** 1.0.0 | **Last Updated:** 2026-07-27  
**Status:** Design Phase | **Priority:** High  

---

## 1. Game Overview

### Elevator Pitch
เกมจับคู่การ์ดป๊อกที่เปิดการ์ดทีละ 2 ใบ หาการ์ดที่เหมือนกันให้ได้ครบทุกคู่ก่อนที่จะหมดเวลาลง ใช้กราฟิกการ์ดป๊อกที่สวยงามจาก Kenney Playing Cards Pack พร้อม game play ที่ถูกต้องและไม่ซ้ำซั่น

### Target Audience
- ผู้ที่ชอบเล่นเกม Memory / Card Game
- คนที่อยากเรียบเรียงการ์ดให้ง่ายและเข้าใจง่าย
- คนที่ต้องการ game ที่ไม่ซ้ำซั่น

---

## 2. Gameplay Mechanics

### Core Loop
1. **ป้อนการ์ด:** ผู้เล่นป้อนเลขที่ต้องจับ (0-9)
2. **ปรับการ์ด:** ให้จับ 2 การ์ดที่เหมือนกัน (เช่น 2 จับกับ 2, K จับกับ K)
3. **จับได้:** จับได้ถูกต้องได้ 1 แต้ม
4. **จับไม่ได้:** หมดแต้ม แต่ไม่ต้องจับการ์ด
5. **จับได้ทุกใบ:** จบเกม ได้แต้มทั้งหมด

### Game Flow
```
[ป้อนเลข] → [จับ 2 การ์ดเหมือนกัน] → [ได้แต้ม 1 แต้ม] → [จับต่อ]
     ↓                                      ↓
[จับไม่ได้]                               [จับได้ทุกใบ?]
     ↓                                              ↓
[หมดแต้ม]                                   [จบเกม]
```

### Scoring System
| Action | Points |
|--------|--------|
| จับการ์ดที่เหมือนกัน | +1 แต้ม |
| จับได้ทุกใบ (Win) | +5 แต้ม (Bonus) |
| จับไม่ได้ | 0 แต้ม |

---

## 3. File Structure & Assets

- **Game Files:** `public/games/card-memory/`
  - `index.html` — Layout & Game UI
  - `styles.css` — Card Layout, Grid, Modal
  - `game.js` — Game State, Timer, Card Logic

- **Assets:** `public/assets/kenney_playing-cards-pack/`
  - Card faces: card_clubs_*, card_diamonds_*, card_hearts_*, card_spades_*
  - Card backs: card_back.png
  - Special cards: card_joker_red.png, card_joker_black.png

---

## 4. Game Rules & Constraints

### Win Conditions
- **จับได้ทุกใบ:** จับการ์ดที่เหมือนกันครบ → แต้ม +5 แต้ม (Win)
- **หมดแต้ม:** จับไม่ได้ครบ → หมดแต้ม แต่ไม่ต้องจับการ์ด

### Lose Conditions
- **หมดเวลา:** หมดเวลาก่อนจับครบทุกใบ
- **จับไม่ได้:** จับการ์ดที่ไม่เหมือนกัน 5 ครั้ง → หมดแต้ม แต่ไม่ต้องจับการ์ด

---

## 5. Related Links

- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
- Product Backlog: [Product Backlog](../../../agile/01-product-backlog.md)
- User Stories:
  - [US-08-01 — Card Grid Display](../../../agile/user-stories/US-08-01-card-grid.md)
  - [US-08-02 — Card Flip & Match Logic](../../../agile/user-stories/US-08-02-match-logic.md)
  - [US-08-03 — Move Counter & Timer](../../../agile/user-stories/US-08-03-move-timer.md)
  - [US-08-04 — Results Screen & Rating](../../../agile/user-stories/US-08-04-results-modal.md)
  - [US-08-05 — Game Restart & New Game](../../../agile/user-stories/US-08-05-game-restart.md)
  - [US-08-06 — Mobile Touch Support](../../../agile/user-stories/US-08-06-mobile-responsive.md)
  - [US-08-07 — Performance & Preloading](../../../agile/user-stories/US-08-07-performance-preload.md)
- Asset Pack: [Kenney Playing Cards Pack](https://kenney.nl/assets/playing-cards-pack)
