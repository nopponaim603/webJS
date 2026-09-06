---
title: "🖌️ Ink Warden 墨守 — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - ink-warden
  - fluid-dynamics
  - calligraphy
  - gesture-defense
  - webgl
  - claude-fable-5
  - ai-generated
---

# 🖌️ Ink Warden 墨守 — Game Design Document & Dev Specs

**Code Name:** `ink-warden`  
**Game ID:** `G042`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.0.0` (Top Version / Masterpiece Build)  
**Age Rating:** 13+  
**Target Playtime:** 1–5 Minutes per Run (Fast-Paced Action Defense)  
**Supported Platforms:** Mobile & Desktop (Touch Screen, Mouse Brush, Keyboard)  
**AI Generation & Tech Stack:** Claude Fable 5, WebGL 2.0 (Living-ink Real-time Fluid Simulation `fluid.js`), HTML5 Canvas Gesture Recognition (`game.js`), CSS3, JavaScript (ES6+), Procedural WebAudio Synthesis  
**Original Live Source:** [AIGameShare Ink Warden](https://www.aigameshare.com/games/ink-warden?play=1&mode=fullscreen)  
**Tagline:** *"A calligraphy defense game painted in living ink. Draw brush strokes to cut paper demons, cast glyph spells, and guard the vermilion seal across an unrolling ink-wash handscroll."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Ink Warden (墨守)** เป็นเกมแนว Calligraphy Action Defense & Roguelite ที่จำลองการวาดภาพพู่กันจีนโบราณบนผืนกระดาษม้วนภาพจิตรกรรมหมึกจีน (Unrolling Ink-wash Handscroll) แบบเรียลไทม์

ผู้เล่นรับบทเป็นจอมปราชญ์พิทักษ์ผนึกชาด (Vermilion Seal) ป้องกันแท่นบูชาจากคลื่นกองทัพปีศาจกระดาษ (Paper Demons) และบอสอสูรหมึกโบราณ ตัวเกมเริ่มต้นเล่นได้ทันทีแบบ Direct-start (No Start Screen) ด้วยการตวัดนิ้วหรือเมาส์วาดเส้นพู่กันหมึกสด (Living WebGL Ink) ที่ตัดขาดศัตรูได้ทุกทิศทาง พร้อมระบบตรวจจับสัญลักษณ์เวทมนตร์ (Glyph Recognition) และการประเมินเกรดความพริ้วไหวของลายเส้นพู่กัน (Calligraphy Grading)

### 1.2 Core Pillars
1. **Living WebGL Ink & Cut-anywhere Stroke Combat:** ทุกการตวัดพู่กันจะกลายเป็น "ดาบหมึก" (Ink Blade) เฉือนฟันศัตรูที่สัมผัสแนวเส้นทันที และการแตะหน้าจอแบบเร็ว (Quick Tap) จะยิง "กระสุนหมึก" (Ink Dart)
2. **Gesture Glyph Spells & Calligraphy Grading:** การวาดรูปทรงเรขาคณิตจะปลดปล่อยเวทมนตร์ขั้นสูง ยิ่งตวัดเส้นได้เรียบเนียนถูกต้อง จะยิ่งได้รับคะแนนเกรดพู่กันที่สูงขึ้นและเพิ่มอานุภาพของเวทมนตร์
3. **Inkstone Economy & Risk/Reward:** ทุกฝีแปรงจะสูญเสียน้ำหมึกในแท่นฝนหมึก (Inkstone) การสังหารปีศาจจะดรอปหยดหมึกเพื่อเติมพลังงานกลับคืน บังคับให้ผู้เล่นบริหารจัดการการวาดอย่างคุ้มค่า
4. **Copybook Upgrades (Roguelite Progression):** หลังกำจัดบอสในแต่ละรอบ ผู้เล่นจะได้เลือกตำราอัปเกรดพู่กัน (Copybook Upgrade) 1 ใน 3 เล่ม เพื่อเสริมพลังเวทหรือความจุหมึก

### 1.3 Creator Versions & Release Changelog (Current Top Pick)

> [!NOTE]
> **AIGameShare Creator Top Pick:** [nilni](https://www.aigameshare.com/profile/nil)  
> **Community Metrics:** 24 Votes / 2,246 Plays / 63h 53m Total Played  
> **Categories & Tags:** `Action` `Calligraphy` `Ink Wash` `Drawing` `Defense` `Roguelite` `Boss Fight` `Mobile` `HTML5` `Claude` `Fable 5` `fable` `Creative`

#### 📜 Official Version Release Notes
> *"A mobile-friendly calligraphy defense game with no start screen, full-screen brush drawing, living WebGL ink, cut-anywhere stroke combat, circle/zigzag/wave/spiral spell recognition, calligraphy grading, ink economy, boss fights, copybook upgrades, procedural ink-wash scenes, WebAudio feedback, safe sandbox behavior, and score leaderboard submission.*
> 
> *By [nilni](https://www.aigameshare.com/profile/nil) — 24 votes / 2,246 plays / 63h 53m"*

---

## 2. Core Gameplay Mechanics & Controls

```
                                ┌───────────────────────────┐
                                │   Touch / Mouse Input     │
                                └─────────────┬─────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         [ Quick Single Tap ]                                 [ Drag / Draw Stroke ]
         Fires Quick Ink Dart                                 Living Ink Blade Path
                    │                                                   │
                    │                                                   ▼
                    │                                       [ Glyph Recognition ]
                    │                                       • Circle → Ward Barrier
                    │                                       • Zigzag → Chain Thunder
                    │                                       • Wave   → Pushing Tide
                    │                                       • Spiral → Ink Vortex
                    │                                                   │
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
                                 [ Calligraphy Grading ]
                                 (Smoothness & Flow Score)
                                              ▼
                                 [ Inkstone Resource Cost ]
                                (Refilled by Monster Kills)
```

### 2.1 Glyph Spell Recognition Matrix (ระบบเวทมนตร์อักขระ)

| รูปร่างที่วาด (Glyph) | ชื่อเวทมนตร์ | ผลลัพธ์และอานุภาพ |
| :--- | :--- | :--- |
| **⭕ วงกลม (Circle)** | **Ward / Barrier (ม่านคุ้มภัย)** | สร้างเกราะป้องกันรอบแท่นบูชา ป้องกันการโจมตีของปีศาจชั่วคราว |
| **⚡ ซิกแซก (Zigzag)** | **Chain Thunder (อสุนีบาตหมึก)** | ปลดปล่อยสายฟ้าชิ่งทำลายศัตรูต่อเนื่องเป็นกลุ่ม |
| **🌊 คลื่น (Wave)** | **Pushing Tide (คลื่นหมึกผลักดัน)** | ซัดระลอกคลื่นหมึกกวาดศัตรูทั้งหมดให้ถอยร่นกลับไป |
| **🌀 ก้นหอย (Spiral)** | **Ink Vortex (หลุมดำน้ำหมึก)** | ดูดศัตรูทั้งหมดเข้าสู่จุดศูนย์กลางและสร้างความเสียหายต่อเนื่อง |

### 2.2 Controls & Shortcuts
- **Touch / Mouse Drag:** วาดเส้นพู่กันดาบหมึกบนหน้าจอ / วาดรูปทรงเวทมนตร์
- **Touch / Mouse Tap:** ยิงกระสุนหมึกความเร็วสูง (Ink Dart)
- **`P` / `Escape`:** พักเกม (Pause / Resume)
- **`M`:** ปิด/เปิดเสียงสังเคราะห์ WebAudio
- **Mobile Best Practice:** แนะนำให้เล่นในโหมด Fullscreen เพื่อป้องกันเบราว์เซอร์แย่ง Gesture

---

## 3. Technical Specs & Standalone Architecture

### 3.1 Architecture Overview
- **`fluid.js`**: WebGL Shader Pipeline จำลองอนุภาคของไหลและการซึมของหมึกบนกระดาษสา (Navier-Stokes fluid solver & diffusion)
- **`game.js`**: ระบบตรวจจับ Stroke Vector, อัลกอริทึมจำแนกท่าทาง (Geometric Gesture Recognizer), State Machine ของศัตรูและบอส, และ WebAudio Procedural Synthesizer
- **`styles.css`**: ดีไซน์กรอบภาพกระดาษโบราณ (Parchment Texture), Vermilion Seal Indicator, และ UI HUD แบบมินิมอล

### 3.2 Integration Details

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G042` |
| **Directory** | `public/games/ink-warden/` |
| **Main URL** | `/games/ink-warden/index.html` |
| **AI Generation Tools** | Claude Fable 5 + WebGL / Canvas / WebAudio |
| **Tech Stack** | WebGL Living Fluid / Canvas Gesture Engine / Web Audio API |
| **Category** | `Three.js 3D Engine` / `ปริศนา / ป้องกันฐาน` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
