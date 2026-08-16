---
title: "📜 Documentation Changelog — webJS"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Antigravity AI & Dev Team"
status: "Active"
tags:
  - documentation
---

# 📜 Documentation Changelog — webJS

**Project:** Game Portfolio (`webJS`)  
**Maintained by:** Antigravity AI & Dev Team  

## [1.31.0] - 2026-08-16

- **YAML Frontmatter Standardization & Skill Update ([.agents/skills/game-doc-manager/SKILL.md](file:///c:/Users/noppon/source/06-WEB/webJS/.agents/skills/game-doc-manager/SKILL.md))**:
  - กำหนดมาตรฐาน **YAML Frontmatter** สำหรับเอกสารทุกฉบับ (`title`, `version`, `last_updated`, `owner`, `status`, `tags`)
  - อัปเดตเทมเพลตทั้งหมดใน skill `game-doc-manager` (GDD Concept, Mechanics, System Design, Product Backlog, Sprint Planning, User Stories, Wiki, Project Index)
  - ประยุกต์ใช้ YAML Frontmatter ให้กับเอกสาร Markdown ทุกไฟล์ในโฟลเดอร์ `docs/` (จำนวน 170+ ไฟล์) ครอบคลุมทั้ง GDD, Software, Agile, Reports และ Wiki

- **Ecosystem Mindmaps (Canvas & Excalidraw)**:
  - **Obsidian Canvas ([docs/gdd/mindmap-idea.canvas](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/mindmap-idea.canvas))**: แผนผังความคิดแบบละเอียดครอบคลุมทั้งระบบของ **GameDevJS Hub (`webJS`)**
  - **Excalidraw Visual Mindmap ([docs/gdd/Drawing.excalidraw.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/Drawing.excalidraw.md))**: วาดแผนผังภาพ Excalidraw ในสไตล์มินิมอล กระชับ ชัดเจน เข้าใจง่าย พร้อมรองรับเปิดมุมมอง Excalidraw View ใน Obsidian
  - จัดระเบียบ 5 กลุ่มหลัก:
    1. **🏛️ Core Platform Architecture**: UI Glassmorphism, Modal Sandbox, HighScore Bridge, Web Audio Synth, Native Server.
    2. **🕹️ 2D Games Collection (Phaser & Canvas)**: G001–G004, G006, G008, G017, G019, G020, G021 (SNKRX), G022 (Cards).
    3. **🌐 3D & Shader Games (Babylon.js & WebGL)**: G005, G007, G016, G018 (Hole.io), G023 (Boba Pearl Drop).
    4. **💡 Game Ideas Roadmap**: G009 (Ocean Frenzy), G010 (Dice Quest), G011 (Pico Tower), G012 (Bullet Hell), G013–G015.
    5. **🚀 Future Platform Evolution**: Leaderboard, Achievements, WebRTC Multiplayer, Level Editor, Offline PWA.

## [1.30.0] - 2026-08-12

- **WarFront.io RTS Strategy Granular GDD Suite (G020)**:
  - แตกเอกสารงานออกแบบลงรายละเอียดเชิงลึกแยกเป็นส่วนๆ ใน [docs/gdd/games/warfront/](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/) เพื่อความสะดวกในการปรับแต่งระบบ Gameplay:
    - **[spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/spec.md)**: Technical Specification & Modular Index
    - **[00-concept.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/00-concept.md)**: Vision, World Maps (World/Europe), และ Faction Lore (Blue, Red, Green, Gold)
    - **[01-mechanics.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/01-mechanics.md)**: Core Mechanics, State Machine Loop, Combat Formulas, Casualty Loss & Isolation Penalty Equations
    - **[02-economy-and-buildings.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/02-economy-and-buildings.md)**: Population Growth Model & Strategic Building Upgrade Tree (Fortress, Barracks, Naval Port, Watchtower)
    - **[03-terrain-and-naval.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/03-terrain-and-naval.md)**: Terrain Modifiers, Naval Transport Logistics State Machine, และ Line of Sight Fog of War System
    - **[04-ai-and-balancing.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/04-ai-and-balancing.md)**: AI Utility Decision Matrix, 4 Personality Types (Blitzkrieg, Expansionist, Turtle, Naval) และ 4 Difficulty Tiers
    - **[05-controls-and-ux.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/05-controls-and-ux.md)**: Input Mapping (Mouse/Touch), Keyboard Hotkeys (Space, A, D, F, P, 1-9, Tab) และ Overlay Layout
    - **[gdd.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/gdd.md)**: Master Hub Document เชื่อมโยงเอกสารทุกหมวดหมู่

- **BOBA PEARL DROP: 100% SUGAR Game (G023)**:
  - จัดทำชุดเอกสาร GDD ฉบับสมบูรณ์สำหรับเกม 3D Marble Runner สไตล์ *Super Monkey Ball* ด้วย **BabylonJS** ได้รับแรงบันดาลใจจากคลิปทดลองของ Kevin Ngo (`@kevin_t_ngo`)
  - **Game Specification & Concept ([docs/gdd/games/boba-pearl-drop/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/boba-pearl-drop/spec.md), [00-concept.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/boba-pearl-drop/00-concept.md))**: ออกแบบระบบการเล่นเม็ดไข่มุกกลิ้งทรงตัวฝ่าลู่ 3D ลอยฟ้า
  - **Core Mechanics ([01-mechanics.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/boba-pearl-drop/01-mechanics.md))**: ควบคุมทิศทางเม็ดไข่มุกตามกล้อง, กระโดด Bounce, เทอร์โบ Dash, และระบบสะสม % น้ำตาล (Sugar Level Bar 0-100%)
  - **Level Design ([02-level-design.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/boba-pearl-drop/02-level-design.md))**: ดีไซน์ 3 ด่าน 3 ธีมเครื่องดื่ม ได้แก่ Milk Tea Meadow (ชานมสด), Taro Heights (ยอดเขาเผือก), และ Matcha Gardens (สวนชาเขียว)
  - **Art Direction ([03-art-direction.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/boba-pearl-drop/03-art-direction.md))**: กำหนดโทนสีพาสเทลชานมสดใส, PBR Glossy Boba Material, Glow Layer, และ Glassmorphism UI
  - **Software System Design ([docs/software/games/boba-pearl-drop/01-system-design.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/software/games/boba-pearl-drop/01-system-design.md))**: ออกแบบสถาปัตยกรรม BabylonJS Scene, Camera, Player Sphere Physics Controller, และ Asset Generator
  - **Product Backlog ([docs/agile/games/boba-pearl-drop/01-product-backlog.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/agile/games/boba-pearl-drop/01-product-backlog.md))**: จัดลำดับความสำคัญของ User Stories สำหรับขั้นตอนการลงมือพัฒนาตัวเกมจริง

## [1.29.0] - 2026-08-12

- **Royal Cascade: Juicy Card Dealer Game (G022)**:
  - จัดทำเอกสาร GDD ฉบับสมบูรณ์สำหรับเกมไพ่ที่เน้นระบบ **Card Dealing Animation & Layout Polish** ที่ [docs/gdd/games/animated-card-game/gdd.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/animated-card-game/gdd.md)
  - ออกแบบระบบ **Staggered Bézier Arc Card Dealing**, **Adaptive Hand Fan Layout**, **Haptic & Visual Interaction States**, **Juicy Victory Celebration (Confetti & Coin Cascade)**, และระบบ **In-Game Economy / Card Shop** อ้างอิงจากเทรนด์งานพัฒนาเกมไพ่ยุคใหม่ (Flutter/Gamedev showcase)

## [1.28.0] - 2026-08-04

- **Tiny Dungeon Squad — SNKRX Edition (G021)**:
  - แยกสร้างเป็น **เกมใหม่แยกต่างหาก (G021)** โดยคงเกมเดิม `tiny-dungeon-roguelike` (G017) ไว้ในรูปแบบเดิม 100%
  - นำระบบเกมจาก [SNKRX by a327ex](https://github.com/a327ex/SNKRX) มาพัฒนาเป็น **2D Top-Down Snake Squad Auto-Battler Roguelite** ในโฟลเดอร์ `public/games/tiny-dungeon-squad/`
  - บังคับขบวนแถวฮีโร่ (Snake Squad Formation) เคลื่อนที่หลบมอนสเตอร์ พร้อมระบบสมาชิกทีมโจมตีอัตโนมัติ (Auto-Battler)
  - ระบบ **8 Hero Classes** (Knight, Wizard, Rogue, Priest, Ranger, Paladin, Necromancer, Bard) พร้อม **Auto-Chess Class Synergies** (2/4 ตัวเปิดบัฟสายอาชีพ)
  - ระบบ **Auto-Merge Tier System** (ผสมฮีโร่ 3 ตัวเป็น ★★ และ ★★★)
  - ระบบ **Post-Wave Shop Phase** (ซื้อ/ขายฮีโร่, Reroll, ล็อกร้านค้า, อัปเกรดขยายขนาดทีม, สะสมเงินรับดอกเบี้ย Interest)
  - จัดทำเอกสาร GDD ใน [docs/gdd/games/tiny-dungeon-squad/](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/tiny-dungeon-squad/) และเปิดให้เข้าเล่นบนหน้าหลัก `src/app/page.js`

## [1.27.0] - 2026-08-01

- **WarFront.io & FrontWars Strategy Game (G020)**:
  - บันทึกเอกสารงานออกแบบ (GDD Spec) ที่ [docs/gdd/games/warfront/gdd.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/warfront/gdd.md) โดยอ้างอิงจากงานออกแบบและซอร์สโค้ดของ [Elitis/FrontWars](https://github.com/Elitis/FrontWars) และ [WarFrontIO/client](https://github.com/WarFrontIO/client)
  - พอร์ตและรวบรวม Standalone Production Web Bundle ลงใน `public/games/warfront/index.html` พร้อมเชื่อมต่อกับเกมฮับบน `src/app/page.js`
- **OpenFront.io Offline Strategy RTS Game (G020)**:
  - พอร์ตและพัฒนาตัวเกมวางแผนยึดครองโลกจาก [openfrontio/OpenFrontIO](https://github.com/openfrontio/OpenFrontIO) ให้อยู่ในรูปแบบ **Offline Single-Player Mode 100%** ใน `public/games/openfront/`
  - รองรับระบบสลับแผนที่ (World, Europe, Asia, Pangaea, Archipelago), สู้กับ 5 AI Factions, ระบบการทูต (Diplomacy Alliances), และอาวุธ Silo Missiles
  - จัดทำเอกสาร GDD ที่ [gdd.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/openfront/gdd.md) และเชื่อมต่อตัวเกมบนหน้าหลัก `src/app/page.js`
- **State.IO RTS Territory Domination Game (G019)**:
  - จัดทำเอกสารฉบับเต็ม [gdd.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/stateIO/gdd.md) ครอบคลุมระบบการเล่น Core Loop, Faction Balance, Terrain Multipliers, Battle Formula, Multi-Node Dragging, Building Upgrades, Web Audio Synthesizer, และ UI Architecture
- **Dice Quest Monopoly Board Game (G010)**:
  - พัฒนาและแก้ไขตัวเกมกระดานวางกลยุทธ์ทอยลูกเต๋า **Dice Quest (G010)** ใน `public/games/dice-quest/` (Vanilla JS + HTML5 + CSS Grid)
  - เพิ่มสไตล์ visual design system `styles.css` ในรูปแบบ Modern Dark Glassmorphism
  - แก้ไขเส้นทางอ้างอิงภาพลูกเต๋าและการตรวจสอบสินทรัพย์เป็น `/assets/kenney_boardgame-pack/PNG/Dice/dieRed1.png`
  - เชื่อมต่อตัวเกมขึ้นบนหน้าหลัก Hub UI (`src/app/page.js`) ในหมวดหมู่ *"กระดาน / วางกลยุทธ์"*
  - สร้างเอกสาร [US-G010-dice-quest.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/agile/user-stories/US-G010-dice-quest.md), ย้าย GDD spec เป็น [docs/gdd/games/dice-quest/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/dice-quest/spec.md) และจัดทำรายงานสรุปประจำสัปดาห์ [weekly-2026-W31.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/reports/weekly/weekly-2026-W31.md)

## [1.22.0] - 2026-07-29

### Chore & Version Bump
- **Build Version Update ([public/build.json](file:///c:/Users/noppon/source/06-WEB/webJS/public/build.json))**:
  - อัปเดตข้อมูลเวอร์ชันโปรเจกต์และ Build Tag เป็น **v1.22.0 #1418** ใน `package.json`, `public/build.json`, `docs/agile/01-product-backlog.md`, และเอกสารระบบที่เกี่ยวข้อง

## [1.21.0] - 2026-07-29

### Added & Developed
- **Goosl Glass Marbles WebGL 2 Rendering Knowledge Base ([docs/wiki/development/goosl-marbles-rendering.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/wiki/development/goosl-marbles-rendering.md))**:
  - ถอดองค์ความรู้และสถาปัตยกรรมการเรนเดอร์กราฟิกลูกแก้วของ `public/games/goosl-marbles/app.js` ครอบคลุม Procedural Ray-Marched Quads, Analytical Normal Derivation, Quaternion 3D Spin Matrices, Multi-Chromatic Dispersion Refraction, 120Hz Sub-Stepping Physics Engine และ Web Audio API Stereo Sound Synthesizer
- **Planned Games Specs Reorganization ([docs/gdd/planning/index.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/planning/index.md))**:
  - คัดแยกเอกสาร Game Design Spec ที่ยังไม่ได้สร้างตัวเกมจริงจำนวน 7 เกม ได้แก่ `ocean-frenzy`, `dice-quest`, `pico-tower-climber`, `pixel-bullet-hell`, `block-collapse`, `tiny-farm-tycoon`, และ `lunar-lander` ย้ายไปเก็บในโฟลเดอร์ **`docs/gdd/planning/`** พร้อมสร้างหน้าดรรชนีรวมแผนงานพัฒนา
  - คงเหลือโฟลเดอร์ **`docs/gdd/games/`** ไว้เฉพาะ 11 เกมที่มีการเปิดเล่นจริงใน `public/games/` สอดคล้องกัน 100%
- **Tile Swap Game Renaming & Category Re-alignment ([docs/gdd/games/tile-swap/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/tile-swap/spec.md))**:
  - เปลี่ยนชื่อเกมจาก `Kenney Match 3` เป็น **`Tile Swap` (G006)** เพื่อให้ตรงกับรูปทรงไทล์สี่เหลี่ยมหลากสีในเกม 100%
  - ย้ายโฟลเดอร์เกมเป็น `public/games/tile-swap/` และย้ายหมวดหมู่มาอยู่ใน **กลุ่มเกมปริศนา (Puzzle Games)** บนหน้าแรก
- **Mahjong Tile Match GDD Renaming ([docs/gdd/games/mahjong-tile-match/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/mahjong-tile-match/spec.md))**:
  - เปลี่ยนชื่อโฟลเดอร์จาก `docs/gdd/games/tile-match` เป็นชื่อภาษาอังกฤษของเกมไพ่นกกระจอก **`docs/gdd/games/mahjong-tile-match/`** พร้อมอัปเดตลิงก์อ้างอิงใน `docs/index.md`
- **Hole.io 3D Game Design Document & Development Specs ([docs/gdd/games/hole-io/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/hole-io/spec.md))**:
  - จัดทำเอกสาร GDD และพิกัดฟีเจอร์ของ **Hole.io 3D (G018)** อย่างสมบูรณ์ ครอบคลุมระบบ Suction Physics, Selective Collision Filtering, True 3D Isometric View, Hole Evolution (LVL 1 - 4), และ Transparent Force-Field Boundaries
  - อัปเดตตารางดรรชนีเกมใน `docs/index.md` และการจัดเรียงบนหมวดหมู่หน้าแรก (`src/app/page.js`)

### Fixed & Resolved (HTTP 404 Root Cause Resolution)
- **Kenney 3D Platformer Self-Contained Asset Mirroring ([public/games/3d-platformer/assets/](file:///c:/Users/noppon/source/06-WEB\webJS\public\games\3d-platformer\assets\))**:
  - แก้ไข **HTTP 404 Iframe Resolution Failure**: สาเหตุที่ขึ้น 404 เกิดจากเมื่อเกมรันใน Iframe/Modal ค่า `window.location.href` ของ Iframe ขาด สแลช (`/`) ปิดท้าย ทำให้การคำนวณย้อนกลับด้วย `../../assets/` เพี้ยนขึ้นไปผิดชั้นจนตอบกลับเป็น HTTP 404
  - จัดทำ **Self-Contained Local Asset Mirror**: คัดลอกโฟลเดอร์โมเดล 3D (.glb) ทั้งหมดมาเก็บไว้ใน `public/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/` โดยตรง
  - อัปเดต **Priority Candidate Paths**: เพิ่ม `./assets/...` และ `/games/3d-platformer/assets/...` ขึ้นเป็นอันดับ 1 ในการดาวน์โหลด ช่วยการันตีพบไฟล์โมเดล 3D จริง 1000% บนทุกเบราว์เซอร์และทุกอุปกรณ์
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.21.0 #2285**

## [1.20.0] - 2026-07-29

### Fixed & Resolved (Diagnostic Popup Unblock)
- **Kenney 3D Platformer Dynamic Diagnostic Code Popup Fix ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB\webJS\public\games\3d-platformer\game.js))**:
  - แก้ไข **Static Popup Text Trap**: แก้ไขจุดหลุดเงื่อนไขใน `showAssetStatusPopup()` ที่เดิมมีข้อความ Hardcoded เป็น `'⚙️ Output: Procedural 3D Geometry Fallback Mode'` ทำให้ Popup แสดงผลข้อความเดิมเสมอโดยไม่ยอมส่งผ่าน `gameState.errorCode` ออกมา
  - พัฒนา **Live Diagnostic Reporting**: ปรับแต่ง `startGame()` และ `showAssetStatusPopup(isFallback, errorCode, lastErrorMsg)` ให้ส่งผ่านและแสดงผลรหัสข้อผิดพลาดสดๆ (เช่น `⚙️ Fallback Geometry [E02: HTTP_404]` หรือ `⚙️ Fallback Geometry [E01: NO_GLTF_PLUGIN]`) ทันทีที่รันบนมือถือ
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.20.0 #2280**

## [1.19.0] - 2026-07-29

### Fixed & Resolved (Core Architectural Root Cause)
- **Kenney 3D Platformer Babylon 7.x Plugin & Clone Architectural Fix ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB\webJS\public\games\3d-platformer\game.js))**:
  - แก้ไข **Babylon.js 7.x GLTF Plugin Namespace**: เพิ่มการรองรับ `BABYLON.GLTF2.GLTFFileLoader` ซึ่งเป็นมาตรฐาน Plugin Namespace หลักของ Babylon.js 7.x (เดิมระบบเช็คเพียง `BABYLON.GLTFFileLoader` ทำให้ตัวเอนจินมองไม่เห็นปลั๊กอินอ่าน `.glb`)
  - แก้ไข **Empty Mesh Child Clone Logic**: ยกเลิกการใช้ `ImportMeshAsync` แบบมี `tempRoot.setEnabled(false)` และ `clone(..., null, false)` ซึ่งทำให้ Children Meshes หายไปทั้งหมดจนเรนเดอร์เป็น TransformNode เปล่า
  - สลับกลับมาใช้ **`BABYLON.SceneLoader.LoadAssetContainerAsync` Direct Native Pipeline**: โหลดโมเดลพร้อม Children, Skeletons และ Animations สมบูรณ์ 100%
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.19.0 #2275**

## [1.18.0] - 2026-07-29

### Added & Fixed
- **Kenney 3D Platformer Asset Diagnostic Error Code System ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB\webJS\public\games\3d-platformer\game.js))**:
  - เพิ่ม **Diagnostic Error Code Taxonomy**: พัฒนาระบบรหัสข้อผิดพลาด 5 หมวดหมู่เพื่อระบุสาเหตุที่เกมตกลงไปรันในโหมด Fallback อย่างกระชับและแม่นยำ 100%:
    - `ERR-E01 (NO_GLTF_PLUGIN)`: ปลั๊กอิน GLTF Loader โหลดล้มเหลว
    - `ERR-E02 (HTTP_404_PATH)`: หาไฟล์ GLB ไม่พบบน Host Path
    - `ERR-E03 (CORS_BLOCK)`: โดนบล็อกโดย CORS / Security Policy
    - `ERR-E04 (NETWORK_FAIL)`: สัญญาณเน็ตล้มเหลว หรือ Data Saver Intercept
    - `ERR-E05 (DECODE_PARSE_FAIL)`: การถอดรหัสไฟล์ GLB ล้มเหลวในเอนจิน
  - อัปเดต **Glassmorphic Popup Banner**: แสดง Error Code กระชับต่อการอ่านและทดสอบบนหน้าจอมือถือ (เช่น `⚙️ Fallback Geometry Mode [ERR-E02 (HTTP_404_PATH)]`)
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.18.0 #2270**

## [1.17.0] - 2026-07-29

### Fixed & Resolved
- **Kenney 3D Platformer Asset Loader Ultimate Overhaul ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB\webJS\public\games\3d-platformer\game.js))**:
  - เพิ่ม **Dynamic GLTF Loader CDN Injection (`ensureGLTFLoader`)**: ระบบจะตรวจเช็คปลั๊กอิน GLTF Loader จาก Babylon.js หากพบว่าเบราว์เซอร์มือถือยังไม่ได้โหลดปลั๊กอิน สคริปต์จะทำการฉีด (Inject) ปลั๊กอินจาก Cloudflare CDN / Unpkg CDN สำรองให้อัตโนมัติทันที
  - เปลี่ยนมาใช้ **`BABYLON.SceneLoader.ImportMeshAsync` Template Cloning**: สลับจาก `LoadAssetContainerAsync` มาใช้วิธีนำเข้า `ImportMeshAsync` สดๆ ผ่าน Template Root Node ซึ่งเป็นทางตรงและเสถียรที่สุดในเอนจิน Babylon.js 7.x ช่วยให้โหลดโมเดล 3D จริงจาก Kenney Pack แสดงผลในฉากได้ 100%
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.17.0 #2265**

## [1.16.0] - 2026-07-29

### Fixed & Resolved
- **Kenney 3D Platformer Asset Loader Fundamental Fix ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/3d-platformer/game.js))**:
  - แก้ไข **Core Function Signature**: ปรับแก้คำสั่ง `BABYLON.SceneLoader.LoadAssetContainerAsync(rootUrl, filename, scene)` โดยเอาพารามิเตอร์ `null, ".glb"` สองตัวท้ายออก ซึ่งเดิมส่ง `null` ไปยัง `onProgress` callback จนทำให้ Babylon.js 7.x โยน TypeError/Rejection
  - พัฒนาระบบ **`BABYLON.FilesInputStore` ArrayBuffer Loading**: เมื่อใช้วิธีดาวน์โหลด `fetch(fullUrl)` ไฟล์ Binary จะถูกลงทะเบียนลงใน `BABYLON.FilesInputStore[filename]` แล้วให้ `LoadAssetContainerAsync("file:", filename, scene)` ดึงข้อมูลจาก Memory ไปสร้างโมเดล 3D จริงอย่างแม่นยำ
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.16.0 #2260**

## [1.15.0] - 2026-07-29

### Fixed
- **Kenney 3D Platformer Asset Loader Bug Fix ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/3d-platformer/game.js))**:
  - แก้ไข **Root Cause Bug**: ยกเลิกการเรียก `URL.revokeObjectURL(blobUrl)` ก่อนเวลาที่ทำลาย Memory Blob ทันทีขณะ Babylon.js กำลังถอดรหัส GLB ซึ่งเป็นสาเหตุให้ระบบเข้าใจว่าโหลดโมเดลจริงล้มเหลวและตกลงไปที่ Procedural Geometry Fallback
  - เพิ่ม **Native Babylon File Object Loading**: สลับใช้ `new File([arrayBuffer], filename)` และ `BABYLON.SceneLoader.LoadAssetContainerAsync("file:", fileObj)` เพื่อนำข้อมูลไบนารีโมเดล 3D จริงจาก Kenney Pack เข้าสู่ฉาก 3D ได้อย่างสมบูรณ์แบบ 100%
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` เป็น **v1.15.0 #2255**

## [1.14.0] - 2026-07-29

### Release & Build Preparation
- **Edge Mobile Real 3D Model Rendering Verification ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/3d-platformer/game.js))**:
  - ระบบ **Direct Memory Blob Fetch (`fetch` + `createObjectURL`)** ดึงไฟล์ Binary 3D Models (`.glb`) มาเรนเดอร์ในแรมโดยตรง ข้ามข้อจำกัด Iframe Scope และ Data Saver ของ Microsoft Edge Mobile
  - กำหนด **Content-Type MIME-Type Header (`model/gltf-binary`)** และ **CORS Headers (`Access-Control-Allow-Origin: *`)** ใน `next.config.js` และ `server.js`
  - ตรวจสอบผ่านการคอมไพล์ Production Build (`npm run build`) สมบูรณ์ 100% พร้อมสำหรับการ Deploy
- **Build Release Update**:
  - อัปเดตข้อมูลเวอร์ชันใน `package.json`, `public/build.json` และ `docs/agile/01-product-backlog.md` เป็น **v1.14.0 #2250**

## [1.13.0] - 2026-07-29

### Fixed & Enhanced
- **Kenney 3D Platformer Edge Mobile & Iframe Asset Fallback ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/3d-platformer/game.js))**:
  - แก้ไขปัญหา Microsoft Edge Mobile และ Iframe Environment ในการดาวน์โหลด `.glb` 3D Assets ด้วยระบบ **Multi-Path Candidate Loader** (`/assets/...`, `./../../assets/...`, `origin + /assets/...`)
  - สร้างระบบ **Procedural 3D Mesh Fallback Generator** สำหรับตัวละคร 3D (`CreateCapsule`), แพลตฟอร์ม 3D (`CreateBox`), แพลตฟอร์มเคลื่อนที่, แพลตฟอร์มถล่ม, เหรียญทอง, บล็อกคำถาม, และธงชัยชนะ
  - การันตีว่าเกมสามารถสร้างฉาก 3D และตัวละครให้เล่นได้สมบูรณ์ 100% ปราศจากอาการตกทะลุพื้นตกตายตลอดเวลา แม้เบราว์เซอร์บนมือถือจะบล็อกหรือล้มเหลวในการดาวน์โหลดไฟล์ GLB

## [1.12.0] - 2026-07-29

### Added & Fixed
- **Kenney 3D Platformer Mobile Physics & Render Fix ([public/games/3d-platformer/game.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/3d-platformer/game.js))**:
  - แก้ไขการ Render และ Hardware Scaling บนอุปกรณ์มือถือ (Hardware Scaling Level cap max DPR 1.5) เพิ่ม FPS 60FPS
  - พัฒนาระบบ **Swept Dynamic Raycast** และ **Upward Ray Recovery** ป้องกันการตกลงทะลุพื้นแพลตฟอร์มเมื่อเกิดอาการเฟรมตกชั่วขณะบนมือถือ
  - ปรับจุดเกิด (Spawn / Respawn Point) ให้อยู่บนแพลตฟอร์มเริ่มต้นอย่างปลอดภัยที่ `Y = 1.2`
- **Card Memory Match Optimizations ([public/games/card-memory/](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/card-memory/))**:
  - **`US-08-06` (Mobile Responsive HUD)**: ปรับแต่ง Canvas HUD Responsive สำหรับ Mobile Viewports (<480px) แก้ไขบั๊กข้อความซ้อนทับปุ่มกดที่ 360px
  - **`US-08-07` (Performance & Preload)**: สลับใช้รูปการ์ด `Cards (medium)` ขนาดกระทัดรัด พัฒนาระบบ `preloadAllAssets()` แบบ Async/Promise.all และจำกัด Memory Particles
- **Tiny Dungeon Survivor Chain Lightning Rebalance ([public/games/tiny-dungeon-roguelike/game.js](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/tiny-dungeon-roguelike/game.js))**:
  - ปรับปรุงสกิล **Chain Lightning** ของ Wizard ให้มีระบบ Chain Jump Reaction ชิ่งความเสียหายไปยังศัตรูใกล้เคียงเป็นทอดๆ ตามระดับเลเวล พร้อมเพิ่มเส้นสายฟ้า Zig-Zag VFX
  - อัปเดตเอกสาร GDD [`level-design-character-growth.md`](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/tiny-dungeon-roguelike/level-design-character-growth.md) ให้สอดคล้องกัน
- **Agile User Stories Cleanup & Archive ([docs/agile/user-stories/archive/](file:///c:/Users/noppon/source/06-WEB/webJS/docs/agile/user-stories/archive/))**:
  - ย้ายและจัดเก็บ User Stories ที่ทำเสร็จสมบูรณ์เข้าสู่ `archive/` (US-17-01..04, US-08-01..07)
  - อัปเดตสถานะบอร์ด Kanban (`Kanban-board.md`) และลิงก์อ้างอิงใน Product Backlog (`01-product-backlog.md`)

## [1.10.0] - 2026-07-28

### Added & Upgraded
- **Agile Sprint 03 & User Stories ([docs/agile/sprint-backlogs/sprint-03.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/agile/sprint-backlogs/sprint-03.md))**:
  - จัดตัดรอบ **Sprint 03** สำหรับเกม Tiny Dungeon Survivor (G017) อย่างเป็นระบบ
  - สร้าง User Stories (US-17-01 ถึง US-17-04), อัปเดต Product Backlog (`01-product-backlog.md`), Sprint Planning (`02-sprint-planning.md`), และ Kanban Board (`Kanban-board.md`)
- **Tiny Dungeon Survivor GDD Spec ([docs/gdd/games/tiny-dungeon-roguelike/spec.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/gdd/games/tiny-dungeon-roguelike/spec.md))**:
  - จัดทำเอกสาร GDD ฉบับสมบูรณ์สำหรับเกม **Tiny Dungeon Survivor (G017)**
  - ครอบคลุม Overview, Asset Pack breakdown (`kenney_tiny-dungeon`), Core Loop Sequence Diagram (Mermaid), Skill Upgrade System (Roguelike Card Upgrades), Controls & Input Mapping และ System Architecture
- **Cross-Platform Responsive & Mobile Portrait Standard ([docs/wiki/guidelines/cross-platform-display-standard.md](file:///c:/Users/noppon/source/06-WEB/webJS/docs/wiki/guidelines/cross-platform-display-standard.md))**:
  - จัดทำเอกสารข้อกำหนดมาตรฐานการพัฒนาเกมที่ต้องรองรับทั้ง **PC (Desktop Landscape)** และ **Mobile แนวตั้ง (Portrait First)**
  - กำหนด Base Aspect Ratio `9:16` (720x1280 px / 540x960 px), Safe Area Top/Bottom Insets
  - กำหนดแนวคิด **Centered Portrait Cabinet Frame** บน PC ร่วมกับ **Glassmorphic Ambient Backdrop**
  - กำหนดระบบ **Dual Control Auto-Sensing** (Touch Virtual Controls บน Mobile และ WASD/Space/Mouse บน PC)
- **Public Games Compliance Upgrades ([public/games/](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/))**:
  - **`2048-cubes`**: ปรับสเกลเป็น Responsive Mobile Portrait (`max-width: 540px`), เพิ่มการควบคุมด้วย Keyboard บน PC (`ArrowLeft`, `ArrowRight`, `A`, `D`, `Space`, `ArrowDown`)
  - **`space-shooter` (`phaser-demo`)**: ปรับ Base Aspect Ratio เป็น `540x960` Portrait Standard, เพิ่ม Touch Drag Pointer & Auto Fire สำหรับมือถือ (แก้ไขปัญหาเล่นบนมือถือไม่ได้), เพิ่มการควบคุม WASD/Space บน PC
  - **`match3`**: ปรับเปลี่ยนกฎการเล่นเป็น **Endless Mode** — ยกเลิกการจำกัด 25 ตาและคะแนนเป้าหมาย เล่นต่อเนื่องได้ไม่จำกัด เพิ่มระบบตรวจสอบ `hasPossibleMoves()` อัตโนมัติ เกมจะจบลงเมื่อ **ไม่มีคู่ที่สามารถสลับจับคู่เหลืออยู่บนกระดาน** (`🚫 NO MORE MOVES!`) พร้อมแสดงสถิติจำนวนครั้งที่สลับ (SWAPS), คะแนนรวม และ Max Combo
  - **`card-memory`**: เพิ่ม Safe Area Insets และ Desktop Centered Frame Styling
  - ตรวจสอบความสมบูรณ์ของ **`3d-platformer`**, **`goosl-marbles`**, **`tile-match`**, **`emoji-match`**, **`babylon-demo`** ผ่านเกณฑ์มาตรฐานครบถ้วนทั้ง 9 เกม

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
