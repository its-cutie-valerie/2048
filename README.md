# TILE SLAYER 2048

A fast-paced, arcade-inspired twist on the classic 2048 puzzle game. Race against the clock, merge tiles, and survive as long as possible in this retro-styled challenge.

## Overview

TILE SLAYER 2048 combines the addictive tile-merging mechanics of 2048 with time pressure, random events, and a distinctive retro aesthetic. The game features a day/night cycle, multiple difficulty modes, a rewind mechanic, and procedurally generated sound effects.

## Features

### Core Gameplay
- **Classic 2048 Mechanics**: Slide tiles in any direction to merge matching numbers
- **Time-Based Challenge**: Earn time by merging tiles; every merge extends your survival
- **Multiple Difficulty Modes**:
  - *Baby Mode*: Extended timers and reduced hazards for casual play
  - *Marine*: Standard difficulty for a balanced experience
  - *Nightmare*: Aggressive time limits and frequent hazards for veterans

### Special Mechanics
- **Time Rewind**: Undo your last move with limited rewind charges (press R or click the REWIND button)
- **Day/Night Cycle**: Time bonuses fluctuate based on the current phase (Dawn, Day, Dusk, Night)
- **Random Events**:
  - Soul Sphere: Grants bonus time
  - Power-Up: Spawns high-value tiles
  - Demon Bomb: Spawns explosive tiles that detonate after a countdown
  - Ice Demon: Freezes tiles in place, preventing movement
  - Chaos Magic: Randomly shuffles tile positions on the board

### Controls
- **Desktop**: Arrow keys or WASD to move tiles; R to rewind
- **Mobile**: Swipe in any direction; tap buttons for rewind and menu actions
- **Mouse**: Click and drag on the game grid to slide tiles

### Audio
- Procedurally generated sound effects using the Web Audio API
- Background chiptune-style music
- Independent toggles for sound effects and music

### Visual Design
- Retro arcade aesthetic with pixel fonts and CRT-inspired effects
- Dark and light theme support
- Smooth tile animations and screen effects for events

### Data Persistence
- High scores saved locally per difficulty mode
- Sound, music, and theme preferences persist between sessions

## Getting Started

1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. Select a difficulty and start playing

No build step or dependencies required beyond a browser that supports ES6 and the Web Audio API.

## Project Structure

```
2048/
├── index.html    # Main HTML structure and game UI
├── style.css     # Complete styling with CSS variables for theming
├── script.js     # Game logic, audio systems, and event handling
└── README.md     # This file
```

## Browser Support

Tested and compatible with:
- Chrome / Chromium-based browsers
- Firefox
- Safari
- Edge

Mobile browsers are fully supported with touch and swipe controls.

## Roadmap

### Planned Features
- [ ] Online leaderboards with score submission
- [ ] Additional tile themes and visual skins
- [ ] Achievement system with unlockable rewards
- [ ] Daily challenge mode with unique constraints
- [ ] Statistics tracking (total games played, average score, highest tile reached)

### Under Consideration
- Sound pack customization
- Colorblind mode with enhanced tile patterns
- Animated background themes
- Multiplayer or versus mode

## Technical Notes

- All audio is synthesized in real-time using the Web Audio API; no external audio files are required
- Game state and UI updates occur at 60fps with requestAnimationFrame for smooth animations
- CSS variables enable instant theme switching without reloads
- Touch handling includes gesture detection with configurable swipe thresholds

## License

This project is provided as-is for personal and educational use.

---

*Rip and merge until it is done.*
