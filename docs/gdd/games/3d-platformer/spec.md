# 🏃‍♂️ Kenney 3D Platformer (Babylon.js 8) — Game Design Document & Dev Specs

**Game ID:** `3d-platformer`  
**Engine:** Babylon.js 8 (WebGL2 / WebGPU)  
**Assets Pack:** Kenney Starter-Kit-3D-Platformer (CC0 Public Domain License)  
**Version:** 1.0.0 | **Last Updated:** 2026-07-26  
**Status:** Released / Active  

---

## 1. Game Overview

### Elevator Pitch
เกมแอ็กชันผจญภัย 3 มิติ (3D Platformer Game) สไตล์คลาสสิก สร้างด้วย **Babylon.js 8 Engine** บนสถาปัตยกรรม 3D WebGL ผู้เล่นบังคับตัวละคร 3D ผจญภัยฝ่าฟันอุปสรรค กระโดดข้ามแพลตฟอร์มลอยฟ้า โหม่งบล็อกคำถาม สะสมเหรียญทอง และวิ่งไปให้ถึงธงชัยชนะเพื่อผ่านไปยังด่านถัดไป

### Target Audience
ผู้เล่นทุกเพศทุกวัยที่ชื่นชอบเกมแนว 3D Platformer, Mario 3D, Casual 3D Action Games บน Web Browser

---

## 2. Asset Catalog & Visual Breakdown

### 📦 2.1 3D GLB Models (Kenney Assets)

| Visual Asset | Asset Filename | Asset Path | Usage & Description |
|:---:|---|---|---|
| 🤖 **Character** | `character.glb` | `/assets/kenney-starter-kit-3d-platformer/models/character.glb` | โมเดลตัวละครหลัก 3D พร้อมโครงกระดูกและแอนิเมชัน (`Idle`, `Walk`, `Jump`, `Fall`) |
| 🪙 **Coin** | `coin.glb` | `/assets/kenney-starter-kit-3d-platformer/models/coin.glb` | เหรียญทอง 3D หมุน 360 องศา สะสมคะแนน |
| 📦 **Question Block** | `block-coin.glb` | `/assets/kenney-starter-kit-3d-platformer/models/block-coin.glb` | บล็อกคำถาม โหม่งจากด้านล่างเพื่อเสกเหรียญ |
| 🧱 **Brick Block** | `brick.glb` | `/assets/kenney-starter-kit-3d-platformer/models/brick.glb` | บล็อกอิฐทำลายได้เมื่อโหม่งจากด้านล่าง |
| 🟩 **Platform Large** | `platform-large.glb` | `/assets/kenney-starter-kit-3d-platformer/models/platform-large.glb` | ฐานเกาะใหญ่สำหรับพื้นที่เริ่มต้นและเป้าหมาย |
| 🟨 **Platform Medium** | `platform-medium.glb` | `/assets/kenney-starter-kit-3d-platformer/models/platform-medium.glb` | แพลตฟอร์มขนาดกลางและแพลตฟอร์มเคลื่อนที่ |
| 🟥 **Platform Falling** | `platform-falling.glb` | `/assets/kenney-starter-kit-3d-platformer/models/platform-falling.glb` | แพลตฟอร์มที่จะสั่นและร่วงเมื่อผู้เล่นเหยียบ |
| 🏁 **Finish Flag** | `flag.glb` | `/assets/kenney-starter-kit-3d-platformer/models/flag.glb` | ธงชัยชนะสิ้นสุดด่าน |
| ☁️ **Cloud & Deco** | `cloud.glb`, `grass.glb` | `/assets/kenney-starter-kit-3d-platformer/models/` | เมฆลอยฟ้าและหญ้าตกแต่งบรรยากาศ |

---

### 🔊 2.2 Audio Assets (Kenney Sound Effects)

| SFX Key | Audio File | Usage |
|---|---|---|
| `jump` | `public/assets/kenney-starter-kit-3d-platformer/sounds/jump.ogg` | เสียงขณะกระโดดขึ้นกลางอากาศ |
| `coin` | `public/assets/kenney-starter-kit-3d-platformer/sounds/coin.ogg` | เสียงเมื่อเก็บเหรียญทองหรือโหม่งบล็อกคำถาม |
| `land` | `public/assets/kenney-starter-kit-3d-platformer/sounds/land.ogg` | เสียงเมื่อตัวละครตกลงมากระทบพื้น |
| `break` | `public/assets/kenney-starter-kit-3d-platformer/sounds/break.ogg` | เสียงบล็อกอิฐระเบิดทำลาย |
| `fall` | `public/assets/kenney-starter-kit-3d-platformer/sounds/fall.ogg` | เสียงเมื่อตัวละครตกออกจากฉาก |

---

## 3. Gameplay Mechanics & Systems

### Core Gameplay Loop
1. **Movement & Camera Control**:
   - **Keyboard**: [W][A][S][D] / [Arrow Keys] เคลื่อนที่ 360 องศาอิงตามทิศทางกล้อง, [Space] กระโดด (รองรับ Double Jump กระโดด 2 ครั้งกลางอากาศ)
   - **Double Jump (Air Jump)**: สามารถกดกระโดดซ้ำกลางอากาศได้ 1 ครั้งเพื่อส่งตัวละครลอยสูงขึ้น พร้อมเอฟเฟกต์ละอองดาววงแหวน (Cyan/Magenta Air Ring Particles)
   - **Touch Controls**: ปุ่ม D-Pad Touch Joystick ด้านซ้าย + ปุ่มกระโดดด้านขวาสำหรับหน้าจอมือถือ
   - **Orbit Camera**: ลากเมาส์หมุนมุมมองกล้องได้อย่างอิสระ
2. **Multi-Ray Ground Check & Gravity**:
   - ตรวจจับพื้นด้วย Raycast 5 จุด (ตรงกลาง + 4 ขอบ) ความยาว `1.2` ยูนิต
   - เมื่อสัมผัสพื้น ระบบจะล็อค `position.y` ให้อยู่บนพื้นพอดี และตั้งค่า `velocityY = 0` (ไม่คำนวณ Gravity ขณะยืนบนพื้น)
   - ขณะอยู่กลางอากาศ คำนวณ `velocityY += gravity * dt` เพื่อจำลองแรงโน้มถ่วงอย่างสมจริง
3. **Interactive Level Mechanics**:
   - **Collectible Coins**: หมุน 360 องศา เมื่อผู้เล่นวิ่งชนจะเก็บเหรียญ +100 คะแนน + เอฟเฟกต์ละอองดาว Sparkles
   - **Question Blocks**: โหม่งจากด้านล่าง บล็อกเด้งขึ้น เด้งเหรียญออกมา +500 คะแนน
   - **Brick Blocks**: โหม่งจากด้านล่าง บล็อกระเบิดทำลาย +200 คะแนน + เสียง `break.ogg`
   - **Moving Platforms**: เลื่อนสลับทิศทางแบบ Sine wave พร้อมพาตัวละครเลื่อนไปด้วยเมื่อยืนบนพื้น
   - **Falling Platforms**: เมื่อผู้เล่นเหยียบ จะสั่น 0.4s แล้วร่วงลงด้านล่าง ก่อนจะ respawn กลับมาใหม่ใน 3 วินาที
4. **Win / Game Over Conditions**:
   - **Victory**: เดินทางไปถึงธงชัยชนะ (`flag.glb`) แสดงหน้าต่าง Victory Modal พร้อมคะแนนและเวลา
   - **Game Over**: ตกออกจากแมพ (`y < -12`) หักชีวิต 1 หัวใจ หากหมด 3 หัวใจจะแสดง Game Over Modal

---

## 4. Technical Architecture & File Structure

```
public/games/3d-platformer/
├── index.html       ← HTML5 3D Canvas, Glassmorphism HUD Overlay & Mobile Touch Controls
└── game.js          ← Babylon.js 8 Scene, SoundFXManager, PlayerController, LevelBuilder, GameLoop
```

- **Babylon.js 8 Engine Core**: ใช้ `ArcRotateCamera`, `HemisphericLight`, `DirectionalLight` พร้อม `ShadowGenerator` เงาสมจริง
- **Asset Pipeline**: โหลดโมเดลด้วย `BABYLON.SceneLoader.LoadAssetContainerAsync` นำมาสร้าง Instance ของวัตถุในด่านอย่างรวดเร็ว

---

## 5. Related Links
- GDD Concept: [docs/gdd/00-concept.md](../../00-concept.md)
- GDD Mechanics: [docs/gdd/01-mechanics.md](../../01-mechanics.md)
- Project Index: [docs/index.md](../../index.md)
