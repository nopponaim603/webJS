---
title: "🪙 Coin Pusher 3D: Copper Cascade — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.2.2"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - threejs
  - coin-pusher
  - physics-simulation
  - arcade
  - 3d
  - ai-generated
---

# 🪙 Coin Pusher 3D: Copper Cascade — Game Design Document & Dev Specs

**Code Name:** `coin-pusher-3d-copper-cascade`  
**Game ID:** `G039`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.2.2`  
**Age Rating:** All Ages / Casual  
**Target Playtime:** 3–15 Minutes per Session  
**Supported Platforms:** Desktop & Mobile (Touch Drop, Slider, Mouse Click)  
**Engine & Tech Stack:** Three.js / WebGL, Rigid-body 3D Physics Simulation (Gravity, Collision Restitution & Friction), Web Audio API Procedural Chimes  
**Original Live Source:** [AIGameShare Coin Pusher 3D](https://www.aigameshare.com/games/coin-pusher-3d-copper-cascade?play=1&mode=fullscreen)  
**Tagline:** *"Raise rotating coin towers, recover stray coins, pick upgrades, and keep playing with your cascade winnings."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Coin Pusher 3D: Copper Cascade** เป็นเกมจำลองตู้ดันเหรียญอาร์เคด 3 มิติ (3D Physics Coin Pusher) แบบเรียลไทม์ ผู้เล่นจะได้หยอดเหรียญทองแดง (Copper Coins), เหรียญเงิน และเหรียญทองลงบนถาดดันเหรียญที่เคลื่อนที่ไปข้างหน้าและถอยหลังอย่างต่อเนื่อง

จุดเด่นของเกมคือระบบฟิสิกส์ 3D ที่สมจริง การจำลองการเรียงซ้อนของหอคอยเหรียญหมุนวน (Rotating Coin Towers), รางกู้เหรียญที่ตกขอบข้าง (Stray Coin Recovery Rail), และระบบการเลือกอัปเกรดแบบ Roguelite Upgrade Perks เมื่อเก็บคะแนนสะสมได้ครบตามเป้าหมาย

### 1.2 Core Pillars
1. **Realistic 3D Coin Physics:** ฟิสิกส์การกระทบ การเลื่อนไหล และการซ้อนทับของเหรียญโลหะหลายร้อยชิ้นพร้อมกันอย่างลื่นไหล
2. **Rotating Coin Towers:** หอคอยเหรียญรางวัลพิเศษที่ค่อยๆ เคลื่อนมาใกล้ขอบเหว กระตุ้นความตื่นเต้นในการหยอดเหรียญจังหวะที่เหมาะสม
3. **Upgrade & Progression Economy:** เลือกลงทุนอัปเกรดความกว้างของคันดัน, แรงดันเหรียญ, อัตราดรอปเหรียญพิเศษ, หรือระบบ Magnet Recovery
4. **100% Standalone & Web Audio:** เสียงกระทบของเหรียญโลหะสังเคราะห์แบบ Procedural ผ่าน Web Audio API ให้เสียงใสกังวานตามแรงกระทบ

---

## 2. Technical Specs & Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G039` |
| **Directory** | `public/games/coin-pusher-3d-copper-cascade/` |
| **Main URL** | `/games/coin-pusher-3d-copper-cascade/index.html` |
| **Tech Stack** | Three.js / WebGL / Web Audio API |
| **Category** | `Three.js 3D Engine` / `ปริศนา / ฟิสิกส์` |
| **Standalone Ready** | 100% Offline Compatible |
