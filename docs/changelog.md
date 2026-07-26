# 📜 Documentation Changelog — webJS

**Project:** Game Portfolio (`webJS`)  
**Maintained by:** Antigravity AI & Dev Team  

---

## [1.3.0] - 2026-07-26

### Added
- **Kenney Match 3 (`public/games/match3/`)**: พัฒนาเกมจับคู่เพชรอัญมณี 3 ในแถว (Match-3 Puzzle Game) ด้วย Phaser 3 และสินทรัพย์กราฟิก/เสียงจาก `KenneyNL/Starter-Kit-Match-3`:
  - ตาราง 7x7 พร้อมระบบสลับอัญมณีด้วยเมาส์และทัชสกรีน (Smooth Swap Tweens)
  - ระบบตรวจสอบการจับคู่ (Horizontal & Vertical Matches) 3, 4, 5+ ในแถว
  - ระบบสลายเพชร, เอฟเฟกต์ละอองสี (Particle Burst VFX), แรงโน้มถ่วง (Gravity Fall) และสปอว์นเพชรใหม่จากด้านบน
  - ระบบคอมโบล่วงหน้า (Cascade Combo Chains `Combo x2`, `Combo x3`...)
  - เสียงประกอบจาก Kenney (`sfx_swap`, `sfx_match`, `sfx_land`) พร้อม Web Audio SFX Fallback
  - หน้าต่าง Modal สรุปผลชัยชนะ/หมด Moves และปุ่มเล่นอีกครั้ง
- **GDD Specification**: เพิ่มเอกสารกำกับ [docs/gdd/games/match3/spec.md](./gdd/games/match3/spec.md)

## [1.2.0] - 2026-07-26

### Added
- **Game Specs Suite (`docs/gdd/games/`)**: สร้าง Subfolders แยกเอกสารรายละเอียดการพัฒนาเกมเป็นรายเกม:
  - `docs/gdd/games/space-shooter/spec.md`: GDD และสเปคการพัฒนาเกม **Space Shooter** (Phaser 2D)
  - `docs/gdd/games/emoji-match/spec.md`: GDD เกม **Emoji Match**
  - `docs/gdd/games/2048-cubes/spec.md`: GDD เกม **2048 Cubes**
  - `docs/gdd/games/tile-match/spec.md`: GDD เกม **Tile Match**
  - `docs/gdd/games/cyber-sphere-3d/spec.md`: GDD เกม **Cyber Sphere 3D**

## [1.1.0] - 2026-07-26

### Added / Updated
- **GDD Suite**:
  - `docs/gdd/00-concept.md`: เพิ่มสเปคเกม **Space Shooter** (Phaser 2D) และ **Cyber Sphere 3D** เข้าสู่อาร์คิเทคเจอร์และ Game Collection
  - `docs/gdd/01-mechanics.md`: เพิ่มกลไกการเล่น (Core Loops, Rules, Win/Lose Conditions) และ Input Action Matrix สำหรับเกม **Space Shooter**

## [1.0.0] - 2026-07-26

### Added
- **AGENT.md**: สเปคโครงสร้างโปรเจค เทคโนโลยี และกฎการพัฒนาของ AI Agent
- **GDD Suite**:
  - `docs/gdd/00-concept.md`: ภาพรวมโปรเจค Portfolio และมินิเกมทั้ง 3 เกม (`Emoji Match`, `2048 Cubes`, `Tile Match`)
  - `docs/gdd/01-mechanics.md`: กฎ กลไกการเล่น และคอนโทรลของทุกเกม
  - `docs/gdd/02-narrative.md`: ธีม และประสบการณ์การใช้งาน
  - `docs/gdd/03-art-direction.md`: แนวทางการออกแบบ UI/UX, Glassmorphism, Cyan Theme
  - `docs/gdd/04-audio-direction.md`: ข้อกำหนดเสียงและ SFX Feedback
- **Software Design Suite**:
  - `docs/software/01-system-design.md`: โครงสร้างระบบหลัก (Portfolio Loader, Iframe Handler, Native HTTP Server)
  - `docs/software/02-class-diagram.md`: Mermaid Diagrams แสดง Data Flow และโครงสร้างคลาส
  - `docs/software/03-data-schema.md`: การจัดการ LocalStorage และ High Score Persistence
- **Agile Management Suite**:
  - `docs/agile/01-product-backlog.md`: Product Backlog พร้อม User Stories
  - `docs/agile/02-sprint-planning.md`: Sprint Roadmap และ Gantt Chart
  - `docs/agile/sprint-backlogs/sprint-01.md`: สรุปรายละเอียด Sprint 01
  - `docs/agile/kanban.md`: Kanban Board ติดตามสถานะงาน
  - `docs/agile/user-stories/`: รายละเอียด User Stories (US-01, US-02)
- **Knowledge Wiki**:
  - `docs/wiki/wiki.md`: ศูนย์รวมความรู้และการเข้าถึงด่วน
  - `docs/wiki/assets-guide.md`: เอกสารคู่มือ Game Assets และไอเดียการพัฒนาเกมสำหรับ Assets ทั้งหมดใน `public/assets/`
  - `docs/wiki/guidelines/system-test-guideline.md`: แนวทางการทดสอบระบบ
