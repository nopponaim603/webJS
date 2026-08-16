---
title: "Data Schema & Persistence — webJS Game Portfolio"
version: "1.1.0"
last_updated: "2026-07-28"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - software
---

# Data Schema & Persistence — webJS Game Portfolio

**Version:** 1.1.0 | **Last Updated:** 2026-07-28

---

## 1. Portfolio Game Registry Data Schema (`script.js`)

```typescript
interface GameItem {
    id: string | number;         // รหัสประจำเกม (e.g. "emoji-match", "2048-cubes", "tile-match")
    title: string;               // ชื่อเกม
    category: string;            // หมวดหมู่เกม (e.g. "ปริศนา / ฝึกสมอง", "ปริศนา / ฟิสิกส์")
    url?: string;                // เส้นทางไฟล์ HTML ของเกม (e.g. "emoji-match/index.html")
    aspectRatio?: string;        // อัตราส่วนหน้าจอของ Modal Iframe (e.g. "390 / 480", "1 / 1.5")
    image: string;               // URL รูปภาพปกการ์ดเกม
    gradient: string;            // CSS Gradient background
    highScore?: number;          // คะแนนสูงสุดที่ดึงมาจาก LocalStorage
}
```

---

## 2. Cross-Iframe Message Payload Schema (`window.postMessage`)

เมื่อมินิเกมทำงานเสร็จสิ้นหรือทำคะแนนใหม่ มินิเกมจะส่ง Payload ในรูปแบบต่อไปนี้ไปยัง Host Window (`script.js`):

```typescript
interface HighScoreMessagePayload {
    type: 'WEBJS_HIGH_SCORE_UPDATE';  // Identifies postMessage event type
    gameId: string;                    // รหัสประจำเกม (e.g. "emoji-match")
    score: number;                     // คะแนนล่าสุดที่ทำได้ในเกม
    timestamp?: number;                // UNIX timestamp
}
```

---

## 3. LocalStorage Persistence Schema

ระบบบันทึกคะแนนและตั้งค่าของผู้ใช้จะบันทึกลงใน Browser `localStorage` ภายใต้ Key หลัก `webjs_highscores` และ `webjs_settings`:

```json
{
  "webjs_settings": {
    "theme": "dark",
    "soundMuted": false,
    "recentPlayed": ["tile-match", "emoji-match", "2048-cubes"]
  },
  "webjs_highscores": {
    "emoji-match": 1420,
    "2048-cubes": 8192,
    "tile-match": 3500,
    "space-shooter": 12500,
    "cyber-sphere": 4800,
    "match3": 9600,
    "3d-platformer": 520
  }
}
```

---

## Related Documents
- System Design: [Software System Design](./01-system-design.md)
- Class Diagram: [Class Diagram & Data Flow](./02-class-diagram.md)
- Product Backlog: [Product Backlog](../agile/01-product-backlog.md)
