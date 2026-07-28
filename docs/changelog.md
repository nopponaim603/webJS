# 📜 Documentation Changelog — webJS

**Project:** Game Portfolio (`webJS`)  
**Maintained by:** Antigravity AI & Dev Team  

## [1.9.0] - 2026-07-28

### Added / Updated
- **PWA Installation System ([src/components/Header.jsx](file:///c:/Users/noppon/source/06-WEB/webJS/src/components/Header.jsx))**:
  - เพิ่มปุ่ม `📲 ติดตั้งแอป (PWA)` บนแถบ Header สำหรับเรียกใช้งานหน้าต่างติดตั้ง Progressive Web App (Native Browser Prompt)
  - เพิ่มป๊อปอัปคำแนะนำ **วิธีติดตั้งแอป (PWA Guide Modal)** สำหรับแนะนำขั้นตอนการติดตั้งบน iOS (Safari), Android (Chrome/Edge) และ Desktop
  - เพิ่มระบบตรวจจับสถานะ PWA Standalone Mode (`✅ ติดตั้งแล้ว`)
- **Build Release Update**:
  - อัปเดต Build Info ใน `public/build.json` และ `package.json` เป็นเวอร์ชัน **v1.9.0 #2239**

## [1.8.0] - 2026-07-28

### Added
- **Goosl Glass Marbles GDD Spec ([docs/gdd/games/goosl-marbles/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/goosl-marbles/spec.md))**:
  - จัดทำเอกสารข้อกำหนดการพัฒนาเกม (GDD & Dev Specs) สำหรับ **Goosl Glass Marbles (구슬치기)** ครอบคลุม:
    - กลไกการเล่นโหมดหลัก ยิงเคาะลูกแก้วเป้าหมาย 7 ลูกออกนอกวงภายใน 6 ครั้ง
    - โหมดเล่นอิสระ (Free Play Mode) และระบบเอียงเครื่อง (Tilt Motion Sensor)
    - สถาปัตยกรรม WebGL 2 Ray-marching Glass Shader, 2D Circle Elastic Physics Engine
    - ระบบสังเคราะห์เสียงกระทบแก้ว (Glass Clinking SFX) ด้วย Web Audio API
    - ระบบสลับภาษาอัตโนมัติ (TH, EN, KO)
  - ลงทะเบียนดัชนีคลังเกม G016 ใน [docs/gdd/00-concept.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/00-concept.md) และ [docs/index.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/index.md) สมบูรณ์

## [1.7.0] - 2026-07-28

### Added
- **Detailed Game Specifications Suite ([docs/gdd/games/](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games))**:
  - จัดทำเอกสารข้อกำหนดการพัฒนาเกม (GDD Spec) รายละเอียดเจาะจงระดับระบบ ศิลป์ การควบคุม และระบบเสียง สังเคราะห์ สำหรับเกมใหม่ทั้ง 7 เกม:
    - [Ocean Frenzy Spec (G009)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/ocean-frenzy/spec.md) — เกมปลาใหญ่กินปลาเล็ก (Phaser 3)
    - [Dice Quest Spec (G010)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/dice-quest/spec.md) — เกมกระดานวางกลยุทธ์ทอยลูกเต๋า (Vanilla JS / Phaser)
    - [Pico Tower Climber Spec (G011)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/pico-tower-climber/spec.md) — เกมพิกเซล 8-bit ไต่หอคอย (Phaser Tilemap)
    - [Pixel Bullet Hell Spec (G012)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/pixel-bullet-hell/spec.md) — เกมยานยิงแนวตั้งยิงสู้บอส (Phaser 3)
    - [Block Collapse Spec (G013)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/block-collapse/spec.md) — เกมปริศนาสลับทำลายบล็อกสี (Canvas 2D)
    - [Tiny Farm Tycoon Spec (G014)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/tiny-farm-tycoon/spec.md) — เกมผสานพืชผลและบริหารฟาร์มพิกเซล (Phaser Top-down)
    - [Lunar Lander Gravity Spec (G015)](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/lunar-lander/spec.md) — เกมจรวดลงจอดดาวเคราะห์ระบบฟิสิกส์ (Phaser Physics)
  - ลงทะเบียนดัชนีคลังเกม G001 ถึง G015 พร้อมเอกสารกำกับใน [docs/index.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/index.md) ครบถ้วน

## [1.6.0] - 2026-07-28

### Added
- **Asset Expansion Game Proposals ([docs/gdd/05-asset-game-proposals.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/05-asset-game-proposals.md))**:
  - วิเคราะห์ Asset Packs ทั้งหมดใน `public/assets/` และจัดทำข้อเสนอแนวคิดการพัฒนาเป็นมินิเกมใหม่ 7 เกม:
    1. **G009 Ocean Frenzy** (`kenney_fish-pack_2`): เกมปลาใหญ่กินปลาเล็ก (Phaser 3)
    2. **G010 Dice Quest** (`kenney_boardgame-pack`): เกมกระดานวางกลยุทธ์ทอยลูกเต๋า (Vanilla JS / Phaser)
    3. **G011 Pico Tower Climber** (`kenney_pico-8-platformer`): เกมพิกเซล 8-bit ไต่หอคอยไร้ขีดจำกัด (Phaser 3 Tilemap)
    4. **G012 Pixel Bullet Hell** (`kenney_pixel-shmup`): เกมยานยิงแนวตั้งยิงสู้บอส (Phaser 3)
    5. **G013 Block Collapse** (`kenney_puzzle-pack-2`): เกมปริศนาสลับและแตะทำลายบล็อกสี (Canvas 2D)
    6. **G014 Tiny Farm Tycoon** (`kenney_tiny-farm`): เกมผสานพืชผลและบริหารฟาร์มพิกเซล (Phaser 3 Top-down)
    7. **G015 Lunar Lander Gravity** (`kenney_simple-space`): เกมจรวดลงจอดดาวเคราะห์ระบบฟิสิกส์ (Phaser Physics)
  - เพิ่ม Game Development Summary Matrix และแผนงานปรับใช้ร่วมกับสถาปัตยกรรม Modal Iframe / High Score System

## [1.5.0] - 2026-07-28

### Updated / Synchronized
- **Agile to GDD & Software Doc Sync**: อัปเดตเอกสารระบบและเกมทั้งหมดให้สอดคล้องกับแผนการพัฒนา Agile (Sprint 01/02):
  - **GDD Suite ([docs/gdd/](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd)):**
    - `00-concept.md`: เพิ่มสถานะการพัฒนา Sprint 01/02 และเชื่อมโยง Agile User Stories
    - `01-mechanics.md`: เพิ่มไดอะล็อกการสืบค้น real-time, คีย์บอร์ดลัด (`Space`, `F`, `Esc`), และสเปค High Score Persistence
    - `04-audio-direction.md`: สเปคการสังเคราะห์เสียงเอฟเฟกต์เรียลไทม์ด้วย Synthetic Web Audio API Engine
  - **Software Design Suite ([docs/software/](file:///c:/Users/noppon/source/06-WEB/webJS/docs/software)):**
    - `01-system-design.md`: เพิ่มย่อยระบบ High Score Manager และโครงสร้าง Zero-Dependency Node HTTP Server
    - `02-class-diagram.md`: เพิ่ม Sequence Diagram ลำดับการส่งคะแนนผ่าน `window.postMessage` และ Class Diagram สำหรับ `HighScoreManager` / `AudioEngine`
    - `03-data-schema.md`: กำหนดข้อกำหนด Schema สำหรับ `postMessage` Event และ JSON Structure ของ LocalStorage

## [1.4.0] - 2026-07-26

### Added
- **Kenney 3D Platformer (`public/games/3d-platformer/`)**: พัฒนาเกมผจญภัย 3D Platformer ด้วย Babylon.js 8 Engine และสินทรัพย์ 3D/เสียงจาก `KenneyNL/Starter-Kit-3D-Platformer`:
  - ตัวละคร 3D พร้อมโครงกระดูก แอนิเมชัน (`Idle`, `Walk`, `Jump`, `Fall`) และระบบฟิสิกส์ Multi-Ray Ground Check
  - ระบบ **Double Jump (กระโดด 2 ครั้ง)** พร้อมเอฟเฟกต์ละอองดาววงแหวน (Air Ring Particle Burst)
  - วัตถุโต้ตอบในด่าน: เหรียญทอง 3D, บล็อกคำถามเสกเหรียญ, บล็อกอิฐระเบิดทำลาย, แพลตฟอร์มเคลื่อนที่ และแพลตฟอร์มสั่นร่วง
  - อินเทอร์เฟซ HUD สไตล์ Glassmorphism และระบบควบคุม Touch Joystick สำหรับหน้าจอมือถือ
- **GDD Specification**: เพิ่มเอกสารกำกับ [docs/gdd/games/3d-platformer/spec.md](./gdd/games/3d-platformer/spec.md)

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
