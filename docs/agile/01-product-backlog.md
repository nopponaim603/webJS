# Product Backlog — webJS Game Portfolio

**Last Updated:** 2026-08-01 | **Version:** 1.23.0

---

## 🃏 Epic 22 — FOOL THE GAME (G022)

| ID | User Story | Acceptance Criteria | Estimate | Status |
|----|-----------|---------------------|----------|--------|
| [US-G022-01](./user-stories/US-G022-01.md) | Title Screen & Main Navigation | โลโก้ FOOL THE GAME, พัดไพ่ 5 ใบแบบ Arc Fan, ปุ่ม PLAY (ฟ้า), ปุ่ม QUIT (แดง) | S | 🔵 In Progress |
| [US-G022-02](./user-stories/US-G022-02.md) | Staggered Arc Card Deal & Adaptive Fan Engine | แจกไพ่โค้ง Bézier Path แบบ Staggered, พลิก 3D, ปรับพัดไพ่อัตโนมัติ | M | 🔵 In Progress |
| [US-G022-03](./user-stories/US-G022-03.md) | In-Game Battle Zone & Action Bar | 3 Play Slots ตรงกลาง, แถบปุ่ม PLAY (ฟ้า), TAKE (แดง), DISCARD (เหลือง) | M | 🔵 In Progress |
| [US-G022-04](./user-stories/US-G022-04.md) | Purple Shop Panel & Card Draft System | พาเนลร้านค้าม่วง slide-up, การ์ด 3 ใบ ($1, $2, $3), ปุ่ม NEXT (แดง) & RE-ROLL (เขียว) | M | 🔵 In Progress |
| [US-G022-05](./user-stories/US-G022-05.md) | Haptics, Sound SFX & Victory FX | สั่น Haptics 4 ระดับ, เสียง Web Audio API, Confetti & Coin Ticker เมื่อชนะ | S | 🔵 In Progress |

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
