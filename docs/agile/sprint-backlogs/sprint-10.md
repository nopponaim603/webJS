---
title: "🍦 Sprint 10: การสำรวจเมือง (Town Exploration)"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "Planning"
tags:
  - agile
  - sprint
---

# 🍦 Sprint 10: การสำรวจเมือง (Town Exploration)

**Sprint Name:** Town Exploration
**Sprint ID:** sprint-10
**Start Date:** 2026-08-28
**End Date:** 2026-09-11 (2 สัปดาห์)
**Status:** Planning

---

## 1. เป้าหมายของ Sprint (Sprint Goal)

สร้างระบบเมืองที่ผู้เล่นสามารถสำรวจและเลื่อนคิ่นผ่าน 7 โซน — Town Square → School → Business → Art → Beach → Festival → Night Town โดยแต่ละโซนมีลูกค้า/อีเวนต์เฉพาะตัว และมีระบบโหยดิ์เต้าส่วนแบบสุ่ม (dice random events) ที่ส่งผลต่อร้าน

---

## 2. ผลงานสำคัญ (Key Deliverables)

| # | ผลงาน | สำเร็จแล้ว |
|---|--------|----------|
| 1 | Town Map — แผนที่เมืองแบบ interactive | [ ] |
| 2 | ระบบปลดล็อกโซน 7 โซน (Zone Unlock Progression) | [ ] |
| 3 | ระบบโหยดิ์เต้าส่วนแบบสุ่ม (Dice Random Events) | [ ] |
| 4 | Zone-specific gameplay — ลูกค้า/อีเวนต์เฉพาะโซน | [ ] |
| 5 | Town Progression Tracker — ติดตามความคืบหน้า | [ ] |
| 6 | Zone transition animations — ข้ามโซนแบบ smooth | [ ] |

---

## 3. สิ้นเดือน Sprint

### สัปดาห์ที่ 1: Town Map + Zone Progression (2026-08-28 → 2026-09-03)

| วัน | คุณพุทธะ (Focus) | ผลงาน (Deliverable) |
|-----|------------------|---------------------|
| D1 | ออกแบบ Zone data structure + unlock conditions | US-10-01 |
| D2 | พัฒนา Town Map scene — แสดง 7 โซน | US-10-01 |
| D3 | พัฒนา Zone navigation — tap zone to enter | US-10-01 |
| D4 | พัฒนา Zone unlock progression system | US-10-02 |
| D5 | พัฒนา Zone transition animations | US-10-02 |

### สัปดาห์ที่ 2: Dice Events + Zone-Specific (2026-09-04 → 2026-09-10)

| วัน | คุณพุทธะ (Focus) | ผลงาน (Deliverable) |
|-----|------------------|---------------------|
| D6 | พัฒนา Dice random event system | US-10-03 |
| D7 | ใช้งาน Dice events ในเลเวล (bonuses, penalties, surprises) | US-10-03 |
| D8 | พัฒนา zone-specific customers & orders | US-10-04 |
| D9 | พัฒนา zone-specific challenges/events | US-10-04 |
| D10 | Progression tracker + polish | — |

---

## 4. User Stories

| US ID | สถานี (Story) | คุณภาพ (Priority) | การคาดคุณ (Est.) |
|-------|--------------|------------------|-----------------|
| US-10-01 | Town Map — ผู้เล่นเห็นและนำทางในแผนที่เมืองที่มีหลายโซน | P0 | 6 |
| US-10-02 | Zone Unlock Progression — ปลดล็อกโซนตามความคืบหน้า (7 โซน) | P0 | 6 |
| US-10-03 | Dice Random Events — ทอยเต้าเต้าส่วนได้ผลกระทบต่อร้าน | P1 | 6 |
| US-10-04 | Zone-Specific Gameplay — แต่ละโซนมีลูกค้า/อีเวนต์เฉพาะ | P1 | 6 |

---

## 5. ปริการทางเทคนิค (Technical Tasks)

| # | ปริการ (Task) | การคาดคุณ | หมายเหตุ |
|---|--------------|----------|----------|
| T1 | ออกแบบ Zone data — name, bg, unlockReq, customers[], events[] | 6h | 7 zones, each with unique assets |
| T2 | พัฒนา Town Map scene — render zone sprites as a grid/map | 8h | Interactive map, tap-to-navigate |
| T3 | พัฒนา Zone navigation (tap → transition → enter zone) | 6h | Tween + fade transitions |
| T4 | ออกแบบ Zone unlock conditions (level req, coin req) | 6h | Progressive unlock: Square → ... → Night Town |
| T5 | พัฒนา unlock animation + locked overlay | 6h | Padlock icon, "Level 5 required" |
| T6 | พัฒนา Dice system — generate random events (bonuses, penalties, surprises) | 8h | Event types: coin bonus, speed boost, customer surge |
| T7 | เชื่อมต่อกับ Level/Shop systems จาก Sprint 08-09 | 6h | Dice affects economy |
| T8 | พัฒนา zone-specific customer data (different sprites/preferences) | 6h | School zone → kid customers, Beach → relaxed |
| T9 | พัฒนา zone-specific challenge data (unique objectives) | 6h | Art zone → match specific colors, etc. |
| T10 | พัฒนา Progression Tracker UI — show unlocked zones + % | 6h | Checkpoint grid display |
| T11 | Polish zone background assets + ambient animations | 8h | Kenney: Beach, School, etc. assets |

**Total estimated:** 68h (ประมาณ 10-12 วันวิธี)

---

## 6. เกณฑ์การรับรับ (Acceptance Criteria)

| เกณฑ์ | คำอธิบาย |
|--------|----------|
| ✅ Town Map ทำงานได้ | ผู้เล่นเห็นแผนที่เมืองทั้งหมด 7 โซน |
| ✅ Navigation | Tap โซนใดก็เดินทางเข้าโซนได้ (หรือเห็น overlay ถ้า lock) |
| ✅ Zone Unlock Progression | โซนเปลี่ยนเปิดตัวตามข้อกำหนด (level/coin req) |
| ✅ Lock/Unlock animation | มี animation ชัดเจนเมื่อปลดล็อก/ปิด |
| ✅ Dice Events | ทอยเต้าส่วนได้ผลกระทบต่อร้าน (bonuses, penalties, surprises) |
| ✅ Zone-specific customers | แต่ละโซนมีลูกค้า/รีเซิปีเฉพาะตัว |
| ✅ Zone-specific events | แต่ละโซนมีความยาก/อีเวนต์เฉพาะ |
| ✅ Integration | ทำงานร่วมกับเลเวล/ร้าน/รีเซิปีได้ |
| ✅ Progression tracker | เห็น progress ดี ๆ — โซนที่ปลดล็อก + % |

---

## 7. ความเสี่ยงและแนวทางการแก้ (Risks & Mitigation)

| ความเสี่ยง | ผลกระทบ | แนวทางการแก้ |
|-----------|---------|---------------|
| Asset ครบทุกโซนไม่เพียงพอ | ขาดความหลากหลาย | ใช้ placeholder color + 4-5 asset สำหรับ zone ที่เหลือ |
| Zone unlock balance ซับซ้อน | Unlock เร็วเกินหรือช้าเกิน | Test playthrough 3 รอบก่อนจบ |
| Dice events ครอบคลุมมาก | ขาดเวลาทำทุก event | จำกัด 5-6 event types แรก |
| Performance จาก zone backgrounds | FPS ต่ำบนมือถือ | Optimize asset size, lazy load backgrounds |
| Map navigation ซับซ้อน | UX แย่บนจอเล็ก | Test on mobile early — simple tap-to-navigate |
| Zone content overlap | ลูกค้า/อีเวนต์ซ้ำกัน | Define unique theme per zone clearly |

---

## 8. การพึ่งพาท (Dependencies)

| การพึ่งพาท | สถานะ | หมายเหตุ |
|-----------|--------|----------|
| Sprint 08: Level system | ✅ สำเร็จแล้ว | Zone unlock based on level |
| Sprint 09: Coin/Shop system | ✅ สำเร็จแล้ว | Zone unlock costs coins |
| Sprint 09: Customer types | ✅ สำเร็จแล้ว | Zone-specific customer variants |
| Sprint 09: Recipe collection | ✅ สำเร็จแล้ว | Zone-specific recipes |
| Kenney: Beach, School, etc. assets | ✅ สำเร็จแล้ว | Zone backgrounds |
| Kenney: Boardgame Pack | ✅ สำเร็จแล้ว | Zone marker sprites |

---

## 9. ตัวชี้วัดความสำเร็จ (Success Metrics)

| ตัวชี้วัด | เป้าหมาย |
|----------|----------|
| Town Map ทำงานได้ 100% | 7 โซนแสดงครบ ทุกโซน navigate ได้ |
| Zone unlock progression | ทุก zone ปลดล็อกได้ตามข้อกำหนด |
| Dice events ทำงานได้ | ทอยเต้าส่วนได้ 5+ event types |
| Zone-specific content | แต่ละโซนมี content เฉพาะ ไม่ซ้ำ |
| Progression tracker | เห็น progress ชัดเจน |
| Performance บนมือถือ ≥ 30 FPS | ไม่ lag ขณะ map/transition |
| ทุก feature ทดสอบและ bug-free | 0 critical bugs |
