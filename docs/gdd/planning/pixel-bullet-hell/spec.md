# 🚀 Pixel Bullet Hell — Game Design Document & Dev Specs

**Code Name:** `pixel-bullet-hell` (G012)  
**Game ID:** `pixel-bullet-hell`  
**Engine / Tech:** Phaser 3 (Arcade Physics / Bullet Emitter)  
**Asset Pack:** Kenney Pixel Shmup (`public/assets/kenney_pixel-shmup/`)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-28  
**Status:** Proposal / Design Phase | **Priority:** Medium (Sprint 04)  

---

## 1. Game Overview

### Elevator Pitch
เกมยานยิงอวกาศพิกเซลแนวตั้ง (Vertical Shoot 'em Up / Bullet Hell) สู้กับคลื่นยานเอเลี่ยน ยิงเก็บ Power-up อัปเกรดปืนรวดเร็ว และดวลกับยานบอสขนาดใหญ่ที่ปล่อยกระสุนเต็มหน้าจอ

### Target Audience
แฟนเกมยิงยานคลาสสิก (Raiden / Galaga / Touhou Style) ที่ชอบความรวดเร็ว ตื่นเต้น และเน้นทักษะการหลบกระสุน

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Move & Shoot**: บังคับยานผู้เล่นหลบกระสุนและยิงทำลายฝูงยานศัตรูที่บินลงมาจากด้านบน
2. **Power-up Collection**: เก็บไอเทมเพื่อเปลี่ยนและอัปเกรดกระสุน (Spread Shot 3 ทิศทาง, Laser Beam, Homing Missile)
3. **Boss Encounter**: ดวลกับยานบอสประจำด่านที่มีแถบพลังชีวิตหนา และปล่อยรูปแบบกระสุนกระจายเป็นวงกว้าง (Bullet Hell Patterns)
4. **Bomb Ability**: กดใช้ระเบิดทำลายกระสุนทั้งหมดบนหน้าจอเมื่อตกอยู่ในสถานะวิกฤต (Smart Bomb)

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `public/assets/kenney_pixel-shmup/PNG/`

| Category | Asset Key | File Name | Description |
|---|---|---|---|
| **Player Ship** | `ship_pixel` | `ship_0001.png` | ยานผู้เล่นพิกเซลหลัก |
| **Enemy Ships** | `enemy_pixel_1` | `ship_0005.png` | ยานเอเลี่ยนจู่โจมระลอกแรก |
| **Boss Ship** | `boss_pixel` | `ship_0012.png` | ยานบอสขนาดใหญ่ท้ายด่าน |
| **Projectiles** | `laser_red` | `tile_0001.png` | กระสุนเลเซอร์สีแดงผู้เล่น |
| **Enemy Bullet** | `bullet_yellow` | `tile_0004.png` | กระสุนศัตรูสำหรับสร้าง Bullet Hell |

---

## 4. Controls & Input Mapping

| Action | Input Device |
|---|---|
| เคลื่อนที่ยาน | Mouse Drag / Touch Drag / Arrow Keys |
| ยิงกระสุน | Auto Fire / Key `Space` |
| ใช้ Smart Bomb | Double Tap / Key `B` / Click Bomb Icon |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/pixel-bullet-hell/`
  - `index.html` — Game Canvas & Container
  - `game.js` — Bullet Pool, Boss Pattern & Phaser Physics Scene
  - `styles.css` — Sci-Fi Arcade HUD

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
