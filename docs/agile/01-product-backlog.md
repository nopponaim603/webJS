# Product Backlog — webJS Game Portfolio

**Last Updated:** 2026-07-28 | **Version:** 1.1.0

---

## 🎯 Must Have (MVP Core)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-01-01](./user-stories/US-01-01-portfolio-cards.md) | ในฐานะผู้เข้าชมเว็บ ฉันต้องการดูการ์ดแสดงเกมทั้งหมดในหน้าหลัก เพื่อเลือกเล่นเกมที่สนใจได้ง่าย | การ์ดแสดงครบ มีรูปภาพ หมวดหมู่ ชื่อเกม และตอบสนองต่อการ Hover | M | ✅ Done |
| [US-01-02](./user-stories/US-01-02-modal-loader.md) | ในฐานะผู้เล่น ฉันต้องการเปิดเล่นเกมผ่าน Modal Iframe ได้ทันทีโดยไม่ต้องเปลี่ยนหน้า | คลิกการ์ดแล้ว Modal แสดงผลลื่นไหล มีปุ่มปิดชัดเจน | M | ✅ Done |
| [US-01-03](./user-stories/US-01-03-search-filter.md) | ในฐานะผู้เล่น ฉันต้องการค้นหาเกมและกรองตามหมวดหมู่ได้ | ค้นหาแบบ Real-time และกรองตามหมวดหมู่ได้ถูกต้อง | S | ✅ Done |
| [US-02-01](./user-stories/US-02-01-emoji-match.md) | ในฐานะผู้เล่น ฉันต้องการเล่นเกม Emoji Match เพื่อทดสอบความจำ | จับคู่การ์ดที่เหมือนกัน บันทึกคะแนน และแสดงผลแพ้/ชนะ | L | ✅ Done |
| [US-02-02](./user-stories/US-02-02-2048-cubes.md) | ในฐานะผู้เล่น ฉันต้องการเล่นเกม 2048 Cubes รวมตัวเลขฟิสิกส์ | ยิง Cube รวมตัวเลข 2048 ได้ถูกต้องตามกฎฟิสิกส์ | L | ✅ Done |
| [US-02-03](./user-stories/US-02-03-tile-match.md) | ในฐานะผู้เล่น ฉันต้องการเล่นเกม Tile Match จับคู่ไพ่ 3 ใบ | เลือกไทล์ลงถาด 7 ช่อง และจับคู่ 3 ใบหายไป | L | ✅ Done |

---

## 🚀 Should Have (Enhancements)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| US-03-01 | ในฐานะผู้เล่น ฉันต้องการบันทึกคะแนนสูงสุด (High Score) ลง LocalStorage | คะแนนสูงสุดไม่หายไปเมื่อ Refresh หน้าเว็บ | S | 🔵 In Progress |
| US-03-02 | ในฐานะผู้พัฒนา ฉันต้องการใช้ Node.js Server แบบ Zero-Dependency | รัน `npm start` แล้วระบบเปิด HTTP Server ได้โดยไม่ต้องลง NPM Packages | S | ✅ Done |

---

## 💡 Nice to Have (Future Ideas)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| US-04-01 | ในฐานะผู้เล่น ฉันต้องการเปลี่ยนธีม (Light/Dark mode toggle) | มีปุ่ม สลับธีมหน้า Portfolio ได้ตามต้องการ | S | 🏗 Pending |
| US-04-02 | ในฐานะผู้เล่น ฉันต้องการตารางคะแนนรวมแบบ Leaderboard | แสดงคะแนนผู้เล่นอันดับต้นๆ | M | 🏗 Pending |

---

## Linked GDD Features
- Derived from: [Game Concept & Architecture](../gdd/00-concept.md), [Core Mechanics](../gdd/01-mechanics.md)
