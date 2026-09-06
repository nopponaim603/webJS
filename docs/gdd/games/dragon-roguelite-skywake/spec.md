---
title: "🐉 Dragon Roguelite: Skywake — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.4.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - pixijs
  - dragon-roguelite
  - skywake
  - action-roguelite
  - bullet-heaven
  - gpt-6
  - ai-generated
---

# 🐉 Dragon Roguelite: Skywake — Game Design Document & Dev Specs

**Code Name:** `dragon-roguelite-skywake`  
**Game ID:** `G040`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.4.0` (Top Version / Current Top Pick)  
**Age Rating:** 13+  
**Target Playtime:** 1–5 Minutes per Run (Fast-Paced Action Roguelite)  
**Supported Platforms:** Mobile & Desktop (Touch Drag, Mouse Pointer, Keyboard WASD/Arrows)  
**AI Generation & Tech Stack:** OpenAI GPT-6 + Codex, PixiJS 8.6.6 (WebGL Fast Particle & Sprite Batching), ImageGen Environment & 36 Skill Illustrations, Procedural WebAudio Synthesis, LocalStorage & Cloud Preferences, AIGameShare SDK  
**Original Live Source:** [AIGameShare Dragon Roguelite](https://www.aigameshare.com/games/dragon-roguelite-skywake?play=1&mode=fullscreen)  
**Tagline:** *"Grow from basic dragon flight into a four-weapon arsenal above a painted cloud ocean. Charge forward fire breath and sweep finite prism beams clockwise from the dragon back, evolving into a four-arm cross."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Dragon Roguelite: Skywake** เป็นเกม 2D Bullet Heaven / Action Roguelite เหนือทะเลเมฆสีพู่กัน (Painted Cloud Ocean) ผู้เล่นจะเริ่มเล่นจากการเป็นมังกรบินธรรมดาพร้อมทักษะพื้นฐาน **Starfire, Dash และ Skyseals** ก่อนที่จะค่อยๆ ปลดล็อกและพัฒนาคลังแสงมังกร 4 ช่องอาวุธ (Four-weapon Arsenal) และรูนเสริมพลังข้ามสาย 6 ชนิด (Six Cross-weapon Runes)

ต่อสู้ผ่านบอสผู้พิทักษ์ 3 ด่าน (**Three Guardians**) เพื่อมุ่งหน้าสู่โหมดเอาชีวิตรอดนิรันดร์ (**Endless Survival**) พร้อมระบบสกิลภาพวาดประกอบกว่า 36 ชนิด (36 Illustrated Skills) ระบบชาร์จท่าไม้ตาย **Nova & Overdrive** และหน้าต่างประเมินสถานะใน **Armory**

### 1.2 Core Pillars
1. **Four-Weapon Arsenal & Cross-Weapon Runes:** สวมใส่อาวุธสูงสุด 4 ช่องพร้อมกันและผสมผสานรูน 6 ชนิดเพื่อสร้างคอมโบไร้ขีดจำกัด (เช่น Positron Cannon, Dragon Clones, Marked Meteor Strikes, Pulling Singularities)
2. **Dynamic Dragon Mechanics (Breath & Dorsal Prism Sweep):**
   - **Dragon Breath:** ชาร์จพลังงาน 0.55 วินาที ก่อนพ่นเพลิงมังกรตรงไปข้างหน้าจากปาก
   - **Prism Laser:** ชาร์จพลังงาน 0.7 วินาที ที่กึ่งกลางหลังมังกร จากนั้นกวาดลำแสง 360 องศาตามเข็มนาฬิกา (Clockwise) โดยเริ่มจากทิศทางหัวมังกร
3. **Weapon Evolution & Tier Hierarchy:**
   - Prism Laser พัฒนาจาก 1 ลำแสง ➔ ลำแสงคู่ตรงข้าม (Opposing Pair) ที่ Rank 3 ➔ ไม้กางเขน 4 แฉก (Four-arm Cross) ที่ Rank 6 (พร้อมเพิ่มความหนาของลำแสง)
   - ปลดล็อกทักษะสาย Ultimate ด้วยเงื่อนไขการสะสม Rank พื้นฐาน 7 ขั้น + เข้าสู่ Chapter 2
4. **36 Illustrated Skills & Mechanical Reel Reveal:** สุ่มเลือกการ์ดสกิล 3 ใบในรูปแบบ Mechanical Reel & Card Flip พร้อมระบบ Reroll, Rank Preview, และการเลือกสลับเปลี่ยนอาวุธเดิมเมื่อช่องเต็ม (Explicit Weapon Replacement)
5. **Armory & Endless Ascension:** ระบบ Pause ที่เปิดหน้าต่าง Armory ตรวจสอบเงื่อนไข Prerequisite ที่ยังไม่ปลดล็อก, สถิติดาเมจแยกตามอาวุธ, จำนวน Kills, Evolution Tiers และสู้ต่อเนื่องใน Endless Mode หลังปราบบอสทั้ง 3

### 1.3 Creator Versions & Release Changelog (Current Top Pick)

> [!NOTE]
> **AIGameShare Creator Top Pick:** [nilni](https://www.aigameshare.com/profile/nil)  
> **Community Metrics:** 2 Votes / 42 Plays / 1h 45m Total Played (Avg 2m 00s per play)  
> **Categories & Tags:** `Dragon` `Roguelite` `Bullet Heaven` `Action` `Flying` `Boss Battles` `Endless` `Survival` `High Score` `Mobile` `Desktop` `HTML5` `PixiJS` `GPT-6` `Codex`

#### 📜 Official Version Release Notes
> *"Begin with Starfire, dash and skyseals, then learn your arsenal through upgrade choices. Dragon Breath gathers energy for 0.55 seconds before projecting flame forward from the mouth. Prism Laser charges for 0.7 seconds at the center of the dragon back, then sweeps clockwise through one full turn, starting from the head direction when the beam fires. Its finite rays evolve from one beam into an opposing pair at rank three and a four-arm cross at rank six; ranks also increase bounded beam thickness. Unlock a visibly charging positron cannon, living dragon clones, marked meteor strikes and pulling singularities through prerequisite abilities. Equip four weapons and combine six cross-weapon runes. Nova requires three Starfire ranks. Overdrive requires chapter two plus an equipped rank-three weapon or a learned path ultimate; both powers start empty when unlocked. Overdrive empowers only eligible rank-three weapons and learned ultimates. Path ultimates require chapter two, seven matching basic path ranks and an evolution. Choose from 36 illustrated skills in a horizontal three-card row with mechanical reel and flip reveals, rerolls, rank previews and explicit weapon replacement. Inspect unmet prerequisites, damage, kills and evolution tiers in the armory. Defeat three guardians and continue the same build into rising endless encounters. Defeat or voluntary retirement banks the run once. English and Chinese, keyboard and touch controls, original music with mute, safe saved preferences and best score, and the existing expedition-score leaderboard. Active runs are not saved.*
> 
> *By [nilni](https://www.aigameshare.com/profile/nil) — 2 votes / 42 plays / 1h 45m"*

---

## 2. Combat Mechanics, Abilities & Progression Matrix

```
                          ┌───────────────────────────┐
                          │   Starting Loadout        │
                          │ • Starfire                │
                          │ • Dash                    │
                          │ • Skyseals                │
                          └─────────────┬─────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
  [ Dragon Breath (0.55s Charge) ]                    [ Prism Laser (0.7s Dorsal Charge) ]
  • Forward Flamethrower Arc                          • 360° Clockwise Dorsal Sweep
                                                      • Rank 1: Single Beam
                                                      • Rank 3: Opposing Dual Beam
                                                      • Rank 6: 4-Arm Cross Beam
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
  [ 4 Weapon Slots & 6 Runes ]                        [ Ultimate & Special Powers ]
  • Positron Cannon (Charging Beam)                   • Nova: Requires Starfire Rank 3
  • Dragon Clones (Living Allies)                     • Overdrive: Requires Chapter 2 + Rank-3
  • Meteor Strikes (Marked AOE)                       • Path Ultimates: Chapter 2 + 7 Ranks
  • Singularities (Gravity Vortex)
                                        │
                                        ▼
                          [ 3 Guardians Boss Battles ]
                                        │
                                        ▼
                          [ Endless Survival Mode ]
```

### 2.1 Weapon & Skill Evolution Specifications

| Weapon / Power | Charging / Trigger | Evolution & Rank Effects | Unlock / Prerequisite Requirements |
| :--- | :--- | :--- | :--- |
| **Dragon Breath** | ชาร์จ 0.55 วินาที | พ่นเปลวเพลิงทำลายล้างเป็นแนวตรงไปข้างหน้า | อัปเกรดเลือกผ่าน Skill Card |
| **Prism Laser** | ชาร์จ 0.70 วินาทีที่หลังมังกร | กวาดลำแสง 360° ตามเข็มนาฬิกา; Rank 3 เป็น 2 ลำแสงตรงข้าม; Rank 6 เป็นกางเขน 4 แฉก (ลำแสงหนาขึ้นตาม Rank) | อัปเกรดเลือกผ่าน Skill Card |
| **Positron Cannon** | ชาร์จสะสมประจุโปรตอน | ยิงลำแสงอนุภาคพลังงานสูงระเบิดทะลุแนวศัตรู | ปลดล็อกผ่าน Prerequisite Abilities |
| **Dragon Clones** | ปล่อยมังกรจิ๋วร่วมรบ | บินวนรอบตัวและช่วยยิงโจมตีศัตรูอัตโนมัติ | ปลดล็อกผ่าน Prerequisite Abilities |
| **Meteor Strikes** | มาร์กเป้าหมายบนพื้นฟ้า | เรียกอุกกาบาตเพลิงตกลงมาสร้างความเสียหาย AOE มหาศาล | ปลดล็อกผ่าน Prerequisite Abilities |
| **Singularities** | สร้างแรงดึงดูดหลุมดำ | ดูดศัตรูและกระสุนเข้าสู่ใจกลางพร้อมบดขยี้ | ปลดล็อกผ่าน Prerequisite Abilities |
| **Nova Burst** | กดใช้งานทันทีเมื่อเต็ม | คลื่นระเบิดพลังงานรอบทิศทาง | ต้องมี Starfire ครบ 3 Ranks |
| **Overdrive** | กดปลดปล่อยพลังคลั่ง | เพิ่มพลังโจมตีอย่างมหาศาลให้กับอาวุธ Rank 3 และ Ultimate | ต้องถึง Chapter 2 + มีอาวุธ Rank 3 หรือ Path Ultimate |
| **Path Ultimates** | ท่าไม้ตายประจำสาย | ปลดปล่อยพลังขั้นสูงสุดของสายอัปเกรดนั้นๆ | ต้องถึง Chapter 2 + สะสม Basic Path 7 Ranks + Evolution |

---

## 3. Controls & User Interface

### 3.1 Control Mapping

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Steering / Movement** | `W`, `A`, `S`, `D` หรือปุ่มลูกศร (Arrow Keys) / ลากเมาส์ค้าง | แตะและลากนิ้วบนหน้าจอ (Virtual Drag) เพื่อบิน |
| **Dash (พุ่งหลบ)** | `Spacebar` หรือคลิกขวา (Right Click) | แตะปุ่ม **Dash** บนหน้าจอ |
| **Cast Nova** | ปุ่ม `E` (เมื่อชาร์จเต็ม) | แตะปุ่ม **Nova** เมื่อปลดล็อกและชาร์จเต็ม |
| **Release Overdrive** | ปุ่ม `R` (เมื่อชาร์จเต็ม) | แตะปุ่ม **Overdrive** เมื่อปลดล็อกและชาร์จเต็ม |
| **Pause & Armory** | `P` หรือ `Escape` (เปิดหน้าต่างคลังแสง/สกิล/ยอมแพ้) | แตะไอคอน **Pause** มุมบน |
| **Mute Audio** | `M` | แตะไอคอนลำโพง |
| **Language Switch** | `L` (สลับภาษาอังกฤษ / ภาษาจีน) | แตะปุ่มสลับภาษา |

### 3.2 UI / UX Flow
- **Direct-to-Action:** เริ่มต้นบินทันทีโดยไม่ต้องผ่านหน้า Start Screen ยุ่งยาก
- **Skill Draft Overlay:** เมื่อเลเวลอัพ จะแสดงการ์ดสกิล 3 ใบแนวนอน (Horizontal 3-card Reel Reveal) มีปุ่ม Reroll, ดู Rank Preview และหากช่องอาวุธครบ 4 ช่องจะมีปุ่มให้เลือกเปลี่ยนอาวุธเดิมออกได้
- **Armory Screen (Pause Menu):** ตรวจสอบสถานะสกิล, รายการ Prerequisite ที่ยังไม่ผ่าน, สถิติดาเมจแยกตามอาวุธ, จำนวน Kills, และปุ่ม Retire เพื่อบันทึกคะแนนรอบนั้นลง Leaderboard

---

## 4. Technical Specs & Standalone Architecture

### 4.1 Engine & Architecture
- **PixiJS 8.6.6 Engine:** ประมวลผล Sprite Batching และ Particle Effects ขั้นสูง (ความเร็วคงที่ 60 FPS บนมือถือและเดสก์ท็อป)
- **Procedural WebAudio:** เสียงสังเคราะห์ของลำแสงเลเซอร์, เสียงคำรามมังกร, และเพลงประกอบที่ไม่ต้องโหลดไฟล์เสียงหนักจากภายนอก
- **Storage & State:** บันทึก Preferences การตั้งค่าและคะแนนสูงสุด (High Score) ผ่าน `localStorage` โดยไม่มีการบันทึกสถานะรันที่กำลังเล่นอยู่ (Active runs are not saved)

### 4.2 Integration Summary

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G040` |
| **Directory** | `public/games/dragon-roguelite-skywake/` |
| **Main URL** | `/games/dragon-roguelite-skywake/index.html` |
| **AI Generation Tools** | OpenAI GPT-6 + Codex / PixiJS 8.6.6 / ImageGen 36 Skills |
| **Tech Stack** | PixiJS 8.6.6 / WebGL / Web Audio API / LocalStorage |
| **Category** | `PixiJS 2D Engine` / `แอ็กชัน / เอาชีวิตรอด` |
| **Standalone Ready** | 100% Offline Compatible (No CDN dependency) |
