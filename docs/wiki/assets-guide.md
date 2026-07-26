# 🎨 Game Assets Guide & Game Ideas (`public/assets`)

**Version:** 1.0.0 | **Last Updated:** 2026-07-26  
**Maintained by:** Antigravity AI & Dev Team  
**Location:** `public/assets/`

---

## 📖 ภาพรวม (Overview)

เอกสารนี้รวบรวมข้อมูลรายการ **Game Assets** ทั้งหมดที่มีอยู่ในโฟลเดอร์ `public/assets/` ของโปรเจค **GameDevJS Hub (`webJS`)** พร้อมข้อเสนอแนะและไอเดียการนำ Asset แต่ละชุดไปพัฒนาเป็นเกม HTML5 / Phaser 3 / Babylon.js หรือระบบย่อยในมินิเกม

---

## 🗂️ รายการ Assets และไอเดียการสร้างเกม (Assets & Game Ideas Catalog)

| โฟลเดอร์ Asset | ประเภทงานศิลป์ (Art Style) | รูปแบบเกมที่เหมาะสม (Recommended Game Types) | Engine ที่แนะนำ |
| :--- | :--- | :--- | :--- |
| [`icons/`](#1-icons) | App Icons | System UI / PWA Launcher / Branding | Next.js / HTML5 |
| [`kenney_boardgame-pack/`](#2-kenney_boardgame-pack) | 2D Vector / Flat | Board Game / Dice / Monopoly / Tabletop | Phaser 3 / HTML5 |
| [`kenney_fish-pack_2/`](#3-kenney_fish-pack_2) | 2D Vector / Cartoon | Fish Feeding / Fishing Arcade / Endless Swimmer | Phaser 3 |
| [`kenney_pico-8-platformer/`](#4-kenney_pico-8-platformer) | 8-bit Pixel Art (8x8) | Retro Platformer / Precision Jump / Tower Climber | Phaser 3 (Tilemap) |
| [`kenney_pixel-shmup/`](#5-kenney_pixel-shmup) | Pixel Art Space | Space Shooter / Vertical Shmup / Bullet Hell | Phaser 3 |
| [`kenney_playing-cards-pack/`](#6-kenney_playing-cards-pack) | 2D Vector Cards | Solitaire / Blackjack / Poker / Memory Match | HTML5 / Phaser 3 |
| [`kenney_puzzle-pack-2/`](#7-kenney_puzzle-pack-2) | Colorful Blocks & Tiles | Match-3 / Block Puzzle / Tetris / Tap-to-Clear | Phaser 3 / HTML5 |
| [`kenney_simple-space/`](#8-kenney_simple-space) | 2D Vector Space | Lunar Lander / Orbit Physics / Space Runner | Phaser 3 / Babylon.js |
| [`kenney_tiny-farm/`](#9-kenney_tiny-farm) | Pixel Art Farm (16x16) | Farming Sim / Idle Farm Tycoon / Merge Crops | Phaser 3 (Tilemap) |

---

### 1. `icons/`
- **พาธ:** `public/assets/icons/`
- **รายละเอียด:** ไอคอน PWA รูปแบบ 192x192px และ 512x512px
- **การนำไปใช้งาน:**
  - ใช้เป็น Favicon และ App Launcher Icon สำหรับระบบ PWA (Progressive Web App)
  - ใช้ในหน้า UI Header, Navigation Bar หรือ Modal ต้อนรับของเว็บไซต์

---

### 2. `kenney_boardgame-pack`
- **พาธ:** `public/assets/kenney_boardgame-pack/`
- **องค์ประกอบหลัก:** ลูกเต๋า (Dice 6 ด้านหลากสี), ตัวเดิน (Pawns/Tokens), ชิปการ์ด, แผ่นกระดาน, โทเคนแต้ม
- **ไอเดียเกมที่สร้างได้:**
  1. **Monopoly / เกมเศรษฐี HTML5 (Turn-based Board Game):**
     - ระบบทอยลูกเต๋า เดินตามช่อง ซื้อ/อัปเกรดพื้นที่ เก็บค่าเช่า
  2. **Snakes & Ladders / Ludo (เกมบันไดงู / ลูโด):**
     - เกมกระดานผู้เล่น 2-4 คน ทอยลูกเต๋าเดินข้ามสิ่งกีดขวาง
  3. **Checkers & Carrom Variant (เกมกระดานใช้วัตถุกระแทก):**
     - ใช้ชิปโทเคนยิงดีดสะท้อนขอบกระดานโดยใช้ Arcade Physics
  4. **Tabletop Card-Board Hybrid:**
     - เกมการ์ดวางกลยุทธ์บนกระดานสี่เหลี่ยมผืนผ้า

---

### 3. `kenney_fish-pack_2`
- **พาธ:** `public/assets/kenney_fish-pack_2/`
- **องค์ประกอบหลัก:** ตัวละครปลาหลากสายพันธุ์, สัตว์ทะเล (แมงกะพรุน, ปู, กุ้ง, ปะการัง), ฟองน้ำ, เหยื่อ/เบ็ดตกปลา, พื้นหลังใต้น้ำ
- **ไอเดียเกมที่สร้างได้:**
  1. **Feeding Frenzy Style (เกมปลาใหญ่กินปลาเล็ก):**
     - ควบคุมปลาตัวเล็ก กินปลาที่ขนาดเล็กกว่าเพื่อเติบโต หลบปลาตัวใหญ่และแมงกะพรุนพิษ
  2. **Arcade Fishing Simulator (เกมตกปลา):**
     - ควบคุมคันเบ็ดหย่อนลงน้ำ เลือกความลึก จังหวะดึงสายเบ็ด และเก็บสะสมพันธุ์ปลาลงตู้
  3. **Flappy Fish / Endless Swimmer:**
     - ควบคุมปลาว่ายน้ำทรงตัวขึ้น-ลง หลบปะการังและโขดหินใต้น้ำ เก็บคะแนนระยะทาง
  4. **Aquarium Idle Collector:**
     - เกมคลิกเกอร์/บริหารตู้ปลา ซื้อพันธุ์ปลา ให้อาหาร และตกแต่งสิ่งแวดล้อมใต้น้ำ

---

### 4. `kenney_pico-8-platformer`
- **พาธ:** `public/assets/kenney_pico-8-platformer/`
- **องค์ประกอบหลัก:** กราฟิกพิกเซล 8x8 สไตล์คลาสสิก Pico-8, ตัวละครเดิน/กระโดด, ไทล์พื้นดิน/หิน/หนาม, เหรียญทอง, ศัตรูพิกเซล, ประตูและกุญแจ
- **ไอเดียเกมที่สร้างได้:**
  1. **Retro 2D Side-scrolling Platformer (เกมกระโดดผ่านด่านย้อนยุค):**
     - วิ่ง กระโดด หลบหนาม/ศัตรู เก็บเหรียญ และหากุญแจไขประตูไปด่านถัดไป
  2. **Precision Platformer (เกมทดสอบไหวพริบสไตล์ Celeste):**
     - ด่านขนาดสั้นเน้นการกระโดดเกาะผนัง (Wall jump) จังหวะแม่นยำ
  3. **Infinite Tower Climber (เกมกระโดดขึ้นหอคอย):**
     - ตัวละครกระโดดขึ้นแท่นลอยฟ้าเรื่อยๆ โดยมีระดับน้ำหรือลาวาดันขึ้นมาจากด้านล่าง
  4. **Mini Metroidvania / Dungeon Crawler:**
     - สำรวจเขาวงกตพิกเซล เก็บทักษะใหม่ (Double Jump, Dash) เพื่อเปิดเส้นทางใหม่

---

### 5. `kenney_pixel-shmup`
- **พาธ:** `public/assets/kenney_pixel-shmup/`
- **องค์ประกอบหลัก:** ยานอวกาศพิกเซล (ยานผู้เล่น & ยานศัตรู), กระสุน/เลเซอร์สีสดใส, อุกกาบาต, เอฟเฟกต์การระเบิด, ไทล์ฉากหลังอวกาศ
- **ไอเดียเกมที่สร้างได้:**
  1. **Vertical Space Shooter (Galaga / Space Invaders / Raiden Style):**
     - ยานเคลื่อนที่แนวนอน/แนวตั้ง ยิงคลื่นยานศัตรูที่ลอยลงมา เก็บ Power-up เพิ่มจำนวนกระสุน
  2. **Bullet Hell Boss Rush:**
     - สู้กับยานบอสขนาดใหญ่ที่ปล่อยกระสุนกระจายหลายทิศทาง ผู้เล่นต้องหลบหลีกในช่องแคบ
  3. **Asteroid Survival / Shooter:**
     - ยิงทำลายอุกกาบาตที่แตกตัวเป็นชิ้นเล็กชิ้นน้อย พร้อมเก็บโล่ป้องกัน
  4. **Space Defense Arcade:**
     - ปกป้องฐานจากยานศัตรูที่บุกเข้ามาจากขอบจอ

---

### 6. `kenney_playing-cards-pack`
- **พาธ:** `public/assets/kenney_playing-cards-pack/`
- **องค์ประกอบหลัก:** สำรับไพ่มาตรฐานครบ 52 ใบ (4 ดอก: ♠ Spades, ♥ Hearts, ♦ Diamonds, ♣ Clubs A-K), หลังไพ่หลายสี, โต๊ะผ้าสักหลาดกำมะหยี่
- **ไอเดียเกมที่สร้างได้:**
  1. **Classic Solitaire Collection (Solitaire / Klondike / Spider / FreeCell):**
     - เกมไพ่คนเดียว จัดเรียงชุดไพ่ตามสีและลำดับแต้ม
  2. **Blackjack 21 & Card Duel:**
     - เกมดวลแต้มไพ่กับ AI ดีลเลอร์ คำนวณความเสี่ยงและแต้มรวม
  3. **Card Matching / Memory Pair Game:**
     - คว่ำไพ่แล้วเปิดจับคู่ไพ่ที่มีแต้มหรือดอกเดียวกัน
  4. **Roguelike Deckbuilder (Mini Slay the Spire Style):**
     - ใช้ไพ่แต่ละใบเป็นสกิลโจมตี/ป้องกันในการต่อสู้แบบ Turn-based

---

### 7. `kenney_puzzle-pack-2`
- **พาธ:** `public/assets/kenney_puzzle-pack-2/`
- **องค์ประกอบหลัก:** บล็อกปริศนาสีสันสดใส, ชิ้นส่วนเรขาคณิต, กรอบตาราง puzzle, ไทล์สัญลักษณ์, ปุ่ม UI และไอคอนเอฟเฟกต์
- **ไอเดียเกมที่สร้างได้:**
  1. **Match-3 Candy / Jewel Swap:**
     - สลับตำแหน่งบล็อกสีเดียวกัน 3 ชิ้นขึ้นไปเพื่อทำลายและสะสม Combo
  2. **Tap-to-Clear / Color Collapse Puzzle:**
     - แตะกลุ่มบล็อกสีเดียวกันที่อยู่ติดกันตั้งแต่ 2 ชิ้นขึ้นไปเพื่อทำลาย
  3. **Tetris / Block Drop Variant:**
     - ท่อยชิ้นส่วนเรขาคณิตลงมาจัดเรียงให้เต็มแถว horizontal/vertical
  4. **Sliding Puzzle / Color Sorting Game:**
     - จัดเรียงบล็อกสีตามลำดับเป้าหมายที่กำหนดในจำนวนก้าวที่จำกัด

---

### 8. `kenney_simple-space`
- **พาธ:** `public/assets/kenney_simple-space/`
- **องค์ประกอบหลัก:** กราฟิกเวกเตอร์ยานอวกาศ จรวด ดาวเคราะห์ จานบิน UFO สถานีอวกาศ อุกกาบาต และ UI ธีมอวกาศ
- **ไอเดียเกมที่สร้างได้:**
  1. **Lunar Lander Physics Game:**
     - บังคับไอพ่นจรวดและทิศทาง เพื่อนำยานลงจอดบนแท่นลงจอดของดาวเคราะห์ภายใต้แรงดึงดูด
  2. **Gravitational Slingshot (Angry Birds Space Style):**
     - ยิงจรวดโค้งผ่านสนามแรงดึงดูดของดาวเคราะห์ต่างๆ ไปยังเป้าหมาย
  3. **Endless Space Runner / Galaxy Flyer:**
     - บังคับยานบินผ่านห้วงอวกาศ หลบหลีกดาวตกและจานบิน UFO เก็บพลังงานเชื้อเพลิง
  4. **Space Station Tycoon / Idle Planet Explorer:**
     - ส่งยานออกไปสำรวจดาวเคราะห์ นำทรัพยากรกลับมาอัปเกรดสถานีอวกาศ

---

### 9. `kenney_tiny-farm`
- **พาธ:** `public/assets/kenney_tiny-farm/`
- **องค์ประกอบหลัก:** ไทล์เซ็ตพิกเซล 16x16 พืชผล (ผัก ข้าว ผลไม้), สัตว์ฟาร์ม (วัว หมู ไก่ แะ), รั้วกั้น, เครื่องมือเกษตร, แปลงดิน, บ้านฟาร์ม
- **ไอเดียเกมที่สร้างได้:**
  1. **Farming Simulator / Idle Farm Tycoon:**
     - พรวนดิน ปลูกพืช รดน้ำ เก็บเกี่ยวผลผลิต นำไปขายในตลาดเพื่อนำเงินมาขยายฟาร์ม
  2. **Farm Merge Crops Game:**
     - ผสาน (Merge) พืชชนิดเดียวกัน 3 ต้นเพื่ออัปเกรดเป็นพืชระดับสูงกว่า
  3. **Animal Corral / Herding Arcade:**
     - ต้อนสัตว์ฟาร์มกลับเข้าคอกก่อนเวลาหมด โดยหลบสิ่งกีดขวาง
  4. **Top-down 2D Farm RPG (Stardew Valley Mini):**
     - ตัวละครเดินสำรวจฟาร์ม ปลูกผัก เลี้ยงสัตว์ และทำเควสต์ส่งของ

---

## 🛠️ แนวทางการปฏิบัติตามมาตรฐานการพัฒนา (Best Practices)

1. **การโหลดและจัดเก็บ Assets (Phaser 3 / Engine Preloading):**
   - ควรโหลด Asset ผ่าน `this.load.image()` หรือ `this.load.spritesheet()` ในช่วง `preload()` ของ Scene
   - สำหรับ Tilemap (เช่น `kenney_pico-8-platformer` หรือ `kenney_tiny-farm`) ให้ใช้ `this.load.tilemapTiledJSON()` หรือ `this.load.spritesheet()`
2. **การรักษาอัตราส่วนและ Performance:**
   - Asset พิกเซล (Pico-8, Pixel Shmup, Tiny Farm) ควรกำหนด `pixelArt: true` หรือ `roundPixels: true` ใน Phaser Config เพื่อให้ภาพคมชัดไม่เบลอ
   - Asset เวกเตอร์ (Simple Space, Boardgame, Fish Pack) สามารถปรับขนาด Transform Scale ได้โดยไม่เสียความละเอียด

---

## 🔗 เอกสารที่เกี่ยวข้อง (Related Documents)
- [Project Index](../index.md)
- [Project Knowledge Wiki](./wiki.md)
- [Art & UI/UX Direction](../gdd/03-art-direction.md)
- [Game Concept & Architecture](../gdd/00-concept.md)
