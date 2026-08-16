---
title: "🎖️ WarFront.io — 00. Game Concept, World Lore & Factions"
version: "1.2.0"
last_updated: "2026-08-12"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
  - warfront
---

# 🎖️ WarFront.io — 00. Game Concept, World Lore & Factions

**Version:** 1.2.0 | **Last Updated:** 2026-08-12  

---

## 1. High-Level Vision & Game Concept

### 1.1 Concept Statement
**WarFront.io** นำเสนอประสบการณ์การทำสงครามยึดครองโลกแบบเรียลไทม์ที่ตัดความซับซ้อนของการจุ๊กจิ๊กจัดการระดับไมโคร (Micro-management) ออกไป โดยมุ่งเน้นไปที่ **"การตัดสินใจระดับมหภาค (Macro-Strategy)"**:
- การบริหารขอบเขตดินแดน (Border Control)
- การสร้างลู่ลำเลียงกำลังบำรุง (Supply Lines)
- การจัดสรรกำลังพลระหว่างแนวหน้า (Frontline) กับแนวหลัง (Rear Guard)

### 1.2 Target Gamer Profile
- **Casual & Hardcore RTS Fans:** แฟนเกมสไตล์ *Hearts of Iron*, *RISK*, *State.io*, *Solarmax*, และ *Generals* ที่ต้องการความสนุก รวดเร็ว เล่นจบได้ใน 10–20 นาทีบนเว็บเบราว์เซอร์
- **Browser IO Enthusiasts:** ผู้เล่นที่ชื่นชอบเกมแข่งขันยึดพื้นที่แบบลื่นไหล ไม่สะตุก

---

## 2. World Setting & Global Maps

เกมจำลองสนามรบบนแผนที่ภูมิศาสตร์จริง โดยมีแผนที่มาตรฐาน 2 แบบ:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GLOBAL MAP SETTINGS                           │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ แผนที่ (Map)      │ จำนวนภูมิภาค (Regions)│ จุดเด่นทางยุทธศาสตร์ (Strategic Focus) │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 🌍 World Map      │ ~180 Regions      │ การสงครามข้ามทวีป, การส่งกองเรือ  │
│                   │                   │ ข้ามมหาสมุทรแปซิฟิก/แอตแลนติก   │
│ 🇪🇺 Europe Theater │ ~85 Regions       │ การสงครามภาคพื้นดินหนาแน่น,     │
│                   │                   │ จุดยุทธศาสตร์เทือกเขาอัลป์      │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 3. Global Factions & Regional Colors

แต่ละฝ่ายในการเล่นมีโทนสี สีธงชาติ และโบนัสประจำ Faction:

| Faction Name | โทนสีแผนที่ (Hex Color) | คุณลักษณะพิเศษ (Faction Perk) |
| :--- | :--- | :--- |
| **🔵 Blue Vanguard (ผู้เล่น/บอท)** | `#3B82F6` (Electric Blue) | **Tactical Mobility:** ความเร็วในการแล่นเรือลำเลียง +20% |
| **🔴 Red Dominion (AI Faction)** | `#EF4444` (Crimson Red) | **Mass Mobilization:** อัตราการเพิ่มกำลังพลพื้นฐาน +15% |
| **🟢 Green Coalition (AI Faction)** | `#10B981` (Emerald Green) | **Fortified Defense:** โบนัสการตั้งรับในป้อมปราการ +25% |
| **🟡 Gold Alliance (AI Faction)** | `#F59E0B` (Amber Gold) | **Economic Empire:** โบนัสการผลิตกำลังพลจากเมืองหลวง +30% |

---

## 🔗 Related Documents
- [Specification Index](./spec.md)
- [Core Mechanics & Combat Physics](./01-mechanics.md)
- [Master GDD Hub](./gdd.md)
