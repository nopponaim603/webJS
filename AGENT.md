# 🤖 AGENTS.md — Workspace Guidance & Project Specification

**Project:** Game Portfolio — HTML5 Games Showcase (`webJS`)  
**Repository:** [nopponaim603/webJS](https://github.com/nopponaim603/webJS)  
**Last Updated:** 2026-07-26  

---

## 📌 Project Overview

`webJS` เป็นเว็บไซต์ Game Portfolio สำหรับแสดงผลงานเกม HTML5 และ Browser-based Games ซึ่งมีระบบ Showcase หน้าหลักแบบ Modern Responsive UI พร้อมมินิเกมสำเร็จรูปและเกมสำหรับเปิดเล่นในรูปแบบ Iframe/Modal

---

## 📁 Directory Structure

```
webJS/
├── index.html                  # หน้าเว็บหลักสำหรับแสดงผลงาน (Showcase Portfolio)
├── styles.css                  # Styling หลัก (Cyan/Turquoise Theme, Glassmorphism, Responsive Grid)
├── script.js                   # Logic หลักของหน้า Portfolio (Filtering, Search, Modal Loader, Shortcuts)
├── server.js                   # Custom Node.js HTTP Live Server (Zero Dependency)
├── package.json                # NPM configuration & scripts (`npm start`, `npm run dev`)
├── netlify.toml                # Netlify deployment configuration
├── README.md                   # เอกสารประกอบโปรเจค
├── GIT_GUIDE.md                # คู่มือการใช้งาน Git
├── 2048-cubes/                 # เกมที่ 1: 2048 Cubes (Physics & Math Puzzle)
│   ├── index.html
│   ├── style.css
│   └── game.js
├── emoji-match/                # เกมที่ 2: Emoji Match (Memory Matching Game)
│   ├── index.html
│   ├── styles.css
│   └── game.js
├── tile-match/                 # เกมที่ 3: Tile Match (Mahjong Triple Match Puzzle)
│   ├── index.html
│   ├── styles.css
│   └── game.js
├── docs/                       # เอกสารการพัฒนา (Managed by game-doc-manager)
│   ├── index.md                # ศูนย์กลางเอกสาร (Document Inventory)
│   ├── changelog.md            # บันทึกการเปลี่ยนแปลงเอกสาร
│   ├── gdd/                    # Game Design Documents (Concept, Mechanics, Art, Audio)
│   ├── software/               # System Architecture, Class Diagrams, Data Schemas
│   ├── agile/                  # Backlog, Sprint Planning, User Stories, Reports
│   └── wiki/                   # Knowledge Hub & Development Guidelines
└── .agents/                    # Custom Agent Skills & Configurations
    └── skills/                 # Agent Skills (game-doc-manager, phaser, etc.)
```

---

## 🛠 Tech Stack & Environment

- **Frontend Core**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Server**: Node.js HTTP Server (`server.js`) - Native standard libraries (`http`, `fs`, `path`, `url`)
- **Hosting / CI/CD**: Netlify Ready (`netlify.toml`)
- **Game Engines / Libraries**: HTML5 Canvas / Vanilla JS / WebGL (Three.js for 3D physics if expanded)

---

## 🎨 Design & Coding Guidelines for AI Agents

1. **Design Aesthetics**:
   - ใช้สไตล์ Modern Dark/Glassmorphism ในหน้าหลัก
   - ธีมสีหลัก: Cyan / Turquoise (`#00F2FE`, `#4FACFE`) ผสม Gradient
   - Typography: Google Fonts (Inter, Prompt, Kanit)
   - Micro-animations: Dynamic Hover effects, Smooth Scale transition

2. **Code Principles**:
   - ห้ามใช้ Libraries ภายนอกที่ไม่จำเป็นในตัว Web Portfolio หลัก
   - รักษาความกระชับ อ่านง่าย และมี Comments กำกับส่วนสำคัญ
   - รองรับ Responsive Design ทุกขนาดหน้าจอ (Mobile, Tablet, Desktop)

3. **Documentation Sync (`game-doc-manager`)**:
   - เมื่อมีการเพิ่มฟีเจอร์ ปรับแก้ Mechanics หรือเปลี่ยนโครงสร้างโค้ด ให้ทำการปรับปรุงเอกสารในไดเรกทอรี `docs/` ทุกครั้ง
   - อัปเดต `docs/changelog.md` และ `docs/index.md` เสมอเมื่อมีการเปลี่ยนแปลงเอกสาร

---

## 🚀 Execution & Verification Commands

- **Run Dev Server**: `npm run dev` หรือ `node server.js` (Server จะเปิดที่ `http://localhost:5500` หรือ Port ที่ว่างอยู่)
- **Check Docs Consistency**: ตรวจสอบ Relative Links ภายในไดเรกทอรี `docs/`
