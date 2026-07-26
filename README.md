# 🎮 Game Portfolio — Next.js & Multi-Engine Showcase

เว็บไซต์สำหรับแสดงผลงานเกม HTML5, Phaser 2D และ Babylon.js 3D บนสถาปัตยกรรม **Next.js (App Router)** พร้อมด้วย UI/UX Modern Glassmorphism, ระบบ **Progressive Web App (PWA)** ออฟไลน์, และเตรียมพร้อมสำหรับการ Deploy บน **Vercel**

[![GitHub Repository](https://img.shields.io/badge/GitHub-nopponaim603%2FwebJS-181717?style=for-the-badge&logo=github)](https://github.com/nopponaim603/webJS)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Phaser](https://img.shields.io/badge/Phaser_3-E20074?style=for-the-badge&logo=phaser&logoColor=white)
![Babylon.js](https://img.shields.io/badge/Babylon.js-BB464B?style=for-the-badge&logo=babylon.js&logoColor=white)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

---

## ✨ Highlights & Key Features

- ⚡ **Next.js App Router Core**: พัฒนาด้วย Next.js Framework (App Router + React) รวดเร็วและเสถียร
- 🎨 **Modern Glassmorphism UI**: ธีม Cyan/Turquoise สดใส พร้อม Micro-animations ละมุนตา
- 📱 **Progressive Web App (PWA)**: มี Service Worker (`sw.js`) รองรับการเล่นออฟไลน์ และปุ่มกดติดตั้งแอป (Install Prompt) บนมือถือและเดสก์ท็อป
- 🕹️ **Multi-Engine Game Launcher**:
  - **Vanilla HTML5 Games**: Emoji Match, 2048 Cubes, Tile Match
  - **Phaser 3 (2D Engine)**: Cosmic Bouncer Demo
  - **Babylon.js (3D WebGL Engine)**: Cyber Sphere 3D Demo
- 🔍 **Interactive Search & Category Filter**: ค้นหาชื่อเกมเรียลไทม์ และกรองแยกตามประเภทเกม
- ☁️ **Vercel Deployment Ready**: ตั้งค่า `vercel.json` สำหรับการต้อนรับ PWA Headers และ Next.js Build

---

## 📁 โครงสร้างโปรเจค (Project Structure)

```
webJS/
├── src/                        # Next.js Source Code
│   ├── app/                    # Next.js App Router (page.js, layout.js, globals.css)
│   └── components/             # React Components (Header, GameCard, GameModal)
├── public/                     # Static Assets & Mini Games
│   ├── assets/                 # App Icons & Images
│   ├── games/                  # ไดเรกทอรีมินิเกมทั้งหมด
│   │   ├── 2048-cubes/         # เกม 2048 Cubes
│   │   ├── emoji-match/        # เกม Emoji Match
│   │   ├── tile-match/         # เกม Tile Match
│   │   ├── phaser-demo/        # เกม Phaser 3 2D Demo
│   │   └── babylon-demo/       # เกม Babylon.js 3D Demo
│   ├── manifest.json           # Web App Manifest (PWA)
│   └── sw.js                   # Service Worker (PWA Offline Cache)
├── docs/                       # เอกสารการพัฒนา (Managed by game-doc-manager)
│   ├── gdd/                    # Game Design Documents
│   ├── software/               # System Architecture & Diagrams
│   ├── agile/                  # Backlog, Sprint Plans, Reports
│   └── wiki/                   # Knowledge Hub & Guidelines
├── start-web.ps1               # สคริปต์ PowerShell สำหรับรันและเปิดเว็บอัตโนมัติ
├── run.ps1                     # สคริปต์ทางลัดสำหรับ start-web.ps1
├── vercel.json                 # การตั้งค่า Deployment บน Vercel
├── AGENT.md                    # คู่มือสเปคโปรเจคสำหรับ AI Agent
└── package.json                # NPM configuration & dependencies
```

---

## 🚀 วิธีการ Setup และรันโปรเจค

### ข้อกำหนดเบื้องต้น (Prerequisites)
- **Node.js**: เวอร์ชัน 18.0.0 ขึ้นไป [ดาวน์โหลด Node.js](https://nodejs.org/)

### 1. Clone โปรเจคและติดตั้ง Dependencies

```bash
git clone https://github.com/nopponaim603/webJS.git
cd webJS
npm install
```

---

### 2. การเปิดรันโปรเจค (Running the Project)

#### 🟢 วิธีที่ 1: ใช้ PowerShell Script (แนะนำบน Windows 🚀)
คลิกขวาเปิด PowerShell ในโฟลเดอร์โปรเจค แล้วพิมพ์:

```powershell
.\start-web.ps1
# หรือ
.\run.ps1
```
*สคริปต์จะสตาร์ท Next.js Dev Server และเปิดเบราว์เซอร์ไปที่ `http://localhost:3000` โดยอัตโนมัติ*

#### 🔵 วิธีที่ 2: ใช้คำสั่ง NPM Standard
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## ☁️ การ Deploy บน Vercel

โปรเจคนี้ได้รับการตั้งค่า `vercel.json` สำหรับ **Vercel** เรียบร้อยแล้ว สามารถนำเข้าโปรเจคบน [Vercel Dashboard](https://vercel.com/new) ได้ทันที โดย Vercel จะตรวจจับ Next.js Framework และตั้งค่าการ Build ให้โดยอัตโนมัติ

---

## 📚 เอกสารประกอบโปรเจค (Documentation)

- [AGENT.md](./AGENT.md) — คู่มือสเปคโปรเจคและข้อกำหนดสำหรับ AI Agent
- [docs/index.md](./docs/index.md) — ศูนย์กลางภาพรวมระบบเอกสาร (Project Index)
- [docs/wiki/wiki.md](./docs/wiki/wiki.md) — Central Knowledge Hub & Guidelines

---
*Developed with Next.js, Phaser 3, Babylon.js & Antigravity AI Assistant.*
