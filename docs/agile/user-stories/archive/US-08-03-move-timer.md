---
title: "User Story: US-08-03 — Move Counter and Timer Display"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Dev Team"
status: "Completed"
tags:
  - agile
  - user-story
---

# User Story: US-08-03 — Move Counter and Timer Display

**Status:** ✅ Done  
**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Owner:** Dev Team  
**Created:** 2026-07-27  
**Last Updated:** 2026-07-28  
**Priority:** P0 — Must Have  
**Estimate:** 2 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกม  
**ฉันต้องการ** ดูตัวนับจำนวนครั้งที่เปิดการ์ด (Moves) และเวลาที่ใช้เล่น (Timer) บนหน้าจอ  
**เพื่อให้** สามารถติดตามและประเมินประสิทธิภาพความจำในการเล่นเกมของตนเองได้  

---

## ✅ Acceptance Criteria

1. [x] แสดงตัวนับจำนวนครั้งเปิดการ์ด (Moves Counter) เริ่มต้นที่ 0
2. [x] แสดงตัวจับเวลา (Timer Display) รูปแบบ `MM:SS` เริ่มต้นที่ `00:00`
3. [x] ตัวนับ Moves เพิ่มขึ้นทีละ 1 เมื่อเปิดการ์ดครบ 1 คู่ (1 Move = 2 Cards Opened)
4. [x] Timer เริ่มเดินโดยอัตโนมัติเมื่อผู้เล่นคลิกเปิดการ์ดใบแรก
5. [x] Timer หยุดทำงานทันทีเมื่อจับคู่การ์ดครบทั้ง 8 คู่ (Win Condition)
6. [x] ตัว HUD แสดงผลชัดเจน ด้านบนของกระดานเกมโดยไม่บดบังตารางการ์ด (ยืนยันที่ desktop/tablet ขึ้นไป — ปัญหาป้ายข้อความซ้อนทับกันที่หน้าจอแคบ ≤360px ถูกติดตามแยกไว้ใน [US-08-06](../US-08-06-mobile-responsive.md))

---

## 🛠 Technical Tasks

- [x] สร้าง State สำหรับนับจำนวน Moves (`movesCount`)
- [x] สร้าง State และ Timer Interval สำหรับนับเวลา (`timerInterval`, `secondsElapsed`)
- [x] พัฒนาฟังก์ชัน `startTimer()`, `stopTimer()`, `resetTimer()`
- [x] พัฒนาฟังก์ชัน `formatTime(seconds)` แปลงวินาทีเป็นรูปแบบ `MM:SS`
- [x] อัปเดตการแสดงผลบน HUD Elements แบบ Real-time
- [x] หยุดการทำงานของ Timer เมื่อเกมจบลง

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/index.html` | โครงสร้าง HUD Display (Timer, Moves Counter) |
| `public/games/card-memory/game.js` | ฟังก์ชัน `updateMoveCounter()`, `startTimer()`, `stopTimer()` |
| `public/games/card-memory/styles.css` | สไตล์ส่วนหัว HUD Display |

---

## 🎨 HUD Design Specifications

- **Location:** ด้านบนของกระดานเกม (Top Center Layout)
- **Labels:** `Moves: 0` | `Time: 00:00`
- **Format:** `MM:SS` (เช่น `01:25`)

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../../01-product-backlog.md)
- **Previous Story:** [US-08-02](./US-08-02-match-logic.md)
- **Next Story:** [US-08-04](./US-08-04-results-modal.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-28):
1. **แก้ไขภาษาและคำสับสน (Fixed Phrasing Errors):** แก้ไขคำว่า "ตัวเล่านับการตี", "หน้าที่เล่นเกม" และ "จับ 1 ตี" ให้เป็นคำศัพท์การออกแบบเกมที่ถูกต้อง ("ตัวนับจำนวนครั้งเปิดการ์ด (Moves)", "ตัวจับเวลา (Timer)", "1 Move = 2 Cards Opened")
2. **แก้ไขข้อความสับสนใน Acceptance Criteria:** ลบข้อความที่แปลผิดพลาด ("ไม่ต้องการแสดงที่จะเล่นเกมที่จะเล่น") และปรับปรุงเกณฑ์การแสดงผล HUD ด้านบนของหน้าจอให้ชัดเจน
3. **จัดระเบียบชื่อไฟล์ (Descriptive Filename):** เปลี่ยนชื่อไฟล์เป็น `US-08-03-move-timer.md` ตามข้อกำหนดมาตรฐาน `task-tracker` skill

### ✅ Verification Note (2026-07-28)
ตรวจสอบผ่าน automated browser test: Moves/Timer นับค่าถูกต้อง, HUD อยู่เหนือกระดานเสมอ ไม่บดบังการ์ด บนหน้าจอ desktop/tablet ปัญหา label ซ้อนทับที่ 360px เป็นปัญหาด้าน Responsive Breakpoint ซึ่งอยู่ในขอบเขตของ US-08-06