---
title: "⚔️ Grapple Knight: Storm Siege — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.1.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - grapple-knight
  - boss-rush
  - physics-grapple
  - action
  - ai-generated
---

# ⚔️ Grapple Knight: Storm Siege — Game Design Document & Dev Specs

**Code Name:** `grapple-knight-storm-siege`  
**Game ID:** `G041`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.1.0`  
**Age Rating:** 10+  
**Target Playtime:** 3–10 Minutes per Boss Rush  
**Supported Platforms:** Desktop & Mobile (Touch Grapple, Mouse Aim, Keyboard WASD / Space)  
**Engine & Tech Stack:** HTML5 Canvas, Elastic Hook & Rope Physics, Web Audio API Sound Synthesizer  
**Original Live Source:** [AIGameShare Grapple Knight](https://www.aigameshare.com/games/grapple-knight-storm-siege?play=1&mode=fullscreen)  
**Tagline:** *"Grapple through six giant bosses, dodge storm mines, cut lightning tethers, and choose powerful relics."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Grapple Knight: Storm Siege** เป็นเกมแนว Boss Rush 2D Physics Action ที่ผู้เล่นจะสวมบทอัศวินสายฟ้าผู้ใช้ตะขอยึดเกาะ (Grappling Hook) ในการเหวี่ยงตัวรอบบอสขนาดยักษ์ทั้ง 6 ตัว (Six Titan Bosses) ท่ามกลางพายุสายฟ้าคลั่ง

ผู้เล่นจะต้องโหนตะขอเหวี่ยงตัวหลบทุ่นระเบิดพายุ (Storm Mines), ตัดสายโยงพลังงานสายฟ้า (Lightning Tethers), โจมตีจุดอ่อนของบอสในจังหวะกระโดดปล่อยมือ, และเลือกรับโบราณวัตถุทรงพลัง (Relics & Blessings) หลังพิชิตบอสแต่ละตัว

### 1.2 Core Pillars
1. **Elastic Rope & Momentum Physics:** การเหวี่ยงตัวด้วยฟิสิกส์โมเมนตัมเชือกที่แม่นยำและให้อิสระในการเคลื่อนไหวสูง
2. **Titan Boss Rush Mechanics:** บอส 6 รูปแบบที่มีท่าโจมตีและกลไกเฉพาะตัว เช่น การหมุนกวาดเลเซอร์, การปล่อยคลื่นช็อตเวฟ, และทุ่นระเบิดลอยน้ำ
3. **Relic & Build Customization:** เสริมความแกร่งด้วย Relics เพิ่มระยะตะขอ, แรงดึงกลับ, คลื่นดาบสุญญากาศ, หรือโล่สายฟ้า
4. **Instant Standalone Performance:** เล่นได้ทันทีโดยไม่ต้องโหลดไฟล์ภายนอก รันด้วย 60 FPS Canvas Physics

---

## 2. Technical Specs & Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G041` |
| **Directory** | `public/games/grapple-knight-storm-siege/` |
| **Main URL** | `/games/grapple-knight-storm-siege/index.html` |
| **Tech Stack** | Canvas 2D / Rope Physics / Web Audio API |
| **Category** | `Three.js 3D Engine` / `Phaser 2D Engine` / `แอ็กชัน / บอสรัช` |
| **Standalone Ready** | 100% Offline Compatible |
