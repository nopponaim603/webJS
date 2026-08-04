# 📈 Level Design: Character Growth, Shop Draft & Synergy Mechanics

**Game:** Tiny Dungeon Squad — SNKRX Edition (`tiny-dungeon-squad`)  
**File:** [`public/games/tiny-dungeon-squad/game.js`](../../../../public/games/tiny-dungeon-squad/game.js)  
**Last Updated:** 2026-08-04  

---

## 1. Design Goal

ในเกม Tiny Dungeon Squad การพัฒนาความแข็งแกร่งของทีมขับเคลื่อนด้วย **ระบบเศรษฐกิจ ร้านค้า และ Synergy สไตล์ SNKRX** 

ผู้เล่นพัฒนาความแข็งแกร่งของทีมผ่าน 4 กลไกหลัก:
1. **การขยายขนาดทีม (Squad Capacity)**: ซื้อการขยายความจุขบวนจาก 3 ตัวสูงสุดถึง 7+ ตัว
2. **การผสมยูนิต 3 ตัว (Auto-Merge Tier System)**: รวมฮีโร่ชนิดเดียวกัน 3 ตัวยกระดับเป็น Tier 2 (★★) และ 3 ตัวของ Tier 2 รวมเป็น Tier 3 (★★★)
3. **การเปิดใช้งาน Class Synergies (Auto-Chess Synergies)**: ผสมสายอาชีพเดียวกันให้ได้ตามจำนวนเกณฑ์ (2/4 ตัว) เพื่อสร้างคอมโบโบนัสทั้งทีม
4. **การบริหารการเงิน (Gold Economy & Interest)**: บริหารการใช้จ่าย Reroll และเก็บเงินสะสมเพื่อรับดอกเบี้ย

---

## 2. Hero Roster & Base Stats

| Hero Class | Sprite Tile | Primary Class | Secondary Class | Base HP | Base Dmg | Attack Cooldown | Attack Type |
|---|:---:|---|---|:---:|:---:|:---:|---|
| **Knight** | `tile_0096` | Warrior | Tank | 180 | 35 | 900ms | Melee Cleave Cone (130°) |
| **Wizard** | `tile_0084` | Mage | Sorcerer | 80 | 65 | 1400ms | Ranged Fireball + AoE Splash |
| **Rogue** | `tile_0086` | Rogue | Assassin | 110 | 25 | 600ms | Critical Dagger (30% Crit) |
| **Priest** | `tile_0087` | Healer | Buffer | 100 | 15 | 2000ms | Radiance Healing Pulse |
| **Ranger** | `tile_0085` | Ranger | Ranged | 100 | 30 | 800ms | Piercing Arrow (Bores through targets) |
| **Paladin** | `tile_0097` | Tank | Warrior | 220 | 20 | Continuous | Orbiting Holy Shield Ring |
| **Necromancer** | `tile_0111` | Sorcerer | Curser | 90 | 40 | 1200ms | Venom Bolt + Poison Floor Area |
| **Bard** | `tile_0088` | Buffer | Enchanter | 95 | 15 | 2500ms | Haste Speed Aura (Buffs Team) |

---

## 3. Tier Merging Formulas

เมื่อมีฮีโร่ชนิดเดียวกันอยู่ในทีมหรือคลังครบ 3 ตัว ระบบจะรวมร่างทันที:

```js
// Tier 1 -> Tier 2 (Requires 3x Tier 1)
Tier2.maxHp = Tier1.maxHp * 2.0;
Tier2.damage = Tier1.damage * 1.75;
Tier2.scale = 1.25; // Sprite Visual Scale

// Tier 2 -> Tier 3 (Requires 3x Tier 2)
Tier3.maxHp = Tier1.maxHp * 3.5;
Tier3.damage = Tier1.damage * 2.5;
Tier3.scale = 1.5; // Sprite Visual Scale
```

---

## 4. Class Synergies Breakdown

```js
const SYNERGIES = {
  warrior: { name: 'Warrior', thresholds: [2, 4], armorBonus: [0.25, 0.60] },
  mage: { name: 'Mage', thresholds: [2, 4], spellDmgBonus: [0.30, 0.70], extraProj: [1, 1] },
  rogue: { name: 'Rogue', thresholds: [2, 4], critChance: [0.25, 0.50], moveSpeed: [0.25, 0.25] },
  ranger: { name: 'Ranger', thresholds: [2, 4], attackSpeed: [0.30, 0.65], pierce: [1, 2] },
  healer: { name: 'Healer', thresholds: [2, 4], healPct: [0.08, 0.20], healIntervalMs: 3000 },
  sorcerer: { name: 'Sorcerer', thresholds: [2, 4], aoeRadiusBonus: [0.40, 0.90], slowPct: [0.40, 0.40] },
  tank: { name: 'Tank', thresholds: [2, 4], maxHpBonus: [0.35, 0.80], reflectPct: [0.20, 0.40] },
  buffer: { name: 'Buffer', thresholds: [2, 4], synergyMultiplier: [1.25, 1.50] }
};
```

---

## 5. Economy & Shop Pacing

### 5.1 Gold Income & Interest
- **Wave Reward**: `5 + WaveNumber * 2` Gold
- **Interest Cap**: ได้รับ +1 Gold ต่อทุกๆ 5 Gold ที่มีอยู่เมื่อจบ Wave (สูงสุดไม่เกิน +5 Gold)

### 5.2 Squad Capacity Upgrade Curve
- Initial Capacity: **3 Heroes**
- Level 2 (4 Heroes): **4 Gold**
- Level 3 (5 Heroes): **8 Gold**
- Level 4 (6 Heroes): **14 Gold**
- Level 5 (7 Heroes): **22 Gold**

---

## Related Documents
- [Game Spec](spec.md)
- [Level Design: Monster Spawning](level-design-monster-spawning.md)
- [Project Index](../../index.md)
