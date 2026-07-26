# 🧩 Emoji Match — Game Design Document & Dev Specs

**Code Name:** `emoji-match` (G001)
**Game ID:** `emoji-match`  
**Engine / Tech:** HTML5, CSS3, Vanilla JavaScript  
**Version:** 1.0.0 | **Last Updated:** 2026-07-26  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมจับคู่การ์ดอีโมจิ (Memory Card Game) ทดสอบความจำและความไว โดยเปิดการ์ดทีละ 2 ใบ หากได้รูปภาพที่เหมือนกัน การ์ดจะถูกล็อคเปิดไว้ ผู้เล่นต้องจับคู่ให้ครบทั้งหมดในเวลาที่สั้นที่สุดและจำนวนครั้งน้อยที่สุด

---

## 2. Gameplay Mechanics

### Core Loop
1. **Grid Generation**: สุ่มจับคู่การ์ด Emoji ตามขนาดตาราง (4x4 Grid - 16 การ์ด / 8 คู่)
2. **Flip Card**: ผู้เล่นคลิกเลือกเปิดการ์ดทีละใบ (พลิกการ์ดด้วย CSS 3D Transform Animation)
3. **Match Logic**: 
   - เปิดใบที่ 2 -> เปรียบเทียบกับใบแรก
   - **เปิดตรงกัน:** ล็อคการ์ดทั้งสองใบให้ค้างไว้ เพิ่มคะแนนสะสม
   - **เปิดไม่ตรงกัน:** รอ 800ms แล้วพลิกการ์ดกลับอัตโนมัติ
4. **Victory**: เมื่อจับคู่ครบทั้ง 8 คู่ แสดง Modal สรุปเวลาและจำนวนครั้งที่ใช้ในการเล่น

---

## 3. File Structure & Assets

- **Game Files:** `public/games/emoji-match/`
  - `index.html` — Layout & Modal UI
  - `styles.css` — CSS Grid, Card Flip 3D Animations & Modern Styling
  - `game.js` — Game State, Timer, Shuffle Algorithm (Fisher-Yates)

---

## 4. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
