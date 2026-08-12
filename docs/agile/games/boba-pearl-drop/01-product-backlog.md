# 🚀 BOBA PEARL DROP: 100% SUGAR — Product Backlog & Sprint Roadmap

**Version:** 1.0.0 | **Last Updated:** 2026-08-12  

---

## 📌 Product Backlog (Must-Have MVP)

| ID | Feature / User Story | Acceptance Criteria | Priority | Status |
| :--- | :--- | :--- | :---: | :---: |
| **US-BOBA-01** | **BabylonJS Core Scene & Camera**<br>ในฐานะผู้เล่น ฉันต้องการเห็นฉาก 3D พร้อมเม็ดไข่มุกและกล้องติดตามนุ่มนวล เพื่อเตรียมพร้อมสำหรับการเล่น | - BabylonJS Canvas ทำงานบน Web browser ได้สมบูรณ์<br>- กล้อง ArcRotate/Follow Camera ติดตามไข่มุก 360° | Must Have | 🏗 Ready |
| **US-BOBA-02** | **Sphere Rolling Physics & Controls**<br>ในฐานะผู้เล่น ฉันต้องการกลิ้งไข่มุกด้วย WASD/Arrow Keys และกด Space เพื่อเด้งได้ | - เคลื่อนที่ตามทิศทางกล้องนุ่มนวล<br>- มีน้ำหนักและแรงต้านการกลิ้งสมจริง<br>- ระบบเด้ง (Jump) สมบูรณ์ | Must Have | 🏗 Ready |
| **US-BOBA-03** | **Sugar Cubes Collection & HUD**<br>ในฐานะผู้เล่น ฉันต้องการเก็บก้อนน้ำตาลเพื่อสะสม Sugar Bar 0-100% และเห็น HUD สดใส | - Sugar Cubes หมุนได้กลางอากาศ<br>- เมื่อชนก้อนน้ำตาล เพิ่ม Sugar +10% และเกิดประกายไฟ Particle<br>- HUD แสดง Sugar Bar % และเวลา | Must Have | 🏗 Ready |
| **US-BOBA-04** | **Level 1: Milk Tea Meadow Track**<br>ในฐานะผู้เล่น ฉันต้องการเล่นด่านแรกสนามชานมสดที่มีหลอดดูดและถ้วยชาไข่มุกยักษ์ปลายทาง | - สร้างทางกลิ้งธีมชานมสดเรียบร้อย<br>- มีหลอดดูดยิงไข่มุกไปยังอีกฝั่ง<br>- ถ้วย Finish Cup ตรวจจับการชนะด่าน | Must Have | 🏗 Ready |
| **US-BOBA-05** | **Levels 2 & 3 (Taro & Matcha)**<br>ในฐานะผู้เล่น ฉันต้องการด่านท้าทายเพิ่มขึ้น 2 ด่าน (ยอดเขาเผือก & สวนชาเขียว) | - ด่าน Taro Heights (แท่นเลื่อน & สะพานแคบ)<br>- ด่าน Matcha Gardens (ไม้คนชาหมุนหลบ & สโลปดรอป) | Should Have | ⏳ Pending |
| **US-BOBA-06** | **Audio & Visual Polish**<br>ในฐานะผู้เล่น ฉันต้องการฟัง SFX เสียงเด้ง/เก็บน้ำตาล และเห็นเอฟเฟกต์ Glow/Splash น่ารักๆ | - PBR Material ไข่มุกผิวมันวาว<br>- Glow Layer และเอฟเฟกต์สาดน้ำชาเมื่อชนะ | Nice to Have | ⏳ Pending |

---

## 🗓 Roadmap & Sprint Overview

- **Sprint 1 (Core Prototype):** Engine Setup + Player Sphere Physics + Level 1 Setup + Basic HUD
- **Sprint 2 (Content & Levels):** Level 2 & 3 Construction + Collectibles + Audio SFX
- **Sprint 3 (Polish & Release):** Particle FX + Touch Controls + Bug Fixing & Deployment

---

## 🔗 Related Documents
- [GDD Specification](../../gdd/games/boba-pearl-drop/spec.md)
- [Software System Design](../../software/games/boba-pearl-drop/01-system-design.md)
