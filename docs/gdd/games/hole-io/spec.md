# 🕳️ Hole.io 3D (Babylon.js 7.50 / 8) — Game Design Document & Dev Specs

**Code Name:** `hole-io` (G018)  
**Game ID:** `hole-io`  
**Engine:** Babylon.js 7.50 / 8 (WebGL2 / WebGPU)  
**Assets Pack:** Kenney Starter-Kit-3D-Platformer Models & Sounds (CC0 Public Domain License)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-29  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมแคชชวลอาเขต 3 มิติ (3D Casual Arcade Game) แนว **Hole.io** ที่พัฒนาด้วย **Babylon.js Engine** บนสถาปัตยกรรม WebGL2 ผู้เล่นบังคับหลุมดำ 3 มิติเคลื่อนที่ดูดกลืนสิ่งของบนสนามแข่งขัน ยิ่งดูดกลืนวัตถุมากเท่าไร หลุมดำจะขยายขนาดใหญ่ขึ้นและสามารถดูดกลืนสิ่งของที่มีขนาดใหญ่ขึ้นตามลำดับ สะสมคะแนนและแข่งขันกับเวลานับถอยหลัง 60 วินาที

### Target Audience
ผู้เล่นทุกเพศทุกวัยที่ชื่นชอบเกมแนว Hole.io, Casual Arcade, 3D Physics .io Games บน Web Browser ทั้งคอมพิวเตอร์และอุปกรณ์มือถือ

---

## 2. Asset Catalog & Visual Breakdown

### 📦 2.1 3D GLB Models (Kenney Assets Mirror)

| Visual Asset | Asset Filename | Asset Path | Usage & Description |
|:---:|---|---|---|
| 🪙 **Coin** | `coin.glb` | `/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/coin.glb` | เหรียญทอง 3D (Size 1) วัตถุขนาดเล็กสำหรับหลุมดำ Level 1 |
| 🧱 **Brick Block** | `brick.glb` | `/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/brick.glb` | บล็อกอิฐ 3D (Size 2) วัตถุขนาดปานกลางสำหรับหลุมดำ Level 2 |
| 📦 **Question Block** | `block-coin.glb` | `/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/block-coin.glb` | กล่องคำถาม 3D (Size 2) วัตถุขนาดปานกลาง |
| 🟩 **Platform Large** | `platform-large.glb` | `/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/platform-large.glb` | เกาะแพลตฟอร์มใหญ่ 3D (Size 3) วัตถุขนาดใหญ่สำหรับหลุมดำ Level 3+ |
| 🟨 **Platform Medium** | `platform-medium.glb` | `/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/platform-medium.glb` | แพลตฟอร์มขนาดกลาง 3D (Size 3) |
| ☁️ **Cloud** | `cloud.glb` | `/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/models/cloud.glb` | เมฆลอยฟ้าตกแต่งบรรยากาศ |

---

### 🔊 2.2 Audio Assets (Kenney Sound Effects)

| SFX Key | Audio File | Usage |
|---|---|---|
| `coin` | `public/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/coin.ogg` | เสียงเมื่อดูดกลืนเหรียญทอง (Size 1) |
| `break` | `public/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/break.ogg` | เสียงเมื่อดูดกลืนบล็อกอิฐและกล่องคำถาม (Size 2+) |
| `land` | `public/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/land.ogg` | เสียงเอฟเฟกต์เมื่อหลุมดำ Level Up ขยายขนาด |
| `fall` | `public/games/3d-platformer/assets/kenney-starter-kit-3d-platformer/sounds/fall.ogg` | เสียงเอฟเฟกต์ตกอเวจี |

---

## 3. Gameplay Mechanics & Systems

### 3.1 Player Controls & Movement
- **Keyboard**: [W][A][S][D] / [Arrow Keys] เคลื่อนที่หลุมดำ 360 องศา สอดคล้องกับมุมกล้อง Isometric
- **Touch Controls**: Virtual D-Pad Touch Joystick ด้านซ้ายล่าง สำหรับอุปกรณ์มือถือ
- **Camera-Relative Movement**: คำนวณเวกเตอร์การเคลื่อนที่ทแยงอิงตามทิศทางกล้อง Isometric เพื่อการบังคับที่ลื่นไหล

### 3.2 Classic 3D Isometric View
- **Yaw Angle (`alpha`)**: `-45°` (`-Math.PI / 4`) ทำมุมทแยงเข้าหามุมสนามแข่ง
- **Pitch Angle (`beta`)**: `54.74°` (`Math.atan(Math.SQRT2)`) มุมมอง True Isometric คลาสสิก
- **Camera Distance (`radius`)**: ปรับเปลี่ยนไดนามิกตามขนาดหลุม (`42 + holeRadius * 3.5`) พร้อม `fov = 0.78` เพื่อเห็นภาพรวมของสนามแข่งได้อย่างสบายตา

### 3.3 Suction & Cavity Physics Engine
1. **Distance Check**: ตรวจสอบระยะห่าง 2D บนแกน XZ ระหว่างหลุมดำกับวัตถุทุกชิ้น
2. **Selective Size Filtering**: 
   - หากวัตถุมีขนาดใหญ่กว่า Level ของหลุมดำ (`obj.size > currentLevel`) ระบบจะ **ข้ามการเช็คและการขยับตำแหน่ง 100%** วัตถุจะอยู่นิ่งบนพื้นโดยไม่เด้งหรือถูกดัน
   - หากวัตถุมีขนาดเล็กกว่าหรือเท่ากับ Level ของหลุมดำ (`obj.size <= currentLevel`) เมื่อเข้าใกล้รัศมีหลุมดำ ระบบจะดึงวัตถุเข้าสู่ศูนย์กลาง และปล่อยให้ร่วงลงไปในขุมอเวจีใต้พื้น (`position.y -= 7.5 * dt`)
3. **Swallow Completion**: เมื่อวัตถุตกลงไปลึกกว่า `Y = -1.8` วัตถุจะถูกลบออกจากฉาก + เพิ่มคะแนน + เพิ่ม XP เติบโต + เล่นเสียง SFX + แสดงละออง Particle Burst

### 3.4 Hole Evolution & Growth System

| Level | Name | Radius | Target XP | Allowed Swallowed Items |
|:---:|---|:---:|:---:|---|
| **LVL 1** | Level 1 (เล็ก) | `0.90` | 120 XP | 🪙 Coins (Size 1) |
| **LVL 2** | Level 2 (ปานกลาง) | `1.65` | 450 XP | 🧱 Bricks & 📦 Question Blocks (Size 2) |
| **LVL 3** | Level 3 (ใหญ่) | `2.70` | 1000 XP | 🟩 Platforms Large/Medium (Size 3) |
| **LVL 4** | Level MAX (มหาหลุมดำ) | `4.00` | MAX | วัตถุทุกชิ้นบนสนาม |

---

### 3.5 Arena Environment & Transparent Force Fields
- **สนามแข่งขัน (Arena)**: พื้นหญ้า 3D ขนาด 60x60 ยูนิต
- **ม่านพลังงานโปร่งแสง (Transparent Force Field Boundaries)**: กำแพงขอบสนามสูง 1.2 ยูนิต แบบกระจกโปร่งใสเรืองแสง (`alpha = 0.35`) พร้อมขอบสไลด์นีออนสีฟ้าด้านบน เพื่อไม่ให้บังวัตถุที่อยู่ขอบสนาม

---

## 4. Technical Architecture & File Structure

```
public/games/hole-io/
├── index.html       ← HTML5 3D Canvas, Glassmorphism HUD Overlay, Growth XP Bar & Mobile Touch Controls
└── game.js          ← Babylon.js Scene, SoundFXManager, Suction Physics Loop, Level Evolution, GameLoop
```

---

## 5. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
- Project Index: [docs/index.md](../../index.md)
