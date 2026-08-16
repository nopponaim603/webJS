---
title: "👾 Pico Tower Climber — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Proposal"
tags:
  - gdd
  - pico-tower-climber
---
# 👾 Pico Tower Climber — Game Design Document & Dev Specs

**Code Name:** `pico-tower-climber` (G011)  
**Game ID:** `pico-tower-climber`  
**Engine / Tech:** Phaser 3 (2D Arcade Physics & Tilemap)  
**Asset Pack:** Kenney Pico-8 Platformer (`public/assets/kenney_pico-8-platformer/`)  

---

## 1. Game Overview

### Elevator Pitch
เกมพิกเซลอาร์ตย้อนยุคสไตล์ 8-bit Pico-8 (Infinite Vertical Climber) ผู้เล่นบังคับตัวละครวิ่ง กระโดด และเกาะผนัง (Wall Jump) เพื่อปีนขึ้นหอคอยความสูงไม่สิ้นสุด หลบหลีกระดับลาวาที่ดันขึ้นมาสไตล์ Celeste

### Target Audience
ผู้เล่นที่ชื่นชอบเกมแนว Retro Pixel Art, Platformer, Precision Jump และผู้ที่ชอบความท้าทาย

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Jump & Wall Jump**: บังคับตัวละครวิ่ง กระโดด และกระโดดเกาะกำแพงไต่ขึ้นด้านบน
2. **Rising Lava**: ระดับน้ำร้อน/ลาวาจะค่อยๆ ดันขึ้นมาจากด้านล่างด้วยความเร็วเร่งขึ้นเรื่อยๆ
3. **Obstacles & Traps**: หลบหนามพิกเซล, พื้นบล็อกสั่นร่วง (Crumbling Platforms) และศัตรูบิน
4. **Coins & High Score**: เก็บเหรียญพิกเซลระหว่างทางเพื่อทำคะแนนสูงสุด
5. **Win/Lose Condition**: ทำความสูงขึ้นไปให้ได้ไกลที่สุด หากตกหลุมลาวาหรือชนหนาม พลังชีวิตจะหมดลงทันที

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `public/assets/kenney_pico-8-platformer/PNG/`

| Category | Asset Key | Description |
|---|---|---|
| **Player** | `hero_pico` | ตัวละครพิกเซล (8x8 Spritesheet: Walk, Jump, Wall Slide) |
| **Tileset** | `tiles_pico` | ไทล์พื้นหิน, ดิน, หนาม, บล็อกสั่นร่วง |
| **Items** | `coin_pico` | เหรียญทองพิกเซล +100 pts |
| **Hazards** | `lava_pico` | เอฟเฟกต์ลาวาสีแดงดันขึ้นจากด้านล่าง |

---

## 4. Controls & Input Mapping

| Device | Action | Mapping |
|---|---|---|
| Keyboard | เคลื่อนที่ซ้าย-ขวา | Arrow Keys (`←` / `→`) หรือ `A` / `D` |
| Keyboard | กระโดด / Wall Jump | Key `Space` / `W` / `↑` |
| Mobile Touch | เคลื่อนที่ & กระโดด | Touch Buttons (Left, Right, Jump) |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/pico-tower-climber/`
  - `index.html` — Canvas Loader & UI
  - `game.js` — Phaser Tilemap & Pixel Physics Scene
  - `styles.css` — Retro Arcade Styling

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
