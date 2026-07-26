# 🤖 AGENT.md — Workspace Guidance & Project Specification

**Project:** Game Portfolio — HTML5 & Multi-Engine Games Showcase (`webJS`)  
**Repository:** [nopponaim603/webJS](https://github.com/nopponaim603/webJS)  
**Last Updated:** 2026-07-26  

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
├── docs/                       # เอกสารการพัฒนา (Managed by game-doc-manager)
│   ├── index.md                # ศูนย์กลางเอกสาร (Document Inventory)
│   ├── changelog.md            # บันทึกการเปลี่ยนแปลงเอกสาร
│   ├── gdd/                    # Game Design Documents (Concept, Mechanics, Art, Audio)
│   ├── software/               # System Architecture, Class Diagrams, Data Schemas
│   ├── agile/                  # Backlog, Sprint Planning, User Stories, Reports
│   └── wiki/                   # Knowledge Hub & Development Guidelines
└── .agents/                    # Custom Agent Skills & Configurations
```

---

## 🛠 Tech Stack & Environment

- **Frontend Core**: Vanilla HTML5, CSS3, JavaScript (ES6+), PWA Standards (Service Worker, Web Manifest)
- **Game Engines & Libraries**:
  - **Phaser 3**: 2D Sprite Rendering, Arcade Physics, Scene Lifecycle
  - **Babylon.js**: Real-time 3D WebGL Rendering, PBR Materials, Lighting, Physics & Camera
- **Server**: Node.js HTTP Server (`server.js`) - Zero External Dependencies
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

---

## 🚀 Execution & Verification Commands

- **Run Dev Server**: `npm run dev` หรือ `node server.js` (Server จะเปิดที่ `http://localhost:5500` หรือ Port ที่ว่างอยู่)
- **Check PWA Audit**: เปิด Chrome DevTools > Lighthouse > Select PWA Check
