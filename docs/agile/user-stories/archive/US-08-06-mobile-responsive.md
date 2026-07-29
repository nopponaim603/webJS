# User Story: US-08-06 — Mobile-Responsive Touch Support

# User Story: US-08-06 — Mobile-Responsive Touch Support

**Status:** 🟢 Done  
**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Owner:** Dev Team  
**Created:** 2026-07-27  
**Last Updated:** 2026-07-29  
**Priority:** P1 — Should Have  
**Estimate:** 3 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกมบนอุปกรณ์เคลื่อนที่  
**ฉันต้องการ** ให้หน้าจอเกมปรับขนาดสมดุล แสดงผลและสัมผัสหน้าจอ (Touch Events) ได้อย่างแม่นยำบนมือถือและแท็บเล็ต  
**เพื่อให้** สามารถเล่นเกมได้อย่างลื่นไหลทุกที่ทุกเวลา  

---

## ✅ Acceptance Criteria

1. [x] แสดงผล Responsive รองรับหน้าจอมือถือ (360px+) และแท็บเล็ต (768px+)
2. [x] สัมผัสเลือกการ์ดผ่าน Touch Events ได้อย่างถูกต้อง แม่นยำ และไร้ความล่าช้า
3. [x] ขนาดการ์ดและระยะห่างปรับเปลี่ยนโดยอัตโนมัติตามขนาดหน้าจอเบราว์เซอร์
4. [x] ตัว HUD และปุ่มกดมีขนาดพอดี ไม่บดบังกระดานเกม และกดได้ง่ายบนมือถือ
5. [x] ไม่เกิดปัญหา UI Overflow หรือ Clipping บนสมาร์ตโฟนหน้าจอเล็ก

---

## 🛠 Technical Tasks

- [x] เพิ่ม Viewport Meta Tag สำหรับการแสดงผลบน Mobile Browser
- [x] เขียน CSS Media Queries สำหรับ Screen Breakpoints (Mobile, Tablet, Desktop)
- [x] ปรับขนาดการ์ดตามขนาดหน้าจอ (Mobile: ~60-80px, Tablet: ~100-120px, Desktop: ~140px)
- [x] เพิ่ม Touch Event Listeners (`touchstart` / `touchend`) ควบคู่กับ Mouse Click Events
- [x] ปรับปรุง `drawHUD()` ใน Canvas ให้แสดงผล Dynamic Responsive สำหรับ Mobile Viewport <480px ป้องกันข้อความซ้อนทับปุ่มกด
- [x] ทดสอบการแสดงผลบน Viewport 360px, 768px, 1024px+

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/styles.css` | CSS Media Queries สำหรับ Responsive Layout |
| `public/games/card-memory/index.html` | Viewport Meta Tag และ Responsive Structure |
| `public/games/card-memory/game.js` | Touch Events Handler & Dynamic Responsive Canvas HUD |

---

## 📐 Responsive Breakpoints Specification

| Device | Screen Width | Card Size | Grid Gap |
|--------|--------------|-----------|----------|
| Phone | 360px - 767px | 44px - 80px | 6px |
| Tablet | 768px - 1023px | 100px - 120px | 12px |
| Desktop | 1024px+ | 140px - 144px | 12px |

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../01-product-backlog.md)
- **Previous Story:** [US-08-05](./archive/US-08-05-game-restart.md)
- **Next Story:** [US-08-07](./US-08-07-performance-preload.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-29):
1. **แก้ไขปัญหา HUD Clipping บนหน้าจอมือถือ (Fixed HUD Text Overlap Bug):** ปรับปรุงอัลกอริทึมใน `drawHUD()` ใน `game.js` ให้คำนวณพื้นที่แบบ Dynamic Responsive เมื่อ `width < 480px` ย่อขนาดปุ่มย่อไอคอนและคำนวณ `availableStatW` เพื่อให้ข้อความ Pairs / Moves / Time และปุ่ม New Game / Sound ไม่ซ้อนทับกันที่ Viewport 360px
2. **ยืนยันผ่านการทดสอบ (Verification Completed):** ผ่านการทดสอบสมบูรณ์แบบ 100% บนมือถือ แท็บเล็ต และเดสก์ท็อป สถานะเปลี่ยนเป็น 🟢 Done