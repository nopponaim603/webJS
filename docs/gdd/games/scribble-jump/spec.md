---
title: "✏️ Scribble Jump — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - scribble-jump
  - vertical-jumper
  - doodle-jump-style
  - mobile-friendly
---

# ✏️ Scribble Jump — Game Design Document & Dev Specs

**Code Name:** `scribble-jump`  
**Game ID:** `G046`  
**Creator:** [Zero](https://www.aigameshare.com/profile/zero)  
**Version:** `1.0.0` (Production Standalone Build)  
**Age Rating:** 13+  
**Target Playtime:** 1 - 3 Minute High Score Chaser  
**Supported Platforms:** Mobile & Desktop (Touch Left/Right Half, Arrow Keys, WASD, Device Tilt / Mouse)  
**Engine & Tech Stack:** HTML5 Canvas 2D Vector Engine, Hand-Drawn Scribble Doodle Art Style, Procedural High-Altitude Difficulty Scaling  
**Original Live Source:** [AIGameShare Scribble Jump](https://www.aigameshare.com/games/scribble-jump)  
**Tagline:** *"Immediate-play vertical jumper on hand-drawn scribble notebook paper. Bounce on bouncy springs, stomp tricky monsters, grab blue shields, and climb to the stratosphere."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Scribble Jump** เป็นเกมแนว Vertical Endless Jumper สไตล์ลายเส้นสมุดวาดเขียน (Hand-Drawn Notebook Doodle) ที่ได้รับแรงบันดาลใจจากเกมคลาสสิกอย่าง Doodle Jump

ผู้เล่นควบคุมตัวละครจิ๋วเด้งดึ๋งกระโดดขึ้นไปบนแท่นกระโดดหลากชนิดอย่างต่อเนื่อง หลบหลีกหรือเหยียบมอนสเตอร์เพื่อกำจัด เก็บเหรียญทองเพื่อทำคะแนน และใช้ไอเทมช่วยเหลือ เช่น เกราะบลูชิลด์ (Shield) และสปริงกระโดดสูง เพื่อทำสถิติความสูงสูงสุด

### 1.2 Core Pillars
1. **Fluid Vertical Bouncing Physics:**
   - ระบบกระโดดอัตโนมัติเมื่อตัวละครสัมผัสแท่นกระโดด
   - แท่นกระโดดหลากหลายประเภท: แท่นนิ่งสีเขียว, แท่นเลื่อนซ้ายขวาสีฟ้า, แท่นไม้เปราะแตกหักสีน้ำตาล, และแท่นสปริงเด้งสูง
2. **Enemy Encounters & Combat:**
   - มอนสเตอร์ลายเส้นขวางทาง สามารถกระโดดเหยียบหัว (Stomp) เพื่อกำจัดและได้รับคะแนนพิเศษ
   - เกราะป้องกันสีฟ้า (Blue Shield) สามารถรับความเสียหายแทนได้ 1 ครั้ง
3. **Screen Wrapping & Tight Steering:**
   - รองรับระบบทะลุขอบจอซ้าย-ขวา (Screen Wrap) ช่วยให้วางแผนเส้นทางขึ้นได้อย่างยืดหยุ่น
4. **Instant Restart & Bilingual Settings:**
   - เมนูปรับภาษาได้ทันที (English / 中文)
   - หน้าสรุปสถิติคะแนน ความสูง และ Fact ขำๆ ประจำรอบการเล่น

---

## 2. Controls & Interaction Guide

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Move Left** | กด `A` หรือปุ่มลูกศรซ้าย `←` | แตะนิ้วค้างฝั่งซ้ายของหน้าจอ |
| **Move Right** | กด `D` หรือปุ่มลูกศรขวา `→` | แตะนิ้วค้างฝั่งขวาของหน้าจอ |
| **Pause / Settings** | คลิกปุ่ม **Settings** บนมุมจอ | แตะปุ่ม **Settings** |
| **Restart** | กด `Spacebar` หรือคลิกปุ่ม **Again** | แตะปุ่ม **Again** |

---

## 3. Technical Specs & Catalog Integration

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G046` |
| **Directory** | `public/games/scribble-jump/` |
| **Main URL** | `/games/scribble-jump/index.html` |
| **Engine / Framework** | HTML5 Canvas 2D / LocalStorage Persistence |
| **Category** | `เกมแคชชวล / พัซเซิล` / `Phaser 2D Engine` |
| **Standalone Ready** | 100% Offline Compatible (No CDN / External SDK dependency) |
