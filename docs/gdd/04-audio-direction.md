---
title: "HTML5 Game Portfolio — Audio Direction"
version: "1.1.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
---

# HTML5 Game Portfolio — Audio Direction

**Version:** 1.1.0 | **Last Updated:** 2026-07-28

---

## 1. Sound Design Principles

- **Feedback Focus**: เสียงตอบสนอง (SFX) ต้องกระชับ นุ่มนวล และเพิ่มความรู้สึกมีมิติขณะเล่น (Juicy Audio Feedback)
- **Non-Intrusive**: มีตัวเลือกเปิด-ปิดเสียง (Mute Toggle) ในมินิเกมและตัว Portfolio ควบคุมได้เสมอ
- **Web Audio API Synthetic SFX Engine**: สนับสนุนการใช้ Web Audio API สังเคราะห์เสียงเอฟเฟกต์แบบเรียลไทม์ (OscillatorNode, GainNode) เพื่อลดขนาดไฟล์และไม่ต้องดาวน์โหลดไฟล์ `.mp3` ภายนอก (Sprint 02 Feature)

---

## 2. SFX Event Matrix

| Event | Audio Style | Frequency / Waveform | Target Game |
|-------|------------|----------------------|-------------|
| Card Flip | Soft Snap / Click | 400Hz → 200Hz Sine | Emoji Match |
| Match Success | Chime / Positive Arpeggio | C5-E5-G5 Triangle Wave | Emoji Match / Tile Match |
| Cube Merge | Bubble Pop / Physics Thud | 150Hz Sine Pitch Drop | 2048 Cubes |
| Tile Select | Light Tap | 800Hz Short Square | Tile Match |
| High Score New Record | Fanfare / Victory Sound | Major Chords Synth | All Games (Portfolio Host) |
| Game Over | Low Soft Tone | 120Hz Sawtooth Fade Out | All Games |

---

## Related Documents
- Mechanics: [Core Mechanics](./01-mechanics.md)
- Art Direction: [Art & UI/UX Guidelines](./03-art-direction.md)
- Sprint Planning: [Sprint Planning & Roadmap](../agile/02-sprint-planning.md)
