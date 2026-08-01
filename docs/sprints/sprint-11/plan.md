# 🍦 Sprint 11: Polish & Launch (ปรับปรุงและเปิดตัว)

**Sprint Name:** Polish & Launch
**Sprint ID:** sprint-11
**Start Date:** 2026-09-12
**End Date:** 2026-09-26 (2 สัปดาห์)
**Status:** Planning

---

## 1. เป้าหมายของ Sprint (Sprint Goal)

ปรับปรุงเกมให้สมบูรณ์ — เพิ่ม particle effects, animations, sound design, daily rewards system, settings & accessibility, optimization สำหรับมือถือ และทดสอบจบบทท้ายเพื่อให้เกมพร้อมเปิดตัว

---

## 2. ผลงานสำคัญ (Key Deliverables)

| # | ผลงาน | สำเร็จแล้ว |
|---|--------|----------|
| 1 | Particle effects (sparkles, bubbles, confetti) | [ ] |
| 2 | Animations (ball pop, special ball effects) | [ ] |
| 3 | Sound design (Web Audio SFX) — ทุก action | [ ] |
| 4 | Daily Rewards & streak system | [ ] |
| 5 | Settings & accessibility options | [ ] |
| 6 | Performance optimization (mobile) | [ ] |
| 7 | Final testing & bug fixes | [ ] |

---

## 3. สิ้นเดือน Sprint

### สัปดาห์ที่ 1: Effects + Sound + Daily (2026-09-12 → 2026-09-18)

| วัน | คุณพุทธะ (Focus) | ผลงาน (Deliverable) |
|-----|------------------|---------------------|
| D1 | พัฒนา particle system — sparkles, bubbles, confetti | US-11-01 |
| D2 | พัฒนา animation system — ball pop, special ball effects | US-11-01 |
| D3 | พัฒนา Web Audio SFX manager | US-11-02 |
| D4 | จับ sound trigger — match, serve, upgrade, level up | US-11-02 |
| D5 | พัฒนา Daily Rewards system — login, streak bonus | US-11-03 |

### สัปดาห์ที่ 2: Settings + Performance + Testing (2026-09-19 → 2026-09-25)

| วัน | คุณพุทธะ (Focus) | ผลงาน (Deliverable) |
|-----|------------------|---------------------|
| D6 | พัฒนา Settings UI — audio, graphics, controls | US-11-04 |
| D7 | พัฒนา accessibility features (colorblind, large text) | US-11-04 |
| D8 | Performance profiling — identify bottlenecks | US-11-04 |
| D9 | Optimization — mobile FPS, memory, asset size | US-11-04 |
| D10 | Final testing, bug fixes, polish pass | — |

---

## 4. User Stories

| US ID | สถานี (Story) | คุณภาพ (Priority) | การคาดคุณ (Est.) |
|-------|--------------|------------------|-----------------|
| US-11-01 | Particle Effects & Animations — สิ่งแวดล้อมและ animation สำหรับทุก action | P0 | 6 |
| US-11-02 | Sound Design & Audio — SFX สำหรับ match, serve, upgrade, level up | P0 | 6 |
| US-11-03 | Daily Rewards & Streak — รับรางวัลรายวันและ streak bonuses | P1 | 6 |
| US-11-04 | Settings & Accessibility — ปรับเสียง, กราฟิก, controls, accessibility | P2 | 4 |

---

## 5. ปริการทางเทคนิค (Technical Tasks)

| # | ปริการ (Task) | การคาดคุณ | หมายเหตุ |
|---|--------------|----------|----------|
| T1 | พัฒนา ParticleManager class — sparkles, bubbles, confetti | 6h | Object pooling, auto-destroy |
| T2 | ทดสอบ particle trigger บน match/serve/upgrade events | 4h | Hook into existing systems |
| T3 | พัฒนา BallAnimation class — pop, special effects | 6h | Tween + scale + color |
| T4 | พัฒนา SpecialBallEffect — rainbow, bomb, explosion | 6h | Area effect + screen shake |
| T5 | พัฒนา SFXManager — Web Audio API integration | 6h | Volume, mute, preload |
| T6 | จับ sound trigger ทุก action (match, serve, coin, upgrade) | 6h | 10+ SFX files |
| T7 | ใช้ Kenney assets สำหรับ SFX (Puzzle Pack 2) | 4h | Download + import |
| T8 | พัฒนา DailyReward system — login tracking, streak counter | 6h | LocalStorage persist |
| T9 | พัฒนา DailyReward UI — popup, claim button, streak display | 6h | Animation + coin count |
| T10 | พัฒนา Settings UI — audio slider, graphics toggle, controls | 8h | Modal/panel UI |
| T11 | พัฒนา Accessibility — colorblind mode, text size, haptic | 6h | Settings integration |
| T12 | Performance profiling — Chrome DevTools, FPS monitor | 6h | Identify bottlenecks |
| T13 | Optimization — asset compression, texture atlas, memory | 8h | Target 30+ FPS mobile |
| T14 | Final testing — manual + automated bug hunt | 6h | All features, all scenes |

**Total estimated:** 68h (ประมาณ 10-12 วันวิธี)

---

## 6. เกณฑ์การรับรับ (Acceptance Criteria)

| เกณฑ์ | คำอธิบาย |
|--------|----------|
| ✅ Particle effects | Sparkles, bubbles, confetti ทำงานบน match/upgrade/level-up |
| ✅ Ball animations | Ball pop, special ball effects (rainbow, bomb, explosion) ทำงาน |
| ✅ Sound design | ทุก action มี SFX (match, serve, coin, upgrade, level-up) |
| ✅ Sound controls | Player สามารถปรับ/ปิดเสียงได้ |
| ✅ Daily rewards | ระบบรับรางวัลรายวันทำงานได้ — login tracking, streak counter |
| ✅ Daily rewards UI | Popup เมื่อ login, claim button ทำงาน |
| ✅ Settings UI | Player สามารถปรับ audio, graphics, controls ได้ |
| ✅ Accessibility | Colorblind mode, text size, haptic ทำงาน |
| ✅ Performance | ≥ 30 FPS บนมือถือ, ไม่ memory leak, smooth transitions |
| ✅ ทดสอบครบ | ทุก feature ทดสอบ, 0 critical bugs, 0 game-breaking bugs |
| ✅ Loading time | < 3s loading บนมือถือ 4G |

---

## 7. ความเสี่ยงและแนวทางการแก้ (Risks & Mitigation)

| ความเสี่ยง | ผลกระทบ | แนวทางการแก้ |
|-----------|---------|---------------|
| Sound assets ไม่เพียงพอ | ขาดความสมบูรณ์ | ใช้ Kenney assets (Puzzle Pack 2) ที่มีให้แล้ว |
| Particle effects เรียก RAM | Performance แย่ | Object pooling, limit particle count (50-100) |
| Daily reward logic ซับซ้อน | Timeline tracking ผิด | Test with 3+ days simulated |
| Settings persistence ผิด | Player ต้องตั้งค่าใหม่เสมอ | Test LocalStorage read/write + edge cases |
| Mobile performanceแย่ | FPS ต่ำ | Early profiling — fix bottlenecks เร็ว |
| Bug จาก polish pass | Feature เดิม break | Regression testing 2 รอบ |
| Asset size ใหญ่ | Loading ช้า | Compress images, use texture atlas, lazy load |

---

## 8. การพึ่งพาท (Dependencies)

| การพึ่งพาท | สถานะ | หมายเหตุ |
|-----------|--------|----------|
| Sprint 08-10: ทุก feature | ✅ สำเร็จแล้ว | Polish บน feature ที่มีอยู่ |
| Kenney: Puzzle Pack 2 (SFX) | ✅ สำเร็จแล้ว | Sound effects |
| Kenney: Assets (sparkles, bubbles) | ✅ สำเร็จแล้ว | Particle assets |
| Sprint 10: Zone system | ✅ สำเร็จแล้ว | Daily reward trigger |
| Browser: Web Audio API | ✅ สำเร็จแล้ว | Sound engine |
| localStorage | ✅ สำเร็จแล้ว | Settings + daily reward persist |

---

## 9. ตัวชี้วัดความสำเร็จ (Success Metrics)

| ตัวชี้วัด | เป้าหมาย |
|----------|----------|
| Particle effects ทำงานครบ | ทุก action มี visual feedback |
| Sound design สมบูรณ์ | ทุก action มี SFX + controls ทำงาน |
| Daily rewards ใช้งานได้ | Login tracking, streak, claim ทำงาน |
| Settings ทำงานได้ | ทุก option persist ได้ถูกต้อง |
| Performance ≥ 30 FPS (มือถือ) | Smooth gameplay บน 4G |
| Loading time < 3s | เร็วที่จะเปิดได้ |
| 0 critical bugs | ทดสอบครบ 3 รอบ |
| ทุก feature ทดสอบได้ | Feature complete & playable |
