---
title: "👶 Jelly Baby (WebGPU 3D Soft-Body Physics) — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - jelly-baby
  - webgpu
  - threejs-r185
  - soft-body-physics
  - xpbd
  - wasm-kernel
  - 3d-simulation
---

# 👶 Jelly Baby (WebGPU 3D Soft-Body Physics) — Game Design Document & Dev Specs

**Code Name:** `jelly-baby`  
**Game ID:** `G043`  
**Original Creator:** Scott Sun ([scottstts/Jelly-Baby](https://github.com/scottstts/Jelly-Baby) · [jelly.scottsun.io](https://jelly.scottsun.io))  
**Version:** `1.0.0` (Production Standalone Build)  
**Target Playtime:** Freeform Sandbox Playground  
**Supported Platforms:** Desktop & Mobile (Touch Joystick, Orbit Camera, Mouse Grab & Throw, Keyboard WASD / Space / R)  
**Graphics & Engine:** WebGPU Native Pipeline via Three.js r185, Linear HDR EXR Lighting (`bg_room.exr`), AgX Tone Mapping, Real-Time Caustics & Fresnel Transmission Worker  
**Physics Engine:** Embedded WebAssembly Soft-Body Kernel (Coupled XPBD Neo-Hookean Energy, 4,026 Tetrahedra, 72,234 Indexed Vertices, 144,464 Triangles at 240 Hz Fixed Step)  
**Audio:** 100% Procedural Web Audio Contact Synthesizer (Damped Membrane Modes & Transient Hits)  
**Tagline:** *"A small, soft world. Wander, hop, stretch, and let go. A bouncy shiny jelly baby playground powered by WebGPU and real-time WASM soft-body physics."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Jelly Baby** เป็นเกม Interactive 3D Physics Sandbox ที่จำลองตุ๊กตาเยลลี่เด้งดึ๋งนุ่มนิ่ม (Jelly Baby Doll ขนาดสมจริง ~7 ซม.) เหนือโต๊ะไม้ขัดเงา ด้วยการประมวลผลกราฟิกขั้นสูง **WebGPU** ร่วมกับระบบฟิสิกส์เนื้อนิ่ม **Soft-Body XPBD** ผ่าน **WebAssembly Kernel** ความถี่ 240 Hz

ผู้เล่นสามารถบังคับให้ Jelly Baby เดิน, กระโดดลอยตัวอย่างนุ่มนวล, คลิกหรือแตะเพื่อหยิบจับ ดึงยืด (Stretch) และโยนตัวเยลลี่เหวี่ยงไปมารอบโต๊ะ โดยตัวเยลลี่จะบิดเบี้ยว ยุบพอง และสะท้อนแสงหักเห (Fresnel Transmission & Refraction Caustics) ลงบนพื้นโต๊ะไม้แบบเรียลไทม์

### 1.2 Core Pillars
1. **Coupled XPBD Neo-Hookean Soft-Body Solver (WASM 240 Hz):**
   - การคำนวณโครงสร้างเตตราฮีดรอน 4,026 ชิ้น และพื้นผิว 72,234 จุดพิกัดแบบ Marching Tetrahedra
   - ป้องกันการกลับด้านของชิ้นส่วน (Orientation Barrier & Backtracking) และถ่ายโอนแรงจับอย่างเป็นธรรมชาติ (Force-Limited Barycentric Grabbing)
2. **WebGPU Optical Caustics & Transmission Proxy Worker:**
   - ประมวลผลการหักเหของแสง, Fresnel Reflection, Spectral Absorption และความหนาของเนื้อเยลลี่ใน Web Worker แยกต่างหาก
   - ฉายแสงสะท้อน Caustic Footprint คมชัดลงบนพื้นผิวโต๊ะไม้ความละเอียดสูง
3. **Natural Locomotion & Powered Gait:**
   - การเดินและการทรงตัวด้วยแรงกล้ามเนื้อจำลอง (Powered Posture Forces) ไม่ใช่เพียงการแทนที่พิกัดอนิเมชัน
   - เมื่อถูกจับหรือโยน กล้ามเนื้อจะคลายตัวโดยสมบูรณ์ และค่อยๆ ฟื้นคืนการทรงตัวเมื่อตกลงสู่พื้น
4. **Procedural Membrane Audio:**
   - เสียงตกกระทบและเสียงเด้งดึ๋งสังเคราะห์ด้วย Web Audio API จากความถี่เรโซแนนซ์ของเยลลี่โดยตรง ไม่ต้องโหลดไฟล์เสียงภายนอก
5. **Adaptive Desktop & Touch Controls:**
   - บนเดสก์ท็อป: บังคับเดิน WASD, หมุนมุมกล้อง, กระโดด Spacebar, และรีเซ็ต `R`
   - บนมือถือ: มี Virtual Joystick บังคับเดิน, ปุ่ม Hop, และรองรับ Multi-touch Pinch to Zoom

---

## 2. Technical Architecture & Physics Specs

```
                                 ┌───────────────────────────────┐
                                 │       Input Interaction       │
                                 │ • WASD / Touch Joystick       │
                                 │ • Pointer Grab & Stretch      │
                                 └───────────────┬───────────────┘
                                                 │
                                                 ▼
                                 ┌───────────────────────────────┐
                                 │   Powered Locomotion Gait     │
                                 │   (Muscle Forces & Jumping)   │
                                 └───────────────┬───────────────┘
                                                 │
                                                 ▼
             ┌───────────────────────────────────────────────────────────────────┐
             │            WebAssembly Soft-Body Kernel (240 Hz Fixed)            │
             │ • Coupled XPBD Neo-Hookean Elastic Energy                         │
             │ • 4,026 Tetrahedral Elements / 72,234 Indexed Vertices            │
             │ • Dynamic Barycentric Grabbing & Rest Stress Elimination          │
             └─────────────────┬───────────────────────────────┬─────────────────┘
                               │                               │
                               ▼                               ▼
                 [ 3D WebGPU Mesh Deformation ]   [ Optical Proxy Worker (30 Hz) ]
                 • Marching-tetrahedra Surface    • Fresnel Transmission & Absorption
                 • True CPU Position/Normal Buffers• RGBA16F Refraction Caustics
                               │                               │
                               └───────────────┬───────────────┘
                                               ▼
                                 [ Three.js r185 WebGPU Scene ]
                                 • Linear HDR Lighting (`bg_room.exr`)
                                 • AgX Tone Mapping & Bloom PostFX
                                 • Procedural Membrane WebAudio
```

---

## 3. Controls & Interaction Guide

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Move / Walk** | `W`, `A`, `S`, `D` หรือปุ่มลูกศร (Arrow Keys) สัมพันธ์กับมุมกล้อง | เลื่อนนิ้วผ่าน **Virtual Joystick** ซ้ายล่าง |
| **Hop / Jump** | `Spacebar` (กระโดดลอยตัวนุ่มนวล แรงโน้มถ่วง 2.4 m/s²) | แตะปุ่ม **Hop** ขวาล่าง |
| **Grab & Stretch** | คลิกซ้ายค้างที่ตัว Jelly Baby แล้วลากเพื่อดึงยืด | แตะค้างที่ตัว Jelly Baby แล้วลากเพื่อยืดตัว |
| **Throw / Fling** | ลากตัวเยลลี่อย่างเร็วแล้วปล่อยเมาส์ | ลากแล้วดีดปล่อยนิ้ว |
| **Orbit Camera** | คลิกซ้ายค้างบนโต๊ะไม้แล้วลากเมาส์ | แตะและลากนิ้วบนพื้นโต๊ะ |
| **Zoom In/Out** | หมุนลูกกลิ้งเมาส์ (Scroll Wheel) | กาง/หุบนิ้ว (Pinch to Zoom) |
| **Reset Position** | กดปุ่ม **`R`** | มีปุ่มรีเซ็ตบนหน้าจอ |

---

## 4. Technical Specs & Catalog Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G043` |
| **Directory** | `public/games/jelly-baby/` |
| **Main URL** | `/games/jelly-baby/index.html` |
| **Original Repo** | [scottstts/Jelly-Baby](https://github.com/scottstts/Jelly-Baby) |
| **Tech Stack** | WebGPU Native / Three.js r185 / WebAssembly / XPBD Soft-Body / Web Audio API |
| **Category** | `Three.js 3D Engine` / `ฟิสิกส์ / ซิมูเลชัน 3D` |
| **Asset Footprint** | Standalone Compiled Client (`bg_room.exr`, `jelly-baby.bin`, `wood_*` textures) |
| **Standalone Ready** | 100% Offline Compatible |
