---
title: "🧩 Block Collapse — Game Design Document & Dev Specs"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Proposal"
tags:
  - gdd
  - block-collapse
---

# 🧩 Block Collapse — Game Design Document & Dev Specs

**Code Name:** `block-collapse` (G013)  
**Game ID:** `block-collapse`  
**Engine / Tech:** HTML5 Canvas API / Vanilla JS  
**Asset Pack:** Kenney Puzzle Pack 2 (`public/assets/kenney_puzzle-pack-2/`)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-28  
**Status:** Proposal / Design Phase | **Priority:** Medium (Sprint 03)  

---

## 1. Game Overview

### Elevator Pitch
เกมปริศนาจับคู่ทำลายบล็อกสี (Match-3 / Tap-to-Clear Collapse Puzzle) ผู้เล่นสลับตำแหน่งหรือคลิกกลุ่มบล็อกสีเดียวกันที่อยู่ติดกันตั้งแต่ 3 ชิ้นขึ้นไปเพื่อทำลาย สร้างคอมโบให้บล็อกด้านบนหล่นลงมาตามแรงโน้มถ่วง

### Target Audience
ผู้เล่นสาย Puzzle / Casual ที่ชอบเกมเล่นเพลิน คลายเครียด และชอบสร้างสะสมคะแนน Combo

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Block Grid**: ตารางบล็อกสี 8x8 สุ่มบล็อกสีต่างกัน 5 สี
2. **Swap / Tap Match**:
   - **Swap Mode:** สลับบล็อก 2 ชิ้นที่อยู่ติดกันเพื่อสร้างแถวเรียง 3+ ชิ้น
   - **Tap Mode:** แตะกลุ่มบล็อกสีเดียวกันตั้งแต่ 2-3 ชิ้นขึ้นไปเพื่อทำลาย
3. **Cascading Gravity Fall**: บล็อกที่อยู่ด้านบนจะหล่นลงมาแทนที่ช่องว่างตามแรงโน้มถ่วง สปอว์นบล็อกใหม่จากขอบบน
4. **Combo Chain**: หากการหล่นเกิดการเรียงตรงกันซ้ำ จะเกิดคะแนนสะสมคอมโบทวีคูณ (Combo x2, x3, x4...)
5. **Game Modes**:
   - **Time Attack:** ทำคะแนนสูงสุดในเวลา 60 วินาที
   - **Moves Challenge:** ทำคะแนนเป้าหมายใน 30 ก้าว

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `public/assets/kenney_puzzle-pack-2/PNG/`

| Category | Asset Key | File Name | Description |
|---|---|---|---|
| **Blocks** | `block_red` - `block_yellow` | `element_red_square.png` - `element_yellow_square.png` | ชิ้นส่วนบล็อกสีทรงสี่เหลี่ยม 5 สี |
| **Special Block** | `block_bomb` | `element_explosive.png` | บล็อกระเบิดทำลายรอบทิศทาง 3x3 |
| **UI Panel** | `panel_bg` | `panel_glass.png` | กรอบ UI สไตล์ Glassmorphism |

---

## 4. Controls & Input Mapping

| Action | Mapping |
|---|---|
| Select / Swap Block | Mouse Click & Drag / Touch Swipe |
| Tap Group | Single Mouse Click / Single Touch Tap |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/block-collapse/`
  - `index.html` — Canvas & Score UI
  - `game.js` — Grid Match Algorithm, Cascade Gravity & Combo System
  - `styles.css` — Modern UI Styling

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
