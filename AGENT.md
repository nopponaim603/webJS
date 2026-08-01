# 🤖 AGENT.md — Workspace Guidance & Project Specification

**Project:** GameDevJS Hub — HTML5 & Multi-Engine Games Showcase (`webJS`)  
**Repository:** [nopponaim603/webJS](https://github.com/nopponaim603/webJS)  
**Last Updated:** 2026-08-01  

---

## 📌 Project Overview

`webJS` เป็นเว็บไซต์ Game Portfolio สำหรับแสดงผลงานเกม HTML5 และ Browser-based Games ซึ่งรองรับการทำงานในรูปแบบ **Progressive Web App (PWA)** พร้อมสถาปัตยกรรม **Multi-Engine Game Launcher** ที่รองรับทั้ง **Phaser 3 (2D Engine)** และ **Babylon.js (3D WebGL Engine)** รวมถึงเกม Vanilla JS เดิม

---

## 📁 Directory Structure

```
webJS/
├── index.html                  # หน้าเว็บหลักสำหรับแสดงผลงาน (PWA Head Meta, Install Prompt, Modal Container)
├── manifest.json               # Web App Manifest สำหรับ PWA (App Icons, Theme Color, Standalone Mode)
├── sw.js                       # Service Worker สำหรับ Offline Caching & PWA
├── styles.css                  # Styling หลัก (Cyan/Turquoise Theme, Glassmorphism, Responsive Grid, PWA UI)
├── script.js                   # Portfolio Logic (PWA SW Register, Install Banner, Search, Filter, Modal Loader)
├── server.js                   # Custom Node.js HTTP Live Server (PWA MIME Types & Header Handling)
├── assets/                     # Shared static assets (Icons, PWA banners, Fonts, Audio)
│   └── icons/                  # PWA App Icons (icon-192.png, icon-512.png)
├── engines/                    # Multi-Engine Architecture Layer
│   ├── base-adapter.js         # Unified Base Game Engine Interface
│   ├── phaser-adapter.js       # Phaser 3 (2D Engine) Loader & Controller Adapter
│   └── babylon-adapter.js      # Babylon.js (3D Engine) WebGL Loader & Scene Controller Adapter
├── games/                      # Game Modules Suite
│   ├── emoji-match/            # เกมที่ 1: Emoji Match (Memory Matching Game)
│   ├── 2048-cubes/             # เกมที่ 2: 2048 Cubes (Physics & Math Puzzle)
│   ├── tile-match/             # เกมที่ 3: Tile Match (Mahjong Triple Match Puzzle)
│   ├── phaser-demo/            # เกมที่ 4: Cosmic Bouncer (Phaser 3 2D Arcade Demo)
│   └── babylon-demo/           # เกมที่ 5: Cyber Sphere 3D (Babylon.js 3D WebGL Demo)
├── docs/                       # ศูนย์รวมเอกสารการพัฒนา (Managed by game-doc-manager & task-tracker)
│   ├── index.md                # ศูนย์กลางดรรชนีเอกสารระบบ (Master Document Index)
│   ├── changelog.md            # บันทึกประวัติการอัปเดตเอกสารและเวอร์ชันระบบ
│   ├── sprint-plan.md          # สรุปแผนงานพัฒนาสปรินท์ในภาพรวม
│   ├── agile/                  # การบริหารจัดการโปรเจกต์ Agile แบบครบวงจร
│   │   ├── 01-product-backlog.md       # Product Backlog รวมทุก Epic/User Story
│   │   ├── 02-sprint-planning.md     # แผนงาน Sprint Roadmap
│   │   ├── 03-meeting-backlogs.md      # บันทึกการประชุมทีมพัฒนา
│   │   ├── 04-retrospectives-backlog.md# บันทึก Retrospective & Review Log
│   │   ├── 05-report-backlog.md       # ศูนย์รวมสรุปรายงาน QA/Testing
│   │   ├── Kanban-board.md            # บอร์ดติดตามสถานะงาน (Kanban Board)
│   │   ├── reports/                   # สรุปรายงาน Audit Feedback รายเกม (เช่น feedback-g009-ocean-frenzy.md)
│   │   ├── sprint-backlogs/           # Sprint Logs รายรอบแบบฟอร์แมตมาตรฐาน (sprint-01.md - sprint-11.md)
│   │   └── user-stories/              # User Stories แยกรายฟีเจอร์และคลังเก็บย้อนหลัง (archive/)
│   ├── gdd/                    # Game Design Documents (GDD Specs & Proposals)
│   │   ├── 00-concept.md ~ 05-*.md     # แนวคิดหลัก กลไก อาร์ต เสียง และข้อเสนอเกมใหม่
│   │   ├── games/                     # GDD Specs ของเกมที่พัฒนาสำเร็จและเปิดใช้งานแล้ว
│   │   └── planning/                  # GDD Specs และ Roadmap ของเกมที่อยู่ระหว่างวางแผน
│   ├── software/               # System Architecture, Engine Adapters, Data Schemas
│   ├── asset-list/             # แคตตาล็อกแสดงรายการ Asset รูปภาพและเสียงประกอบ
│   └── wiki/                   # คลังความรู้ พฤติกรรมที่ดีที่สุด (Best Practices) และการแก้ไขปัญหา
└── .agents/                    # Custom Agent Skills & Configurations (phaser, babylonjs, task-tracker ฯลฯ)
```

---

## 🛠 Tech Stack & Environment

- **Frontend Core**: Next.js (App Router), React, JavaScript (ES6+), PWA Standards (Service Worker, Web Manifest)
- **Game Engines & Libraries**:
  - **Phaser 3**: 2D Sprite Rendering, Arcade Physics, Scene Lifecycle
  - **Babylon.js**: Real-time 3D WebGL Rendering, PBR Materials, Lighting, Physics & Camera
- **Framework Dev Server**: Next.js (`npm run dev` / `next dev`)
- **Hosting / CI/CD**: Vercel Ready (`vercel.json`)

---

## 🎨 Design & Coding Guidelines for AI Agents

1. **PWA Standards**:
   - รักษาความสามารถในการทำงานแบบ Offline ผ่าน Service Worker (`sw.js`)
   - รองรับ Responsive Viewport บนอุปกรณ์พกพา และ UI สำหรับปุ่ม "ติดตั้งแอป" (PWA Install Button)

2. **Multi-Engine Integration**:
   - เมื่อสร้างเกม 2D ใหม่ด้วย Phaser 3 ให้เชื่อมต่อผ่าน `engines/phaser-adapter.js` หรือจัดวางใน `games/`
   - เมื่อสร้างเกม 3D ใหม่ด้วย Babylon.js ให้เชื่อมต่อผ่าน `engines/babylon-adapter.js` หรือจัดวางใน `games/`

3. **Documentation Sync (`game-doc-manager`)**:
   - อัปเดตเอกสารใน `docs/` ทุกครั้งเมื่อปรับเปลี่ยนโครงสร้างโปรเจค

4. **Version & Build Management**:
   - **Version Number**: ปรับเปลี่ยนเลข `version` ใน `public/build.json` ให้ตรงกับเวอร์ชันล่าสุดในเอกสาร `docs/changelog.md` เสมอ
   - **Build Number**: เลข `build` ใน `public/build.json` ให้ใช้เวลาอัปเดตในรูปแบบ `HHMM` (เช่น `2237`)

---

## 🚀 Execution & Verification Commands

- **Run Dev Server & Open Browser (PowerShell)**: `.\start-web.ps1` หรือ `.\run.ps1`
- **Run Dev Server (NPM)**: `npm run dev` (เปิดใช้งานที่ `http://localhost:3000`)
- **Check PWA Audit**: เปิด Chrome DevTools > Lighthouse > Select PWA Check
