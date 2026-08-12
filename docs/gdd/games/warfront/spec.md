# ⚔️ WarFront.io & FrontWars Strategy — Document Index & Technical Specification

**Code Name:** `warfront`  
**Game ID:** `warfront-rts` (`G020`)  
**Engine / Tech Stack:** WebGL / Canvas 2D Shader System, TypeScript, MapCodec Binary Decoder, Local Singleplayer Ticker Engine  
**Version:** 1.2.0 | **Last Updated:** 2026-08-12  
**Status:** Deep Design Phase / Modular GDD Ready  

---

## 1. Executive Summary & Architecture Overview

**WarFront.io & FrontWars Strategy** คือระบบเกมยุทธศาสตร์ทหารสงครามระดับมหภาคแบบเรียลไทม์ (Macro RTS & Real-Time Territory Domination) ที่พัฒนาในรูปแบบ Standalone HTML5 Web App โดยออกแบบโครงสร้างโปรแกรมในลักษณะ Decoupled Module ประสิทธิภาพสูง รองรับการจำลองยูนิตนับหมื่นนายบนแผนที่ความละเอียดสูง 60 FPS

---

## 2. Modular Document Suite Index

เอกสารงานออกแบบฉบับเต็มถูกแบ่งออกเป็น 6 หมวดหมู่หลักในโฟลเดอร์นี้เพื่อความสะดวกในการจูนค่า Gameplay:

- 📘 **Master GDD Hub:** [gdd.md](./gdd.md) — หน้าดรรชนีสรุปภาพรวมและสถาปัตยกรรมระบบ
- 🎯 **00. Concept & Lore:** [00-concept.md](./00-concept.md) — วิสัยทัศน์ ธีมสงคราม การแบ่งฝ่าย Factions และภาพรวมตลาด
- 🎮 **01. Core Mechanics & Combat Physics:** [01-mechanics.md](./01-mechanics.md) — สูตรคำนวณการรบ อัตราความสูญเสีย ขวัญกำลังใจ และสายส่งกำลังบำรุง
- 💰 **02. Economy & Strategic Buildings:** [02-economy-and-buildings.md](./02-economy-and-buildings.md) — สูตรการผลิตกำลังพล การอัปเกรดป้อมปราการ ท่าเรือ และค่ายทหาร
- 🗺️ **03. Terrain, Fog of War & Naval Logistics:** [03-terrain-and-naval.md](./03-terrain-and-naval.md) — ตัวคูณพื้นที่ (ป่า, ภูเขา, แม่น้ำ), หมอกควันสงคราม และการขนส่งทางเรือ
- 🤖 **04. AI Behavior Matrix & Balancing:** [04-ai-and-balancing.md](./04-ai-and-balancing.md) — ตารางการตัดสินใจบอท บุคลิกภาพ AI 4 สาย และระดับความยาก 4 ระดับ
- ⌨️ **05. Controls, Hotkeys & UI/UX:** [05-controls-and-ux.md](./05-controls-and-ux.md) — ระบบการควบคุมเมาส์ Drag-Select, คีย์ลัดแป้นพิมพ์ และเลย์เอาต์ HUD

---

## 3. Reference Source Repositories

1. **FrontWars Concept Reference:** [https://github.com/Elitis/FrontWars](https://github.com/Elitis/FrontWars)
2. **WarFront.io Production Client:** [https://github.com/WarFrontIO/client](https://github.com/WarFrontIO/client)
3. **OpenFrontIO Strategic Expansion:** [https://github.com/openfrontio/OpenFrontIO](https://github.com/openfrontio/OpenFrontIO)
