---
title: "User Story: US-17-01 - Character Selection & Boot Engine"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "GameDev Team"
status: "Completed"
tags:
  - agile
  - user-story
---

# User Story: US-17-01 - Character Selection & Boot Engine

**Status:** ✅ Done  
**Epic:** [Epic 17 — Tiny Dungeon Survivor](../01-product-backlog.md)  
**Owner:** GameDev Team  

---

## 📖 Description
**ในฐานะ** ผู้เล่น  
**ฉันต้องการ** เลือกตัวละครฮีโร่ (Knight, Wizard, Rogue) ก่อนเริ่มเกม  
**เพื่อให้** สัมผัสรูปแบบการเล่น อาวุธเริ่มต้น และค่าพลังที่แตกต่างกันตามสไตล์ที่ชอบ  

---

## ✅ Acceptance Criteria
1. [x] หน้า MenuScene แสดงการ์ด 3 ตัวละครพร้อมสไปรต์พิกเซลอาร์ต สถิติ (HP, Speed) และคำอธิบาย
2. [x] เมื่อกดเลือกฮีโร่ จะส่งข้อมูล `heroId` เข้าสู่ `MainGameScene`
3. [x] โหลดสไปรต์ชีต `kenney_tiny-dungeon` สมบูรณ์โดยไม่เกิดข้อผิดพลาด

---

## 🔗 Related Files
- Backlog: [Product Backlog](../01-product-backlog.md)
- GDD: [Tiny Dungeon Spec](../../gdd/games/tiny-dungeon-roguelike/spec.md)
- Code: [game.js](../../../public/games/tiny-dungeon-roguelike/game.js)
