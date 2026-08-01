# [US-09-01] Ocean Frenzy — Complete Feeding Frenzy Game Mechanics

**System Group / Module:** Game Mechanics / Phaser 3 Arcade  
**Status:** 🟢 DONE  
**Related Code Files:** `public/games/ocean-frenzy/index.html`, `public/games/ocean-frenzy/game.js`

### 1. User Story Statement
- **As a** player
- **I want** to steer a small fish, eat smaller prey to gain score and level up, avoid larger predators and jellyfish hazards, and collect speed boost power-ups
- **So that** I can grow into the ultimate sea king and achieve the highest score

### 2. Acceptance Criteria
- [x] Smooth pointer steering control for PC (mouse) and Mobile (touch drag)
- [x] Spawning of 7 prey fish types and 2 large predator fish types
- [x] Size comparison mechanics for eating fish (`playerW >= preyW * 0.7`)
- [x] 9-level growth evolution (`Small` ➔ `KING`) with scaling player sprite size
- [x] 3 lives system with screen tint, camera shake, and floating damage texts
- [x] Jellyfish hazard (`jellyfish`) causing 3-second speed slowdown (-50%) with electric sting sound
- [x] Speed boost item (`bubble_item`) granting 5-second speed boost (+50%) with gold particle effects
- [x] Procedural Web Audio API synthesizer for all sound effects (eat, levelup, hit, sting, boost, gameover)
- [x] Glassmorphism HUD (Score, Level, Lives, Growth progress bar)
- [x] Game Over screen with High Score persistence in `localStorage`

### 3. Implementation Summary
- **Phaser 3 Scene Architecture:** Built with `PreloadScene` and `MainScene`.
- **Dynamic Synthesizer:** Zero external audio file dependency using Web Audio API oscillators.
- **Particle Systems:** Ambient seabed bubbles, player trail, eat bursts, sting bursts, speed boost bursts, level up explosions.
