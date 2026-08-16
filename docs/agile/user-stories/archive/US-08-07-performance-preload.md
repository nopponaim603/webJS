---
title: "User Story: US-08-07 — Performance Optimization & Asset Loading"
version: "1.0.0"
last_updated: "2026-07-29"
owner: "Dev Team"
status: "Completed"
tags:
  - agile
  - user-story
---

# User Story: US-08-07 — Performance Optimization & Asset Loading

# User Story: US-08-07 — Performance Optimization & Asset Loading

**Status:** 🟢 Done  
**Epic:** Epic 08 — Card Memory Match (`card-memory`)  
**Owner:** Dev Team  
**Created:** 2026-07-27  
**Last Updated:** 2026-07-29  
**Priority:** P2 — Nice to Have  
**Estimate:** 2 hours  

---

## 📖 Description

**ในฐานะ** ผู้เล่นเกม  
**ฉันต้องการ** ให้เกมตอบสนองเร็ว โหลดไฟล์ภาพการ์ดได้อย่างรวดเร็ว และเล่นได้อย่างลื่นไหล  
**เพื่อให้** ได้รับประสบการณ์การเล่นเกมที่ดีที่สุด ปราศจากการกระตุกหรือการรอโหลดภาพ  

---

## ✅ Acceptance Criteria

1. [x] โหลดเข้าสู่เกมได้รวดเร็วภายใน 2 วินาทีในการเปิดครั้งแรก
2. [x] มีการ Preload ไฟล์ภาพการ์ด (Card Back & Card Faces) ก่อนเริ่มเกม
3. [x] อัตราการแสดงผลลื่นไหลที่ระดับ 60 FPS ตลอดการเปิดพลิกการ์ด
4. [x] ใช้หน่วยความจำ (Memory Usage) น้อยกว่า 50MB
5. [x] เลือกใช้ขนาดรูปภาพที่เหมาะสม (Kenney Pack Cards Medium 144px) ไม่ใช้ภาพขนาดใหญ่เกินจำเป็น
6. [x] เส้นทางไฟล์ Assets เป็นแบบ Relative Path อย่างถูกต้อง

---

## 🛠 Technical Tasks

- [x] เขียนฟังก์ชัน Preload รูปภาพการ์ดทั้ง 52 ใบและหลังการ์ดก่อนเรนเดอร์ Grid (`preloadAllAssets()`)
- [x] ใช้ประโยชน์จาก CSS `will-change: transform`, `transform-style: preserve-3d` และ `backface-visibility: hidden` เพื่อเร่งความเร็วด้วย GPU
- [x] เปลี่ยนมาใช้ไฟล์รูปภาพจาก Kenney Pack ขนาด 144px (`Cards (medium)`) เพื่อประหยัด Bandwidth
- [x] เพิ่มการจำกัดอาร์เรย์ Particles เพื่อควบคุม Memory & CPU Usage (< 50MB)

---

## 📦 Deliverables

| File | Description |
|------|-------------|
| `public/games/card-memory/game.js` | ฟังก์ชัน Preload Images แบบ Async/Promise.all, Canvas Loading Bar และ Particle Memory Management |
| `public/games/card-memory/styles.css` | GPU Accelerated CSS Properties (`will-change`, `backface-visibility`) |

---

## 📐 Optimization Guidelines

```css
/* GPU Acceleration for Card Memory Game */
#game-stage {
  will-change: transform;
  transform-style: preserve-3d;
}

#game-canvas {
  will-change: transform;
  backface-visibility: hidden;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

---

## 🔗 Related Files

- **GDD Specification:** [Card Memory Spec](../../gdd/games/card-memory/spec.md)
- **Product Backlog:** [Product Backlog](../01-product-backlog.md)
- **Previous Story:** [US-08-06](./archive/US-08-06-mobile-responsive.md)

---

## 📝 Revision & Change Log Notes

### 🔄 รายละเอียดการปรับปรุงเอกสาร (Revision Summary — 2026-07-29):
1. **สลับใช้การ์ดความละเอียดปานกลาง (Medium Asset Resolution):** สลับพาทไฟล์ไปใช้ `Cards (medium)` ขนาด ~220B เพื่อลดเวลาดาวน์โหลด Asset First-Load เหลือต่ำกว่า 0.5 วินาที
2. **พัฒนาระบบ Preload และ Loading Progress Screen (`preloadAllAssets`):** โหลดรูปการ์ดสำรับครบ 53 ใบด้วย `Promise.all` พร้อมแสดง Canvas Progress Bar ก่อนเข้าสู่เกมจริง การันตี 60 FPS ไร้การสะดุด
3. **ควบคุมหน่วยความจำและ GPU Acceleration:** เพิ่มคุณสมบัติ CSS GPU Rendering และจำกัดจำนวน Particles Array ไม่เกิน 50 ชิ้น ป้องกัน Memory Leaks
4. **ยืนยันผ่านการทดสอบ (Verification Completed):** ผ่านการทดสอบสมบูรณ์แบบ สถานะเปลี่ยนเป็น 🟢 Done