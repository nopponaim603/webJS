---
title: "User Story: US-08-02 — Card Flip and Match Detection Logic"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Dev Team"
status: "Completed"
tags:
  - agile
  - user-story
---
# User Story: US-08-02 — Card Flip and Match Detection Logic

**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Created:** 2026-07-27  
**Priority:** P0 — Must Have  
**Estimate:** 4 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกม  
**ฉันต้องการ** คลิกการ์ดเพื่อเปิดดูหน้าไพ่ 2 ใบ และให้ระบบตรวจสอบความถูกต้องโดยอัตโนมัติ  
**เพื่อให้** รู้ว่าจับคู่ไพ่ถูกต้องหรือไม่ และดำเนินเกมต่อไปได้อย่างราบรื่น  

---

## ✅ Acceptance Criteria

1. [x] ป้องกันการคลิกซ้ำซ้อนขณะกำลังเล่นแอนิเมชันพลิกการ์ด (Prevent Double Click)
2. [x] รับ Click/Touch Events ได้อย่างแม่นยำทุกใบ
3. [x] คลิกการ์ดใบแรก → แสดงแอนิเมชันเปิดหน้าการ์ด (Face Up)
4. [x] คลิกการ์ดใบที่สอง → แสดงแอนิเมชันเปิดหน้าการ์ด + เริ่มตรวจสอบการจับคู่
5. [x] กรณีจับคู่ถูกต้อง → การ์ดทั้งสองใบเปิดค้างไว้ (Matched State)
6. [x] กรณีจับคู่ไม่ถูกต้อง → หน่วงเวลาแล้วพลิกการ์ดกลับหน้าคว่ำ (Face Down) — ใช้งานจริง ~1.1s (shake 300ms + flip-back 1100ms) แทน 1.5s ตามสเปกเดิม แต่ยังให้ความรู้สึก UX ที่เหมาะสม
7. [x] ป้องกันไม่ให้ผู้เล่นคลิกการ์ดใบที่ 3 ขณะกำลังเปรียบเทียบผลจับคู่
8. [x] เมื่อจับคู่ได้ครบทั้ง 8 คู่ → เรียกทำงาน Win Condition และเปิดหน้าต่างสรุปผล

---

## 🛠 Technical Tasks

- [x] เขียน Event Handler สำหรับการเปิดการ์ด
- [x] เพิ่ม Match Detection Algorithm เปรียบเทียบค่าไพ่ (Value/Suite)
- [x] สร้าง Lock State ป้องกันการคลิกเกิน 2 ใบพร้อมกัน
- [x] ตั้งเวลา Timeout หน่วงเวลาเพื่อพลิกการ์ดกลับกรณีจับคู่ผิด
- [x] นับจำนวนคู่ที่เปิดสำเร็จ (Match Counter)
- [x] เชื่อมโยงระบบเข้ากับ Win State เพื่อส่งค่าไปยังหน้าสรุปผล

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/game.js` | ฟังก์ชัน `selectCard()`, `checkMatch()`, `flipBack()` และการจัดการ State |

---

## 🎨 State Machine Design

```text
[FACE_DOWN] -- (Click Card 1) --> [FACE_UP]
[FACE_UP]   -- (Click Card 2) --> [MATCH_CHECKING]
[MATCH_CHECKING] -- (Matched)   --> [MATCHED (Locked Open)]
[MATCH_CHECKING] -- (Mismatch)  --> (Wait 1.5s) --> [FACE_DOWN]
```

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../../01-product-backlog.md)
- **Previous Story:** [US-08-01](./US-08-01-card-grid.md)
- **Next Story:** [US-08-03](./US-08-03-move-timer.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-28):
1. **แก้ไขคำสับสนและคำสะกดผิด (Grammar & Terminology Fixes):** แก้ไขคำว่า "เรื่อยรับ click event", "ป้องการคลิกใบที่ 3" เป็นภาษาไทยเทคนิคที่ถูกต้องและเข้าใจง่าย ("รับ Event ได้แม่นยำ", "ป้องกันการคลิกการ์ดใบที่ 3 ขณะเปรียบเทียบ")
2. **แก้ไขลิงก์อ้างอิงเสีย (Fixed Broken Links):** แก้ไขลิงก์ไปยังเอกสาร GDD Spec จริงของเกม [Card Memory Spec](../../../gdd/games/card-memory/spec.md)
3. **จัดระเบียบชื่อไฟล์ (Descriptive Filename):** เปลี่ยนชื่อไฟล์เป็น `US-08-02-match-logic.md` ตามข้อกำหนดมาตรฐาน `task-tracker` skill

### ✅ Verification Note (2026-07-28)
ตรวจสอบผ่านการรัน `public/games/card-memory/game.js` จริงด้วย automated browser test (Playwright): บังคับ shuffle แบบ deterministic แล้วเล่นจนครบ 8 คู่ ยืนยันว่า flip/match/mismatch/win-state ทำงานถูกต้องครบตาม Acceptance Criteria ทั้งหมด