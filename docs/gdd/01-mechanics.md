---
title: "HTML5 Game Portfolio — Core Mechanics"
project: "GameDevJS Hub (webJS)"
version: "1.1.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
---
# HTML5 Game Portfolio — Core Mechanics


---

## 1. Portfolio System Core Loop

1. **Browse**: ผู้เล่นเรียกดูรายการเกมจาก Grid Cards หรือเลือกตามหมวดหมู่ (ปริศนา / ฝึกสมอง, ปริศนา / ฟิสิกส์, แบล็กบอร์ด / จับคู่) ([US-01-01](../agile/user-stories/archive/US-01-01-portfolio-cards.md))
2. **Search / Filter**: ค้นหาชื่อเกมด้วย Search bar แบบ Real-time หรือกด Filter category tag ([US-01-03](../agile/user-stories/archive/US-01-03-search-filter.md))
3. **Play**: คลิกที่เกมเพื่อเปิด Game Modal Iframe เล่นเกมได้ทันทีแบบไม่ต้องโหลดเปลี่ยนหน้าใหม่ ([US-01-02](../agile/user-stories/archive/US-01-02-modal-loader.md))
4. **Control & Shortcuts**:
   - `Space`: Pause / Resume เกมใน Modal
   - `F`: สลับโหมด Fullscreen
   - `Esc`: ปิด Modal กลับสู่หน้า Portfolio
5. **High Score & Persistence**: เมื่อเล่นจบเกม มินิเกมจะส่งคะแนนสะสมผ่าน `window.postMessage` ไปยัง Portfolio Controller เพื่อบันทึกลง Browser `localStorage` โดยอัตโนมัติ ([US-03-01](../agile/01-product-backlog.md))

---

## 2. Individual Game Mechanics

### 🎮 Game 1: Emoji Match (`emoji-match/`) — [US-02-01](../agile/user-stories/archive/US-02-01-emoji-match.md)
- **Core Loop**: พลิกเปิดการ์ด Emoji ครั้งละ 2 ใบเพื่อจับคู่อีโมจิที่เหมือนกัน หากเปิดตรงกัน การ์ดจะถูกล็อคเปิดไว้ หากไม่ตรงจะถูกพลิกกลับ
- **Win Condition**: จับคู่การ์ดครบทุกคู่ในเวลาที่กำหนด
- **Lose Condition**: เวลาหมดก่อนจับคู่ครบ
- **High Score**: คำนวณจากเวลาที่เหลือ + โบนัสจำนวนครั้งที่พลิกน้อยที่สุด

### 🎲 Game 2: 2048 Cubes (`2048-cubes/`) — [US-02-02](../agile/user-stories/archive/US-02-02-2048-cubes.md)
- **Core Loop**: เล็งและยิงลูกบาศก์ตัวเลขลงในสนามแข่ง เมื่อลูกบาศก์ที่มีตัวเลขเท่ากันชนกัน จะรวมร่างเป็นลูกบาศก์ใหม่ที่มีค่าเพิ่มขึ้นเป็น 2 เท่า (2 → 4 → 8 → ... → 2048)
- **Win Condition**: รวมได้ลูกบาศก์ 2048 หรือทำคะแนนสูงสุด
- **Lose Condition**: ลูกบาศก์ล้นข้ามเส้นกั้นสนาม
- **High Score**: รวมคะแนนจากการชนผสม Cube ทั้งหมดลง LocalStorage

### 🀄 Game 3: Tile Match (`tile-match/`) — [US-02-03](../agile/user-stories/archive/US-02-03-tile-match.md)
- **Core Loop**: เลือกคลิกไพ่/ไทล์จากกระดานลงในถาดพัก (Holder) ความจุสูงสุด 7 ช่อง หากมีไทล์ลายเดียวกัน 3 ใบในถาด จะถูกจับคู่และหายไป
- **Win Condition**: เคลียร์ไทล์ทั้งหมดออกจากกระดาน
- **Lose Condition**: ถาดพักไทล์เต็ม 7 ใบโดยไม่เกิดการจับคู่ 3 ใบ
- **High Score**: คำนวณจากจำนวนไทล์ที่จับคู่ได้ + โบนัสความเร็วในการเคลียร์กระดาน

### 🚀 Game 4: Space Shooter (`phaser-demo/`)
- **Engine**: Phaser 3 (2D Arcade Physics)
- **Core Loop**: ควบคุมยานอวกาศเคลื่อนที่ยิงต่อสู้กับฝูงเอเลี่ยน (Wave-based Spawning) พร้อมหลบหลีกอุกกาบาต สะสมคะแนนจากการทำลายศัตรู
- **Controls**: เคลื่อนที่ด้วย Keyboard (`←`/`→` หรือ `A`/`D`) หรือลาก Touch/Mouse, ยิงด้วย `Space` หรือคลิกเมาส์
- **Win Condition**: เคลียร์ Wave และทำคะแนนสูงสุด (High Score)
- **Lose Condition**: ยานถูกศัตรูยิงชน/พลังชีวิต (Lives: 3) หมดลง

---

## 3. Player Actions Matrix

| Action | Input | Target System | Outcome | Agile Reference |
|--------|-------|---------------|---------|-----------------|
| Select Category | Mouse Click / Touch | Portfolio Filters | กรองแสดงเฉพาะเกมในหมวดที่เลือก | [US-01-03](../agile/user-stories/archive/US-01-03-search-filter.md) |
| Search Game | Keyboard Input | Search Bar | กรองเกมตามคำค้นหา Real-time | [US-01-03](../agile/user-stories/archive/US-01-03-search-filter.md) |
| Launch Game | Click Game Card | Modal Loader | เปิด Iframe แสดงผลเกมที่เลือก | [US-01-02](../agile/user-stories/archive/US-01-02-modal-loader.md) |
| Pause / Resume | Press `Space` | Modal Overlay | หยุดเกมชั่วคราว / เล่นต่อ | [US-01-02](../agile/user-stories/archive/US-01-02-modal-loader.md) |
| Toggle Fullscreen | Press `F` / Click Icon | Window Screen API | แสดงผลเกมเต็มหน้าจอ | [US-01-02](../agile/user-stories/archive/US-01-02-modal-loader.md) |
| Close Modal | Press `Esc` / Click Close | Modal Overlay | ปิดหน้าต่างเกม กลับสู่ Portfolio | [US-01-02](../agile/user-stories/archive/US-01-02-modal-loader.md) |
| Save Score | Auto on Game End | LocalStorage API | บันทึกคะแนนสูงสุดประจำเกมลงเบราว์เซอร์ | [US-03-01](../agile/01-product-backlog.md) |

---

## Related Documents
- Concept & Architecture: [Game Concept & Architecture](./00-concept.md)
- System Design: [Software System Design](../software/01-system-design.md)
- Product Backlog: [Product Backlog](../agile/01-product-backlog.md)
