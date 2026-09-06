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
  - claude-fable-5
  - ai-generated
---

# 🌊 Echo Abyss: Deep-Sea Sonar Survival — Game Design Document & Dev Specs

**Code Name:** `echo-abyss`  
**Game ID:** `G038`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.0.0` (Top Version / Masterpiece Build)  
**Age Rating:** 13+  
**Target Playtime:** 1–5 Minutes per Run (Deep Descent Session)  
**Supported Platforms:** Mobile & Desktop (One-finger Touch / Two-handed, Mouse, Keyboard WASD / Arrows)  
**AI Generation & Tech Stack:** Claude Fable 5, WebGL 2.0 (Custom GLSL Shaders, 2D SDF Raymarched Soft Sound-shadows, GPU Plankton Field), HTML5 Canvas Fallback, CSS3, JavaScript (ES6+), Procedural WebAudio Convolution Reverb Synthesizer  
**Original Live Source:** [AIGameShare Echo Abyss](https://www.aigameshare.com/games/echo-abyss?play=1&mode=fullscreen)  
**Tagline:** *"A deep-sea descent where sound is sight. Every sonar ping lights the pitch-black abyss in fading phosphorescence — and calls the blind hunters. Hide in sonar shadows, steal light from enemy pings, evolve at depth gates, and dive as deep as you dare."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Echo Abyss** เป็นเกมจำลองการดำดิ่งสู่ห้วงลึกมหาสมุทรแบบ One-finger Survival Roguelite ในความมืดมิดสนิทที่ **"เสียงคือการมองเห็น" (Sound is Sight)** เล่นได้ทันทีแบบ Direct-start (No Start Screen)

ผู้เล่นจะควบคุม "Sonarling" สิ่งมีชีวิตที่มี 3 เยื่อหุ้มพลังชีวิต (Three Membranes) ดำดิ่งลงสู่ก้นบึ้งของมหาสมุทรผ่านถ้ำหินใต้ทะเลที่สร้างขึ้นแบบโพรซีเดอรัล (Pitch-black Procedural Caves) ทุกการส่งสัญญาณโซนาร์ (Sonar Wavefront) จะปลดปล่อยคลื่นเสียงสะท้อนโครงสร้างหินและไอเทมในความมืดด้วยระบบ **2D SDF Raymarching & Soft Sound-shadows** และปลุกสนามแพลงก์ตอน GPU (GPU Plankton Field) ให้เรืองแสงเฉพาะบริเวณที่คลื่นแสงกระทบ

ทว่าในความมืดมี **Blind Abyssal Hunters** ที่คอยฟังทุกการเคลื่อนไหว, เหยื่อล่อปลาตกเบ็ด (Anglerfish Lure) ที่คอยดักทำร้ายผู้เล่นที่ละโมบ, ปล่องน้ำร้อนใต้ทะเลที่ปะทุขึ้น (Erupting Abyssal Vents), และเสียงคำรามของ **Leviathan Roar** ที่ส่องสว่างทั่วทั้งแผนที่ให้ทุกชีวิตได้เห็น

### 1.2 Core Pillars
1. **Sound is Sight (Echolocation via SDF Raymarching):** ในความมืดสนิท ผู้เล่นจะมองไม่เห็นอะไรจนกว่าจะปล่อยคลื่น Ping คลื่นเสียงจะสะท้อนกลับมาเป็นภาพความสว่างชั่วคราวและค่อยๆ เลือนหาย (Fading Phosphorescence)
2. **Sound Shadow Stealth & Painted Hunter Danger:** การส่งเสียงทำให้มองเห็น แต่ก็เป็นการส่งตำแหน่งให้นักล่าตาบอด คลื่นเสียงของศัตรูก็ช่วยส่องสว่างให้เราเช่นกัน แต่ถ้าคลื่นเสียงของศัตรูสัมผัสโดนตัวเรา เราจะถูก "Painted" และถูกตามล่าทันที
3. **12 Stackable Evolutions at Depth Gates:** สะสมไข่มุกใต้สมุทรเพื่อผ่านประตูความลึก (Depth Gates) และเลือก 1 ใน 12 การ์ดวิวัฒนาการที่สามารถสะสมความสามารถทับซ้อนกันได้
4. **Physically-correct WebAudio Echo & Convolution Reverb:** ทุกเสียงสะท้อนของโน้ตดนตรีจะเดินทางกลับมาตามระยะทางจริงทางฟิสิกส์ และจำลองเสียงสะท้อนก้อง (Convolution Reverb) ตามขนาดของถ้ำรอบตัว
5. **Luminous Afterglow Death Screen:** หน้าจอจบเกมจะวาดเส้นทางการดำดิ่งทั้งหมดเป็นเส้นใยเรืองแสง (Luminous Afterglow Thread) และคำนวณคะแนนตามสูตร:
   $$\text{Score} = \text{Depth} + (\text{Pearls} \times \text{Unharmed Combo})$$

### 1.3 Creator Versions & Release Changelog (Current Top Pick)

> [!NOTE]
> **AIGameShare Creator Top Pick:** [nilni](https://www.aigameshare.com/profile/nil)  
> **Community Metrics:** 12 Votes / 422 Plays / 9h 22m Total Played  
> **Categories & Tags:** `Action` `Roguelite` `Stealth` `Deep Sea` `Sonar` `Atmospheric` `One Finger` `Mobile` `HTML5` `Claude` `Fable 5` `fable` `Adventure` `Survival` `Exploration`

#### 📜 Official Version Release Notes
> *"A one-finger deep-sea sonar survival roguelite with no start screen. Pitch-black procedural caves are revealed only by expanding sonar wavefronts with SDF-raymarched soft sound-shadows (WebGL2 with full Canvas 2D fallback), a GPU plankton field that exists only where light touches, blind hunters that hear your every move, an anglerfish lure that punishes greed, erupting abyssal vents, a leviathan whose roar lights the whole map for everyone, 12 stackable evolutions at depth gates, fully synthesized WebAudio whose echo notes return at physically correct times and whose convolution reverb measures the cave around you, and a death screen that paints your entire dive as one luminous Afterglow thread. Score = depth + pearls × unharmed combo, submitted to the leaderboard.*
> 
> *By [nilni](https://www.aigameshare.com/profile/nil) — 12 votes / 422 plays / 9h 22m"*

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
        │ • SDF Raymarching     │ • Adaptive Sub-drone  │ • 3 Membranes & Life
        │ • Soft Sound Shadows  │ • Physically Echo Ret │ • Hunter AI & Vision
        │ • GPU Plankton Field  │ • Cave Convol. Reverb │ • 12 Depth Evolutions
        │ • Dual-pass Bloom     │ • Doppler Sweeps      │ • One-finger / 2-Hand
        │ • Volumetric Godrays  │ • Siren & King Songs  │ • Shriek Charge Blast
        │ • Chromatic Aberr.    │ • Leviathan Roar Synth│ • Afterglow Path Map
```

### 2.1 Graphics & Shader Pipeline (`render-gl.js`)
- **WebGL 2.0 & Canvas 2D Fallback:** รองรับการเรนเดอร์คุณภาพสูงบน WebGL2 พร้อมระบบสำรองอัตโนมัติบน Canvas 2D
- **SDF Raymarching & Soft Sound-shadows:** คำนวณแนวการตกกระทบของคลื่นเสียงสะท้อนและเงาเสียงแบบนุ่มนวล
- **GPU Plankton Field:** อนุภาคแพลงก์ตอนเรืองแสงที่คำนวณผ่าน GPU Vertex Shader และจะสว่างขึ้นเฉพาะบริเวณที่คลื่นเสียงส่องถึง
- **Volumetric Godrays & PostFX:**
  - `uBloom`: Dual-pass Box/Gaussian Blur แยก Channel ความสว่าง
  - `Chromatic Aberration`: การเหลื่อมสี RGB แยกตามความเสียหายที่ได้รับและการสั่นสะเทือน
  - `Film Grain & Vignette`: ละอองน้ำลึกและเงาดำรอบขอบจอ

### 2.2 Procedural Web Audio Synthesizer (`audio.js`)
- **Physically-timed Echoes:** ทุกการส่งเสียง จะคำนวณเวลาสะท้อนกลับของโน้ตตามระยะทางจริงจากผนังถ้ำ
- **Cave Convolution Reverb:** ปรับความกังวานของเสียงสะท้อนตามปริมาตรความกว้างของถ้ำแบบ Real-time
- **Adaptive Ambient Drone:** ปรับระดับความถี่เบสต่ำ (Sub-bass drone oscillator) ให้ต่ำลงเรื่อยๆ ตามความลึก
- **Harmonic Pentatonic Pings:** คลื่นเสียง Ping ของผู้เล่นใช้คอร์ดเสียง Harmonic เพลงสังเคราะห์ 5 โน้ต
- **Leviathan Roar Synthesizer:** เสียงคำรามต่ำสั่นสะเทือน (Sub-oscillator + Bandpass Sweep + Noise Burst Buffer)

---

## 3. Gameplay Mechanics & Systems

### 3.1 Controls & Input Handling
- **Mobile One-finger Mode (มือเดียว):** 
  - นิ้วแรกแตะหน้าจอจะกลายเป็น Floating Virtual Joystick (กดค้างแล้วลากเพื่อว่ายน้ำ)
  - แตะเร็ว (Quick Tap) เพื่อส่ง Sonar Ping
- **Mobile Two-handed Mode (สองมือ):**
  - นิ้วหนึ่งบังคับทิศทาง อีกนิ้วหนึ่งแตะส่ง Ping หรือกดค้างเพื่อ **Charge the Shriek** (คลื่นเสียงทำลายล้างรอบทิศ)
- **Keyboard & Mouse (Desktop):**
  - `W, A, S, D` หรือ `Arrow Keys` หรือลากเมาส์: เคลื่อนที่ตัวละคร Sonarling
  - `Spacebar` หรือ `Left Click`: ส่ง Sonar Ping
  - กดค้างเพื่อชาร์จ Shriek Blast
  - `P` / `Escape`: พักเกม (Pause / Resume)
  - `M`: ปิด/เปิดเสียงสังเคราะห์
  - `L`: สลับภาษา (EN / ZH)

### 3.2 12 Stackable Evolutions (ระบบวิวัฒนาการ 12 รูปแบบ)
เมื่อดำดิ่งผ่านประตูความลึก (Depth Gates) ผู้เล่นจะเลือกบัฟ 1 ใน 3 ตัวเลือก ซึ่งสามารถสะสมทับซ้อนกันได้ (Stackable):
1. **Resonance Pulse:** เพิ่มรัศมีการกระจายตัวของคลื่นเสียง Ping
2. **Phosphor Persistence:** แสงสะท้อนจากแนวหินสว่างค้างอยู่นานขึ้นก่อนเลือนหาย
3. **Eel Agility:** เพิ่มความเร็วในการว่ายน้ำและความคล่องตัว
4. **Shriek Charge:** ลดเวลาในการชาร์จคลื่นระเบิดเสียง Shriek Blast
5. **Shockwave Repel:** เพิ่มระยะผลักดันศัตรูเมื่อปลดปล่อยคลื่นเสียง
6. **Pearl Magnet:** ดูดไข่มุกเรืองแสงเข้าหาตัวจากระยะไกล
7. **Bioluminescent Cloak:** ลดการมองเห็นของศัตรูเมื่ออยู่ในแนวเงาเสียง
8. **Vitality Surge:** ซ่อมแซมและเพิ่มเยื่อหุ้มพลังชีวิต (Membranes)
9. **Echo Echo:** ปล่อยคลื่นสะท้อนระลอกที่สองโดยอัตโนมัติ
10. **Abyssal Sense:** ตรวจจับตำแหน่งสัตว์ประหลาดและปล่องความร้อนล่วงหน้า
11. **Tide Breaker:** ทนทานต่อแรงกระแทกจากกระแสน้ำวน
12. **Deep Harmony:** เพิ่มตัวคูณคะแนน Unharmed Combo จากการไม่โดนดาเมจ

---

## 4. Integration into webJS Portfolio

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G038` |
| **Directory** | `public/games/echo-abyss/` |
| **Main URL** | `/games/echo-abyss/index.html` |
| **AI Generation Tools** | Claude Fable 5 + WebGL2 / GLSL / Canvas / WebAudio |
| **Tech Stack** | WebGL 2.0 2D SDF / GPU Plankton / Web Audio API |
| **Category** | `Three.js 3D / WebGL` & `ปริศนา / เอาชีวิตรอด` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
