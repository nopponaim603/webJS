---
title: "⚡ VOLTA: Lineman of the Storm — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - volta
  - lineman-of-the-storm
  - swing-arcade
  - pixijs
  - wpa-artstyle
  - mobile-ready
---

# ⚡ VOLTA: Lineman of the Storm — Game Design Document & Dev Specs

**Code Name:** `volta`  
**Game ID:** `G045`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.0.0` (Production Standalone Build)  
**Age Rating:** 13+  
**Target Playtime:** 1 - 5 Minute Fast-Paced Arcade Runs  
**Supported Platforms:** Mobile & Desktop (Single-Touch Hold/Release, Mouse Click Hold/Release, Spacebar)  
**Engine & Tech Stack:** PixiJS 8 Canvas/WebGL 2D Renderer, Procedural Audio Synthesizer (Web Audio API Thunder & Crackle), 1930s WPA Poster Art Style, Baked Paper Grain & Rain Particle Shaders  
**Original Live Source:** [AIGameShare VOLTA](https://www.aigameshare.com/games/volta)  
**Tagline:** *"One-finger swing arcade on live high-voltage power lines ahead of an encroaching thunderstorm. Hold to reel in and swing, release to fly, and dodge lightning before the bolt fries the wire."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**VOLTA: Lineman of the Storm** เป็นเกมแนว One-Finger Swing Action Arcade สไตล์ภาพโปสเตอร์ย้อนยุค 1930s WPA (Works Progress Administration - Rural Electrification Era)

ผู้เล่นรับบทเป็นช่างไฟสายส่งแรงสูง (Lineman) ที่ต้องโหนสายเคเบิลข้ามเสาไฟฟ้าแรงสูงหนีพายุกระหน่ำ โดยเสาไฟจะส่งเสียงกึกก้องล่วงหน้า 1 วินาทีก่อนที่ฟ้าผ่าจะฟาดลงมาและส่งกระแสไฟวิ่งตามสาย หากผู้เล่นยังจับสายอยู่จะถูกช็อตทันที ต้องปล่อยตัวล่วงหน้าให้พอดีจังหวะเพื่อทำคะแนน **ARC DODGE** พร้อมเก็บฉนวนลูกถ้วยและถุงมือยางฉนวนกันไฟฟ้า

### 1.2 Core Pillars
1. **One-Finger Cable Swing & Winch Reel:**
   - กดค้าง (Hold): ยิงสายเคเบิลไปยังฉนวนเสาไฟข้างหน้า แล้วกว้านรอกจะดึงตัวผู้เล่นเข้าหาเสาพร้อมเหวี่ยงโมเมนตัม
   - ปล่อย (Release): ปล่อยสายเหวี่ยงเพื่อพุ่งลอยตัวไปข้างหน้าตามวิถีฟิสิกส์
2. **Lightning Surge & Arc Dodge:**
   - เสาไฟทุกต้นจะเริ่มมีประกายไฟ (Crackle) ก่อนฟ้าผ่า 1 วินาที
   - หากปล่อยสายก่อนฟ้าผ่าลงพอดี จะได้รับโบนัส **ARC DODGE** และเพิ่มตัวคูณคะแนน
3. **Storm Wall Chase & 5 Hand-Drawn Zones:**
   - กำแพงพายุจะไล่หลังมาอย่างต่อเนื่อง วิ่งหนีผ่าน 5 ฉากทิวทัศน์:
     1. *I · Prairie (ทุ่งหญ้า)*
     2. *II · The Gorge (หุบเหวลึก)*
     3. *III · Rail Yard (ชุมทางรถไฟ)*
     4. *IV · The Pass (ช่องเขาอันตราย)*
     5. *V · Night Line (สายส่งกลางดึก)*
     - ผ่านครบ 5 โซนจะเข้าสู่โหมด Endless Infinite Loops ที่มีความเร็วและความท้าทายสูงขึ้น
4. **Power-ups & Collectibles:**
   - **Insulators (ลูกถ้วยฉนวน):** เก็บตามแนวโค้งการโหนเพื่อสะสมคอมโบและคะแนน
   - **Rubber Gloves (ถุงมือยาง):** ป้องกันไฟฟ้าช็อตฟรี 1 ครั้ง
5. **Aesthetics & Atmosphere:**
   - โทนสี Flat 3-Color Poster Art ผสมผสาน Paper Grain Texture และเม็ดฝน
   - เสียงเอฟเฟกต์ Procedural Thunder, Electric Arcing และ Wind Swell สังเคราะห์ด้วย Web Audio API

---

## 2. Controls & Interaction Guide

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Throw Cable & Reel In** | กดคลิกซ้ายค้าง หรือกดค้าง `Spacebar` | แตะนิ้วค้างบนหน้าจอตรงไหนก็ได้ |
| **Release & Fly** | ปล่อยคลิกซ้าย หรือปล่อย `Spacebar` | ยกนิ้วขึ้นจากหน้าจอ |
| **Pause / Resume** | กดปุ่ม `P` หรือคลิกปุ่ม `II` บนมุมขวา | แตะปุ่ม `II` |
| **Language Toggle** | คลิกปุ่ม `中/EN` | แตะปุ่ม `中/EN` |
| **Mute Audio** | กดปุ่ม `M` หรือคลิกปุ่ม `♪` | แตะปุ่ม `♪` |

---

## 3. Technical Specs & Catalog Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G045` |
| **Directory** | `public/games/volta/` |
| **Main URL** | `/games/volta/index.html` |
| **Engine / Framework** | PixiJS 8 / Web Audio API |
| **Category** | `แอ็กชัน / เอาชีวิตรอด` / `Phaser 2D Engine` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
