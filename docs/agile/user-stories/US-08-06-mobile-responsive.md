# User Story: US-08-06 — Mobile-Responsive Touch Support

**Status:** 🔵 In Progress  
**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Owner:** Dev Team  
**Created:** 2026-07-27  
**Last Updated:** 2026-07-28  
**Priority:** P1 — Should Have  
**Estimate:** 3 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกมบนอุปกรณ์เคลื่อนที่  
**ฉันต้องการ** ให้หน้าจอเกมปรับขนาดสมดุล แสดงผลและสัมผัสหน้าจอ (Touch Events) ได้อย่างแม่นยำบนมือถือและแท็บเล็ต  
**เพื่อให้** สามารถเล่นเกมได้อย่างลื่นไหลทุกที่ทุกเวลา  

---

## ✅ Acceptance Criteria

1. [ ] แสดงผล Responsive รองรับหน้าจอมือถือ (360px+) และแท็บเล็ต (768px+)
2. [ ] สัมผัสเลือกการ์ดผ่าน Touch Events ได้อย่างถูกต้อง แม่นยำ และไร้ความล่าช้า
3. [ ] ขนาดการ์ดและระยะห่างปรับเปลี่ยนโดยอัตโนมัติตามขนาดหน้าจอเบราว์เซอร์
4. [ ] ตัว HUD และปุ่มกดมีขนาดพอดี ไม่บดบังกระดานเกม และกดได้ง่ายบนมือถือ
5. [ ] ไม่เกิดปัญหา UI Overflow หรือ Clipping บนสมาร์ตโฟนหน้าจอเล็ก

---

## 🛠 Technical Tasks

- [ ] เพิ่ม Viewport Meta Tag สำหรับการแสดงผลบน Mobile Browser
- [ ] เขียน CSS Media Queries สำหรับ Screen Breakpoints (Mobile, Tablet, Desktop)
- [ ] ปรับขนาดการ์ดตามขนาดหน้าจอ (Mobile: ~60-80px, Tablet: ~100-120px, Desktop: ~140px)
- [ ] เพิ่ม Touch Event Listeners (`touchstart` / `touchend`) ควบคู่กับ Mouse Click Events
- [ ] ทดสอบการแสดงผลบน Chrome DevTools Mobile Viewport และอุปกรณ์จริง

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/styles.css` | CSS Media Queries สำหรับ Responsive Layout |
| `public/games/card-memory/index.html` | Viewport Meta Tag และ Responsive Structure |
| `public/games/card-memory/game.js` | Touch Events Handler |

---

## 📐 Responsive Breakpoints Specification

| Device | Screen Width | Card Size | Grid Gap |
|--------|--------------|-----------|----------|
| Phone | 360px - 767px | 65px - 80px | 4px |
| Tablet | 768px - 1023px | 100px - 120px | 6px |
| Desktop | 1024px+ | 140px - 144px | 8px |

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../01-product-backlog.md)
- **Previous Story:** [US-08-05](./archive/US-08-05-game-restart.md)
- **Next Story:** [US-08-07](./US-08-07-performance-preload.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-28):
1. **จัดกลุ่ม Breakpoints ชัดเจน (Standardized Breakpoints):** สรุปขนาดการ์ดและ Grid Gap เป็นตาราง Breakpoint ชัดเจนสำหรับ Phone, Tablet, Desktop
2. **ปรับปรุงสำนวนภาษาไทย:** แก้ไขประโยคสับสนเดิม ให้ระบุชัดเจนเรื่องการรองรับ Touch Events และป้องกันปัญหา UI Clipping บนหน้าจอมือถือ
3. **จัดระเบียบชื่อไฟล์ (Descriptive Filename):** เปลี่ยนชื่อไฟล์เป็น `US-08-06-mobile-responsive.md` ตามข้อกำหนดมาตรฐาน `task-tracker` skill

### 🐛 Known Issue Found During Verification (2026-07-28)
ทดสอบด้วย automated browser test ที่ viewport 360px (ขอบล่างสุดของ breakpoint "Phone" ตามสเปก) พบว่าแถบ HUD ด้านบนมีข้อความซ้อนทับปุ่ม:
- ปุ่ม "New Game" บังข้อความ "Time: 00:00" บางส่วน
- ปุ่มเปิด/ปิดเสียง (🔊) บังตัวเลข "Moves: 0" บางส่วน

สาเหตุ: `drawHUD()` ใน `game.js` คำนวณตำแหน่งข้อความและปุ่มด้วยค่า pixel คงที่ (เช่น `hudX + 160`, `hudX + 280`) ที่ไม่ได้ปรับตาม `hudW` เมื่อหน้าจอแคบกว่า ~400px ทำให้ AC ข้อ 5 (ไม่เกิด UI Overflow/Clipping) ยังไม่ผ่านที่ breakpoint 360px แม้ว่า Canvas จะ resize และปรับขนาดการ์ดได้ถูกต้อง (AC 1–3) ก็ตาม ยังไม่ได้แก้ไข — สถานะคงเป็น In Progress