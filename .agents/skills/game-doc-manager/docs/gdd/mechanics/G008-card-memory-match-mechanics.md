# G008: Card Memory Match — Core Mechanics

**Version:** 1.0 | **Last Updated:** 2026-07-27

## Core Loop
1. **Start Game** — Cards are shuffled face-down on a grid
2. **Flip Card** — Player clicks/taps a card to reveal it
3. **Flip Second Card** — Player selects another card
4. **Compare** — Cards match → stay face-up / Cards don't match → flip back
5. **Repeat** — Continue until all pairs are matched
6. **Result** — Show final stats (moves, time, accuracy)

## Player Actions

| Action | Input | Result | Notes |
|--------|-------|--------|-------|
| Select Card | Mouse Click / Touch | Flip card face-up | Can only flip one at a time |
| Confirm Match | (Auto) | If matched, cards stay face-up | Auto-processed |
| Re-roll Cards | Button | Shuffle remaining face-down cards | Limited uses |
| Restart Game | Button | Reset grid to new shuffle | Resets score |

## Game Systems

### Card Flipping System
Cards have two states: face-down and face-up. On click, cards flip with animation. Only one card can be face-up at a time during gameplay.

**Linked to Software Design:** [System Design](../../software/01-system-design.md)

### Match Detection System
When two cards are face-up, compare their values. If equal → mark as matched (remain visible). If not → flip both back after delay.

### Scoring System
- **Moves Counter:** Increment each card flip
- **Timer:** Stopwatch from first card flip to game completion
- **Accuracy:** Matched pairs / total attempts
- **Streak Bonus:** Consecutive correct matches award bonus points

## Win / Lose Conditions
- **Win:** All pairs matched (auto-advance to results)
- **Lose:** N/A (no failure state — just track efficiency)