---
title: "🧋 BOBA PEARL DROP: 100% SUGAR — Game Specification"
project: "BOBA PEARL DROP: 100% SUGAR"
version: "1.0.0"
last_updated: "2026-08-12"
owner: "Noppon / Dev Team"
status: "Design"
tags:
  - gdd
  - boba-pearl-drop
---
# 🧋 BOBA PEARL DROP: 100% SUGAR — Game Specification

**Code Name:** `boba-pearl-drop`  
**Game ID:** `boba-pearl-drop-3d` (`babylon-boba`)  
**Engine / Tech Stack:** Babylon.js 3D Engine, WebGL, PBR Shader System, Custom Sphere Physics, Particle Systems, Web Audio API  
**Inspiration:** Kevin Ngo's Super Monkey Ball style 3D Boba Game Experiment  

---

## 1. Executive Summary

**BOBA PEARL DROP: 100% SUGAR** คือเกม 3D Arcade / Marble Roller สไตล์น่ารักที่ให้ผู้เล่นรับบทเป็นเม็ดไข่มุกชาไข่มุก (Boba Pearl) ที่ต้องวิ่ง กลิ้ง ทรงตัว และกระโดดผ่านด่าน 3D ลอยฟ้าธีมเครื่องดื่มชาไข่มุก 3 รสชาติ ได้แก่ Milk Tea Meadow, Taro Heights และ Matcha Gardens เพื่อสะสมก้อนน้ำตาลให้ได้ครบ 100% Sugar ก่อนจะพุ่งลงถ้วยชาไข่มุกยักษ์ (Boba Cup) ที่ปลายทาง

---

## 2. Document Suite Quick Links

- 📘 **Game Concept & Vision:** [00-concept.md](./00-concept.md)
- 🎮 **Core Gameplay & Mechanics:** [01-mechanics.md](./01-mechanics.md)
- 🗺️ **Level Design & Architecture:** [02-level-design.md](./02-level-design.md)
- 🎨 **Art & Visual Direction:** [03-art-direction.md](./03-art-direction.md)
- 💻 **Software System Design:** [../../software/games/boba-pearl-drop/01-system-design.md](../../software/games/boba-pearl-drop/01-system-design.md)
- 🚀 **Product Backlog & User Stories:** [../../agile/games/boba-pearl-drop/01-product-backlog.md](../../agile/games/boba-pearl-drop/01-product-backlog.md)

---

## 3. Technology & Target Specs

- **3D Engine:** BabylonJS 7.x (via CDN / NPM)
- **Canvas Rendering:** High-DPI WebGL 2.0 Canvas
- **Lighting & Post-FX:** PBR Materials, Directional Light with Soft Shadows, Glow Layer, Motion Blur
- **Physics Engine:** Babylon.js Physics Engine / Custom Sphere Physics Controller
- **Target Platform:** Desktop Browsers & Mobile Devices (HTML5 Web App)
