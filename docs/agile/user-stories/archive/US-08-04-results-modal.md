---
title: "User Story: US-08-04 — Match Results Screen with Stats"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-07-28"
owner: "Dev Team"
status: "Completed"
tags:
  - agile
  - user-story
---
# User Story: US-08-04 — Match Results Screen with Stats

**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Created:** 2026-07-27  
**Priority:** P0 — Must Have  
**Estimate:** 2 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกม  
**ฉันต้องการ** หน้าต่างสรุปผลลัพธ์ (Results Modal) เมื่อจับคู่การ์ดครบทั้งหมด  
**เพื่อให้** สรุปเวลา จำนวนครั้งที่ใช้เล่น คะแนนสะสม และสามารถเลือกเริ่มเกมใหม่ได้  

---

## ✅ Acceptance Criteria

1. [x] แสดง Modal/Overlay สรุปผลชัยชนะอัตโนมัติเมื่อจับคู่การ์ดครบ 8 คู่
2. [x] แสดงสถิติการเล่นอย่างถูกต้อง:
   - เวลาที่ใช้ทั้งหมด (Total Time)
   - จำนวนครั้งที่เปิดไพ่ (Total Moves)
   - คะแนนรวม (Calculated Score)
   - ระดับดาวการเล่น (Rating 1-5 Stars)
3. [x] มีปุ่ม "Play Again" สำหรับเริ่มเกมใหม่ทันที
4. [x] รองรับการแสดงผลแบบ Responsive สวยงามบนทุกขนาดหน้าจอ (ยืนยันที่ 360px และ 480px viewport)

---

## 🛠 Technical Tasks

- [x] สร้าง Results Modal Component (Canvas-rendered แทน HTML/CSS แยกไฟล์)
- [x] พัฒนาฟังก์ชันคำนวณคะแนน (`calculateScore(moves, time)`)
- [x] พัฒนาฟังก์ชันประเมินระดับดาว (`calculateRating(moves, time)`)
- [x] เขียน Event Handler สำหรับปุ่ม "Play Again" เพื่อรีเซ็ตกระดาน
- [ ] ส่งค่าคะแนนสูงสุดไปยัง Portfolio Controller ผ่าน `window.parent.postMessage` — ยังไม่ implement (บันทึกลง `localStorage` ในเกมเองแทน) ติดตามเป็นส่วนหนึ่งของ [US-03-01](../../01-product-backlog.md) ซึ่งเป็น cross-cutting feature ที่ยังไม่เสร็จในทุกเกมของโปรเจกต์

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/index.html` | โครงสร้าง HTML Modal สรุปผล |
| `public/games/card-memory/game.js` | ฟังก์ชัน `showResults()`, `calculateScore()`, `calculateRating()` |
| `public/games/card-memory/styles.css` | สไตล์ Glassmorphism Modal และ Star Rating |

---

## 🎨 Score & Star Rating Formula

### Rating Criteria (1 - 5 Stars)
- ⭐⭐⭐⭐⭐ (5 Stars): น้อยกว่า 10 moves หรือ น้อยกว่า 30 วินาที
- ⭐⭐⭐⭐☆ (4 Stars): 10-14 moves หรือ 30-60 วินาที
- ⭐⭐⭐☆☆ (3 Stars): 15-18 moves หรือ 61-90 วินาที
- ⭐⭐☆☆☆ (2 Stars): 19-22 moves หรือ 91-120 วินาที
- ⭐☆☆☆☆ (1 Star): เกิน 22 moves หรือ เกิน 120 วินาที

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../../01-product-backlog.md)
- **Previous Story:** [US-08-03](./US-08-03-move-timer.md)
- **Next Story:** [US-08-05](./US-08-05-game-restart.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-28):
1. **ปรับปรุงสูตรและเกณฑ์การให้ดาว (Clarified Rating Rules):** ปรับเกณฑ์การประเมินดาว 1-5 ดาวให้ชัดเจนและสอดคล้องกับจำนวนการเปิดการ์ด 16 ใบ (8 คู่)
2. **แก้ไขสำนวนภาษา (Language Refinement):** เปลี่ยนคำว่า "การตี" เป็น "จำนวนครั้งเปิดการ์ด (Moves)" และจัดรูปแบบกล่องตัวอย่างการแสดงผลให้เป็นมาตรฐาน
3. **จัดระเบียบชื่อไฟล์ (Descriptive Filename):** เปลี่ยนชื่อไฟล์เป็น `US-08-04-results-modal.md` ตามข้อกำหนดมาตรฐาน `task-tracker` skill

### ✅ Verification Note (2026-07-28)
ทดสอบเล่นจนครบ 8/8 คู่ด้วย automated browser test (บังคับ shuffle แบบ deterministic): Modal แสดงผลถูกต้อง ครบทุกสถิติ (เวลา/moves/score/ดาว/high score) และ responsive ดีทั้งที่ 360px และ 480px viewport ปุ่ม Play Again ทดสอบแล้วว่ารีเซ็ตกระดานได้จริงไม่ต้องรีเฟรชหน้า Portfolio postMessage integration ยังไม่ทำ (ดู Technical Tasks ด้านบน)