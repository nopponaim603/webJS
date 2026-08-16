---
title: "🍦 Sprint 09: ระบบร้านค้าและเศรษฐกิจ (Shop & Economy)"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "Planning"
tags:
  - agile
  - sprint
---
# 🍦 Sprint 09: ระบบร้านค้าและเศรษฐกิจ (Shop & Economy)

**Sprint Name:** Shop & Economy
**Sprint ID:** sprint-09
**Start Date:** 2026-08-13
**End Date:** 2026-08-27 (2 สัปดาห์)

---

## 1. เป้าหมายของ Sprint (Sprint Goal)

นำระบบเศรษฐกิจของร้านค้ามาใช้งาน — ผู้เล่นสามารถเก็บเหรียญจากการผ่านเลเวล ซื้อและอัปเกรดร้านค้าผ่าน 5 ชั้น (Tier) เก็บรีเซิปีใหม่ ๆ และรับบิลออเดอร์จากลูกค้าในมินิเกมเสิร์ฟอาหาร โดยเชื่อมโยงกับระบบเลเวลจาก Sprint 08

---

## 2. ผลงานสำคัญ (Key Deliverables)

| # | ผลงาน | สำเร็จแล้ว |
|---|--------|----------|
| 1 | ระบบเหรียญ (Coin Economy) — เก็บสะสมและใช้จ่าย | [ ] |
| 2 | ระบบอัปเกรดร้านค้า 5 Tier (Cart → Small Shop → Boutique → Grand → Megastore) | [ ] |
| 3 | ระบบออเดอร์ลูกค้า 6 ลุค (Customer Types) | [ ] |
| 4 | มินิเกมเสิร์ฟอาหาร (Customer Service) | [ ] |
| 5 | ระบบรีเซิปี (Recipe Collection) | [ ] |
| 6 | ระบบอัปเกรดภายในร้าน (Servers, Flavors, Tables, Speed, Tips) | [ ] |

---

## 3. สิ้นเดือน Sprint

### สัปดาห์ที่ 1: เศรษฐกิจ + อัปเกรด (2026-08-13 → 2026-08-19)

| วัน | คุณพุทธะ (Focus) | ผลงาน (Deliverable) |
|-----|------------------|---------------------|
| D1 | ออกแบบและกำหนดโครงสร้างข้อมูลเหรียญและรีเซิปี | US-09-01 |
| D2 | พัฒนา Coin Manager + LocalStorage persist | US-09-01 |
| D3 | พัฒนา Shop Tier upgrade system | US-09-02 |
| D4 | พัฒนา Upgrade system (Servers, Flavors, Tables) | US-09-02 |
| D5 | ทดสอบและ polish ระบบร้านค้า | US-09-02 |

### สัปดาห์ที่ 2: มินิเกมเสิร์ฟ + รีเซิปี (2026-08-20 → 2026-08-26)

| วัน | คุณพุทธะ (Focus) | ผลงาน (Deliverable) |
|-----|------------------|---------------------|
| D6 | พัฒนา Customer Types (6 ลุค) | US-09-03 |
| D7 | พัฒนา Customer Service มินิเกม | US-09-03 |
| D8 | พัฒนา Recipe Collection system | US-09-04 |
| D9 | ทดสอบรีเซิปี + เชื่อมต่อกับเลเวล | US-09-04 |
| D10 | Integration testing + polish | — |

---

## 4. User Stories

| US ID | สถานี (Story) | คุณภาพ (Priority) | การคาดคุณ (Est.) |
|-------|--------------|------------------|-----------------|
| US-09-01 | ระบบเหรียญ (Coin Economy) — ผู้เล่นได้รับเหรียญจากการผ่านเลเวลและใช้จ่ายในร้านค้า | P0 | 4 |
| US-09-02 | ระบบอัปเกรดร้าน — ผู้เล่นสามารถอัปเกรดร้านไอนีม์ครีมผ่าน 5 Tier | P0 | 6 |
| US-09-03 | Customer Service มินิเกม — ผู้เล่นเสิร์ฟออเดอร์ให้ลูกค้าและรับทิปตามความเร็ว | P1 | 6 |
| US-09-04 | ระบบรีเซิปี — ผู้เล่นสร้างและรวบรวมรีเซิปีใหม่จากเลเวลและชาเลนจ์ | P1 | 4 |

---

## 5. ปริการทางเทคนิค (Technical Tasks)

| # | ปริการ (Task) | การคาดคุณ | หมายเหตุ |
|---|--------------|----------|----------|
| T1 | ออกแบบ Coin Manager class — persist ด้วย LocalStorage | 4h | ข้อมูล: balance, totalEarned |
| T2 | ออกแบบ ShopTier state — cost formula, unlock conditions | 6h | Tier 1-5: Cart → Small → Boutique → Grand → Megastore |
| T3 | พัฒนา Shop UI — แสดง Tier, ปุ่ม upgrade, สถานะ upgrade ที่เปิดใช้งาน | 4h | ใช้ Phaser Container |
| T4 | ออกแบบ Upgrade system — servers, flavors, tables, speed, tips | 6h | Each upgrade: cost, level, effect |
| T5 | พัฒนา Customer Types data — 6 ลุค, flavor preferences | 4h | ใช้ Boardgame Pack sprites |
| T6 | พัฒนา Customer Service scene — order display, serve logic | 6h | Timer-based, tip calculation |
| T7 | ออกแบบ Recipe data structure + collection state | 4h | Recipes: name, ingredients, flavor |
| T8 | พัฒนา Recipe collection UI — grid display, unlock animations | 4h | Locked/Unlocked states |
| T9 | เชื่อมต่อกับ Coin/Level system จาก Sprint 08 | 4h | Integration testing |
| T10 | Polish UI transitions + feedback (coin animation, upgrade flash) | 6h | Tween + particle effects |

**Total estimated:** 44h (ประมาณ 8-10 วันวิธี)

---

## 6. เกณฑ์การรับรับ (Acceptance Criteria)

| เกณฑ์ | คำอธิบาย |
|--------|----------|
| ✅ เหรียญสะสม | ผู้เล่นสามารถรับเหรียญได้เมื่อทำเลเวลสำเร็จและเห็นยอดสะสมที่ถูกต้อง |
| ✅ ฝากถาวร | ข้อมูลเหรียญและร้านถูกเก็บไว้ใน LocalStorage ไม่หายไปเมื่อลูกรอง |
| ✅ อัปเกรด Tier | ผู้เล่นสามารถอัปเกรดร้านผ่าน 5 Tier ได้เมื่อมีพอตั้งแต่ Tier แรก |
| ✅ ช่องเลือกอัปเกรด | ปุ่มอัปเกรดเปิดใช้งานเฉพาะเมื่อมีพอตั้งและร้านอยู่ Tier นั่น |
| ✅ 6 Customer Types | ลูกค้า 6 ลุคแสดงตัวพร้อมออเดอร์รีเซิปีเฉพาะตัว |
| ✅ มินิเกมเสิร์ฟ | ผู้เล่นสามารถเสิร์ฟออเดอร์ให้ลูกค้าได้และรับทิปตามความเร็ว |
| ✅ รีเซิปี | รีเซิปีใหม่ถูกเปลี่ยนเปิดใช้งานเมื่อทำเลเวล/ชาเลนจ์สำเร็จ |
| ✅ Integration | ระบบเชื่อมต่อกับเลเวลจาก Sprint 08 ได้ — ทำเลเวล → รับตัวอย่าง → ใช้ในร้าน |

---

## 7. ความเสี่ยงและแนวทางการแก้ (Risks & Mitigation)

| ความเสี่ยง | ผลกระทบ | แนวทางการแก้ |
|-----------|---------|---------------|
| ข้อมูล economy balance ไม่สมดุล | ผู้เล่นหมดความสนใจเพราะร้านอัปเกรดยากหรือง่ายเกิน | ถ่วงดุลเป็น iteration — test playtest 5+ รอบก่อนจบสปรินท์ |
| Customer Service มินิเกมซับซ้อนเกิน | ขาดเวลาพัฒนาให้ดี | ลดขอบขี่ — เปิดใช้งาน 2-3 รีเซิปีแรกก่อน |
| UI เรียกไร่บนมือถือ | UX แย่บนจอเล็ก | ทดสอบบนมือถือตอน Week 1 — design responsive ได้เลย |
| LocalStorage corruption | ข้อมูลเสีย | Implement save validation + fallback to default state |
| Performance จาก particle/collision | FPS ต่ำ | Limit particle count, use object pooling |

---

## 8. การพึ่งพาท (Dependencies)

| การพึ่งพาท | สถานะ | หมายเหตุ |
|-----------|--------|----------|
| Sprint 08: Level system | ✅ สำเร็จแล้ว | Coin ให้จากเลเวล สำเร็จแล้ว |
| Sprint 08: Ice cream flavors (10) | ✅ สำเร็จแล้ว | ใช้เป็นฐานรีเซิปี |
| Kenney: Boardgame Pack (Customer types) | ✅ สำเร็จแล้ว | 6 ลุคจาก sprites |
| Kenney: Puzzle Pack 2 (Coin sprites) | ✅ สำเร็จแล้ว | ใช้สิ่งของร้าน |
| Next.js project structure | ✅ สำเร็จแล้ว | Route /games/ice-cream-town/ |

---

## 9. ตัวชี้วัดความสำเร็จ (Success Metrics)

| ตัวชี้วัด | เป้าหมาย |
|----------|----------|
| ระบบเหรียญทำงานได้ 100% | เปิดใช้งานครบทุก feature |
| Shop UI รับฟังการอัปเกรด | ใช้ได้ทุก tier + upgrade ปุ่มทำงาน |
| Customer Service มินิเกม playtest ได้ | ทดสอบได้จริง 5+ รอบ |
| รีเซิปี collection ถูกต้อง | ใช้ได้ทุก recipe ที่ปลดล็อก |
| Performance บนมือถือ ≥ 30 FPS | ไม่ lag |
| ทุก feature ทดสอบและ bug-free | 0 critical bugs |
