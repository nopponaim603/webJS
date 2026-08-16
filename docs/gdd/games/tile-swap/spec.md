---
title: "🧩 Tile Swap (Phaser 2D) — Game Design Document & Dev Specs"
version: "1.1.0"
last_updated: "2026-07-29"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - tile-swap
---

# 🧩 Tile Swap (Phaser 2D) — Game Design Document & Dev Specs

**Code Name:** `tile-swap` (G006)  
**Game ID:** `tile-swap`  
**Engine:** Phaser 3 (v3.80.1)  
**Assets Pack:** Kenney Starter-Kit-Match-3 & Puzzle Pack 2 (CC0 Public Domain License)  
**Version:** 1.1.0 | **Last Updated:** 2026-07-29  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมสลับไทล์บล็อกสี 3 ใบในแถว/คอลัมน์ (Tile Swap / Match 3 Puzzle Game) สไตล์คลาสสิก พัฒนาด้วย Phaser 3 เอนจินบนสถาปัตยกรรม 2D Canvas ผู้เล่นทำการสลับตำแหน่งไทล์บล็อกสีทรงสี่เหลี่ยมบนตาราง 7x7 เพื่อทำลายล้างไทล์ เรียงคอมโบต่อเนื่อง สะสมคะแนน และทำเป้าหมายให้สำเร็จก่อนสภาวะทางเดินเล่นหมดลง (Endless Mode)

### Target Audience
ผู้เล่นทุกเพศทุกวัยที่ชอบเกมแนว Tile Swap, Match-3 Puzzle, Block Swapping, Bejeweled, Candy Crush

---

## 2. Asset Catalog & Visual Breakdown

### 🧩 2.1 Block Color Tiles & Special Assets

| Visual | Phaser Key | Source File | Description |
|:---:|---|---|---|
| ![Red Tile](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20red/tileRed_01.png) | `gem_red` | `tileRed_01.png` | ไทล์บล็อกสีแดง (Red Color Tile) |
| ![Blue Tile](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20blue/tileBlue_01.png) | `gem_blue` | `tileBlue_01.png` | ไทล์บล็อกสีน้ำเงิน (Blue Color Tile) |
| ![Green Tile](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20green/tileGreen_01.png) | `gem_green` | `tileGreen_01.png` | ไทล์บล็อกสีเขียว (Green Color Tile) |
| ![Yellow Tile](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20yellow/tileYellow_01.png) | `gem_yellow` | `tileYellow_01.png` | ไทล์บล็อกสีเหลือง (Yellow Color Tile) |
| ![Orange Tile](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20orange/tileOrange_01.png) | `gem_orange` | `tileOrange_01.png` | ไทล์บล็อกสีส้ม (Orange Color Tile) |
| ![Pink Tile](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20pink/tilePink_01.png) | `gem_pink` | `tilePink_01.png` | ไทล์บล็อกสีชมพู (Pink Color Tile) |

---

### 🔊 2.2 Audio Assets (Kenney Sound Effects)

| SFX Key | Audio File | Usage |
|---|---|---|
| `sfx_swap` | `public/assets/kenney-starter-kit-match-3/sounds/tile-swap.ogg` | เสียงเมื่อสลับตำแหน่งไทล์สี่เหลี่ยม |
| `sfx_match` | `public/assets/kenney-starter-kit-match-3/sounds/tile-match.ogg` | เสียงเอฟเฟกต์เมื่อสลายไทล์จับคู่ 3 ใบสำเร็จ |
| `sfx_land` | `public/assets/kenney-starter-kit-match-3/sounds/tile-land.ogg` | เสียงไทล์ตกลงกระแทกพื้นตารางด้านล่าง |

---

## 3. Gameplay Mechanics & Systems

### Core Loop
1. **Selection & Swap**: ผู้เล่นเลือกคลิกไทล์ลูกที่หนึ่ง และคลิกไทล์ข้างเคียง เพื่อสลับตำแหน่ง
2. **Match Checking**: ระบบตรวจสอบว่าเกิดไทล์สีเดียวกันเรียงต่อกัน 3 ใบขึ้นไปในแนวนอนหรือแนวตั้งหรือไม่
3. **Destruction & Particle VFX**: 
   - หาก **พบ Match**: สลายไทล์ เกิดเอฟเฟกต์ละอองสี (Particle Burst) ได้รับคะแนน (+100 คะแนน/ใบ x Combo Multiplier)
   - หาก **ไม่พบ Match**: เล่นเสียง `sfx_swap` และเลื่อนไทล์กลับตำแหน่งเดิมอัตโนมัติ (Revert Swap)
4. **Gravity & Cascade Combo**: ไทล์ด้านบนไหลลงมาแทนที่ช่องว่าง และสร้างไทล์ใหม่หล่นมาจากด้านบน หากเกิด Match ใหม่ จะเกิดปฏิกิริยาลูกโซ่ (Cascade Combo) เพิ่มคูณคะแนน `Combo x2`, `Combo x3`
5. **Win / Game Over**: โหมดการเล่นไร้ขีดจำกัด (Endless Mode) สิ้นสุดเกมเมื่อกระดานไม่มีตำแหน่งไทล์ที่สามารถสลับคู่ได้เหลืออยู่อีกต่อไป

---

## 4. Technical Architecture & File Structure

```
public/games/tile-swap/
├── index.html       ← Responsive 2D Canvas Container
└── game.js          ← Phaser 3 Match Engine, Swap Grid Logic, Combo Multipliers
```

---

## 5. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
- Project Index: [docs/index.md](../../index.md)
