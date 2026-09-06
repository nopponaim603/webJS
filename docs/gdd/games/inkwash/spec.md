---
title: "🎨 INKWASH 晕染 (Territory io Battle) — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - inkwash
  - territory-io
  - paper-io-style
  - multiplayer
  - canvas-2d
  - ai-generated
---

# 🎨 INKWASH 晕染 (Territory io Battle) — Game Design Document & Dev Specs

**Code Name:** `inkwash`  
**Game ID:** `G044`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.0.0` (Production Standalone Build)  
**Age Rating:** 13+  
**Target Playtime:** 3-Minute Fast-Paced Rounds  
**Supported Platforms:** Mobile & Desktop (Touch Virtual Steering & Boost, Mouse Pointer, Keyboard WASD / Arrows / Space)  
**Engine & Tech Stack:** HTML5 Canvas 2D Grid Rasterizer, Living Ink Wash Bleed & Trail Shader Effects, Web Audio API Procedural Sound Synthesizer, Standalone Smart AI Bot Pool & Optional Room P2P Networking  
**Original Live Source:** [AIGameShare INKWASH](https://www.aigameshare.com/games/inkwash)  
**Tagline:** *"Multiplayer territory battle painted in living ink wash. Expand your ink domain, cut enemy trails, and conquer the parchment scroll in real-time."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**INKWASH (晕染)** เป็นเกมแนว Real-Time Territory Control / Paper.io Action Battle ที่ผสมผสานศิลปะภาพวาดพู่กันหมึกจีนโบราณ (Chinese Ink Wash Painting) เข้ากับการแข่งขันยึดครองพื้นที่แบบ IO Game

ผู้เล่นจะควบคุมหยดหมึกมีชีวิต (Living Ink Droplet) เคลื่อนที่ลากเส้นสายน้ำหมึก (Ink Trails) ข้ามผืนกระดาษสาโบราณ เมื่อวนเส้นกลับเข้าสู่เขตแดนของตนเอง พื้นที่ที่ถูกล้อมจะเปลี่ยนเป็นสีหมึกของผู้เล่นทันที พร้อมความสามารถในการพุ่งตัดสายน้ำหมึกของคู่ต่อสู้เพื่อสังหารและแย่งชิงอาณาเขต แข่งขันทำคะแนนสูงสุดในรอบเวลา 3 นาที

### 1.2 Core Pillars
1. **Ink Wash Territory Expansion (Paper.io Style):**
   - การลากเส้นหมึกออกนอกเขตแดนเพื่อล้อมพื้นที่และกลืนกินอาณาเขต
   - ยิ่งล้อมพื้นที่ได้กว้าง ยิ่งได้รับคะแนน Basis Points (BP) และเปอร์เซ็นต์การครองแผนที่สูงขึ้น
2. **Trail Cutting Combat & Risk/Reward:**
   - ในขณะที่ผู้เล่นอยู่นอกเขตแดน เส้นทางหมึกที่ลากอยู่คือจุดอ่อนร้ายแรง หากถูกศัตรูพุ่งตัดเส้นทางจะถูกกำจัดทันที
   - การเร่งความเร็ว (Boost) ช่วยให้หนีหรือตัดเส้นทางศัตรูได้รวดเร็ว แต่จะสิ้นเปลืองน้ำหมึกในตัว (Ink Reserve)
3. **Ink Economy & Frenzy Rush:**
   - น้ำหมึกจะค่อยๆ ฟื้นฟูเมื่อกลับมาอยู่ในอาณาเขตของตนเอง
   - ในช่วงนาทีสุดท้ายของการแข่งขันจะเข้าสู่ **Frenzy Mode** (ดนตรีเร่งจังหวะ, การยึดพื้นที่ได้คะแนนทวีคูณ)
4. **Smart Offline Bot Simulation & Multiplayer Lobby:**
   - รองรับการเล่นคนเดียวแบบ Standalone Offline ทันทีด้วยฝูง AI บอทที่มีบุคลิกการเล่นหลากหลาย
   - รองรับระบบห้อง Room Code / Invite Link เมื่อเชื่อมต่อออนไลน์
5. **Skin Customization & Bilingual UI:**
   - ปลดล็อกลวดลายหยดหมึกหลากหลายสไตล์ (Drop, Seal, Dragon, Lotus, etc.)
   - สลับภาษาได้ทันที (English / 中文) พร้อมเสียงเอฟเฟกต์หยดน้ำหมึกและระฆังทองคำสังเคราะห์ด้วย Web Audio API

---

## 2. Gameplay Mechanics & Flow

```
                           ┌───────────────────────────┐
                           │   Spawn on Home Domain    │
                           │   (Safe Inked Territory)  │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │ Venture Out & Draw Trail  │
                           │ (Vulnerable to Being Cut) │
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ Return to Safe Domain ]                         [ Enemy Cuts Trail ]
     Loop Closes → Inks Territory                      Player Eliminated
     Gains Score & Expands Map                         Drops Inked Cells
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                           [ 3-Minute Match Countdown ]
                                         │
                                         ▼
                           [ Final Minute: Frenzy Mode ]
                                         │
                                         ▼
                           [ Podium & Match Rewards ]
```

---

## 3. Controls & Interaction Guide

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Steer / Move** | ขยับเมาส์ไปในทิศทางที่ต้องการ หรือกด `W`, `A`, `S`, `D` / ปุ่มลูกศร | แตะและลากนิ้วบนหน้าจอเพื่อกำหนดทิศทาง |
| **Ink Boost (เร่งความเร็ว)** | กด **คลิกซ้าย** หรือกดค้าง **`Spacebar`** | แตะสองครั้งหรือกดค้างเพื่อเร่งสปีด |
| **Language Switch** | คลิกปุ่ม **`中/EN`** บนเมนูหลัก | แตะปุ่ม **`中/EN`** |
| **Custom Skins** | เลือกเมนู **Skins** ในหน้าแรกเพื่อเปลี่ยนลายหมึก | แตะเมนู **Skins** |

---

## 4. Technical Specs & Catalog Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G044` |
| **Directory** | `public/games/inkwash/` |
| **Main URL** | `/games/inkwash/index.html` |
| **AI Generation Tools** | HTML5 Canvas 2D / Web Audio API / LocalStorage |
| **Tech Stack** | Canvas 2D Grid Engine / Living Ink Diffusion / Procedural Audio / Smart Bot Pool |
| **Category** | `Phaser 2D Engine` / `Three.js 3D Engine` / `แอ็กชัน / เอาชีวิตรอด` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
