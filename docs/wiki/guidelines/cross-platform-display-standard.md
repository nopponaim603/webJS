# 📱💻 มาตรฐานการพัฒนาเกม: การรองรับ PC และ Mobile แนวตั้ง (Cross-Platform Responsive & Portrait Standard)

**Version:** 1.0.0 | **Last Updated:** 2026-07-28 | **Owner:** Web Game Architecture & UX Team  
**Status:** Approved Standard | **Scope:** HTML5 / Phaser 3 / Canvas 2D / Babylon.js Web Games

---

## 1. วัตถุประสงค์ (Purpose & Scope)

เอกสารฉบับนี้กำหนดมาตรฐานทางด้านเทคนิคและการออกแบบ UI/UX สำหรับเกมบนเว็บ (Web Games) ทั้งหมดในโปรเจกต์ โดยมีข้อบังคับให้ **ทุกเกมต้องรองรับการเล่นทั้งบนอุปกรณ์พกพา (Mobile ในรูปแบบแนวตั้ง - Portrait Mode) และบนคอมพิวเตอร์ (PC / Laptop)** ได้อย่างสมบูรณ์แบบ ไร้ปัญหาภาพสเกลผิดรูป ปุ่ม UI ตกขอบ หรือการควบคุมที่ไม่เหมาะสมกับอุปกรณ์

---

## 2. อัตราส่วนหน้าจอและความละเอียดมาตรฐาน (Aspect Ratio & Resolution Baseline)

### 2.1 Base Resolution & Canvas Aspect Ratio
* **อัตราส่วนหลัก (Primary Aspect Ratio):** `9:16` หรือ `9:19.5` (Portrait First)
* **ความละเอียดฐาน (Design Base Resolution):**
  * **2D Games (Phaser / Canvas 2D):** `540 x 960 px` หรือ `720 x 1280 px`
  * **3D Games (Babylon.js / WebGL):** Dynamic Scaling ตาม Viewport โดยใช้ Base Resolution `720 x 1280 px`
* **Device Pixel Ratio (DPR):** จำกัดการเรนเดอร์สูงสุดที่ `window.devicePixelRatio = Math.min(window.devicePixelRatio, 2.0)` เพื่อประหยัดพลังงานแบตเตอรี่บน Mobile และป้องกัน GPU Overheat บน PC

### 2.2 Safe Area & Notch Insets (พื้นที่ปลอดภัยสำหรับ UI)
เพื่อป้องกันไม่ให้ปุ่มควบคุมเกมโดน Dynamic Island, Camera Notch หรือแถบนำทางของระบบปฏิบัติติการบัง:
* **Top Safe Margin:** เว้นระยะอย่างน้อย `44px` จากขอบบนสุด สำหรับแสดงผล Score, Pause Button หรือ Health Bar
* **Bottom Safe Margin:** เว้นระยะอย่างน้อย `34px` จากขอบล่างสุด สำหรับ Touch Gesture Bar บน iOS/Android
* **CSS Safe Area Integration:**
  ```css
  padding-top: env(safe-area-inset-top, 16px);
  padding-bottom: env(safe-area-inset-bottom, 16px);
  ```

---

## 3. กลยุทธ์การจัดวางและการขยายขนาดหน้าจอ (Canvas Layout & Responsive Scaling)

### 3.1 การแสดงผลบน Mobile (Mobile Portrait Layout)
* **Full Viewport Fit:** Canvas ขยายเต็มความสูงหน้าจอมือถือ (100% Viewport Height) โดยรักษาอัตราส่วนภาพไว้
* **Thumb Zone Architecture:** องค์ประกอบ UI สำหรับโต้ตอบ (ปุ่มกด, คันโยก, ปุ่มยิง) ต้องจัดวางให้อยู่ในโซนที่นิ้วโป้งเอื้อมถึงได้ง่าย (บริเวณ 1/3 ส่วนล่างของหน้าจอ)
* **Orientation Lock Prompt:** หากผู้ใช้หมุนเครื่องเป็นแนวขวาง (Landscape) บน Mobile ให้แสดง Overlay ป๊อปอัปแจ้งเตือน: *"กรุณาหมุนอุปกรณ์กลับเป็นแนวตั้งเพื่อประสบการณ์การเล่นที่ดีที่สุด"*

```
📱 Mobile Portrait Layout (9:16)
+-----------------------------------+
|  [Score: 9999]        [|| Pause]  | <-- Safe Area Top
+-----------------------------------+
|                                   |
|                                   |
|         GAME PLAY AREA            |
|                                   |
|                                   |
+-----------------------------------+
|   ( Joystick )    ( Action Btn )  | <-- Thumb Zone (Bottom 1/3)
+-----------------------------------+
```

### 3.2 การแสดงผลบน PC / Desktop (Desktop Landscape & Glassmorphism Framework)
เมื่อเปิดเล่นบน PC ซึ่งหน้าจอเป็นแนวขวาง (Landscape 16:9 / 16:10 / 21:9) ตัวเกมจะต้องไม่ถูกขยายยืดสเกลจนเสียรูป แต่จะใช้นวัตกรรมจัดวางแบบ **Centered Portrait Cabinet with Dynamic Backdrop**:

1. **Centered Canvas Frame:**
   * Canvas เกมถูกจัดวางกึ่งกลางหน้าจอ PC ในรูปแบบ Portrait Frame (อัตราส่วน 9:16)
   * มีขอบเนียนเรียบสไตล์ Arcade / Modern Frame พร้อมเงา Drop Shadow
2. **Glassmorphism Ambient Backdrop:**
   * พื้นหลังสองข้างซ้าย-ขวา ใช้ระบบ Ambient Backdrop (ฉากหลังเกมแบบขยายและเบลอด้วย `backdrop-filter: blur(20px)` หรือ Live Gradient Animation)
3. **Responsive Side Panels (อุปกรณ์เสริม):**
   * บนหน้าจอ PC ขนาดใหญ่ (ความกว้าง >= 1200px) สามารถเปิดใช้ Side Panels สองข้างสำหรับแสดงผล:
     * **ฝั่งซ้าย:** ตารางคะแนนสูงสุด (Leaderboard / High Scores) & วิธีการเล่น (How to Play)
     * **ฝั่งขวา:** คำแนะนำการควบคุมบน PC (Keybindings: WASD, Space, Mouse Controls)

```
🖥️ PC / Desktop Landscape Layout (16:9 Frame)
+-----------------------------------------------------------------------+
|  BACKGROUND AMBIENT BLUR / GLASSMORPHISM CONTAINER                     |
|                                                                       |
|  +--------------------+  +-------------------------+  +------------+  |
|  | LEFT SIDE PANEL    |  | CENTER PORTRAIT CANVAS  |  | RIGHT PANEL|  |
|  | - How to Play      |  | (9:16 Game Screen)      |  | - Controls |  |
|  | - High Scores      |  |                         |  |   [WASD]   |  |
|  | - Level Progress   |  |                         |  |   [SPACE]  |  |
|  +--------------------+  +-------------------------+  +------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 4. ระบบการควบคุมสองระบบแบบสลับอัตโนมัติ (Dual Control & Hybrid Input System)

เกมจะต้องรองรับอินพุตทั้งสองรูปแบบคู่กันโดยสมบูรณ์ และสลับตามการใช้งานจริงของผู้ใช้ (Input Auto-Sensing):

| คุณสมบัติ | Mobile Support (Touch First) | PC Support (Keyboard & Mouse) |
| :--- | :--- | :--- |
| **การเคลื่อนที่ (Movement)** | Virtual D-Pad / Touch Joystick / Swipe Gesture | ปุ่ม `W A S D` หรือ ปุ่มลูกศร `Arrow Keys` |
| **การทำแอ็กชัน (Action)** | Virtual On-Screen Buttons (Tap) | ปุ่ม `Spacebar` / `Enter` / Mouse Left Click |
| **การยกเลิก/หยุดพัก (Pause)** | ปุ่ม Pause Icon บน Touch UI | ปุ่ม `Esc` / `P` |
| **UI Dynamic Prompt** | แสดงภาพไอคอนปุ่มสัมผัส (Touch Icons) | แสดงคำแนะนำปุ่มกด (เช่น `[SPACE] Jump`, `[WASD] Move`) |

### 4.1 Input Sensing Code Pattern (JavaScript Example)
```javascript
// ตรวจจับประเภทอินพุตและอัปเดต UI คำแนะนำการควบคุม
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (isTouchDevice) {
  enableVirtualTouchControls();
  hideKeybindingPrompts();
} else {
  enableKeyboardAndMouseListeners();
  showKeybindingPrompts(); // แสดงคำแนะนำปุ่มกดบน PC
}
```

---

## 5. มาตรฐานทางเทคนิคสำหรับ Game Engines (Technical Code Standards)

### 5.1 การตั้งค่า Phaser 3 Engine (Scale Manager Config)
สำหรับเกมที่พัฒนาด้วย Phaser 3 ให้กำหนดค่า `scale` ดังนี้:

```javascript
const config = {
  type: Phaser.AUTO,
  width: 540,
  height: 960,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    expandParent: true
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 } }
  },
  scene: [BootScene, MainMenuScene, GameScene]
};
```

### 5.2 การตั้งค่า Canvas 2D / Vanilla JS
สำหรับเกมที่เขียนด้วย Canvas 2D ดั้งเดิม:

```javascript
function resizeGameCanvas() {
  const canvas = document.getElementById('game-canvas');
  const container = document.getElementById('game-container');
  
  const targetRatio = 9 / 16;
  let width = container.clientWidth;
  let height = container.clientHeight;
  
  let currentRatio = width / height;
  
  if (currentRatio > targetRatio) {
    // หน้าจอจอกว้างเกินไป (PC Screen) -> ล็อกความสูงพอดี container แล้วปรับความกว้างตามสัดส่วน
    width = height * targetRatio;
  } else {
    // หน้าจอยาวแนวตั้ง (Mobile Screen) -> ล็อกความกว้างแล้วปรับความสูงตามสัดส่วน
    height = width / targetRatio;
  }
  
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

window.addEventListener('resize', resizeGameCanvas);
```

---

## 6. รายการตรวจสอบสำหรับการทดสอบคุณภาพ (QA & Compliance Checklist)

ก่อนอนุมัติการ Release เกมใหม่ลงในพอร์ตโฟลิโอ ทีมงาน Dev และ QA ต้องผ่านรายการตรวจสอบดังนี้:

- [ ] **Mobile Portrait Display Check:** ตัวเกมแสดงผลแนวตั้งเต็มจอภาพสวยงาม ไม่ขยับเบี้ยวเมื่อซ่อน/แสดง Browser Address Bar
- [ ] **PC Desktop Center Frame Check:** ตัวเกมถูกจัดวางกึ่งกลางหน้าจอ PC พร้อม Ambient Blur / Side Panels สมบูรณ์
- [ ] **Touch Target Size Check:** ปุ่มกดบน Mobile มีขนาดไม่ต่ำกว่า `44 x 44 px` และระยะห่างไม่น้อยกว่า `8px`
- [ ] **Keyboard & Mouse Playability Check:** สามารถเล่นจบเกมบน PC โดยใช้ Keyboard (WASD/Space) และ Mouse ได้ลื่นไหล
- [ ] **Orientation Alert Check:** มีข้อความแจ้งเตือนให้หมุนเป็นแนวตั้งเมื่อเอียงเครื่องเล่นบน Mobile (ถ้าเกมต้องการ Portrait)
- [ ] **Dynamic Resizing Check:** เมื่อปรับขนาดหน้าต่างเบราว์เซอร์บน PC ตัวเกมต้องสเกลตามราบรื่นโดยไม่เกิด Crash หรือ UI ค้าง
- [ ] **Safe Area Inspection:** ไม่มีข้อความสำคัญหรือปุ่ม UI ถูกบดบังโดย Camera Notch / Dynamic Island บนอุปกรณ์ iOS และ Android

---

## เอกสารที่เกี่ยวข้อง (Related Documents)
* Art & UI Direction: [docs/gdd/03-art-direction.md](../../gdd/03-art-direction.md)
* QA & System Testing Guidelines: [docs/wiki/guidelines/system-test-guideline.md](./system-test-guideline.md)
* Knowledge Hub Wiki: [docs/wiki/wiki.md](../wiki.md)
