---
title: "Sprint 03: Tiny Dungeon Survivor (Action Roguelike)"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - agile
  - sprint
---

# Sprint 03: Tiny Dungeon Survivor (Action Roguelike)

**Goal:** พัฒนาและเปิดตัวเกมแนว **2D Top-Down Action Roguelike (Tiny Dungeon Survivor)** โดยใช้ Phaser 3 และชุดกราฟิก Kenney Tiny Dungeon บน Next.js Game Hub  
**Timeline:** 2026-07-28 → 2026-08-04  
**Status:** ✅ Completed  

---

## 📅 Internal Sprint Schedule & Tasks

```mermaid
gantt
    title Sprint 03 Timeline & Tasks
    dateFormat  YYYY-MM-DD
    section Core Engine & Architecture
    Hero Selection & MenuScene (US-17-01)   :done, s3_1, 2026-07-28, 1d
    Top-Down Dual Controls (US-17-02)       :done, s3_2, 2026-07-28, 1d
    section Combat & Roguelike System
    Auto-Weapons Engine (US-17-03)           :done, s3_3, 2026-07-28, 1d
    Roguelike Card Upgrades (US-17-04)       :done, s3_4, 2026-07-28, 1d
    section Integration & GDD
    Web App Integration & GDD Specs          :done, s3_5, 2026-07-28, 1d
```

---

## 📋 Committed User Stories

| ID | User Story / Task | Owner | Estimate | Status |
|----|-------------------|-------|----------|--------|
| [US-17-01](../user-stories/archive/US-17-01-hero-selection.md) | Hero Selection & Boot Engine | GameDev | M | ✅ Done |
| [US-17-02](../user-stories/archive/US-17-02-movement-controls.md) | Top-Down Movement & Dual Controls | GameDev | M | ✅ Done |
| [US-17-03](../user-stories/archive/US-17-03-auto-weapons.md) | Auto-Attacks & Weapons Engine | GameDev | L | ✅ Done |
| [US-17-04](../user-stories/archive/US-17-04-card-upgrades.md) | Roguelike Card Upgrade Modal | GameDev | L | ✅ Done |

---

## 🛠 Sprint Specifics & Definition of Done
- [x] เกมเล่นได้อย่างสมบูรณ์ไม่ติดขัดบน PC และอุปกรณ์พกพา/สัมผัส
- [x] ผ่านการทดสอบ Next.js Production Build (`npm run build`)
- [x] จัดทำเอกสาร GDD Spec ใน `docs/gdd/games/tiny-dungeon-roguelike/spec.md`
