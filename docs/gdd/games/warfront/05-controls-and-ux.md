---
title: "⌨️ WarFront.io — 05. Controls, Hotkeys & UI/UX Design"
project: "WarFront.io (FrontWars)"
version: "1.2.0"
last_updated: "2026-08-12"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
  - warfront
---
# ⌨️ WarFront.io — 05. Controls, Hotkeys & UI/UX Design


---

## 1. Input Controls & Gestures (การควบคุม)

ออกแบบรองรับทั้ง **Desktop Mouse & Keyboard** และ **Mobile Touch Gestures**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        INPUT CONTROL MAPPING TABLE                         │
├───────────────────┬──────────────────────────┬─────────────────────────────┤
│ แอ็กชัน (Action)  │ Desktop (Mouse/Keyboard) │ Mobile (Touch Screen)       │
├───────────────────┼──────────────────────────┼─────────────────────────────┤
│ **Select Region** │ Left Click               │ Tap Region                  │
│ **Multi-Select**  │ Left Click + Drag Box    │ Two-Finger Tap Drag Box     │
│ **Move / Attack** │ Right Click on Target    │ Tap Target (after select)   │
│ **Camera Zoom**   │ Mouse Wheel Scroll       │ Pinch to Zoom (2 fingers)   │
│ **Camera Pan**    │ Middle Click + Drag      │ One-Finger Drag (Empty Area)│
└───────────────────┴──────────────────────────┴─────────────────────────────┘
```

---

## 2. Keyboard Hotkey Schema (คีย์ลัดสั่งการ)

| คีย์ลัด (Hotkey) | ฟังก์ชันการสั่งการ (Command Function) | ประโยชน์ทางยุทธวิธี |
| :---: | :--- | :--- |
| `Spacebar` | พักเกม / เล่นต่อ (Pause / Resume Simulation) | หยุดเพื่อวิเคราะห์สถานการณ์รบ |
| `A` | สั่งกองทัพทั้งหมดบุกเป้าหมาย (All Out Attack) | รวมกำลังพลบดขยี้ในคราวเดียว |
| `D` | แบ่งกำลังพล 50% (Split 50% Troops) | แบ่งกำลังพลออกเป็น 2 ส่วน |
| `F` | สั่งสร้างป้อมปราการ (Build Fortress) | ป้องกันเขตพื้นที่สำคัญเร่งด่วน |
| `P` | สั่งสร้างท่าเรือ (Build Naval Port) | เตรียมลำเลียงกองทัพข้ามทะเล |
| `1` – `9` | กำหนด/เรียกกลุ่มกองทัพ (Control Groups `Ctrl+1..9`) | จัดกลุ่มทัพแนวหน้า/แนวหลัง |
| `Tab` | สลับโหมดโหมดแผนที่ (Territory / Supply / Fog View) | สลับดูสายส่งกำลังบำรุง |

---

## 3. UI/UX & HUD Overlay Layout

โครงสร้าง UI แบบ **Minimalist Glassmorphism Overlay** ซ้อนบน Canvas 3D:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [🏳️ Player Faction: Blue]  [💰 Manpower: 4,250]  [🗺️ Regions: 32 (42%)] [⏸️] │  ← Top HUD
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                                                                            │
│                          [ 3D MAP CANVAS VIEW ]                            │
│                                                                            │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ 🗺️ MINIMAP │ [A] All-Out  [D] Split 50%  [F] Fort  [P] Port │ 📊 BATTLE LOG │  ← Bottom Bar
└────────────┴─────────────────────────────────────────────┴───────────────┘
```

---

## 🔗 Related Documents
- [Specification Index](./spec.md)
- [Master GDD Hub](./gdd.md)
- [AI Behavior & Balancing](./04-ai-and-balancing.md)
