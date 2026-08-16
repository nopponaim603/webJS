---
title: "Kenney Tiny Dungeon Pack — Asset Documentation"
project: "GameDevJS Hub (webJS)"
version: "1.0.0"
last_updated: "2026-08-16"
owner: "Noppon / Dev Team"
status: "Active"
tags:
  - documentation
---
# Kenney Tiny Dungeon Pack — Asset Documentation

**URL:** https://kenney.nl/assets/tiny-dungeon  
**Category:** 2D • Tiny  
**Tile Size:** 16 × 16 pixels  
**File Count:** ~130 files  
**License:** [Creative Commons CC0](https://creativecommons.org/publicdomain/zero/1.0/) (free, no attribution required)

---

## 🎮 Game Genre Suitability

| Tag | Relevance |
|-----|-----------|
| RPG | ✅ Core — dungeon crawler / adventure |
| Roguelike | ✅ Core — procedural dungeon, perma-death loops |
| Dungeon | ✅ Core — all tiles, enemies, loot in dungeon setting |
| Sewer | ✅ Secondary — underground/water levels |
| Pixel | ✅ Core — 16×16 pixel art aesthetic |

---

## 📁 Asset Breakdown

### 1. Tiles / Floor Tiles (Main Floor, Main Floor B, etc.)

| Tile Type | Quantity | Description |
|-----------|----------|-------------|
| `Main Floor` | 8 | Basic dungeon floor tiles (dark, cobble, etc.) |
| `Main Floor B` | 8 | Alternate floor variant |
| `Dark Room` | 8 | Darker floor variants |
| `Lava` | 8 | Hazard floor tiles (burning lava) |
| `Water` | 8 | Water tiles (can be walked on / hazard) |
| `Rat Hole` | 2 | Hole tile with rat sprite |
| `Door Frame` | 2 | Wooden door frames |
| `Pillars` | 6 | Structural columns / support |
| `Torch` | 4 | Lit torch (wall-mount) |

### 2. Enemies

| Enemy Type | Sprite Sheets | Notes |
|-----------|---------------|-------|
| `Bat` | 16×32 | Flying, 16 frames |
| `Skeleton` | 16×32 | Walking/standing, 16 frames |
| `Skull` | 16×16 | Stationary trap/obstacle |
| `Demon` | 16×32 | Fire/red enemy, 16 frames |
| `Slime` | 16×32 | Green blob enemy, 16 frames |
| `Worm` | 32×32 | Ground enemy, 16 frames |
| `Rat` | 16×32 | Small ground enemy, 16 frames |
| `Spider` | 16×32 | Wall-crawler, 16 frames |
| `Imp` | 16×32 | Small red imp, 16 frames |

### 3. Player Sprite

| Sprite | Size | Frames | Notes |
|--------|------|--------|-------|
| `Player` | 16×32 | 16 frames | Knight/warrior character with sprite sheet |

### 4. Loot / Items

| Item Type | Quantity | Description |
|-----------|----------|-------------|
| `Gold` | 10 | Coins of various amounts |
| `Gold Pile` | 6 | Stacked gold on floor |
| `Health Potions` | 4 | Red/green potions |
| `Keys` | 3 | Red, green, blue keys |
| `Chests (Closed)` | 3 | Red, green, blue chests |
| `Chests (Open)` | 3 | Open version of chests |
| `Shields` | 6 | Red, green, blue shield items |

### 5. Traps / Hazards

| Trap Type | Quantity | Description |
|-----------|----------|-------------|
| `Spike` | 3 | Floor spikes (red, green, blue) |
| `Saw` | 3 | Spinning saw blade (red, green, blue) |

### 6. Walls / Obstacles

| Wall Type | Quantity | Description |
|-----------|----------|-------------|
| `Walls` | Various | Corner, straight, T-piece, etc. |
| `Stairs` | 4 | Up/Down variants |

### 7. Effects / Misc

| Effect | Quantity | Description |
|--------|----------|-------------|
| `Particles` | 16 | Fire/explosion particle effects |

---

## 🎨 Sprite Sheet Layout

### Player Sprite Sheet (16×32, 16 frames)
```
Row 0-7: Standing / Idle (frames 0-7)
Row 0-7: Walking animation (frames 8-15)
```

### Enemy Sprite Sheets (16×32, 16 frames each)
- Bat, Skeleton, Demon, Slime, Worm, Rat, Spider, Imp
- Each has 16 animation frames per sheet

### Loot Sprite Sheets
- Gold: Individual frames for each denomination
- Keys: Single-frame sprites for each color
- Chests: Closed + Open variants, 3 colors each

---

## 🔗 Tile Dimensions

```
All base tiles: 16 × 16 pixels
Enemies/Player: 16 × 32 pixels (2 tile rows)
Large sprites: 32 × 32 pixels
```

---

## 💡 Suggested Usage for Roguelike

| Game Element | Asset Used | Notes |
|-------------|-----------|-------|
| Dungeon floor | Main Floor, Dark Room | Base level geometry |
| Player character | Player sprite | 16×32, walk animation |
| Enemies | All enemy sheets | Mix of types per level |
| Collectibles | Gold, Chests, Keys, Potions | Loot drops & chests |
| Hazards | Lava, Water, Spikes, Saw | Damage zones |
| Environment | Walls, Pillars, Torches | Level decoration |
| Effects | Particles | Hit/death animations |

---

## 📦 File Format

- **PNG sprites** (16×16 or 16×32)
- **Sprite sheet PNG** (combined sheets for batching)
- **XML sheet definitions** (Atlas/texture pack format)

---

## 📊 Stats

| Metric | Value |
|--------|-------|
| Total sprites | ~130+ |
| Tile size | 16×16 |
| Total file size | ~200KB (estimate) |
| License | CC0 (public domain) |
| Compatible with | Phaser 3, PixiJS, any 2D engine |