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
  - rapier3d
  - arcade
  - 3d
  - openai-gpt-6
  - ai-generated
---

# 🪙 Coin Pusher 3D: Copper Cascade — Game Design Document & Dev Specs

**Code Name:** `coin-pusher-3d-copper-cascade`  
**Game ID:** `G039`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.2.2` (Top Version / Masterpiece Build)  
**Age Rating:** 13+  
**Target Playtime:** 1–5 Minutes per Run  
**Supported Platforms:** Mobile & Desktop (Touch Aim/Drop, Mouse Slider, Keyboard)  
**AI Generation & Tech Stack:** OpenAI GPT-6 + Codex, Three.js (WebGL 3D Rendering), Rapier 0.19.0 Rigid-body Physics Engine (`rapier_wasm3d_bg.wasm`), Original Procedural 3D Cabinet & Coin Art, Original Procedural WebAudio Synthesis, Local & Cloud Storage Preferences, ImageGen Cover Art  
**Original Live Source:** [AIGameShare Coin Pusher 3D](https://www.aigameshare.com/games/coin-pusher-3d-copper-cascade?play=1&mode=fullscreen)  
**Tagline:** *"Drop coins through a real pinboard and charge a rotating underground tower lift that returns stray coins as two slowly rising single-column stacks. Topple growing coin towers, choose upgrades, and trigger silver-coin fever in an original 3D arcade coin pusher."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Coin Pusher 3D: Copper Cascade** เป็นเกมจำลองตู้ดันเหรียญอาร์เคด 3 มิติ (3D Arcade Coin Pusher) แบบเรียลไทม์ที่ขับเคลื่อนด้วยเอนจินฟิสิกส์วัตถุแข็ง Rapier 0.19.0 WebAssembly และเรนเดอร์ผ่าน Three.js

ผู้เล่นจะเริ่มต้นด้วยเงินทุน 90 เหรียญ (90 Starting Coins) เล็งปล่อยเหรียญผ่านแผงหมุดกระดอนจริง (Real Pinboard) ลงสู่ถาดเลื่อนชั้นบนที่เคลื่อนไหวอย่างต่อเนื่อง ทุกเหรียญที่ดันตกลงสู่ช่องรับรางวัลจะถูกบวกกลับเข้ากระเป๋าและคะแนน (Copper = 1, Silver = 5, Star Coin = 10) เมื่อสะสมพลังงานได้ครบจะสามารถกดเปิดประตูกลใต้ดินเพื่อหมุนยกหอคอยเหรียญขนาดยักษ์ (Rotating Coin Tower) ขึ้นมาบนโต๊ะ และผลักหอคอยให้ล้มเพื่อรับโบนัสก้อนโตและเลือกการ์ดอัปเกรดความสามารถ

### 1.2 Core Pillars
1. **Real-time Rigid-body Physics & Pinboard Plinko:** จำลองแรงโน้มถ่วง แรงเสียดทาน และการกระดอนของเหรียญโลหะหลายร้อยชิ้นร่วมกับแผงหมุดบน WebAssembly 60 FPS
2. **Rotating Underground Tower Lift & Stray Coin Recovery:** แท่นลิฟต์หมุนใต้ดินที่ยกหอคอยเหรียญขึ้นมาสู่โต๊ะ พร้อมระบบกู้เหรียญที่ร่วงลงช่องด้านข้าง (Stray Coins) ให้ดันตัวกลับขึ้นมาเป็นเสาเหรียญเดี่ยว 2 เสาโดยอัตโนมัติ
3. **Cascade Silver Fever:** เมื่อดันเหรียญให้ตกลงมาต่อเนื่อง 8 เหรียญในคราวเดียว (8-Coin Cascade) จะปลดล็อกโหมด **Silver Fever เป็นเวลา 10 วินาที** เปลี่ยนเหรียญทองแดงที่หยอดทั้งหมดให้กลายเป็นเหรียญเงิน (x5 มูลค่า)
4. **Endless Progression & Bank Score:** ผลกำไรจากการดันเหรียญช่วยให้ผู้เล่นสามารถเล่นต่อเนื่องได้เกินกว่า 90 เหรียญเริ่มต้น และสามารถเลือก "Bank Score & Finish" ได้ทุกเมื่อเพื่อส่งคะแนนเข้าสู่ Global Leaderboard

### 1.3 Creator Versions & Release Changelog (Current Top Pick)

> [!NOTE]
> **AIGameShare Creator Top Pick:** [nilni](https://www.aigameshare.com/profile/nil)  
> **Community Metrics:** 0 Votes / 19 Plays / 34m Total Played  
> **Categories & Tags:** `Coin Pusher` `Coin Pusher 3D` `Coin Dozer` `Physics` `Arcade` `3D` `Coin Tower` `High Score` `Mobile` `Desktop` `HTML5` `GPT` `GPT-6` `GPT 6` `OpenAI GPT-6`

#### 📜 Official Version Release Notes
> *"Start with 90 coins and aim edge-first drops through a real pinboard and low exit onto a fully stocked upper moving shelf. Every accepted drop costs one; collected copper, silver and star coins add 1, 5 and 10 to both balance and score. Charge an underground elevator, open its floor doors and rotate a physical coin tower up to the table. Coins that enter the lift shaft return automatically as two slowly rising single-column stacks without a sideways launch or another paid raise. Topple towers for increasing coin bonuses, choose lucky stars, faster charge or extra nudges, and trigger ten seconds of silver-coin fever with an eight-coin cascade. Winnings let play continue beyond 90 drops. Features English and Chinese, desktop and touch controls, original audio with mute, safe saved preferences, medals and the existing global score leaderboard.*
> 
> *By [nilni](https://www.aigameshare.com/profile/nil) — 19 plays / 34m"*

---

## 2. Technical Architecture & Component Pipeline

```
                     ┌───────────────────────────┐
                     │        index.html         │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │          main.js          │ (State, HUD, Input, Flow)
                     └─────────────┬─────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  physics.js   │          │   render.js   │          │   audio.js    │
│ (Rapier 3D)   │          │  (Three.js)   │          │ (Web Audio)   │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        │ • Rigid-body World       │ • PBR Metal Materials    │ • Procedural Clinks
        │ • Pinboard Colliders     │ • Dynamic Shadows & Light│ • Chimes & Payout
        │ • Upper Sliding Shelf    │ • Camera & View Matrices │ • Lift & Motor FX
        │ • Tower Lift Elevator    │ • Particle Burst VFX     │ • Fever Fanfare
        │ • Stray Return Chutes    │ • Cabinet 3D Mesh        │ • Mute Support
```

### 2.1 Physics Engine & WASM Pipeline (`physics.js` + `rapier_wasm3d_bg.wasm`)
- **Rapier3D Integration:** ใช้เอนจินฟิสิกส์ Rapier 0.19.0 คอมไพล์ด้วย Rust สู่ WebAssembly เพื่อการคำนวณการชนและการเคลื่อนที่ของเหรียญ 100+ เหรียญพร้อมกันโดยไม่มีอาการกระตุก
- **Moving Shelf Kinematics:** แท่นดันชั้นบนเคลื่อนที่แบบ Sine-wave Kinematic Velocity ผลักเหรียญลงสู่ถาดชั้นล่าง
- **Tower Vault Mechanism:** บานประตูกลใต้ถาดเปิดออกและยกเสาเหรียญทรงกระบอกขึ้นมาแบบมีแรงเฉื่อยหมุน (Rotational Inertia)

### 2.2 Economy & Values Table

| ประเภทเหรียญ (Coin Kind) | มูลค่าคะแนน & ยอดเงิน | ลักษณะทางกายภาพ |
| :--- | :--- | :--- |
| **🥉 Copper (ทองแดง)** | **1 Coin** | เหรียญมาตรฐาน ผลิตเป็นหลักในรอบปกติ |
| **🥈 Silver (เงิน)** | **5 Coins** | เหรียญพิเศษ สุ่มดรอปทุกๆ 7 เหรียญ หรือในโหมด Silver Fever |
| **⭐ Star Coin (ดาวทอง)** | **10 Coins** | เหรียญโบนัสพิเศษ สุ่มดรอปทุกๆ 15 เหรียญ |

---

## 3. Gameplay Controls & Upgrades

### 3.1 Controls & Shortcuts
- **Desktop (Keyboard & Mouse):**
  - เลื่อนเมาส์ หรือกด `A` / `D` หรือ `Left` / `Right Arrow`: เล็งตำแหน่งหยอดเหรียญ
  - คลิกซ้าย หรือกด `Spacebar`: ปล่อยเหรียญ (กดค้างเพื่อหยอดเหรียญรัวๆ)
  - `N`: เขย่าตู้ (Nudge Machine) — จำกัดจำนวนครั้ง เติมครั้งใหม่เมื่อยกหอคอย
  - `E`: สั่งเปิดประตูกลยกหอคอยเหรียญ (Raise Tower) เมื่อเกจพลังเต็ม 100%
  - `P` / `Escape`: พักเกม (Pause / Resume)
  - `M`: ปิด/เปิดเสียงประกอบ
  - `L`: สลับภาษาอังกฤษ / ภาษาจีน (EN / ZH)
- **Mobile Touch Controls:**
  - ลากนิ้วบนหน้าจอเพื่อเล็งทิศทาง
  - กดปุ่ม **Drop** (แตะทีละครั้งหรือกดค้าง)
  - ปุ่มสัมผัสเฉพาะ: **Nudge**, **Raise Tower**, และเลือกการ์ด **Upgrades**
  - สามารถกด "Bank Score" จากเมนู Pause เพื่อจบเกมและบันทึกคะแนนได้ตลอดเวลา

---

## 4. Integration into webJS Portfolio

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G039` |
| **Directory** | `public/games/coin-pusher-3d-copper-cascade/` |
| **Main URL** | `/games/coin-pusher-3d-copper-cascade/index.html` |
| **AI Generation Tools** | OpenAI GPT-6 + Codex, Three.js, Rapier 0.19.0, WebAudio |
| **Tech Stack** | Three.js / Rapier3D WebAssembly / Web Audio API |
| **Category** | `Three.js 3D Engine` / `ปริศนา / ฟิสิกส์` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
