# 🛸 Lunar Lander Gravity — Game Design Document & Dev Specs

**Code Name:** `lunar-lander` (G015)  
**Game ID:** `lunar-lander`  
**Engine / Tech:** Phaser 3 Physics (Arcade / Gravity Physics)  
**Asset Pack:** Kenney Simple Space (`public/assets/kenney_simple-space/`)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-28  
**Status:** Proposal / Design Phase | **Priority:** Medium (Sprint 04)  

---

## 1. Game Overview

### Elevator Pitch
เกมลงจอดดวงดาวระบบฟิสิกส์คลาสสิก (Lunar Lander / Physics Thruster) ผู้เล่นคุมแรงดันไอพ่นและทิศทางของจรวดอวกาศเพื่อนำยานลงจอดบนแท่นเป้าหมายบนดาวเคราะห์อย่างปลอดภัย ภายใต้สนามแรงดึงดูดและปริมาณเชื้อเพลิงที่จำกัด

### Target Audience
ผู้เล่นสาย Physics Simulation, Skill-based Challenge และผู้ที่ชอบเกมท้าทายจังหวะการควบคุม

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Thrust & Vectoring**: บังคับไอพ่นหลัก (Main Thruster) และไอพ่นปรับทิศทางซ้าย-ขวา (Attitude Thrusters) เพื่อสู้กับแรงดึงดูดของดาวเคราะห์
2. **Fuel Management**: บริหารเชื้อเพลิง (Fuel Tank) ที่มีอยู่อย่างจำกัด การกดไอพ่นค้างจะสิ้นเปลืองเชื้อเพลิงอย่างรวดเร็ว
3. **Safe Landing Conditions**:
   - ความเร็วแนวดิ่ง (Vertical Velocity): ไม่เกิน -30 px/s
   - องศาตั้งตรงของยาน (Angle): ไม่เกิน ±5 องศา
   - ตำแหน่ง: อยู่ภายในแท่นลงจอด (Landing Pad)
4. **Crash Condition**: หากความเร็วเกินกำหนด องศาเอียงเกิน หรือชนโขดหิน ยานจะระเบิดเสียหายทันที (Crash Explosion)

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `public/assets/kenney_simple-space/PNG/Default/`

| Category | Asset Key | File Name | Description |
|---|---|---|---|
| **Lander Ship** | `ship_lander` | `ship_A.png` | ยานจรวดลงจอดหลัก |
| **Landing Pad** | `landing_pad` | `station_A.png` | แท่นลงจอดเป้าหมายบนดาว |
| **Obstacles** | `moon_rock` | `meteor_large.png` | โขดหินและอุกกาบาตกั้นทาง |
| **Thruster VFX** | `thruster_fire` | `effect_yellow.png` | เปลวไฟไอพ่นเมื่อกดจุดจรวด |

---

## 4. Controls & Input Mapping

| Action | Keyboard Mapping | Touch Screen Mapping |
|---|---|---|
| ไอพ่นหลัก (Main Thrust) | Arrow Up (`↑`) / Key `W` / `Space` | Press & Hold Thrust Button |
| หมุนทิศทางซ้าย | Arrow Left (`←`) / Key `A` | Touch Left Screen Area |
| หมุนทิศทางขวา | Arrow Right (`→`) / Key `D` | Touch Right Screen Area |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/lunar-lander/`
  - `index.html` — Canvas & Telemetry HUD (Speed, Angle, Fuel)
  - `game.js` — Phaser Physics Gravity & Thruster Vector Scene
  - `styles.css` — Telemetry HUD Styling

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
