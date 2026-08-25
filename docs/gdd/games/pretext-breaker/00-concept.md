---
title: "🧱 Pretext Breaker — Concept & Vision"
project: "Pretext Breaker (webJS)"
version: "1.0.0"
last_updated: "2026-08-25"
owner: "Game Design Team"
status: "Active"
tags:
  - gdd
  - concept
  - pretext-breaker
  - arkanoid
---

# 🧱 Pretext Breaker — Concept & Vision

---

## 1. Introduction & Vision

### Elevator Pitch
**Pretext Breaker** เป็นเกมแนว **Block Breaker / Arkanoid** สไตล์ Typography Modern Retro ที่สร้างมิติใหม่ให้กับเกมทำลายบล็อกคลาสสิก โดยแปลงประโยคและตัวอักษรแบบโมโนสเปซ (Monospace Glyphs) ให้กลายเป็นบล็อกในสนามแข่งขัน ผู้เล่นจะควบคุมแป้นพาย (Paddle) เพื่อตีลูกบอลสะท้อนไปกะเทาะทำลายตัวอักษรทีละตัว ปลดปล่อยพลัง Power-ups หลากหลายรูปแบบ พร้อมเอฟเฟกต์เสียงสังเคราะห์ 8-bit Procedural Web Audio Synthesizer ที่ปรับเปลี่ยนโทนเสียงตามระดับแถวของตัวอักษรอย่างไพเราะ

### Unique Selling Points (USP)
1. **Typography-as-Gameplay:** ไม่ใช่บล็อกสี่เหลี่ยมธรรมดา แต่เป็นตัวอักษรและประโยคที่มีความหมาย (Code snippets, Poetry, Quotes, Tech logs)
2. **Procedural Web Audio Synth:** ไร้ไฟล์เสียงภายนอก (.mp3/.wav) ทำงานด้วย `AudioContext` สังเคราะห์เสียง Melodic Hits แบบเรียลไทม์ตามระดับตัวโน้ต
3. **Organic Dynamic Physics:** คำนวณมุมสะท้อนตามจุดกระทบของแป้นพาย (Paddle Edge Spin & Velocity)
4. **Juicy Power-ups Suite:** ระบบไอเทมเสริมพลังสุดเร้าใจ เช่น Multi-Ball แตกตัว 3 ลูก, Laser Cannon ยิงเลเซอร์ทำลายข้อความ, และ Paddle Expansion
5. **Modern Minimalist Glassmorphism UI:** กรอบกระจกมน อัตราส่วน 4:3 พร้อมพื้นหลัง Dark Space และแสงสะท้อน Neon Glow

---

## 2. Target Audience & Platform

- **กลุ่มเป้าหมาย:** แฟนเกม Arcade Retro ยุค 80-90s, ผู้ที่ชื่นชอบเกม Arkanoid / Breakout, สาย Minimalist & Typography, นักพัฒนาเว็บและโปรแกรมเมอร์
- **แพลตฟอร์ม:** Web Browser (Desktop, Tablet, Mobile) รองรับ Mouse, Touch, และ Keyboard
- **โหมดการเล่น:** Single Player Arcade Progression & High Score Challenge

---

## 3. High-Level Core Gameplay Loop

```mermaid
flowchart TD
    Start([เริ่มเกม / เลือกระดับข้อความ]) --> Spawn[ปล่อยลูกบอลออกจาก Paddle]
    Spawn --> Bounce[ลูกบอลสะท้อนผนังและ Paddle]
    Bounce --> HitText{ชนตัวอักษร Text Glyph?}
    HitText -- ชนโดน --> Break[ทำลายตัวอักษร + ได้รับแต้ม + เล่น Synth Tone]
    Break --> DropCheck{ดรอป Power-up Capsule?}
    DropCheck -- มีไอเทม --> Catch[รับไอเทมด้วย Paddle เพื่อเปิดใช้พลังพิเศษ]
    DropCheck -- ไม่มี --> CheckClear
    Catch --> CheckClear{ทำลายข้อความหมดด่าน?}
    CheckClear -- หมดด่าน --> NextLevel([ผ่านด่าน → โหลดบทความถัดไป])
    CheckClear -- ยังไม่หมด --> Bounce
    HitText -- ลูกบอลหลุดลงด้านล่าง --> LifeCheck{พลังชีวิตเหลืออยู่?}
    LifeCheck -- เหลือ --> Respawn[เสีย 1 ชีวิต → ปล่อยลูกใหม่]
    Respawn --> Bounce
    LifeCheck -- หมด --> GameOver([Game Over → สรุปคะแนนรวม])
```

---

## 4. Technical Architecture Overview

- **Rendering Engine:** HTML5 Canvas 2D Context พร้อมคำนวณ Text Metrics และ Sub-pixel Rendering
- **Typography Layout:** Custom Pretext Monospace Text-to-Brick Engine + Google Font `IBM Plex Mono`
- **Audio System:** Web Audio API (`OscillatorNode`, `GainNode`) สร้างเสียง Sine, Triangle, Square, Sawtooth
- **Input System:** Unified Pointer Events (Pointer Move / Touch Drag / Keyboard Arrow & AD keys)

---

## 🔗 Related Documents
- [Core Mechanics](./01-mechanics.md)
- [Level Design & Typography Patterns](./02-level-design.md)
- [Art & Audio Direction](./03-art-direction.md)
- [Dev Specs & Overview](./spec.md)
