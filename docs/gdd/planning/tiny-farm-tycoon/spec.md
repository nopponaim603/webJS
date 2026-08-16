---
title: "🚜 Tiny Farm Tycoon — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Proposal"
tags:
  - gdd
  - tiny-farm-tycoon
---
# 🚜 Tiny Farm Tycoon — Game Design Document & Dev Specs

**Code Name:** `tiny-farm-tycoon` (G014)  
**Game ID:** `tiny-farm-tycoon`  
**Engine / Tech:** Phaser 3 (Top-down Tilemap & Merge System)  
**Asset Pack:** Kenney Tiny Farm (`public/assets/kenney_tiny-farm/`)  

---

## 1. Game Overview

### Elevator Pitch
เกมบริหารฟาร์มพิกเซลอาร์ตน่ารัก (Idle Farming & Merge Crops) ผู้เล่นพรวนดิน ปลูกผัก และนำพืชผลชนิดเดียวกันลากมาผสานกัน (Merge 3) เพื่อพัฒนาเป็นพืชพันธุ์ระดับสูงที่สร้างรายได้มหาศาล พร้อมเลี้ยงสัตว์ฟาร์มและส่งของขายในตลาด

### Target Audience
ผู้เล่นที่ชื่นชอบเกมแนว Farming Sim, Merge Game, Idle Tycoon และเกมบรรยากาศสบายๆ (Cozy Games)

---

## 2. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Plant & Water**: พรวนแปลงดิน และปลูกเมล็ดพันธุ์พืชผลบนแปลงผัก 4x4
2. **Merge Evolution**: ลากพืชชนิดและระดับเดียวกัน 3 ต้นมาทับกัน (Merge 3) เพื่อพัฒนาเป็นพืชระดับถัดไป (เช่น ต้นกล้า ➔ ผักกาด ➔ หัวไชเท้า ➔ ฟักทองทองคำ)
3. **Harvest & Market Trade**: เก็บเกี่ยวผลผลิตนำไปขายในตลาดเพื่อรับเหรียญทอง (Gold Coins)
4. **Expand Farm**: นำเงินไปขยายพื้นที่แปลงผัก ซื้อคอกสัตว์เลี้ยง (วัว, หมู, ไก่) และเครื่องมือเกษตรอัตโนมัติ

---

## 3. Asset Catalog & Visual Breakdown

- **Asset Path:** `public/assets/kenney_tiny-farm/PNG/`

| Category | Asset Key | File Name | Description |
|---|---|---|---|
| **Crops** | `crop_carrot` | `crop_carrot.png` | แครอท (พืชระดับ 1) |
| **Crops** | `crop_radish` | `crop_radish.png` | หัวไชเท้า (พืชระดับ 2) |
| **Crops** | `crop_pumpkin` | `crop_pumpkin.png` | ฟักทอง (พืชระดับ 3) |
| **Animals** | `cow_pixel` | `animal_cow.png` | วัวนม สำหรับผลิตนมสด |
| **Tileset** | `farm_tiles` | `tilesheet_farm.png` | ไทล์แปลงดิน, รั้วไม้, หญ้า, บ้านฟาร์ม |

---

## 4. Controls & Input Mapping

| Action | Control Input |
|---|---|
| Plant / Merge Crop | Drag & Drop / Touch Drag Crop to Tile |
| Harvest Crop | Click / Tap Crop when Ready |
| Buy Upgrades | Click Shop UI Modal Button |

---

## 5. Technical Directory Structure

- **Game Path:** `public/games/tiny-farm-tycoon/`
  - `index.html` — Canvas Container & Shop UI
  - `game.js` — Merge Logic, Crop Growth Timer & Phaser Top-down Scene
  - `styles.css` — Cozy Farm UI Styling

---

## 🔗 Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- Asset Expansion Proposals: [docs/gdd/05-asset-game-proposals.md](../../05-asset-game-proposals.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../../agile/01-product-backlog.md)
