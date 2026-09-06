---
title: "🐉 Dragon Roguelite: Skywake — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.4.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - pixijs
  - dragon-roguelite
  - skywake
  - action-roguelite
  - bullet-hell
  - ai-generated
---

# 🐉 Dragon Roguelite: Skywake — Game Design Document & Dev Specs

**Code Name:** `dragon-roguelite-skywake`  
**Game ID:** `G040`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.4.0`  
**Age Rating:** 10+  
**Target Playtime:** 5–15 Minutes per Run  
**Supported Platforms:** Desktop & Mobile (Touch, Mouse Aim, Keyboard WASD)  
**Engine & Tech Stack:** PixiJS 2D Engine (WebGL Fast Particle Batching), Web Audio API Procedural Sound Engine, High-speed Vector Math  
**Original Live Source:** [AIGameShare Dragon Roguelite](https://www.aigameshare.com/games/dragon-roguelite-skywake?play=1&mode=fullscreen)  
**Tagline:** *"Charge dragon fire, rotate a prism cross, and build synergies with 36 illustrated skills through three chapters into endless skies."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Dragon Roguelite: Skywake** เป็นเกม 2D Aerial Action Roguelite ผู้เล่นจะสวมบทบาทเป็นมังกรฟ้า (Skywake Dragon) โบยบินเหนือท้องฟ้าและฟาดฟันกับฝูงศัตรูทางอากาศหลากหลายชนิด

หัวใจสำคัญของเกมคือระบบชาร์จพ่นไฟมังกร (Dragon Fire Breath), การหมุนเป้าเล็งไม้กางเขนปริซึม (Prism Cross Targeting), และระบบการเลือกการ์ดสกิลกว่า **36 Illustrated Skills** ครอบคลุมการต่อสู้ 3 บทหลัก (Three Epic Chapters) ไปจนถึงโหมด **Endless Skies**

### 1.2 Core Pillars
1. **Fluid Aerial Combat & Dragon Maneuvering:** การเคลื่อนที่ลื่นไหลแบบ 360 องศาด้วย PixiJS พร้อมระบบหักเลี้ยวและ Dash หลบห่ากระสุน
2. **Prism Cross Fire Mechanics:** เล็งยิงและหมุนกางเขนแสงเพื่อสะท้อนลำแสงมังกรทำลายศัตรูเป็นกลุ่ม
3. **36 Synergistic Illustrated Skills:** การ์ดอัปเกรดหลากหลายสาย ทั้งสายไฟลุกไหม้ (Inferno), สายสายฟ้าฟาด (Thunder Storm), สายพายุลมกรด (Gale Blades), และเกราะเกล็ดมังกร (Dragon Scales)
4. **100% Standalone WebGL Architecture:** กราฟิกแสงสี 2D อลังการและการผสมเสียง Web Audio โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์ภายนอก

---

## 2. Technical Specs & Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G040` |
| **Directory** | `public/games/dragon-roguelite-skywake/` |
| **Main URL** | `/games/dragon-roguelite-skywake/index.html` |
| **Tech Stack** | PixiJS / WebGL / Web Audio API |
| **Category** | `Phaser 2D Engine` / `Three.js 3D Engine` / `แอ็กชัน / เอาชีวิตรอด` |
| **Standalone Ready** | 100% Offline Compatible |
