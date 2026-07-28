# User Story: US-08-05 — Game Restart and New Game Button

**Status:** 🔵 In Progress  
**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Owner:** Dev Team  
**Created:** 2026-07-27  
**Last Updated:** 2026-07-28  
**Priority:** P0 — Must Have  
**Estimate:** 2 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกม  
**ฉันต้องการ** ปุ่มกดเริ่มเกมใหม่ ("New Game" / "Restart") ได้ตลอดเวลา  
**เพื่อให้** สามารถเริ่มเล่นรอบใหม่ได้ทันทีโดยไม่ต้องโหลดรีเฟรชหน้าเว็บใหม่  

---

## ✅ Acceptance Criteria

1. [ ] มีปุ่ม "New Game" บน HUD ที่สามารถคลิกกดเริ่มใหม่ได้ทุกเมื่อ
2. [ ] มีปุ่ม "Play Again" บนหน้าต่างสรุปผล (Results Modal)
3. [ ] เมื่อกดเริ่มเกมใหม่ → ระบบสุ่มการ์ดใหม่ รีเซ็ตตัวนับ Moves เป็น 0 และรีเซ็ต Timer เป็น `00:00`
4. [ ] เริ่มเกมใหม่แบบไร้รอยต่อโดยไม่ต้องรีเฟรชเบราว์เซอร์ (No Page Reload)
5. [ ] ปิดหน้าต่าง Modal สรุปผลอัตโนมัติเมื่อกดเริ่มเกมใหม่

---

## 🛠 Technical Tasks

- [ ] สร้างปุ่ม "New Game" ใน HUD Layout
- [ ] พัฒนาฟังก์ชัน `resetGame()` ล้างค่า State เดิมทั้งหมด
- [ ] เรียกใช้อัลกอริทึม Fisher-Yates Shuffle เพื่อสุ่มไพ่เซ็ตใหม่
- [ ] รีเซ็ตตัวนับเวลาและตัวนับจำนวนครั้งเปิดไพ่
- [ ] คืนค่าแอนิเมชันและการ์ดให้อยู่ในสถานะคว่ำหน้าทั้งหมด (Face Down)

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/game.js` | ฟังก์ชัน `resetGame()`, `shuffleGrid()`, `resetTimer()`, `resetMoveCounter()` |
| `public/games/card-memory/index.html` | ปุ่ม New Game บน HUD และ Modal |

---

## 🎨 Game Reset Sequence

```text
[Click New Game / Play Again]
   │
   ├──> Close Results Modal (if open)
   ├──> Reset Move Counter to 0
   ├──> Reset Timer to 00:00 & Stop Interval
   ├──> Execute Fisher-Yates Shuffle for 8 pairs
   └──> Render Card Back Sprites (Face Down State)
```

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../01-product-backlog.md)
- **Previous Story:** [US-08-04](./US-08-04-results-modal.md)
- **Next Story:** [US-08-06](./US-08-06-mobile-responsive.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-28):
1. **จัดระเบียบลำดับขั้นตอน Reset (Clean Reset Sequence):** เพิ่มแผนภาพลำดับการทำงานเมื่อผู้เล่นคลิกเริ่มเกมใหม่ เพื่อให้นักพัฒนาเข้าใจและไม่ลืมการ Reset State ตัวนับเวลาและ Shuffle การ์ด
2. **ปรับปรุงสำนวนภาษาไทย:** แก้ไขคำว่า "ตัวเล่า" เป็น "ตัวนับจำนวนครั้ง (Moves)" และเน้นย้ำความสำคัญของการเริ่มใหม่โดยไม่รีเฟรชเบราว์เซอร์ (No Page Reload)
3. **จัดระเบียบชื่อไฟล์ (Descriptive Filename):** เปลี่ยนชื่อไฟล์เป็น `US-08-05-game-restart.md` ตามข้อกำหนดมาตรฐาน `task-tracker` skill