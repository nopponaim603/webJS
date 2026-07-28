# 🎲 Dice Quest — Game Design Document & Dev Specs

**Code Name:** `dice-quest` (G010)  
**Game ID:** `dice-quest`  
**Engine / Tech:** Vanilla JS / Phaser 3  
**Asset Pack:** Kenney Boardgame Pack (`public/assets/kenney_boardgame-pack/`)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-28  
**Status:** Proposal / Design Phase | **Priority:** Medium (Sprint 03)  

---

## 1. Game Overview

### Elevator Pitch
เกมกระดานวางกลยุทธ์ทอยลูกเต๋าพัฒนาด้วย HTML5 (Monopoly / Board Game Style) ผู้เล่นสลับรอบกับ AI ทอยลูกเต๋า 3D เดินตัวเดิน (Pawns) ไปตามช่องกระดาน ซื้อ/อัปเกรดพื้นที่สะสมทรัพย์สิน สุ่มเปิดการ์ดโชคดี/โชคร้าย และแข่งขันสะสมเหรียญทองเพื่อเป็นผู้ชนะ

### Target Audience
ผู้เล่นที่ชื่นชอบเกมกระดาน เกมวางกลยุทธ์แบบสลับรอบ (Turn-based Board Game) และเกมทอยลูกเต๋า

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Roll Dice**: ผู้เล่นกดปุ่มทอยลูกเต๋า (Dice Rolling 3D Tween Animation) เพื่อสุ่มแต้มเดิน 1-6
2. **Pawn Movement**: ตัวเดินเคลื่อนที่ตามจำนวนแต้มเต๋าที่ทอยได้ ไปตามช่องกระดานวนรอบ
3. **Tile Events**:
   - **Unowned Property**: เลือกซื้อที่ดินสร้างสิ่งปลูกสร้าง
   - **Enemy Property**: จ่ายค่าเช่าให้แก่คู่แข่งตามระดับการอัปเกรด
   - **Chance Tile**: สุ่มเปิดการ์ดโชคดี (รับเหรียญโบนัส / วาร์ปฟรี) หรือการ์ดโชคร้าย (เสียค่าปรับ)
4. **Win Condition**: ล้มละลายคู่แข่ง หรือสะสมเงินทุนถึงเป้าหมายที่กำหนด (เช่น 10,000 Gold)

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `public/assets/kenney_boardgame-pack/PNG/`

| Category | Asset Key | File Name | Description |
|---|---|---|---|
| **Dice** | `dice_1` - `dice_6` | `diceRed1.png` - `diceRed6.png` | ชุดลูกเต๋า 6 ด้านสำหรับแสดงผลทอย |
| **Player Pawn** | `pawn_blue` | `pawn_blue.png` | ตัวเดินฝั่งผู้เล่น |
| **AI Pawn** | `pawn_red` | `pawn_red.png` | ตัวเดินฝั่ง AI คู่แข่ง |
| **Board Tiles** | `tile_property` | `tile_green.png` | ช่องที่ดินสำหรับซื้อขาย |
| **Chance Cards** | `card_chance` | `card_back.png` | การ์ดเหตุการณ์สุ่ม |

---

## 4. Controls & Input Mapping

| Action | Control Input |
|---|---|
| Roll Dice | Click "Roll Dice" Button / Press `Space` |
| Buy Property | Click "Buy Property" Modal Button |
| End Turn | Auto after tile action completes |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/dice-quest/`
  - `index.html` — Board Grid & UI Controls
  - `game.js` — Turn State, Dice Roller & Monopoly Logic
  - `styles.css` — Board Layout & CSS Animations

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
