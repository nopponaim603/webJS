---
title: "🌊 Echo Abyss: Deep-Sea Sonar Survival — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - webgl2
  - echo-abyss
  - survival
  - deep-sea
  - sonar
  - ai-generated
---

# 🌊 Echo Abyss: Deep-Sea Sonar Survival — Game Design Document & Dev Specs

**Code Name:** `echo-abyss`  
**Game ID:** `G038`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.0.0` (Abyssal Descent Edition)  
**Age Rating:** All Ages / 10+  
**Target Playtime:** 2–10 Minutes per Run (Roguelike Descent Session)  
**Supported Platforms:** Desktop & Mobile (One-finger Touch, Virtual Joystick, Mouse, Keyboard WASD / Arrows)  
**Engine & Tech Stack:** WebGL 2.0 (Custom GLSL Shaders, 2D SDF Raymarching, Volumetric Godrays, Chromatic Aberration, Bloom PostFX, Dynamic Particle Simulation), HTML5 Canvas, Web Audio API Procedural Sound Synthesizer  
**Original Live Source:** [AIGameShare Echo Abyss](https://www.aigameshare.com/games/echo-abyss?play=1&mode=fullscreen)  
**Tagline:** *"A deep-sea descent where sound is sight. Every sonar ping lights the dark and calls the hunters. Dive through sonar shadows, steal light from enemy pings, and chase your deepest score."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Echo Abyss** เป็นเกมจำลองการดำดิ่งสู่ห้วงลึกมหาสมุทรแบบ Real-time Survival Roguelite ในความมืดมิดสนิทที่ **"เสียงคือการมองเห็น" (Sound is Sight)** 

ผู้เล่นจะควบคุม "Sonarling" สิ่งมีชีวิตเรืองแสงใต้น้ำลึก ดำดิ่งลงสู่ก้นบึ้งของมหาสมุทรผ่านถ้ำหินใต้ทะเลที่ซับซ้อน ทุกการส่งสัญญาณโซนาร์ (Ping) จะปลดปล่อยคลื่นเสียงสะท้อนโครงสร้างหินและไอเทมในความมืดด้วยระบบ **2D SDF Raymarching & Volumetric Lighting** แต่ในขณะเดียวกัน เสียงโซนาร์ก็จะดึงดูดสัตว์ประหลาดตาบอดใต้ทะเลลึก (Blind Abyssal Hunters) เข้ามาจู่โจมทันที!

ผู้เล่นต้องอาศัย **"เงาเสียง" (Sound Shadows)** หลังแนวหิน หลบการสแกนของนักล่า อาศัยแสงจากคลื่นโซนาร์ของศัตรูในการเดินทาง เก็บสะสมไข่มุกเรืองแสง (Bioluminescent Pearls) เพื่อพัฒนาขีดความสามารถที่ประตูวิวัฒนาการ (Evolution Gates) และเอาชีวิตรอดจากเสียงคำรามของสัตว์ประหลาดขนาดยักษ์ (Leviathan Roar) ให้ลึกที่สุดเท่าที่จะทำได้

### 1.2 Core Pillars
1. **Echolocation as Core Mechanic (Sound is Sight):** ในความมืดสนิท ผู้เล่นจะมองไม่เห็นเส้นทางจนกว่าจะปล่อย Ping คลื่นเสียงจะสะท้อนกลับมาเป็นภาพความสว่างชั่วคราว
2. **Sound Shadow Stealth & Risk/Reward:** การส่งเสียงทำให้มองเห็น แต่ก็เป็นการส่งตำแหน่งให้ศัตรูทราบ ผู้เล่นสามารถใช้หินเป็นเกราะกำบังเงาเสียง (Sound Shadow) หรือแอบดูเส้นทางจากคลื่นโซนาร์ของสิ่งมีชีวิตอื่น
3. **Deep Evolution & Roguelite Progression:** สะสมไข่มุกใต้สมุทรเพื่อผ่านประตูวิวัฒนาการ (Evolution Gates) เลือกอัปเกรดความสามารถ เช่น เพิ่มระยะคลื่นเสียง, คลื่นเสียงชาร์จทำลายล้าง, ความเร็วในการเคลื่อนที่, และพลังชีวิต
4. **100% Procedural & Standalone Simulation:** กราฟิกแสงเงา Volumetric Godrays, Bloom, Chromatic Aberration, และเสียงดนตรี Web Audio API ทั้งหมดถูกสังเคราะห์แบบ Procedural 100% โดยไม่ต้องพึ่งพาไฟล์เสียงภายนอก

---

## 2. Technical Architecture & Engine Specs

```
                    ┌────────────────────────┐
                    │      index.html        │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   render-gl   │       │   audio.js    │       │    game.js    │
│  (WebGL 2.0)  │       │  (Web Audio)  │       │ (Game Engine) │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        │ • SDF Raymarching     │ • Adaptive Sub-drone  │ • Descent & Depth
        │ • Volumetric Lighting │ • Sonar Harmonic Ping │ • Hunter AI & Vision
        │ • Dual-pass Bloom     │ • Hunter Sonar Sweep  │ • Evolution Gates
        │ • Godrays & Vignette  │ • Siren & King Songs  │ • Touch & Joy Input
        │ • Chromatic Fringe    │ • Leviathan Roar Synth│ • Score & Highscores
```

### 2.1 Graphics & Shader Pipeline (`render-gl.js`)
- **WebGL 2.0 Pipeline:** ใช้ Quad Vertex Shader ร่วมกับ Fragment Shaders สำหรับการคำนวณแสงและเงา
- **SDF Raymarching Canvas:** เรนเดอร์แผนที่ถ้ำแบบ Signed Distance Field (SDF) คำนวณการตกกระทบและการสะท้อนของคลื่นเสียงตามระยะทาง
- **Volumetric Light & Godrays:** จำลองลำแสงแบบ Radial Streaks พุ่งจากจุดกำเนิดเสียงคำรามของ Leviathan
- **Multi-pass Post Processing:**
  - `uBloom`: Dual-pass Box/Gaussian Blur แยก Channel ความสว่าง
  - `Chromatic Aberration`: การเหลื่อมสี RGB แยกตามความเสียหายที่ได้รับและการสั่นสะเทือน
  - `Film Grain & Vignette`: ละอองน้ำลึกและเงาดำรอบขอบจอ

### 2.2 Procedural Web Audio Synthesizer (`audio.js`)
- **Adaptive Ambient Drone:** ปรับระดับความถี่เบสต่ำ (Sub-bass drone oscillator) ให้ต่ำลงเรื่อยๆ ตามความลึกระดับเมตร
- **Harmonic Pentatonic Pings:** คลื่นเสียง Ping ของผู้เล่นใช้คอร์ดเสียง Harmonic เพลงสังเคราะห์ 5 โน้ต
- **Hunter Pings & Doppler Sweep:** เสียงคลื่นความถี่สูง/ต่ำของนักล่าและปลาไหลไฟฟ้า
- **Leviathan Roar Synthesizer:** เสียงคำรามต่ำสั่นสะเทือน (Sub-oscillator + Bandpass Sweep + Noise Burst Buffer)

---

## 3. Gameplay Mechanics & Systems

### 3.1 Controls & Input Handling
- **Mobile Touch:** แตะหน้าจอเพื่อส่ง Sonar Ping, ลากนิ้วเพื่อเคลื่อนที่ผ่าน Virtual Floating Joystick
- **Keyboard & Mouse:** 
  - `W, A, S, D` หรือ `Arrow Keys`: เคลื่อนที่ตัวละคร Sonarling
  - `Spacebar` หรือ `Left Mouse Click`: ส่ง Sonar Ping
  - `P` หรือปุ่มบนจอ: Pause / Resume
  - `M` หรือปุ่มบนจอ: ปิด/เปิดเสียงสังเคราะห์
  - `L`: สลับภาษา (EN / ZH)

### 3.2 Evolution Gates (ระบบวิวัฒนาการ)
เมื่อดำดิ่งลึกถึงระดับความลึกที่กำหนด ผู้เล่นจะเข้าสู่ประตูวิวัฒนาการ (Evolution Gates) เพื่อเลือกบัฟอัปเกรด 1 ใน 3 ตัวเลือก:
- **Resonance Pulse (ขยายรัศมีคลื่นเสียง):** เพิ่มระยะตรวจจับและระยะการมองเห็นของ Ping
- **Phosphor Persistence (แสงค้างนานขึ้น):** คลื่นแสงสะท้อนจากแนวหินสว่างค้างอยู่นานขึ้นก่อนเลือนหาย
- **Eel Agility (ความเร็วการเคลื่อนที่):** ว่ายน้ำได้เร็วและคล่องตัวขึ้น
- **Shockwave Repel (คลื่นกระแทกผลักศัตรู):** ปล่อยคลื่นชาร์จผลักดันศัตรูรอบตัวเมื่อชาร์จเต็ม
- **Vitality Surge (ฟื้นฟูและเพิ่มเลือด):** เพิ่มหลอดหัวใจสูงสุดและฟื้นฟูพลังชีวิต

---

## 4. Integration into webJS Portfolio

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G038` |
| **Directory** | `public/games/echo-abyss/` |
| **Main URL** | `/games/echo-abyss/index.html` |
| **Portal Status** | Active Showcase Ready |
| **Thumbnail** | `/games/echo-abyss/thumbnail.png` |
| **Category** | `Three.js 3D / WebGL` & `ปริศนา / เอาชีวิตรอด` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
