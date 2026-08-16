---
title: "👾 Level Design: Monster Spawning & Wave Arena Pacing"
project: "Tiny Dungeon Squad"
version: "1.0.0"
last_updated: "2026-08-04"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - gdd
  - tiny-dungeon-squad
---
# 👾 Level Design: Monster Spawning & Wave Arena Pacing

**Game:** Tiny Dungeon Squad — SNKRX Edition (`tiny-dungeon-squad`)  
**File:** [`public/games/tiny-dungeon-squad/game.js`](../../../../public/games/tiny-dungeon-squad/game.js)  

---

## 1. Design Goal

ในระบบ Arena Wave การเกิดของมอนสเตอร์แบ่งออกเป็น **20 Wave หลัก** โดยแต่ละ Wave จะมีระยะเวลา 25 - 40 วินาที เมื่อหมดเวลาและกำจัดมอนสเตอร์ระลอกสุดท้ายหมด จะถือว่าชนะ Wave และเข้าสู่หน้าร้านค้า

---

## 2. Wave Schedule & Boss Rounds

| Wave Range | Wave Duration | Enemy Types Spawning | Spawn Rate | Special Features / Bosses |
|---|:---:|---|:---:|---|
| **Wave 1 - 4** | 25s | Skeleton, Zombie, Goblin | 1.2s | ทำความเข้าใจระบบ Snake & Shop |
| **Wave 5** | 30s | Skeleton, Zombie, Goblin + **Minotaur Boss** | 1.0s | 🛡️ **Mini-Boss Wave 1 (Minotaur)** |
| **Wave 6 - 9** | 30s | + Enemy Mage, Enemy Swordsman, Ogre | 0.9s | มอนสเตอร์เริ่มอึดขึ้นและเคลื่อนที่เร็วขึ้น |
| **Wave 10** | 35s | + Red Demon, Blue Demon + **Minotaur Duo** | 0.8s | 🛡️ **Mini-Boss Wave 2 (Double Minotaur)** |
| **Wave 11 - 14** | 35s | All Mob Types + Swarm Ambush | 0.7s | เพิ่มความถี่ Swarm Rush 60° |
| **Wave 15** | 40s | All Mobs + **Reaper Boss** | 0.6s | ☠️ **Major Boss Wave (Reaper)** |
| **Wave 16 - 19** | 40s | High Density Swarm Waves | 0.5s | มอนสเตอร์เกิดพร้อมกันจำนวนมากกดดันทีม |
| **Wave 20** | 45s | Final Ambush + **Reaper & Minotaur Trio** | 0.4s | 👑 **FINAL BOSS WAVE (Victory Threshold)** |

---

## 3. Monster Scaling Formula

ค่า HP และ Speed ของมอนสเตอร์สเกลตามระดับ Wave:

```js
const hpMultiplier = 1.0 + (waveNumber - 1) * 0.22;
enemy.maxHp = Math.floor(baseHp * hpMultiplier);
```

---

## Related Documents
- [Game Spec](spec.md)
- [Level Design: Character Growth & Shop Mechanics](level-design-character-growth.md)
- [Project Index](../../index.md)
