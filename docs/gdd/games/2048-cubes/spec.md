---
title: "🎲 2048 Cubes — Game Design Document & Dev Specs"
version: "1.0.0"
last_updated: "2026-07-26"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - 2048-cubes
---

# 🎲 2048 Cubes — Game Design Document & Dev Specs

**Code Name:** `2048-cubes` (G002)
**Game ID:** `2048-cubes`  
**Engine / Tech:** HTML5 Canvas, Physics Engine, Vanilla JavaScript  
**Version:** 1.0.0 | **Last Updated:** 2026-07-26  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมยิงลูกบาศก์ตัวเลขผสมผสานกติกาของเกม 2048 เข้ากับระบบฟิสิกส์ 2.5D ผู้เล่นทำการเล็งและยิงลูกบาศก์ลงไปในสนาม เมื่อลูกบาศก์ที่มีตัวเลขเดียวกันชนกัน จะรวมร่างเป็นลูกบาศก์ใหม่ที่มีค่าเพิ่มเป็น 2 เท่า (2 → 4 → 8 → 16 ... → 2048)

---

## 2. Gameplay Mechanics

### Core Loop
1. **Aim & Launch**: ลากนิ้วหรือเมาส์เล็งเส้นทิศทาง แล้วปล่อยเพื่อยิงลูกบาศก์ตัวเลขลงไปในสนาม
2. **Physics & Bounce**: ลูกบาศก์จะสะท้อนขอบสนามและชนกระแทกกับลูกบาศก์อื่นตามกฎฟิสิกส์
3. **Merge Logic**: หากลูกบาศก์ 2 ลูกที่มีค่าเท่ากันชนกัน จะรวมร่าง (Merge) เกิดเอฟเฟกต์ระเบิดเบาๆ และเปลี่ยนเป็นลูกบาศก์ค่าถัดไป
4. **Game Over Check**: หากลูกบาศก์สะสมกองสูงจนเกินเส้นอันตราย (Deadline) ด้านบน จะถือว่า Game Over

---

## 3. File Structure & Assets

- **Game Files:** `public/games/2048-cubes/`
  - `index.html` — Main HTML Canvas container
  - `style.css` — Modern Dark Theme Stylesheet
  - `game.js` — Physics Engine & 2048 Merge Logic

---

## 4. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
