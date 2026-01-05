# Game of Life

Conway's Game of Life implementation with Svelte + TypeScript + Vite.

## Rules (Conway's Classic)

Cellular automaton on infinite 2D grid. Each cell is alive or dead.

**Next generation rules:**
1. **Survival** - Live cell with 2-3 neighbors survives
2. **Birth** - Dead cell with exactly 3 neighbors becomes alive
3. **Death** - All other cells die (underpopulation <2, overpopulation >3)

## Features

- Infinite grid (sparse Set-based storage)
- Pan & zoom
- Preset patterns (gliders, oscillators, etc.)
- Pattern rotation
- Generation/population stats
- Theme support

## Tech

- Svelte 5
- TypeScript
- Vite
- Canvas rendering

## Dev

```bash
npm install
npm run dev
```

## Future

- [ ] Battle Mode - two colonies fighting (#2)
