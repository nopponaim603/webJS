---
title: "⚔️ Grapple Knight: Storm Siege — Game Design Document & Dev Specs"
project: "GameDevJS Hub (webJS)"
version: "1.1.0"
last_updated: "2026-09-06"
owner: "Noppon / Dev Team"
status: "Completed"
tags:
  - gdd
  - grapple-knight
  - boss-rush
  - grappling-hook
  - slow-motion
  - action-roguelite
  - gpt-6
  - ai-generated
---

# ⚔️ Grapple Knight: Storm Siege — Game Design Document & Dev Specs

**Code Name:** `grapple-knight-storm-siege`  
**Game ID:** `G041`  
**Creator:** [nilni](https://www.aigameshare.com/profile/nil)  
**Version:** `1.1.0` (Top Version / Current Top Pick)  
**Age Rating:** 13+  
**Target Playtime:** 1–5 Minutes per Run (Intense Boss Rush Action)  
**Supported Platforms:** Mobile & Desktop (Touch Weakpoints, Mouse Aim, Keyboard WASD / Space / Shift)  
**AI Generation & Tech Stack:** OpenAI GPT-6 + Codex, Canvas 2D (Momentum & Elastic Hook Physics Engine), ImageGen Cloudsea Environment & Cover, Adaptive WebAudio Procedural Synthesizer, Playwright QA Automation, AIGameShare SDK  
**Original Live Source:** [AIGameShare Grapple Knight: Storm Siege](https://www.aigameshare.com/games/grapple-knight-storm-siege?play=1&mode=fullscreen)  
**Tagline:** *"One knight. Six impossible giants. Aim in slow motion, grapple into golden weakpoints and dismantle colossal sky guardians."*  

---

## 1. Executive Summary & Concept

### 1.1 Elevator Pitch
**Grapple Knight: Storm Siege** เป็นเกม 2D Aerial Boss Rush & Action Roguelite ที่ผู้เล่นสวมบทบาทเป็นอัศวินเดี่ยวผู้ใช้ตะขอยึดเกาะ (Grappling Hook) ทะยานเข้าต่อกรกับยักษ์พิทักษ์นภากลางเวหา 6 ตน (**Six Impossible Giants**)

หัวใจหลักของเกมคือระบบเล็งตะขอแบบสโลว์โมชัน (**Slow-Motion Aiming**) ผู้เล่นสามารถกดค้างเพื่อชะลอเวลา เล็งเป้าไปยังจุดอ่อนประกายทอง (Golden Weakpoints) ของบอส และปล่อยเพื่อพุ่งทะลวงทำลายเกราะรอบตัว (Armor Guards) เปิดทางสู่การทำลายแกนพลังงานหัวใจ (Exposed Core) ท่ามกลางอันตรายจากทุ่นระเบิดคลื่นน้ำ (Wake Mines), สายใยไฟฟ้าแรงสูง (Live Tethers), และม่านพลังสุริยุปราคา (Alternating Shields)

พร้อมระบบเลือกรับศัสตราวุธโบราณ **5 Relics จากทั้งหมด 12 พลัง** หลังปราบบอสในแต่ละรอบเพื่อมุ่งหน้าสู่รุ่งอรุณสุดท้าย (The Final Dawn)

### 1.2 Core Pillars
1. **Slow-Motion Hook Aiming & Momentum Physics:** การกดค้างเพื่อเข้าสู่สภาวะชะลอเวลา (Bullet Time / Slow Mo) คำนวณวิถีตะขอและแรงเหวี่ยงโมเมนตัมพุ่งเข้าโจมตีจุดอ่อนได้อย่างแม่นยำ
2. **Six Distinct Colossal Sky Guardians:** บอสยักษ์ 6 ตัว แต่ละตัวมีพฤติกรรม รูปแบบการป้องกัน และฮาซาร์ดเฉพาะตัว:
   - *Tide Serpent:* บอสอสรพิษคลื่นสมุทร ปล่อยทุ่นระเบิดน้ำวน (Wake Mines)
   - *Thunder Loom:* หุ่นทอสายฟ้า ปล่อยสายโยงกระแสไฟฟ้าแรงสูง (Live Tethers)
   - *Eclipse Ark:* เรือรบสุริยุปราคา สลับขั้วม่านพลังแสงสว่าง-ความมืด (Alternating Sun/Moon Shields)
   - *Bellkeeper:* ผู้พิทักษ์ระฆังทองคำ กระหน่ำคลื่นเสียงสะท้อน (Resonance Shockwaves)
   - *Glasswing:* ผีเสื้อแก้วปีกผลึก ยิงห่ากระสุนกระจกปริซึม (Prism Shards)
   - *Solar Crown:* ราชันมงกุฎสุริยะ บอสใหญ่ผู้ควบคุมวงแหวนเปลวสุริยะ
3. **Three Armor/Core Cycles:** บอสแต่ละตัวต้องทำลายเกราะชั้นนอก (Break Armor Guards) ให้ครบ 3 รอบเพื่อเปิดจุดอ่อนแกนกลางหัวใจ (Exposed Heart)
4. **Relic Drafting (Roguelite Progression):** สะสม 5 Relics จากทั้งหมด 12 พลังพิเศษ (เลือก 1 จาก 3 หลังกำจัดบอส 5 ตัวแรก) เพื่อเสริมระยะตะขอ, ดาเมจพุ่งชน, คลื่น Storm Burst, และความเร็วในการฟื้นฟู
5. **Adaptive WebAudio & High-speed Canvas 2D:** ระบบเสียงสังเคราะห์แบบโต้ตอบตามจังหวะการโหนและกระแทก พร้อมกราฟิกทะเลเมฆ (`cloudsea.webp`) ลื่นไหล 60 FPS

### 1.3 Creator Versions & Release Changelog (Current Top Pick)

> [!NOTE]
> **AIGameShare Creator Top Pick:** [nilni](https://www.aigameshare.com/profile/nil)  
> **Community Metrics:** 1 Vote / 54 Plays / 50m Total Played (Avg 56s per play)  
> **Categories & Tags:** `Grappling Hook` `Boss Rush` `Action` `Slow Motion` `Roguelite` `Fantasy` `Mobile` `Desktop` `HTML5` `GPT-6` `Codex`

#### 📜 Official Version Release Notes
> *"One knight. Six impossible giants. Aim in slow motion, grapple into golden weakpoints and dismantle colossal sky guardians. Escape the Tide Serpent’s wake mines, cut the Thunder Loom’s live tethers and breach the Eclipse Ark’s alternating shields. Choose five relics from twelve powers on your way to the final dawn. Hold to aim in slow motion and release to strike. Break each armor guard, attack the exposed heart, and select a relic after each of the first five bosses. Six distinct bosses, twelve relics, three armor/core cycles per boss, English and Chinese, adaptive original audio, desktop and touch controls.*
> 
> *By [nilni](https://www.aigameshare.com/profile/nil) — 1 votes / 54 plays / 50m"*

---

## 2. Combat Mechanics, Bosses & Progression

```
                           ┌───────────────────────────┐
                           │   Hold Mouse / Space      │
                           │   (Slow Motion Aiming)    │
                           └─────────────┬─────────────┘
                                         │
                                         ▼
                           ┌───────────────────────────┐
                           │   Release to Grapple      │
                           │   (Launch & Momentum Hook)│
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ Strike Armor Guards ]                           [ Strike Exposed Core ]
     (Dismantle Outer Plates)                          (Inflict Massive Heart DMG)
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                           [ Complete 3 Armor Cycles ]
                                         │
                                         ▼
                           [ Boss Defeated Reward ]
                           Choose 1 of 3 Relic Cards
                           (5 Relics total per run)
```

### 2.1 The Six Colossal Guardians

| Guardian Boss | Unique Hazard / Mechanism | Strategy & Weakpoints |
| :--- | :--- | :--- |
| **1. Bellkeeper** | สั่นระฆังทองคำปล่อยคลื่นกระแทก Shockwave และฟันเฟืองยักษ์ | โหนหลบคลื่นเสียง กระแทกชิ้นส่วนระฆังข้างตัวเพื่อปลดเกราะ |
| **2. Glasswing** | กางปีกผลึกแก้ว สาดกระสุนสะท้อนแสงมุมกว้าง | อาศัยจังหวะ Slow-mo แทรกผ่านช่องว่างห่ากระสุนเข้าล็อคข้อต่อปีก |
| **3. Tide Serpent** | เคลื่อนที่แบบคลื่นสมุทรและวางทุ่นระเบิดน้ำวน (Wake Mines) | โหนไต่ตามแนวกระดูกสันหลัง ตัดทุ่นระเบิดก่อนระเบิด |
| **4. Thunder Loom** | ขึงสายโยงพลังงานไฟฟ้าแรงสูงเชื่อมโยงทั่วฉาก (Live Tethers) | พุ่งตัดสายโยงพลังงานเพื่อตัดไฟและทำให้บอสสตัน |
| **5. Eclipse Ark** | กางม่านพลังสลับขั้วแสง-เงา (Polarity Shield) | สังเกตสีของกงล้อสุริยะเพื่อเจาะเกราะตามขั้วที่ถูกต้อง |
| **6. Solar Crown** | บอสใหญ่แห่งรุ่งอรุณ ปลดปล่อยพายุสุริยะและวงแหวนเพลิง | รวมพลัง Relic ทั้ง 5 ชนิด ใช้ Storm Burst ทะลวงแกนกลางขั้นสุดท้าย |

---

## 3. Controls & User Interface

### 3.1 Control Mapping

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Aim Hook (Slow Motion)** | กด **คลิกซ้าย (Mouse Hold)** หรือกดค้าง **`Spacebar`** | **แตะหน้าจอค้างไว้** เพื่อเข้าสู่ Slow Motion และลากเป้า |
| **Grapple Strike** | **ปล่อยคลิกเมาส์** หรือปล่อย **`Spacebar`** | **ปล่อยนิ้ว** เพื่อพุ่งตะขอไปยังจุดอ่อน |
| **Quick Strike** | คลิกเมาส์หรือแตะแบบเร็ว (Quick Tap) | แตะหน้าจอรวดเร็ว |
| **Drift / Maneuver** | `W`, `A`, `S`, `D` หรือปุ่มลูกศร (Arrow Keys) | ปัดนิ้วบังคับทิศทางการลอยตัว |
| **Storm Burst** | ปุ่ม `X` หรือ `Shift` (เมื่อเกจพลังงานเต็ม) | แตะปุ่ม **Storm Burst** บนหน้าจอ |
| **Select Relic** | ปุ่มตัวเลข `1`, `2`, `3` | แตะเลือกการ์ด Relic บนหน้าจอ |
| **Pause & Menu** | `P` หรือ `Escape` | แตะไอคอน **Pause** |
| **Mute / Language** | `M` (Mute) / `L` (Switch English & Chinese) | แตะไอคอนบน Topbar |

---

## 4. Technical Specs & Standalone Architecture

### 4.1 Architecture & Performance
- **Canvas 2D Vector Graphics:** ระบบวาดภาพ Procedural Vector ที่สวยงาม นุ่มนวล และเบาเป็นพิเศษ
- **Momentum Physics Solver:** ระบบคำนวณการดึงของสายตะขอแบบ Elastic Spring และการถ่ายโอนโมเมนตัม
- **ImageGen Cloud Environment:** ฉากหลังทะเลเมฆภาพสีน้ำมัน `cloudsea.webp` รองรับการปรับขนาดตาม Resolution
- **100% Standalone Offline:** ไม่ต้องพึ่งพาไลบรารีภายนอก โค้ดทั้งหมดอยู่ในไฟล์ชุดสมบูรณ์

### 4.2 Integration Summary

| Attribute | Value |
| :--- | :--- |
| **Catalog ID** | `G041` |
| **Directory** | `public/games/grapple-knight-storm-siege/` |
| **Main URL** | `/games/grapple-knight-storm-siege/index.html` |
| **AI Generation Tools** | OpenAI GPT-6 + Codex / Canvas 2D / WebAudio / ImageGen |
| **Tech Stack** | HTML5 Canvas 2D / Elastic Rope Physics / Web Audio API / LocalStorage |
| **Category** | `Three.js 3D Engine` / `Phaser 2D Engine` / `แอ็กชัน / บอสรัช` |
| **Standalone Ready** | 100% Offline Compatible (No CDN dependency) |
