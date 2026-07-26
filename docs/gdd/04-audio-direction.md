# HTML5 Game Portfolio — Audio Direction

**Version:** 1.0.0 | **Last Updated:** 2026-07-26

---

## 1. Sound Design Principles

- **Feedback Focus**: เสียงตอบสนอง (SFX) ต้องกระชับ นุ่มนวล และเพิ่มความฟินขณะเล่น (Juicy Audio Feedback)
- **Non-Intrusive**: มีตัวเลือกเปิด-ปิดเสียง (Mute Toggle) ในมินิเกมเสมอ
- **Web Audio API Synthetic SFX**: สนับสนุนการใช้ Web Audio API สังเคราะห์เสียงเอฟเฟกต์แบบเรียลไทม์เพื่อลดขนาดไฟล์และไม่ต้องโหลดไฟล์ `.mp3` ภายนอก

---

## 2. SFX Event Matrix

| Event | Audio Style | Target Game |
|-------|------------|-------------|
| Card Flip | Soft Snap / Click | Emoji Match |
| Match Success | Chime / Positive Arpeggio | Emoji Match / Tile Match |
| Cube Merge | Bubble Pop / Physics Thud | 2048 Cubes |
| Tile Select | Light Tap | Tile Match |
| Game Over | Low Soft Tone | All Games |

---

## Related Documents
- Mechanics: [Core Mechanics](./01-mechanics.md)
- Art Direction: [Art & UI/UX Guidelines](./03-art-direction.md)
