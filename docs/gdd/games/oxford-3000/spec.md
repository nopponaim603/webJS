---
title: "📚 Oxford 3000 Vocab Master — Game Design Document & Data Pipeline Specs"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-08-30"
owner: "Noppon / Dev Team"
status: "Design"
tags:
  - gdd
  - oxford-3000
  - edugame
  - vocab
  - csv-database
---

# 📚 Oxford 3000 Vocab Master — Game Design Document & Dev Specs

**Code Name:** `oxford-3000` (G031)  
**Game Title:** Oxford 3000 Vocab Master (เกมผจญภัยทบทวนคลังคำศัพท์ Oxford 3000)  
**Engine / Tech Stack:** HTML5 / Vanilla JS / Canvas 2D / Web Speech API (TTS) / PapaParse (CSV Parser)  
**Target Platform:** Web (Mobile Responsive & Desktop)  

---

## 1. Game Overview & Vision

### Elevator Pitch
เกมเว็บทบทวนคำศัพท์ภาษาอังกฤษระดับมาตรฐานโลก **Oxford 3000™** (แบ่งตามมาตรฐาน CEFR A1, A2, B1, B2) ที่เปลี่ยนการท่องศัพท์น่าเบื่อให้กลายเป็นเกมผจญภัยและการต่อสู้ฝึกสมอง ด้วยระบบ Spaced Repetition (SRS), Speed Quiz, Flashcard Arena และ Boss Battle พร้อมระบบจัดการฐานข้อมูลคำศัพท์นำเข้าจากเอกสาร PDF แหล่งต่างๆ มาคลีนและคอมไพล์เป็นไฟล์ `.csv` ที่มีโครงสร้างสมบูรณ์

### Target Audience
- ผู้เรียนภาษาอังกฤษทุกระดับ (ระดับเริ่มต้น A1 จนถึงระดับกลาง-สูง B2)
- นักเรียน/นักศึกษาที่เตรียมสอบ (O-NET, TGAT, IELTS, TOEIC, CEFR)
- ผู้เล่นเกมแนว EduGame / Trivia / Word Puzzle ที่ต้องการเพิ่มคลังคำศัพท์พร้อมความสนุก

---

## 2. Data Pipeline: PDF to CSV Database Specification 📄 ➡️ 📊

หัวใจสำคัญของโปรเจกต์นี้คือการสกัดข้อมูลคำศัพท์จากเอกสาร PDF ทางการ (Oxford 3000 Wordlists จาก Oxford Learner's Dictionaries / British Council) เข้าสู่ฐานข้อมูลแบบ `.csv` เพื่อให้ตัวเกมโหลดไปประมวลผลได้อย่างมีประสิทธิภาพ

```mermaid
flowchart LR
    A[📄 Oxford 3000 PDF Sources] --> B[🐍 PDF Extraction Script (pdf-parse / PyPDF)]
    B --> C[🧹 Data Cleaning & Regex Normalizer]
    C --> D[🌐 Translation & IPA Enrichment Engine]
    D --> E[✅ Data Validator & QA Checks]
    E --> F[📊 oxford3000_master.csv]
    F --> G1[📑 oxford_a1.csv]
    F --> G2[📑 oxford_a2.csv]
    F --> G3[📑 oxford_b1.csv]
    F --> G4[📑 oxford_b2.csv]
    F --> H[🎮 In-Game CSV Loader & Cache]
```

### 2.1 โครงสร้างฐานข้อมูลคำศัพท์ (`oxford3000_master.csv`)

| Column Name | Data Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer / String | `1001` | รหัสประจำคำศัพท์ (Primary Key) |
| `word` | String | `ability` | คำศัพท์ภาษาอังกฤษ (Headword) |
| `part_of_speech` | String | `n.` | ชนิดของคำย่อ (`n.`, `v.`, `adj.`, `adv.`, `prep.`, `conj.`, `pron.`, `modal`) |
| `cefr_level` | String | `A2` | ระดับความยากตามเกณฑ์ CEFR (`A1`, `A2`, `B1`, `B2`) |
| `phonetic_uk` | String | `/əˈbɪləti/` | สัทอักษรสากล (IPA) สำเนียงอังกฤษ (UK) |
| `phonetic_us` | String | `/əˈbɪləti/` | สัทอักษรสากล (IPA) สำเนียงอเมริกัน (US) |
| `thai_meaning` | String | `ความสามารถ, ทักษะ` | ความหมายภาษาไทยหลัก (กระชับ เข้าใจง่าย) |
| `example_sentence` | String | `She has the ability to manage complex tasks.` | ประโยคตัวอย่างการใช้งาน |
| `example_translation` | String | `เธอมีความสามารถในการจัดการงานที่ซับซ้อน` | คำแปลประโยคตัวอย่าง |
| `category` | String | `General` | หมวดหมู่คำศัพท์ (เช่น `Education`, `Work`, `Daily Life`, `Feelings`) |
| `distractors` | String | `ทัศนคติ\|โอกาส\|เป้าหมาย` | ชอยส์ลวงภาษาไทยสำหรับทำข้อสอบ (คั่นด้วย pipe `\|`) |
| `audio_key` | String | `ability_us` | คีย์ไฟล์เสียง หรือ trigger Web Speech API TTS |

### 2.2 ตัวอย่างข้อมูลในไฟล์ `.csv` (Sample Seed Records)

```csv
id,word,part_of_speech,cefr_level,phonetic_uk,phonetic_us,thai_meaning,example_sentence,example_translation,category,distractors,audio_key
1,abandon,v.,B2,/əˈbændən/,/əˈbændən/,ละทิ้ง,They had to abandon their car in the snow.,พวกเขาต้องละทิ้งรถไว้ในหิมะ,Action,ดูแล|สะสม|ก่อตั้ง,abandon
2,ability,n.,A2,/əˈbɪləti/,/əˈbɪləti/,ความสามารถ,She has the ability to solve hard puzzles.,เธอมีความสามารถในการไขปริศนายากๆ,Skills,ความเกียจคร้าน|ข้อผิดพลาด|ชื่อเสียง,ability
3,able,adj.,A1,/ˈeɪbl/,/ˈeɪbl/,สามารถ,Will you be able to come tomorrow?,คุณจะสามารถมาพรุ่งนี้ได้ไหม?,Status,เหน็ดเหนื่อย|ยากจน|ล่าช้า,able
4,about,prep.,A1,/əˈbaʊt/,/əˈbaʊt/,เกี่ยวกับ,What is this book about?,หนังสือเล่มนี้เกี่ยวกับอะไร?,Grammar,เหนือกว่า|ก่อนหน้า|ระหว่าง,about
5,above,prep.,A1,/əˈbʌv/,/əˈbʌv/,ข้างบน/เหนือ,The birds are flying above the trees.,นกกำลังบินอยู่เหนือต้นไม้,Position,ข้างใต้|ข้างหลัง|ตรงข้าม,above
```

### 2.3 ขั้นตอนและผลลัพธ์การสกัดข้อมูลจริง (Verified PDF Extraction Results)

- **ไฟล์ต้นฉบับ:** [`The_Oxford_3000_by_CEFR_level.pdf`](./The_Oxford_3000_by_CEFR_level.pdf) (12 หน้า, 116 KB)
- **สคริปต์ประมวลผล:** [`scratch/extract_oxford3000_to_csv.py`](file:///c:/Users/noppon/source/06-WEB/webJS/scratch/extract_oxford3000_to_csv.py)
- **จำนวนคำศัพท์ทั้งหมดที่สกัดได้:** **3,308 รายการ** (ความถูกต้อง 100% Unmatched = 0)
  - 🟢 **CEFR Level A1:** 900 คำ → [`oxford_a1.csv`](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/oxford-3000/data/oxford_a1.csv)
  - 🔵 **CEFR Level A2:** 872 คำ → [`oxford_a2.csv`](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/oxford-3000/data/oxford_a2.csv)
  - 🟡 **CEFR Level B1:** 809 คำ → [`oxford_b1.csv`](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/oxford-3000/data/oxford_b1.csv)
  - 🔴 **CEFR Level B2:** 727 คำ → [`oxford_b2.csv`](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/oxford-3000/data/oxford_b2.csv)
  - 📦 **Master CSV Dataset:** [`oxford3000_master.csv`](file:///c:/Users/noppon/source/06-WEB/webJS/public/games/oxford-3000/data/oxford3000_master.csv) (3,308 รายการ)

---

## 3. Gameplay Mechanics & Game Modes 🎮

```mermaid
graph TD
    MainMenu[🎮 Oxford 3000 Hub] --> Mode1[🃏 Flashcard Mastery (SRS)]
    MainMenu --> Mode2[⚡ Speed Vocab Rush (Time Attack)]
    MainMenu --> Mode3[⚔️ Vocab Boss Dungeon (RPG Battle)]
    MainMenu --> Mode4[🔤 Word Scramble / Spelling]
    
    Mode1 --> XP[⭐ Earn XP & Mastery Coins]
    Mode2 --> XP
    Mode3 --> XP
    Mode4 --> XP
    
    XP --> LevelUp[📈 Level Up & Unlock CEFR Badges: A1 -> A2 -> B1 -> B2]
    LevelUp --> StatTracker[📊 Word Retention & Weak Word Analytics]
```

### 3.1 โหมดการเล่นหลัก (Core Modes)

#### 1. 🃏 Flashcard & Spaced Repetition (SRS Arena)
- ผู้เล่นเปิดการ์ดคำศัพท์ ดูความหมาย, IPA, ฟังเสียงอ่าน (TTS), ดูตัวอย่างประโยค
- เลือกระดับความจำ: `จำไม่ได้ (Again)`, `จำได้พอสมควร (Hard)`, `จำได้ดี (Good)`, `เชี่ยวชาญแล้ว (Easy)`
- ใช้อัลกอริทึม SuperMemo (SM-2) คำนวณช่วงเวลาที่จะนำคำศัพท์กลับมาให้ทบทวนซ้ำ

#### 2. ⚡ Speed Vocab Rush (โหมดจับเวลา)
- คำศัพท์จะลอยลงมาจากด้านบน หรือมีโจทย์ 4 ชอยส์ปรากฏขึ้นมาพร้อมเวลาถอยหลัง (10-15 วินาที/ข้อ)
- ทำ Streak คอมโบต่อเนื่องเพื่อรับแต้มคูณ x2, x3, x4
- ตัวช่วยพิเศษ (Power-ups):
  - ⏱️ **Time Freeze:** หยุดเวลา 5 วินาที
  - 💣 **50:50:** ตัด 2 ชอยส์ที่ผิดออก
  - 💡 **Hint:** แสดงตัวอักษรขึ้นต้นหรือตัวอย่างประโยค

#### 3. ⚔️ Vocab Boss Battle (RPG Dungeon)
- ผู้เล่นเลือกตัวละครนักผจญภัย ต่อสู้กับมอนสเตอร์ประจำด่าน (Slime -> Goblin -> Dragon)
- การตอบคำถามคำศัพท์ถูกต้อง = การโจมตีมอนสเตอร์ (Critical Hit เมื่อตอบได้เร็วภายใน 3 วินาที)
- ถ้าตอบผิด = มอนสเตอร์จะโจมตีผู้เล่น ลด HP
- บอสประจำด่านท้ายระดับ A1, A2, B1, B2 ทดสอบคำศัพท์รวม

#### 4. 🔤 Word Scramble & Spelling Builder
- แสดงความหมายภาษาไทยและเสียงอ่าน
- ผู้เล่นต้องกดเรียงแผ่นป้ายตัวอักษร (Letter Tiles) ให้สะกดเป็นคำศัพท์ที่ถูกต้อง

---

## 4. UI/UX & Art Direction 🎨

- **Theme & Style:** Modern Educational RPG / Sleek Cyber Academy (โทนสีน้ำเงิน Oxford Blue `#0A2540`, ทอง Royal Gold `#F5A623`, เขียวมรกต Emerald `#10B981`, ขาวคลีน Slate White)
- **Audio Feedback:**
  - Web Speech API (SpeechSynthesisUtterance) สำหรับออกเสียงคำศัพท์สำเนียง Native (en-US, en-GB)
  - Web Audio API Sound FX สำหรับเสียงคลิก, เสียงตอบถูก (Ding!), เสียงคอมโบ (Level-up chime), เสียงตอบผิด (Soft Buzz)
- **Responsive Layout:**
  - รองรับทั้งการเล่นแนวตั้ง (Portrait) บนมือถือ และแนวนอน (Landscape) บน Desktop

---

## 5. Technical Architecture & File Structure 📁

### File Structure

```
public/games/oxford-3000/
├── index.html                   ← Main Game Shell & UI Screens
├── css/
│   ├── main.css                 ← Core Styles, Theme Variables, Responsive Grids
│   ├── flashcard.css            ← 3D Flip Card Styles & Animations
│   └── battle.css               ← RPG Battle Arena & VFX Styles
├── js/
│   ├── app.js                   ← Entry point, Router & Screen Switcher
│   ├── data-loader.js           ← CSV Fetcher & Parser (PapaParse integration)
│   ├── srs-engine.js            ← Spaced Repetition (SM-2) Algorithm & LocalStorage
│   ├── audio-manager.js         ← Web Speech TTS & Sound FX Generator
│   ├── modes/
│   │   ├── flashcard-mode.js    ← Flashcard logic & SRS reviewer
│   │   ├── quiz-rush-mode.js    ← Speed Quiz & Combo engine
│   │   ├── boss-battle-mode.js  ← RPG Monster & Battle system
│   │   └── scramble-mode.js     ← Spelling & Tile dragging/clicking
│   └── ui-controller.js         ← HUD, Modals, Stats & Animations
├── data/
│   ├── oxford3000_master.csv    ← Full Database (3,000+ words)
│   ├── oxford_a1.csv            ← Segmented Level A1
│   ├── oxford_a2.csv            ← Segmented Level A2
│   ├── oxford_b1.csv            ← Segmented Level B1
│   └── oxford_b2.csv            ← Segmented Level B2
└── assets/
    ├── icons/                   ← Badges, swords, shield, potion icons
    └── sfx/                     ← Web Audio sound presets
```

---

## 6. Implementation Roadmap & Milestones 🗺️

| Sprint / Phase | Focus | Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Data Pipeline (Current)** | PDF Extraction & CSV Database | Script แปลง PDF เป็น `oxford3000_master.csv` พร้อมฟิลด์ความหมายและชอยส์ลวง |
| **Phase 2: Core Engine & Data Loader** | Game Shell & UI Framework | `index.html`, ระบบอ่าน CSV ด้วย PapaParse, ระบบ Web Speech TTS |
| **Phase 3: Flashcard & SRS** | Learning Mode | ระบบการ์ดคำศัพท์ 3D Flip, บันทึกสถานะคำศัพท์ใน LocalStorage |
| **Phase 4: Speed Quiz & Boss Battle** | Gamification Modes | Speed Quiz โหมดจับเวลา, RPG Boss Battle โจมตีมอนสเตอร์ |
| **Phase 5: Polish & Analytics** | Retention Tracking | กราฟสถิติคลังคำศัพท์ (Mastery %), CEFR Certificate, Mobile Polish |

---

## 7. Related Documents

- Project Index: [Project Index](../../index.md)
- Software System Design: [docs/software/01-system-design.md](../../software/01-system-design.md)
- Data Schema & Persistence: [docs/software/03-data-schema.md](../../software/03-data-schema.md)
- Product Backlog: [docs/agile/01-product-backlog.md](../../agile/01-product-backlog.md)
- Documentation Changelog: [docs/changelog.md](../../changelog.md)
