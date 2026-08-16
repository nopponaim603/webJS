---
title: "🎲 Dice Quest — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-08-01"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - dice-quest
---
# 🎲 Dice Quest — Game Design Document & Dev Specs

**Code Name:** `dice-quest` (G010)  
**Game ID:** `dice-quest`  
**Engine / Tech:** Vanilla JS / HTML5 CSS Grid & Circular Math / Web Audio  
**Asset Pack:** Kenney Boardgame Pack (`public/assets/kenney_boardgame-pack/`)  

---

## 1. Game Overview

### Elevator Pitch
เกมกระดานวางกลยุทธ์ทอยลูกเต๋าพัฒนาด้วย HTML5 (Monopoly / Board Game Style) ผู้เล่นสลับรอบกับ AI 3 ตัว ทอยลูกเต๋าคู่ (Red Dice) เดินตัวเดิน (Pawns) ไปตามช่องกระดานวงกลม 28 ช่อง ซื้อ/เก็บค่าเช่าที่ดิน สุ่มเปิดการ์ดโชคดี/โชคร้าย จ่ายภาษี พักผ่อน Free Parking หรือเข้าคุก และแข่งขันสะสมเหรียญทองเพื่อเป็นผู้ชนะ

### Target Audience
ผู้เล่นที่ชื่นชอบเกมกระดาน เกมวางกลยุทธ์แบบสลับรอบ (Turn-based Board Game) และเกมทอยลูกเต๋า

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Roll Dice**: ผู้เล่นกดปุ่มทอยลูกเต๋า 🎲 ทอยเต๋าคู่ (Roll Animation + Sound FX) เพื่อสุ่มแต้มเดิน 2-12
2. **Pawn Movement**: ตัวเดินเคลื่อนที่ตามจำนวนแต้มเต๋าที่ทอยได้ ไปตามช่องกระดานวนรอบ
3. **Tile Events**:
   - **Unowned Property**: ซื้อที่ดินสะสมทรัพย์สิน
   - **Enemy Property**: จ่ายค่าเช่าให้แก่คู่แข่ง
   - **Chance Tile**: สุ่มเปิดการ์ดโชคดี (รับเหรียญโบนัส / วาร์ป) หรือการ์ดโชคร้าย (เสียค่าปรับ)
   - **Go to Jail / Jail**: ติดคุก 3 รอบหากทอยได้คุก หรือเดินลงช่องคุก
   - **Free Parking**: สะสมเงินภาษีจากกองกลาง
4. **Win Condition**: ล้มละลายคู่แข่งทั้งหมด หรือสะสมเงินทุนถึง $20,000 Gold

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `/assets/kenney_boardgame-pack/PNG/`

| Category | Asset Key | File Name | Description |
|---|---|---|---|
| **Dice** | `dice_1` - `dice_6` | `dieRed1.png` - `dieRed6.png` | ชุดลูกเต๋าแดง 6 ด้านสำหรับแสดงผลทอย |
| **Player Pawn** | `pawn_green` | CSS Circle / Icon | ตัวเดินฝั่งผู้เล่น 🟢 |
| **AI Pawns** | `pawn_ai` | CSS Circle / Icon | ตัวเดินฝั่ง AI 3 ตัว (🔵, 🟡, 🔴) |
| **Board Tiles** | `tile_property` | Circular Math & Glassmorphism | ช่องกระดาน 28 ช่อง |
| **Audio Synthesis** | `Web Audio API` | Real-time Oscillator | เอฟเฟกต์ เสียงทอยเต๋า ซื้อที่ดิน จ่ายเงิน ชนะเกม |

---

## 4. Controls & Input Mapping

| Action | Control Input |
|---|---|
| Roll Dice | Click "🎲 ทอยลูกเต๋า" Button |
| Restart Game | Click "🔄 Play Again" Button in Victory/Game Over Modal |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/dice-quest/`
  - `index.html` — HTML5 App Shell & Modal Container
  - `game.js` — Game State, Turn Manager, Pawn Position Math & Synthesizer
  - `styles.css` — Modern Glassmorphism Styling, Circular Board Layout & Animations

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
