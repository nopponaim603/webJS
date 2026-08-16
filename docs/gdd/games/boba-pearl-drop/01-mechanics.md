---
title: "🧋 BOBA PEARL DROP: 100% SUGAR — Core Mechanics"
project: "BOBA PEARL DROP: 100% SUGAR"
version: "1.0.0"
last_updated: "2026-08-12"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
  - boba-pearl-drop
---
# 🧋 BOBA PEARL DROP: 100% SUGAR — Core Mechanics


---

## 1. Player Controls & Movement

ผู้เล่นควบคุมเม็ดไข่มุก (Boba Pearl) ด้วยระบบควบคุมแบบ Relative to Camera View:

| แอ็กชัน (Action) | Input (Keyboard) | Input (Touch / Mobile) | ผลลัพธ์ในเกม |
| :--- | :--- | :--- | :--- |
| **Move / Roll** | WASD / Arrow Keys | Virtual On-Screen Joystick | เคลื่อนที่/กลิ้งเม็ดไข่มุกตามทิศทางกล้อง |
| **Jump / Bounce** | Spacebar | Jump Button บนหน้าจอ | เด้งเม็ดไข่มุกขึ้นกลางอากาศ (Cooldown 0.8 วินาที) |
| **Turbo Dash** | Shift (Hold) | Dash Button บนหน้าจอ | เพิ่มความเร็วการกลิ้งชั่วขณะ + มีเอฟเฟกต์ Sugar Sparkle |
| **Camera Orbit** | Drag Mouse / Right Click | Swipe หน้าจอฝั่งขวา | หมุนมุมกล้อง 360 องศารอบตัวไข่มุก |

---

## 2. Boba Physics & Stats

- **Pearl Mass & Bounciness:**
  - Radius: 0.5 units
  - Restitution (ความเด้ง): 0.65 (มีความเด้งนุ่มนวลคล้ายวุ้น/ไข่มุก)
  - Linear Damping (แรงต้านอากาศ): 0.15
  - Angular Damping (แรงต้านหมุน): 0.2
- **Sugar Level Bar (0% -> 100% Sugar):**
  - ทุกๆ การเก็บก้อนน้ำตาล (Sugar Cube 🧊) เพิ่ม +10% Sugar Bar
  - หากเก็บครบ 100% Sugar จะเปิดใช้งานโหมด **"OVERLOAD SWEET DAMPING"** ชั่วคราว (เร่งสปีดขึ้น 25% และได้คะแนนโบนัส 2x)

---

## 3. Collectibles & Interactive Objects

| ไอเทม / วัตถุ | ลักษณะ visual | ผลกระทบเมื่อชน / สัมผัส |
| :--- | :--- | :--- |
| **Sugar Cube (ก้อนน้ำตาล 🧊)** | ก้อนลูกบาศก์สีขาวใสเรืองแสง หมุนอยู่กลางอากาศ | เพิ่ม Sugar Bar +10% + เพิ่มคะแนน 100 PTS + เล่น SFX Ping! |
| **Golden Boba (ไข่มุกทองคำ 🌟)** | เม็ดไข่มุกสีทองส่องประกาย | โบนัสพิเศษ 500 PTS + สตาร์ดาวเต็มด่าน |
| **Boba Straw Tunnel (หลอดชา)** | ท่อทรงกระบอกสีพาสเทลโปร่งแสง | เร่งสปีดไข่มุกยิงผ่านหลอดไปยังอีกฝั่งของด่าน |
| **Bounce Pad (แท่นเด้งวุ้น)** | แท่นสี่เหลี่ยมผิวนุ่มสีชมพู | ส่งเม็ดไข่มุกเด้งสูงขึ้นไปยังแท่นชั้นบน |
| **Tea Stirrer Spinner (ใบพัดคนชา)** | แท่นหมุนหมุนรอบตัวเองตลอดเวลา | ปัด/ผลักเม็ดไข่มุกให้ตกแท่นหากไม่ระวัง |

---

## 4. Win / Lose & Scoring Rules

- **Win Condition (ชัยชนะ):**
  - เม็ดไข่มุกตกลงไปใน **Giant Boba Cup (ถ้วยชาไข่มุกยักษ์)** ที่จุดจบของด่าน
  - ปลดล็อกหน้าต่างสรุปผล Victory Screen (แสดง Sugar %, เวลาที่ใช้, คะแนนรวม, และ ดาว 1-3 ดวง)
- **Lose / Respawn Condition (ตกแท่น):**
  - หากเม็ดไข่มุกตกลงไปต่ำกว่าระดับ Y = -10 (Fall-out Zone)
  - แสดงเอฟเฟกต์ Splash และรีสปอว์นไข่มุกกลับมายัง **Checkpoint** ล่าสุด (หักเวลา 3 วินาที)
- **Star Rating Rules:**
  - ⭐ **1 Star:** ผ่านด่านเข้าถ้วยสำเร็จ
  - ⭐⭐ **2 Stars:** ผ่านด่าน + สะสม Sugar ครบอย่างน้อย 70%
  - ⭐⭐⭐ **3 Stars:** ผ่านด่าน + สะสม Sugar ครบ 100% + เวลาผ่านด่านน้อยกว่าเป้าหมาย (Speedrun)

---

## 🔗 Related Documents
- [Concept & Vision](./00-concept.md)
- [Level Design](./02-level-design.md)
- [Art Direction](./03-art-direction.md)
