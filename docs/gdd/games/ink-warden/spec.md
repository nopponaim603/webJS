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
  - ai-generated
---

# 🖌️ Ink Warden 墨守 — Game Design Document & Dev Specs

**Code Name:** `ink-warden`  
**Game ID:** `G042`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.0.0`  
**Age Rating:** All Ages / 10+  
**Target Playtime:** 3–12 Minutes per Defense Run  
**Supported Platforms:** Desktop & Mobile (Touch Stroke Drawing, Mouse Brush, Keyboard Glyphs)  
**Engine & Tech Stack:** WebGL Living-ink Fluid Simulation (`fluid.js`), HTML5 Canvas Gesture Recognition (`game.js`), Procedural Traditional Web Audio Synthesizer  
**Original Live Source:** [AIGameShare Ink Warden](https://www.aigameshare.com/games/ink-warden?play=1&mode=fullscreen)  
**Tagline:** *"Draw living-ink brush strokes, cast circle, zigzag, wave, and spiral glyph spells, fight paper demons and bosses, and defend the ancestral shrine."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Ink Warden (墨守)** เป็นเกมแนว Calligraphy Action Defense ที่ผสมผสานศิลปะการตวัดพู่กันจีนโบราณเข้ากับระบบจำลองพลศาสตร์ของไหลของหมึกดำ (Living-ink WebGL Fluid Dynamics) 

ผู้เล่นจะรับบทเป็นผู้พิทักษ์หมึกพู่กัน ใช้ปลายนิ้วหรือเมาส์วาดสัญลักษณ์เวทมนตร์ (Glyphs: วงกลม Circle, ซิกแซก Zigzag, คลื่น Wave, และก้นหอย Spiral) ลงบนผืนกระดาษสา เพื่อปลดปล่อยเวทหมึกสังหารฝูงปีศาจกระดาษ (Paper Demons) และบอสอสูรหมึกโบราณ

### 1.2 Core Pillars
1. **Living-ink Fluid Dynamics Simulation:** ทุกฝีแปรงที่วาดจะกระจายตัวเป็นละอองหมึกดำที่ไหลเวียนแบบ Real-time Fluid Dynamics บน WebGL
2. **Gesture Glyph Recognition:** ระบบตรวจจับการวาดรูปทรงเรขาคณิตและอักขระพู่กันอย่างแม่นยำ รวดเร็ว และลื่นไหล
3. **Paper Demon Horde Defense:** การป้องกันแท่นบูชาจากคลื่นศัตรูกระดาษพับ (Origami/Paper Demons) หลากหลายพฤติกรรม
4. **Authentic Aesthetic & Standalone Web Audio:** งานภาพสไตล์หมึกจีนโบราณ (Ink Wash Painting) พร้อมเสียงเครื่องสายจีนและกลองโบราณที่สังเคราะห์แบบ Procedural

---

## 2. Technical Specs & Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G042` |
| **Directory** | `public/games/ink-warden/` |
| **Main URL** | `/games/ink-warden/index.html` |
| **Tech Stack** | WebGL Fluid Dynamics / Canvas Gesture Engine / Web Audio API |
| **Category** | `Three.js 3D Engine` / `ปริศนา / ป้องกันฐาน` |
| **Standalone Ready** | 100% Offline Compatible |
