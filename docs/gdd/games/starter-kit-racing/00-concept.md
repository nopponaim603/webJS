---
title: "🏎️ Starter Kit Racing 3D — Concept & Vision"
project: "Starter Kit Racing 3D (webJS)"
version: "1.0.0"
last_updated: "2026-08-25"
owner: "Game Design Team"
status: "Active"
tags:
  - gdd
  - concept
  - starter-kit-racing
---

# 🏎️ Starter Kit Racing 3D — Concept & Vision

---

## 1. Introduction & Vision

### Elevator Pitch
**Starter Kit Racing 3D** เป็นผลงานการพัฒนาและพอร์ตระบบเกมแข่งรถ 3 มิติโดย **mrdoob** (ผู้สร้าง Three.js) ที่นำต้นแบบเกม Godot 4.6 จาก Kenney สู่ขุมพลัง **Three.js WebGL/WebGPU** และ **Crashcat Physics** ตัวเกมนำเสนอบรรยากาศการซิ่งรถสไตล์เรโทรอาเขต ควบคุมง่าย ดริฟต์มันสะใจ และให้ความรู้สึกของการขับขี่จริงผ่านเสียงเครื่องยนต์ที่สังเคราะห์สดตามรอบ RPM พร้อมเครื่องมือสร้างสนามแข่ง (Visual Track Editor) ให้ผู้เล่นออกแบบและแชร์สนามแข่งได้ด้วย URL ทันที

### Unique Selling Points (USP)
1. **Engineered by Three.js Creator:** โค้ดถูกเขียนขึ้นด้วยมาตรฐานระดับสูงจาก mrdoob แสดงศักยภาพของ Three.js สมัยใหม่
2. **AudioWorklet Procedural Engine Synth:** เสียงเครื่องยนต์สังเคราะห์สด 100% ผ่าน AudioWorklet คำนวณรอบสูบและท่อไอเสียแบบ 4-stroke Real-time DSP
3. **Crashcat Fast Rigid Body Physics:** ระบบฟิสิกส์การชนและแรงเสียดทานที่แม่นยำ ลื่นไหล ไม่กินสเปกเครื่อง
4. **Instant In-Browser Track Editor:** สลับโหมดไประบบสร้างสนามแข่ง 3 มิติ วางรางถนนได้ตามใจชอบ พร้อมปุ่มกดทดสอบขับได้ทันที
5. **Full Platform Support:** รองรับทั้ง Keyboard, Gamepad (Controller), และ Touch Controls สำหรับสมาร์ตโฟน

---

## 2. Target Audience & Platform

- **กลุ่มเป้าหมาย:** ผู้เล่นเกม Arcade Racing (Mario Kart, TrackMania, Micro Machines), นักพัฒนา WebGL/WebGPU 3D และชุมชน Three.js
- **แพลตฟอร์ม:** Web Browser (Desktop, Tablet, Mobile)
- **โหมดการเล่น:** Time Trial, Lap Speedrun, Track Creation & Sandbox Driving

---

## 3. High-Level Core Gameplay Loop

```mermaid
flowchart TD
    Start([เลือกสนามแข่ง หรือสร้างเองใน Editor]) --> Spawn[เริ่มที่ซุ้มประตูปล่อยตัว Starting Gate]
    Spawn --> Drive[เร่งความเร็ว / หักเลี้ยว / ดริฟต์เข้าโค้ง]
    Drive --> Sound[AudioWorklet เร่งเสียงเครื่องยนต์ตามความเร็ว]
    Drive --> DriftCheck{เกิดอาการล้อไถล (Skid)?}
    DriftCheck -- ใช่ --> FX[ปล่อยควันยางไหม้ Smoke + วาดรอยยาง Drift Marks]
    DriftCheck -- ไม่ --> CheckGate
    FX --> CheckGate{ขับผ่าน Checkpoint / Finish Gate?}
    CheckGate -- ผ่านรอบ --> LapUpdate[บันทึกเวลา Lap Time + เช็คสถิติ Best Lap]
    CheckGate -- ยังไม่ครบรอบ --> WallCheck{ชนกำแพงขอบทาง?}
    WallCheck -- ชน --> CrashSound[Crashcat เด้งสะท้อน + เล่นเสียง Impact Synth]
    WallCheck -- ไม่ชน --> Drive
    CrashSound --> Drive
    LapUpdate --> Drive
```

---

## 🔗 Related Documents
- [Core Mechanics & Vehicle Physics](./01-mechanics.md)
- [Track Editor & Layout System](./02-track-editor.md)
- [Audio Synth & Visual FX](./03-audio-physics.md)
- [Dev Specs & Overview](./spec.md)
