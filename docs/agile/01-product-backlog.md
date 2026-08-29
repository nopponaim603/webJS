---
title: "Product Backlog — webJS Game Portfolio"
project: "GameDevJS Hub (webJS)"
version: "1.30.0"
last_updated: "2026-08-12"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - agile
---
# Product Backlog — webJS Game Portfolio


---

## ⚡ Epic 28 — GODAWFUL Scraping & Reverse Engineering (G028)
> **Source:** [https://godawful.vercel.app/](https://godawful.vercel.app/)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-G028-00](./user-stories/archive/US-G028-00.md) | Game Design Document & Architecture Spec | จัดทำ [GDD Spec](../gdd/games/godawful/spec.md) ครอบคลุม Concept, God Powers, Town Physics & Porting Plan | S | ✅ Done |
| [US-G028-01](./user-stories/US-G028-01.md) | Asset & Vite Bundle Scraping | สแครป Assets, Three.js modules, 3D GLTF meshes, Shaders, SFX และจัดโครงสร้างลง `public/games/godawful/` | M | 🏗 Pending |
| [US-G028-02](./user-stories/US-G028-02.md) | God Controls & Town Simulation Loop | ควบคุมก้อนเมฆเทพเจ้า (Cloud God), พลังสายฟ้า/ฝน/พายุ, ฟิสิกส์การพังทลายของเมือง และ AI ชาวเมือง | L | 🏗 Pending |
| [US-G028-03](./user-stories/US-G028-03.md) | UI Overlay, Audio FX & Game Hub Integration | แสดงผล 2D UI Overlay, Web Audio SFX, Card ในหน้าแรก และเล่นผ่าน iFrame Modal ได้สมบูรณ์ | S | 🏗 Pending |

---

## 🛡️ Epic 29 — SURVIVE 10 WAVES Scraping & Porting (G029)
> **Source:** [https://www.survive10waves.com/](https://www.survive10waves.com/)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-G029-00](./user-stories/archive/US-G029-00.md) | Game Design Document & 10-Wave Extraction Spec | จัดทำ [GDD Spec](../gdd/games/survive-10-waves/spec.md) วิเคราะห์ Combat Loop, Drone, SVG Upgrade Tree & Saves | S | ✅ Done |
| [US-G029-01](./user-stories/US-G029-01.md) | Asset, Three.js Vendor & Audio Scraping | ดึงโมเดล 3D ทหาร/เอเลี่ยน, ES Modules, CSS HUD, Audio playlist (`tracks.js`), SVG Upgrades | M | 🏗 Pending |
| [US-G029-02](./user-stories/US-G029-02.md) | 10-Wave Combat, Sentinel Drone & Arena Collapse | ระบบทหารยิงต่อสู้ 360°, สลับปืนใน Weapon Rack, โดรนช่วยยิง, วงบีบ Arena Collapse, แท่น Extraction | L | 🏗 Pending |
| [US-G029-03](./user-stories/US-G029-03.md) | Weapon Rack, SVG Tree Upgrades & Persistence | ผังอัปเกรดแบบ Interactive SVG Tree, สรุปเหรียญ & ค่าซ่อมโดรน, LocalStorage Save, Hub Integration | M | 🏗 Pending |

---

## 🏍️ Epic 30 — DIRT LINE Scraping & Trials Physics Porting (G030)
> **Source:** [https://dirtline.pages.dev/](https://dirtline.pages.dev/)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-G030-00](./user-stories/archive/US-G030-00.md) | Game Design Document & Trials Physics Spec | จัดทำ [GDD Spec](../gdd/games/dirtline/spec.md) วิเคราะห์ 72kg Spring-Mass Dynamics, Telemetry & Ghost Replay | S | ✅ Done |
| [US-G030-01](./user-stories/US-G030-01.md) | Engine & Canyon Asset Scraping | สกัด Three.js + GLTFLoader r128 bundle, 3D Canyon track & Bike mesh, Sound SFX สู่ `public/games/dirtline/` | M | 🏗 Pending |
| [US-G030-02](./user-stories/US-G030-02.md) | 2.5D Spring-Mass Rider Dynamics & Trials Physics | มวลคนขับ 72 kg บนสปริง, คันเร่ง/เบรกหน้า-หลัง, ถ่ายน้ำหนักหน้า-หลัง (A/D), คุมสมดุลกลางอากาศ | L | 🏗 Pending |
| [US-G030-03](./user-stories/US-G030-03.md) | Checkpoints, Telemetry HUD, Ghost Replay & Hub Integration | HUD นาฬิกา Millisecond + Faults Counter, แถบ Track Rail, Telemetry Matrix, Ghost Replay, Game Hub Card | M | 🏗 Pending |

---

## ⚔️ Epic 12 — WarFront.io Strategy Overhaul (G020)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-12-01](./user-stories/archive/US-12-01.md) | Core Engine & 60 FPS Ticker Integration | Singleplayer Ticker Engine 60 FPS, MapCodec Binary Decoder, Region Grid Render | S | ✅ Done |
| [US-12-02](./user-stories/archive/US-12-02.md) | Combat Physics, Morale & Casualty Formulas | สมการพลังโจมตี/ตั้งรับ, ขวัญกำลังใจ Morale (0-100), อัตราความสูญเสีย Casualty Rate, Conquest Flip | M | ✅ Done |
| [US-12-03](./user-stories/archive/US-12-03.md) | Supply Line Connectivity & Isolation Penalties | ตรวจสอบเส้นทาง Capital/Port, โทษการตัดสายส่งกำลัง -60% Manpower & Morale Decay | M | ✅ Done |
| [US-12-04](./user-stories/archive/US-12-04.md) | Strategic Buildings & Upgrade System | Fortress L1/L2 (+80%/+160% Def), Barracks L1/L2, Naval Port L1/L2, Watchtower L1/L2 | M | ✅ Done |
| [US-12-05](./user-stories/archive/US-12-05.md) | Terrain Modifiers & Maritime Boat Transport | ตัวคูณภูมิประเทศ (Plains, Forest, Mountain, River), การแล่นเรือลำเลียงข้ามทะเล | M | ✅ Done |
| [US-12-06](./user-stories/archive/US-12-06.md) | AI Bot Utility Matrix & 4 Personalities | บอท AI คำนวณ Utility Score, 4 บุคลิกภาพ (Blitzkrieg, Expansionist, Turtle, Naval), 4 ความยาก | L | ✅ Done |
| [US-12-07](./user-stories/archive/US-12-07.md) | UI/UX, Hotkeys & Fog of War System | Drag-Select, Hotkeys (`Space`, `A`, `D`, `F`, `P`, `1-9`, `Tab`), Glassmorphism HUD, Fog of War | S | ✅ Done |

---

## 🧋 Epic 23 — BOBA PEARL DROP: 100% SUGAR (G023)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-G023-01](./user-stories/archive/US-G023-01.md) | BabylonJS Scene Setup, Lighting & Boba Pearl Mesh | BabylonJS Canvas 3D, Glossy ClearCoat Boba Pearl, ArcRotate Camera 360°, Glow Layer | S | ✅ Done |
| [US-G023-02](./user-stories/archive/US-G023-02.md) | Sphere Physics Rolling & Controls | WASD/Camera relative vectors, Space Jump Bounce, Shift Turbo Dash, Mobile Touch Joystick | M | ✅ Done |
| [US-G023-03](./user-stories/archive/US-G023-03.md) | Sugar Cubes Collectibles & Glassmorphism HUD | Sugar Cubes 🧊 3D, Particle Explosion, Sugar Bar 0-100%, 100% Sugar Overload Speed Boost | M | ✅ Done |
| [US-G023-04](./user-stories/archive/US-G023-04.md) | Level Construction, Hazards & Finish Cup Mechanics | 3 Drink Levels (Milk Tea, Taro, Matcha), Straw Tunnel, Moving Platforms, Stirrers, Finish Boba Cup | L | ✅ Done |
| [US-G023-05](./user-stories/archive/US-G023-05.md) | Audio Synthesizer, Victory Modal & Game Hub Integration | Web Audio API SFX synthesizer, Victory Modal ⭐⭐⭐, Next.js Game Hub integration | S | ✅ Done |

---

## 🃏 Epic 22 — FOOL THE GAME (G022)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-G022-01](./user-stories/archive/US-G022-01.md) | Title Screen & Main Navigation | โลโก้ FOOL THE GAME, พัดไพ่ 5 ใบแบบ Arc Fan, ปุ่ม PLAY (ฟ้า), ปุ่ม QUIT (แดง) | S | ✅ Done |
| [US-G022-02](./user-stories/archive/US-G022-02.md) | Staggered Arc Card Deal & Adaptive Fan Engine | แจกไพ่โค้ง Bézier Path แบบ Staggered, พลิก 3D, ปรับพัดไพ่อัตโนมัติ | M | ✅ Done |
| [US-G022-03](./user-stories/archive/US-G022-03.md) | In-Game Battle Zone & Action Bar | 3 Play Slots ตรงกลาง, แถบปุ่ม PLAY (ฟ้า), TAKE (แดง), DISCARD (เหลือง) | M | ✅ Done |
| [US-G022-04](./user-stories/archive/US-G022-04.md) | Purple Shop Panel & Card Draft System | พาเนลร้านค้าม่วง slide-up, การ์ด 3 ใบ ($1, $2, $3), ปุ่ม NEXT (แดง) & RE-ROLL (เขียว) | M | ✅ Done |
| [US-G022-05](./user-stories/archive/US-G022-05.md) | Haptics, Sound SFX & Victory FX | สั่น Haptics 4 ระดับ, เสียง Web Audio API, Confetti & Coin Ticker เมื่อชนะ | S | ✅ Done |

---

## 🎯 Must Have (MVP Core)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-01-01](./user-stories/archive/US-01-01-portfolio-cards.md) | ในฐานะผู้เข้าชมเว็บ ฉันต้องการดูการ์ดแสดงเกมทั้งหมดในหน้าหลัก เพื่อเลือกเล่นเกมที่สนใจได้ง่าย | การ์ดแสดงครบ มีรูปภาพ หมวดหมู่ ชื่อเกม และตอบสนองต่อการ Hover | M | ✅ Done |
| [US-01-02](./user-stories/archive/US-01-02-modal-loader.md) | ในฐานะผู้เล่น ฉันต้องการเปิดเล่นเกมผ่าน Modal Iframe ได้ทันทีโดยไม่ต้องเปลี่ยนหน้า | คลิกการ์ดแล้ว Modal แสดงผลลื่นไหล มีปุ่มปิดชัดเจน | M | ✅ Done |
| [US-01-03](./user-stories/archive/US-01-03-search-filter.md) | ในฐานะผู้เล่น ฉันต้องการค้นหาเกมและกรองตามหมวดหมู่ได้ | ค้นหาแบบ Real-time และกรองตามหมวดหมู่ได้ถูกต้อง | S | ✅ Done |
| [US-02-01](./user-stories/archive/US-02-01-emoji-match.md) | ในฐานะผู้เล่น ฉันต้องการเล่นเกม Emoji Match เพื่อทดสอบความจำ | จับคู่การ์ดที่เหมือนกัน บันทึกคะแนน และแสดงผลแพ้/ชนะ | L | ✅ Done |
| [US-02-02](./user-stories/archive/US-02-02-2048-cubes.md) | ในฐานะผู้เล่น ฉันต้องการเล่นเกม 2048 Cubes รวมตัวเลขฟิสิกส์ | ยิง Cube รวมตัวเลข 2048 ได้ถูกต้องตามกฎฟิสิกส์ | L | ✅ Done |
| [US-02-03](./user-stories/archive/US-02-03-tile-match.md) | ในฐานะผู้เล่น ฉันต้องการเล่นเกม Tile Match จับคู่ไพ่ 3 ใบ | เลือกไทล์ลงถาด 7 ช่อง และจับคู่ 3 ใบหายไป | L | ✅ Done |

---

## 🐠 Epic 09 — Ocean Frenzy (G009)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-09-01](./user-stories/archive/US-09-01-ocean-frenzy.md) | ควบคุมปลาว่ายน้ำ งับกินเหยื่อ เติบโต 9 Level หลบฉลาม/แมงกะพรุน เก็บไอเทมสปีด | เคลื่อนที่ลื่นไหล ระบบงับตามขนาดตัว แมงกะพรุนช็อตสโลว์ ฟองอากาศสปีด เสียงสังเคราะห์ Web Audio | L | ✅ Done |

---

## 🃏 Epic 08 — Card Memory Match (G008)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-08-01](./user-stories/archive/US-08-01-card-grid.md) | แสดงตารางการ์ด 16 ใบ (4x4 Grid) คว่ำหน้าทั้งหมดเมื่อเริ่มเกม | สุ่มการ์ด 8 คู่ มี 3D Flip animation บนมือถือ/เดสก์ท็อป | M | ✅ Done |
| [US-08-02](./user-stories/archive/US-08-02-match-logic.md) | คลิกการ์ดเพื่อเปิดและตรวจจับคู่ความถูกต้อง | ตรวจจับ 2 ใบ ป้องกันการคลิกซ้ำ ป้องกันใบที่ 3 | M | ✅ Done |
| [US-08-03](./user-stories/archive/US-08-03-move-timer.md) | แสดงตัวนับ Moves และ Timer บน HUD | Moves นับเพิ่มทีละ 1 (2 ใบ) และ Timer เดินอัตโนมัติ | S | ✅ Done |
| [US-08-04](./user-stories/archive/US-08-04-results-modal.md) | แสดง Modal สรุปผลลัพธ์เวลา คะแนน และดาว 1-5 ดาว | แสดงผลเวลา Moves แต้ม และระดับดาวเมื่อชนะ | S | ✅ Done |
| [US-08-05](./user-stories/archive/US-08-05-game-restart.md) | ปุ่ม New Game และ Play Again เริ่มเกมใหม่โดยไม่ต้องโหลดหน้าเว็บ | สุ่มการ์ดใหม่ รีเซ็ต Timer/Moves โดยไม่ reload | S | ✅ Done |
| [US-08-06](./user-stories/archive/US-08-06-mobile-responsive.md) | แสดงผล Responsive และสนับสนุน Touch Events บนมือถือ | รองรับ Touch, Auto Scale Card Size 360px+ | M | ✅ Done |
| [US-08-07](./user-stories/archive/US-08-07-performance-preload.md) | เพิ่มประสิทธิภาพการโหลดและ Preload Assets | Preload ภาพการ์ด Kenney Pack 144px 60 FPS | S | ✅ Done |

---

## 🗡️ Epic 17 — Tiny Dungeon Survivor (Action Roguelike - G017)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-17-01](./user-stories/archive/US-17-01-hero-selection.md) | เลือกตัวละครฮีโร่ (Knight, Wizard, Rogue) ก่อนเริ่มเกม | แสดง MenuScene 3 ตัวละครพร้อมสถิติ และปุ่มเลือกฮีโร่ | M | ✅ Done |
| [US-17-02](./user-stories/archive/US-17-02-movement-controls.md) | ควบคุมตัวละครเดิน 8 ทิศทางลื่นไหลบน PC และสัมผัส | รองรับ WASD/Arrow Keys และ Virtual Touch Joystick | M | ✅ Done |
| [US-17-03](./user-stories/archive/US-17-03-auto-weapons.md) | ระบบอาวุธปล่อยอัตโนมัติ (Orbiting Blades, Fireball, Darts, Lightning) | อาวุธปล่อยอัตโนมัติ มี Damage Floating Text | L | ✅ Done |
| [US-17-04](./user-stories/archive/US-17-04-card-upgrades.md) | สุ่มการ์ดอัปเกรด 1 ใน 3 ใบเมื่อเลเวลอัปแบบ Roguelike | เลเวลอัปแล้วหยุดเกมชั่วคราว เลือกการ์ดแล้วเล่นต่อ | L | ✅ Done |

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
- Derived from: [Game Concept & Architecture](../gdd/00-concept.md), [Core Mechanics](../gdd/01-mechanics.md), [Card Memory Spec](../gdd/games/card-memory/spec.md)
