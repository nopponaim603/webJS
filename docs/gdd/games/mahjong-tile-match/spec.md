---
title: "🀄 Mahjong Tile Match (ไพ่นกกระจอก) — Game Design Document & Dev Specs"
version: "1.1.0"
last_updated: "2026-07-29"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - mahjong-tile-match
---

# 🀄 Mahjong Tile Match (ไพ่นกกระจอก) — Game Design Document & Dev Specs

**Code Name:** `tile-match` (G003)  
**Game ID:** `tile-match` / `mahjong-tile-match`  
**Engine / Tech:** HTML5, CSS Grid & Transforms, Vanilla JavaScript  
**Version:** 1.1.0 | **Last Updated:** 2026-07-29  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมปริศนาจับคู่ไทล์ 3 ใบสไตล์ไพ่นกกระจอก (Mahjong Triple Match / Sheep N Sheep style) ผู้เล่นคลิกเลือกไทล์จากชั้นต่างๆ ลงมาพักในถาดเก็บ เมื่อสะสมไทล์หน้าเดียวกันได้ครบ 3 ใบ ไทล์จะหายไปและได้คะแนน

---

## 2. Gameplay Mechanics

### Core Loop
1. **Layered Board**: ไทล์ถูกเรียงซ้อนกันเป็นเลเยอร์ ไทล์ที่ถูกทับซ้อนจะไม่สามารถคลิกได้จนกว่าไทล์ด้านบนจะถูกย้ายออก
2. **Holder Bar (7 Slots)**: ผู้เล่นเลือกคลิกไทล์ลงในถาดพักล่าง ซึ่งรองรับสูงสุด 7 ช่อง
3. **Triple Match**: เมื่อไทล์ลายเดียวกันสะสมครบ 3 ใบในถาดพัก จะทำการสลายหายไปทันที (Clear Match)
4. **Win / Lose**:
   - **Win:** เคลียร์ไทล์ทั้งหมดบนกระดานสำเร็จ
   - **Lose:** ถาดพักเต็ม 7 ใบ โดยไม่สามารถจับคู่ 3 ใบได้

---

## 3. File Structure & Assets

- **Game Files:** `public/games/mahjong-tile-match/`
  - `index.html` — Board Layout & Holder Container
  - `styles.css` — Tile Layering, Shadow Depth & Match Animations
  - `game.js` — Board Layout Generator, Layer Overlap Check, Match Engine

---

## 4. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
