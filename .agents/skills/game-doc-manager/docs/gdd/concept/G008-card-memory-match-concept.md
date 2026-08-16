---
title: "G008: Card Memory Match — Game Concept & Architecture"
version: "1.0"
last_updated: "2026-07-27"
owner: "Game Dev Team"
status: "Active"
tags:
  - gdd
---

# G008: Card Memory Match — Game Concept & Architecture

**Version:** 1.0 | **Last Updated:** 2026-07-27 | **Owner:** Game Dev Team

## 1. Introduction

### Elevator Pitch
A classic memory card game built with Phaser 2D using the Kenney Playing Cards Pack. Players flip pairs of cards to find matching pairs, testing their memory and pattern recognition skills.

### Target Audience
Casual gamers, ages 8+, players who enjoy puzzle/memory games. Mobile and desktop friendly.

## 2. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Engine | Phaser 2 (Phaser 2.6+) | 2D sprite-based rendering |
| Framework | Vanilla JS | No additional framework |
| Assets | Kenney Playing Cards Pack | CC0 licensed |
| Build | None (static) | Direct browser loading |

## 3. Game Overview

- **Game Type:** Single-player memory card matching game
- **Modes:** Standard (4x4 grid, 8 pairs) or Custom (user selects grid size)
- **Objective:** Match all pairs in the fewest moves possible
- **Scoring:** Based on moves, time, and consecutive matches

## 4. System Architecture

```
Game
├── BootState (preload assets)
├── MenuState (game selection, settings)
├── GameState (core matching logic)
│   ├── CardManager (flip, match, track state)
│   ├── GridManager (layout, shuffle)
│   └── ScoringSystem (moves, time, streak)
└── EndState (results, replay)
```

## Related Documents
- Mechanics: [G008 Core Mechanics](./G008-card-memory-match-mechanics.md)
- Backlog: [Product Backlog](../agile/01-product-backlog.md)