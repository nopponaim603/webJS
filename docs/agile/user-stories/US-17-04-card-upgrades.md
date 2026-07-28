# User Story: US-17-04 - Roguelike Card Upgrade & Level-up System

**Status:** ✅ Done  
**Epic:** [Epic 17 — Tiny Dungeon Survivor](../01-product-backlog.md)  
**Owner:** GameDev Team  

---

## 📖 Description
**ในฐานะ** ผู้เล่น  
**ฉันต้องการ** สุ่มเลือกการ์ดอัปเกรด 1 ใน 3 ใบเมื่อเลเวลอัป  
**เพื่อให้** สามารถวางแผนพัฒนาสายอาวุธและความสามารถฮีโร่ในแบบของตนเอง  

---

## ✅ Acceptance Criteria
1. [x] เมื่อเกจ XP เต็ม เกมจะหยุดเวลาชั่วคราวและเปิด Modal UI
2. [x] สุ่มการ์ด 3 ใบจาก Upgrade Pool (อาวุธใหม่, HP, ความเร็ว, พลังโจมตี, ดูดเลือด)
3. [x] เมื่อเลือกการ์ด จะเพิ่มความสามารถให้ฮีโร่ ปิด Modal และเล่นเกมต่อได้ทันที

---

## 🔗 Related Files
- Backlog: [Product Backlog](../01-product-backlog.md)
- GDD: [Tiny Dungeon Spec](../../gdd/games/tiny-dungeon-roguelike/spec.md)
- Code: [game.js](../../../public/games/tiny-dungeon-roguelike/game.js)
