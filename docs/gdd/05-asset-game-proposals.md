---
title: "🎨 Game Proposals & Asset Expansion Roadmap — GDD"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Antigravity AI & Dev Team"
status: "Active"
tags:
  - gdd
---

# 🎨 Game Proposals & Asset Expansion Roadmap — GDD

**Version:** 1.0.0 | **Last Updated:** 2026-07-28  
**Author:** Antigravity AI & Dev Team  
**Location:** `docs/gdd/05-asset-game-proposals.md`

---

## 1. Executive Summary

เอกสารฉบับนี้จัดทำขึ้นเพื่อวิเคราะห์และเสนอแนวทางการนำ **Game Assets** ที่มีอยู่ในโฟลเดอร์ `public/assets/` มาปรับปรุง ประยุกต์ และพัฒนาเป็นมินิเกม HTML5 / Phaser 3 / Babylon.js เพิ่มเติมลงในคลัง **GameDevJS Hub (`webJS`)** เพื่อขยายความหลากหลายของแนวเกม (Puzzle, Arcade, Action, Board Game, Farming Sim) และเพิ่มคุณค่าให้แก่โปรเจกต์ Portfolio

---

## 2. Asset Pack Analysis & Proposed Game Concepts

### 🐠 Proposal 1: Ocean Frenzy (`kenney_fish-pack_2`) — Code Name: `G009`

- **Asset Location:** `public/assets/kenney_fish-pack_2/`
- **Game Title:** **Ocean Frenzy (เกมปลาใหญ่กินปลาเล็ก)**
- **Engine:** Phaser 3 (2D Arcade Physics)
- **Target Audience:** Casual / Arcade Players
- **Gameplay Mechanics:**
  - **Core Loop:** ควบคุมปลาตัวเล็กว่ายน้ำในมหาสมุทร ไล่กินปลาที่มีขนาดเล็กกว่าเพื่อเพิ่มสะสมคะแนนและขยายขนาดตัว (Growth Progression)
  - **Obstacles & Hazards:** หลบหลีกปลาที่มีขนาดใหญ่กว่า, แมงกะพรุนพิษ (ทำให้เคลื่อนที่ช้าลง) และสิ่งกีดขวางใต้น้ำ
  - **Power-ups:** เก็บทุ่นฟองอากาศเพื่อเพิ่มความเร็ว (Speed Boost) หรือเกราะป้องกันชั่วคราว
- **VFX & Audio:** ฟองอากาศปะทุ (Bubble Particle VFX) พร้อมเสียงน้ำและเสียงกินเหยื่อจาก Web Audio API

---

### 🎲 Proposal 2: Dice Quest & Monopoly Mini (`kenney_boardgame-pack`) — Code Name: `G010`

- **Asset Location:** `public/assets/kenney_boardgame-pack/`
- **Game Title:** **Dice Quest (เกมกระดานทอยลูกเต๋าวางกลยุทธ์)**
- **Engine:** Vanilla JS / Phaser 3
- **Target Audience:** Board Game & Strategy Lovers
- **Gameplay Mechanics:**
  - **Core Loop:** ผู้เล่นทอยลูกเต๋า (Dice Rolling 3D Animation) เพื่อเดินตัวป้อน (Pawns) ไปตามช่องกระดาน
  - **Board Events:** ช่องซื้อที่ดิน, ช่องการ์ดโชคดี/โชคร้าย (Chance Cards), ช่องเก็บค่าเช่า และช่องกิจกรรมสู้กับ AI
  - **Win Condition:** ทำคะแนนเงินทุนสูงสุดหรือยึดครองพื้นที่กระดานได้มากกว่า 70%
- **VFX & Audio:** เสียงทอยลูกเต๋ากระทบกระดาน และเสียงเหรียญทองสะสม

---

### 👾 Proposal 3: Pico Tower Climber (`kenney_pico-8-platformer`) — Code Name: `G011`

- **Asset Location:** `public/assets/kenney_pico-8-platformer/`
- **Game Title:** **Pico Tower Climber (เกมพิกเซลไต่หอคอยไร้ขีดจำกัด)**
- **Engine:** Phaser 3 (Tilemap & Retro Pixel Physics)
- **Target Audience:** Retro Game Fans & Precision Gamers
- **Gameplay Mechanics:**
  - **Core Loop:** ควบคุมตัวละครพิกเซลสไตล์ 8-bit วิ่ง กระโดด และไต่กำแพง (Wall Jump) เพื่อปีนขึ้นหอคอยความสูงไร้ขีดจำกัด (Infinite Vertical Climber)
  - **Hazards:** ระดับลาวาหรือน้ำพิษดันขึ้นมาจากด้านล่างเรื่อยๆ, หนามพิกเซล และศัตรูบิน
  - **Collectibles:** เก็บเหรียญทองเพื่อปลดล็อกสกินตัวละครพิกเซลใหม่
- **VFX & Audio:** 8-bit Retro Chiptune SFX สังเคราะห์ผ่าน Web Audio API

---

### 🚀 Proposal 4: Pixel Bullet Hell (`kenney_pixel-shmup`) — Code Name: `G012`

- **Asset Location:** `public/assets/kenney_pixel-shmup/`
- **Game Title:** **Pixel Bullet Hell (เกมยานยิงแนวตั้ง)**
- **Engine:** Phaser 3 (Arcade Physics / Particle Emitter)
- **Target Audience:** Action / Arcade / Shmup Fans
- **Gameplay Mechanics:**
  - **Core Loop:** บังคับยานอวกาศพิกเซลยิงต่อสู้กับคลื่นยานศัตรูในแนวตั้ง (Vertical Shoot 'em Up)
  - **Weapon Upgrade System:** เก็บโบนัสเปลี่ยนรูปแบบกระสุน (Spread Shot, Laser Beam, Homing Missile)
  - **Boss Battle:** ดวลกับยานบอสขนาดใหญ่ท้ายด่านที่มีรูปแบบกระสุนกระจายวงกว้าง (Bullet Hell Patterns)
- **VFX & Audio:** เอฟเฟกต์การระเบิดของยาน และเสียงเลเซอร์ยิงรัว

---

### 🧩 Proposal 5: Block Collapse & Swap (`kenney_puzzle-pack-2`) — Code Name: `G013`

- **Asset Location:** `public/assets/kenney_puzzle-pack-2/`
- **Game Title:** **Block Collapse (เกมปริศนาสลับทำลายบล็อกสี)**
- **Engine:** Vanilla JS / HTML5 Canvas API
- **Target Audience:** Puzzle & Casual Match Gamers
- **Gameplay Mechanics:**
  - **Core Loop:** สลับหรือแตะกลุ่มบล็อกปริศนาที่มีสีเดียวกันตั้งแต่ 3 ชิ้นขึ้นไปเพื่อทำลายและสะสมคะแนน Combo
  - **Gravity & Cascading:** บล็อกด้านบนหล่นลงมาแทนที่ตามแรงโน้มถ่วง สร้างโอกาสเกิดคอมโบต่อเนื่อง
  - **Game Modes:** Mode จับเวลา (Time Attack 60s) และ Mode จำนวนก้าวจำกัด (Moves Challenge)

---

### 🚜 Proposal 6: Tiny Farm Tycoon (`kenney_tiny-farm`) — Code Name: `G014`

- **Asset Location:** `public/assets/kenney_tiny-farm/`
- **Game Title:** **Tiny Farm Tycoon (เกมผสานและบริหารฟาร์มพิกเซล)**
- **Engine:** Phaser 3 (Top-down Tilemap & Merge System)
- **Target Audience:** Casual / Simulation / Merge Game Fans
- **Gameplay Mechanics:**
  - **Core Loop:** ปลูกพืชบนแปลงผัก ลากผสานพืชประเภทเดียวกัน (Merge 3) เพื่อพัฒนาเป็นพืชระดับสูงที่ให้ผลตอบแทนมากขึ้น
  - **Harvest & Trade:** เก็บเกี่ยวผลผลิตนำไปขายในตลาดเพื่อนำเงินมาซื้อแปลงดินและสัตว์เลี้ยงฟาร์มเพิ่ม (วัว, หมู, ไก่)
  - **Idle Progression:** สะสมรายได้แบบอัตโนมัติขณะเปิดเกมไว้

---

### 🛸 Proposal 7: Lunar Lander Gravity (`kenney_simple-space`) — Code Name: `G015`

- **Asset Location:** `public/assets/kenney_simple-space/`
- **Game Title:** **Lunar Lander Gravity (เกมลงจอดดวงดาวระบบฟิสิกส์)**
- **Engine:** Phaser 3 Physics / Babylon.js
- **Target Audience:** Physics & Challenge Game Lovers
- **Gameplay Mechanics:**
  - **Core Loop:** บังคับจรวดลงจอดบนแท่นเป้าหมายบนดาวเคราะห์ โดยต้องปรับแรงดันไอพ่นและองศาของยานเพื่อต้านทานแรงดึงดูด
  - **Fuel Management:** บริหารเชื้อเพลิงที่มีอยู่อย่างจำกัด หากลงจอดแรงเกินไป ยานจะระเบิดเสียหาย

---

## 3. Game Development Summary Matrix

| Code | Game Title | Asset Pack | Proposed Engine | Estimated Scope | Priority Roadmap |
|------|------------|------------|-----------------|-----------------|------------------|
| `G009` | Ocean Frenzy | `kenney_fish-pack_2` | Phaser 3 | Medium (8-12 hrs) | Sprint 03 |
| `G010` | Dice Quest | `kenney_boardgame-pack` | Vanilla JS / Phaser | Medium (10-14 hrs) | Sprint 03 |
| `G011` | Pico Tower Climber | `kenney_pico-8-platformer` | Phaser 3 (Tilemap) | Large (16-20 hrs) | Sprint 04 |
| `G012` | Pixel Bullet Hell | `kenney_pixel-shmup` | Phaser 3 | Medium (12-16 hrs) | Sprint 04 |
| `G013` | Block Collapse | `kenney_puzzle-pack-2` | Canvas 2D | Small (6-8 hrs) | Sprint 03 |
| `G014` | Tiny Farm Tycoon | `kenney_tiny-farm` | Phaser 3 | Large (16-24 hrs) | Sprint 05 |
| `G015` | Lunar Lander Gravity | `kenney_simple-space` | Phaser 3 Physics | Medium (10-12 hrs) | Sprint 04 |

---

## 4. Integration with Portfolio Architecture

1. **Single Page Container (Iframe Modal):** ทุกเกมที่เสนอใหม่จะถูกพัฒนาให้อยู่ในไดเรกทอรี `public/games/<game-code>/index.html` เพื่อเรียกเล่นผ่าน Modal Iframe
2. **Global High Score Persistence:** ใช้ `window.parent.postMessage` ส่งคะแนนสูงสุดเมื่อจบเกม เข้าสู่ระบบ `localStorage`
3. **Web Audio API Engine:** ใช้ระบบสังเคราะห์เสียงเรียลไทม์เพื่อลดขนาดการดาวน์โหลดไฟล์ `.mp3` ภายนอก

---

## Related Documents
- [Game Concept & Architecture](./00-concept.md)
- [Core Mechanics](./01-mechanics.md)
- [Art & UI/UX Guidelines](./03-art-direction.md)
- [Assets Catalog Guide](../wiki/assets-guide.md)
- [Product Backlog](../agile/01-product-backlog.md)
