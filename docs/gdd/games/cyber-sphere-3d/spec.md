# 🔮 Cyber Sphere 3D — Game Design Document & Dev Specs

**Code Name:** `cyber-sphere` (G005)
**Game ID:** `cyber-sphere-3d` (`babylon-demo`)  
**Engine / Tech:** Babylon.js 3D Engine, WebGL, Modern Shader System  
**Version:** 1.0.0 | **Last Updated:** 2026-07-26  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
โชว์เคสความสามารถด้าน 3D Graphics ด้วย Babylon.js นำเสนอวัตถุทรงกลมสไตล์ไซเบอร์พังก์ (Cybernetic Orb) พร้อมระบบแสง Glow Layer Dynamic Lighting และกล้องหมุนอิสระ 360 องศา

---

## 2. Technical Specs & Features

- **Engine:** Babylon.js (CDN loaded)
- **Camera:** ArcRotateCamera (หมุนกล้องรอบวัตถุด้วยการลากเมาส์ / สัมผัสหน้าจอ)
- **Lighting & Materials:** PBR (Physically Based Rendering) Material พร้อม Glow Layer Post-processing Effect
- **Interaction:** ปรับเปลี่ยนความเร็วการหมุนและเอฟเฟกต์แสงตามการโต้ตอบของผู้เล่น

---

## 3. File Structure & Assets

- **Game Files:** `public/games/babylon-demo/`
  - `index.html` — WebGL Canvas container & Babylon.js Renderer Script

---

## 4. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
