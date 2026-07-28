# User Story: US-08-01 — Card Grid Display with Flip Animation

**Status:** ✅ Done  
**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Owner:** Dev Team  
**Created:** 2026-07-27  
**Last Updated:** 2026-07-28  
**Priority:** P0 — Must Have  
**Estimate:** 4 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกม  
**ฉันต้องการ** แสดงตารางการ์ด 16 ใบ (ขนาด 4×4 Grid) ในรูปแบบการ์ดคว่ำหน้าทั้งหมดเมื่อเริ่มเกม  
**เพื่อให้** สามารถสุ่มเลือกเปิดและจับคู่การ์ดได้อย่างสนุกสนานและเป็นระบบ  

---

## ✅ Acceptance Criteria

1. [x] แสดงตารางการ์ด 16 ใบ (4x4 Grid) ครบถ้วนและสวยงาม
2. [x] การ์ดทุกใบแสดงรูปหลังการ์ด (Card Back) เมื่อเริ่มต้น
3. [x] ระบบทำการสุ่มการ์ด 8 คู่ (16 ใบ) ใหม่ทุกครั้งที่เริ่มเกมด้วยอัลกอริทึม Fisher-Yates Shuffle
4. [x] ไม่มีการ์ดซ้ำเกินคู่ที่กำหนด (8 คู่พอดี)
5. [x] การ์ดมีขนาดและระยะห่างสม่ำเสมอใน Grid Container
6. [x] มี Flip Animation แสดงผลลื่นไหลเมื่อคลิกการ์ด (CSS 3D Transform `rotateY`)
7. [x] การ์ดทุกใบตอบสนองต่อการคลิก (Click/Touch Events)
8. [x] แสดงผลแบบ Responsive บนหน้าจอมือถือและเดสก์ท็อป

---

## 🛠 Technical Tasks

- [x] สร้าง Grid Layout Component (4×4 CSS Grid)
- [x] พัฒนาฟังก์ชัน Fisher-Yates Shuffle สำหรับสุ่มไพ่ 8 คู่
- [x] โหลดและแมป Sprites รูปหลังการ์ด (`card_back.png`)
- [x] เพิ่ม CSS 3D Transform Animation สำหรับการพลิกการ์ด
- [x] ปรับแต่ง CSS Grid ให้รองรับ Responsive Screen Sizes
- [x] ทดสอบ Event Listener ทั้ง Mouse Click (Desktop) และ Touch Event (Mobile)

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/index.html` | โครงสร้าง HTML หลัก และ Grid Container |
| `public/games/card-memory/game.js` | ลอจิกการสร้าง Grid และอัลกอริทึม Shuffle |
| `public/games/card-memory/styles.css` | สไตล์ CSS Grid Layout และ 3D Flip Animation |

---

## 🎨 Asset References

- **Asset Pack:** Kenney Playing Cards Pack (`public/assets/kenney_playing-cards-pack/`)
- **Card Back:** `card_back.png`
- **Card Faces:** `card_clubs_*`, `card_diamonds_*`, `card_hearts_*`, `card_spades_*`

---

## 📐 Design Notes

### Grid Layout
- **Columns:** 4 | **Rows:** 4 | **Total Cards:** 16 (8 pairs)
- **Spacing:** 8px gap
- **Flip Animation:** CSS 3D transform (`rotateY(180deg)`), duration 300ms ease-in-out

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../../01-product-backlog.md)
- **Sprint Backlog:** [Sprint 01 Backlog](../../sprint-backlogs/sprint-01.md)
- **Next Story:** [US-08-02](./US-08-02-match-logic.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-28):
1. **ปรับปรุงภาษาและคำศัพท์ (Language Polish):** แก้ไขคำว่า "การ์ดป๊อกปก" เป็น "การ์ดแบบคว่ำหน้า (Card Back)" และปรับแต่งสำนวนประโยคใน Description ให้ตรงตามรูปแบบมาตรฐาน Agile User Story
2. **แก้ไขลิงก์อ้างอิงเสีย (Fixed Broken Links):** ซ่อมแซมลิงก์ GDD เดิมที่ไม่ถูกต้อง ให้ชี้ไปยังเอกสาร GDD Spec จริงของเกม [Card Memory Spec](../../../gdd/games/card-memory/spec.md)
3. **จัดระเบียบชื่อไฟล์ (Descriptive Filename):** เปลี่ยนชื่อไฟล์เป็น `US-08-01-card-grid.md` ตามข้อกำหนดมาตรฐาน `task-tracker` skill