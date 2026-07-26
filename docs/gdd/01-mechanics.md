# HTML5 Game Portfolio — Core Mechanics

**Version:** 1.0.0 | **Last Updated:** 2026-07-26

---

## 1. Portfolio System Core Loop

1. **Browse**: ผู้เล่นเรียกดูรายการเกมจาก Grid Cards หรือเลือกตามหมวดหมู่ (Puzzle, Action, Physics)
2. **Search / Filter**: ค้นหาชื่อเกมด้วย Search bar หรือกด Filter tag
3. **Play**: คลิกที่เกมเพื่อเปิด Game Modal Iframe เล่นเกมได้ทันที
4. **Control & Shortcuts**:
   - `Space`: Pause / Resume เกมใน Modal
   - `F`: สลับโหมด Fullscreen
   - `Esc`: ปิด Modal กลับสู่หน้า Portfolio

---

## 2. Individual Game Mechanics

### 🎮 Game 1: Emoji Match (`emoji-match/`)
- **Core Loop**: พลิกเปิดการ์ด Emoji ครั้งละ 2 ใบเพื่อจับคู่อีโมจิที่เหมือนกัน หากเปิดตรงกัน การ์ดจะถูกล็อคเปิดไว้ หากไม่ตรงจะถูกพลิกกลับ
- **Win Condition**: จับคู่การ์ดครบทุกคู่ในเวลาที่กำหนด
- **Lose Condition**: เวลาหมดก่อนจับคู่ครบ

### 🎲 Game 2: 2048 Cubes (`2048-cubes/`)
- **Core Loop**: เล็งและยิงลูกบาศก์ตัวเลขลงในสนามแข่ง เมื่อลูกบาศก์ที่มีตัวเลขเท่ากันชนกัน จะรวมร่างเป็นลูกบาศก์ใหม่ที่มีค่าเพิ่มขึ้นเป็น 2 เท่า (2 → 4 → 8 → ... → 2048)
- **Win Condition**: รวมได้ลูกบาศก์ 2048 หรือทำคะแนนสูงสุด
- **Lose Condition**: ลูกบาศก์ล้นข้ามเส้นกั้นสนาม

### 🀄 Game 3: Tile Match (`tile-match/`)
- **Core Loop**: เลือกคลิกไพ่/ไทล์จากกระดานลงในถาดพัก (Holder) ความจุสูงสุด 7 ช่อง หากมีไทล์ลายเดียวกัน 3 ใบในถาด จะถูกจับคู่และหายไป
- **Win Condition**: เคลียร์ไทล์ทั้งหมดออกจากกระดาน
- **Lose Condition**: ถาดพักไทล์เต็ม 7 ใบโดยไม่เกิดการจับคู่ 3 ใบ

### 🚀 Game 4: Space Shooter (`phaser-demo/`)
- **Engine**: Phaser 3 (2D Arcade Physics)
- **Core Loop**: ควบคุมยานอวกาศเคลื่อนที่ยิงต่อสู้กับฝูงเอเลี่ยน (Wave-based Spawning) พร้อมหลบหลีกอุกกาบาต สะสมคะแนนจากการทำลายศัตรู
- **Controls**: เคลื่อนที่ด้วย Keyboard (`←`/`→` หรือ `A`/`D`) หรือลาก Touch/Mouse, ยิงด้วย `Space` หรือคลิกเมาส์
- **Win Condition**: เคลียร์ Wave และทำคะแนนสูงสุด (High Score)
- **Lose Condition**: ยานถูกศัตรูยิงชน/พลังชีวิต (Lives: 3) หมดลง หรือศัตรูหลุดรอดผ่านขอบล่าง

---

## 3. Player Actions Matrix

| Action | Input | Target System | Outcome |
|--------|-------|---------------|---------|
| Select Category | Mouse Click / Touch | Portfolio Filters | กรองแสดงเฉพาะเกมในหมวดที่เลือก |
| Search Game | Keyboard Input | Search Bar | กรองเกมตามคำค้นหา Real-time |
| Launch Game | Click Game Card | Modal Loader | เปิด Iframe แสดงผลเกมที่เลือก |
| Toggle Fullscreen | Press `F` / Click Icon | Window Screen API | แสดงผลเกมเต็มหน้าจอ |
| Match Cards | Mouse Click / Touch | Emoji Match Canvas | เปิดและจับคู่การ์ด |
| Aim & Fire Cube | Drag & Release | 2048 Cubes Engine | ยิง Cube ไปในทิศทางที่เล็ง |
| Pick Tile | Mouse Click | Tile Match Board | ย้ายไทล์ลงถาดพักและตรวจสอบ 3-Match |
| Move & Shoot Ship | Arrows / A,D / Touch / Space | Space Shooter Engine | เคลื่อนที่ยานอวกาศและยิงกระสุนทำลายศัตรู |

---

## Related Documents
- Architecture: [Game Concept & Architecture](./00-concept.md)
- System Design: [Software System Design](../software/01-system-design.md)
- Backlog: [Product Backlog](../agile/01-product-backlog.md)
