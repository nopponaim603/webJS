# Data Schema & Persistence — webJS Game Portfolio

**Version:** 1.0.0 | **Last Updated:** 2026-07-26

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
}
```

---

## 2. LocalStorage Persistence Schema

ระบบบันทึกคะแนนและตั้งค่าของผู้ใช้จะบันทึกลงใน Browser `localStorage`:

```json
{
  "webjs_portfolio_theme": "dark",
  "webjs_highscore_emoji_match": 1420,
  "webjs_highscore_2048_cubes": 8192,
  "webjs_highscore_tile_match": 3500,
  "webjs_recent_played": ["tile-match", "emoji-match"]
}
```

---

## Related Documents
- System Design: [Software System Design](./01-system-design.md)
- Product Backlog: [Product Backlog](../agile/01-product-backlog.md)
