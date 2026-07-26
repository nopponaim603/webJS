# 💎 Kenney Match 3 (Phaser 2D) — Game Design Document & Dev Specs

**Code Name:** `match-3` (G006)
**Game ID:** `match3`  
**Engine:** Phaser 3 (v3.80.1)  
**Assets Pack:** Kenney Starter-Kit-Match-3 & Puzzle Pack 2 (CC0 Public Domain License)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-26  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมจับคู่เพชร 3 ในแถว/คอลัมน์ (Match 3 Puzzle Game) สไตล์คลาสสิก พัฒนาด้วย Phaser 3 เอนจินบนสถาปัตยกรรม 2D Canvas ผู้เล่นทำการสลับตำแหน่งเพชรอัญมณีหลากสีสันบนตาราง 7x7 เพื่อทำลายล้างเพชร เรียงคอมโบต่อเนื่อง สะสมคะแนน และทำเป้าหมายให้สำเร็จก่อนจำนวนครั้ง (Moves) จะหมดลง

### Target Audience
ผู้เล่นทุกเพศทุกวัยที่ชอบเกมแนว Match-3 Puzzle, Bejeweled, Candy Crush

---

## 2. Asset Catalog & Visual Breakdown

### 💎 2.1 Gem Tiles & Special Assets

| Visual | Phaser Key | Source File | Description |
|:---:|---|---|---|
| ![Red Gem](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20red/tileRed_01.png) | `gem_red` | `tileRed_01.png` | อัญมณีสีแดง (Red Gem Tile) |
| ![Blue Gem](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20blue/tileBlue_01.png) | `gem_blue` | `tileBlue_01.png` | อัญมณีสีน้ำเงิน (Blue Gem Tile) |
| ![Green Gem](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20green/tileGreen_01.png) | `gem_green` | `tileGreen_01.png` | อัญมณีสีเขียว (Green Gem Tile) |
| ![Yellow Gem](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20yellow/tileYellow_01.png) | `gem_yellow` | `tileYellow_01.png` | อัญมณีสีเหลือง (Yellow Gem Tile) |
| ![Orange Gem](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20orange/tileOrange_01.png) | `gem_orange` | `tileOrange_01.png` | อัญมณีสีส้ม (Orange Gem Tile) |
| ![Pink Gem](../../../../public/assets/kenney_puzzle-pack-2/PNG/Tiles%20pink/tilePink_01.png) | `gem_pink` | `tilePink_01.png` | อัญมณีสีชมพู (Pink Gem Tile) |

---

### 🔊 2.2 Audio Assets (Kenney Sound Effects)

| SFX Key | Audio File | Usage |
|---|---|---|
| `sfx_swap` | `public/assets/kenney-starter-kit-match-3/sounds/tile-swap.ogg` | เสียงเมื่อสลับตำแหน่งอัญมณีหรือเลือกเพชร |
| `sfx_match` | `public/assets/kenney-starter-kit-match-3/sounds/tile-match.ogg` | เสียงเอฟเฟกต์เมื่อสลายเพชรจับคู่สำเร็จ |
| `sfx_land` | `public/assets/kenney-starter-kit-match-3/sounds/tile-land.ogg` | เสียงเพชรหล่นกระแทกลงสู่ช่องตารางด้านล่าง |

---

## 3. Gameplay Mechanics & Systems

### Core Loop
1. **Selection & Swap**: ผู้เล่นเลือกคลิกเพชรลูกที่หนึ่ง และคลิกเพชรลูกข้างเคียง (หรือลากเมาส์) เพื่อสลับตำแหน่ง
2. **Match Checking**: ระบบตรวจสอบว่าเกิดเพชรสีเดียวกันเรียงต่อกัน 3 ลูกขึ้นไปในแนวนอนหรือแนวตั้งหรือไม่
3. **Destruction & Particle VFX**: 
   - หาก **พบ Match**: สลายเพชร เกิดเอฟเฟกต์ละอองสี (Particle Burst) ได้รับคะแนน (+100 คะแนน/ลูก x Combo Multiplier)
   - หาก **ไม่พบ Match**: เล่นเสียง `sfx_swap` และเลื่อนเพชรกลับตำแหน่งเดิมอัตโนมัติ (Revert Swap)
4. **Gravity & Cascade Combo**: เพชรด้านบนไหลลงมาแทนที่ช่องว่าง และสร้างเพชรใหม่หล่นมาจากด้านบน หากเกิด Match ใหม่ จะเกิดปฏิกิริยาลูกห่วง (Cascade Combo) เพิ่มคูณคะแนน `Combo x2`, `Combo x3`
5. **Win / Game Over**: มีจำนวนครั้งการสลับทั้งหมด 25 Moves หากทำคะแนนถึงเป้าหมาย 3,000 คะแนน จะถือว่าชนะเลิศ

---

## 4. Technical Architecture & File Structure

- **Game Files:** `public/games/match3/`
  - `index.html` — HTML Canvas Container & Phaser Loader
  - `game.js` — Game Config, Grid Matrix Engine, Swap Tweens, Cascade Logic, Web Audio SFX

---

## 5. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
- Project Index: [docs/index.md](../../index.md)
