import type { Cell } from '../engine/GameEngine';

export interface Pattern {
  name: string;
  description: string;
  category: 'still' | 'oscillator' | 'spaceship' | 'gun' | 'methuselah';
  cells: Cell[];
  width: number;
  height: number;
}

// Helper to create cells from a string pattern
function parsePattern(pattern: string): { cells: Cell[]; width: number; height: number } {
  const lines = pattern.trim().split('\n');
  const cells: Cell[] = [];
  let maxWidth = 0;

  lines.forEach((line, y) => {
    maxWidth = Math.max(maxWidth, line.length);
    for (let x = 0; x < line.length; x++) {
      if (line[x] === 'O' || line[x] === '*' || line[x] === '#') {
        cells.push({ x, y });
      }
    }
  });

  return { cells, width: maxWidth, height: lines.length };
}

// Rotate pattern 90 degrees clockwise
export function rotatePattern(cells: Cell[], width: number, height: number): { cells: Cell[]; width: number; height: number } {
  const rotated = cells.map((cell) => ({
    x: height - 1 - cell.y,
    y: cell.x,
  }));
  return { cells: rotated, width: height, height: width };
}

// Flip pattern horizontally
export function flipPatternH(cells: Cell[], width: number): Cell[] {
  return cells.map((cell) => ({
    x: width - 1 - cell.x,
    y: cell.y,
  }));
}

// Flip pattern vertically
export function flipPatternV(cells: Cell[], height: number): Cell[] {
  return cells.map((cell) => ({
    x: cell.x,
    y: height - 1 - cell.y,
  }));
}

// Center pattern around origin
export function centerPattern(cells: Cell[], width: number, height: number): Cell[] {
  const offsetX = Math.floor(width / 2);
  const offsetY = Math.floor(height / 2);
  return cells.map((cell) => ({
    x: cell.x - offsetX,
    y: cell.y - offsetY,
  }));
}

// Pattern definitions
const gliderDef = parsePattern(`
.O.
..O
OOO
`);

const blinkerDef = parsePattern(`
OOO
`);

const beaconDef = parsePattern(`
OO..
OO..
..OO
..OO
`);

const pulsarDef = parsePattern(`
..OOO...OOO..
.............
O....O.O....O
O....O.O....O
O....O.O....O
..OOO...OOO..
.............
..OOO...OOO..
O....O.O....O
O....O.O....O
O....O.O....O
.............
..OOO...OOO..
`);

const gliderGunDef = parsePattern(`
........................O...........
......................O.O...........
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO..............
OO........O...O.OO....O.O...........
..........O.....O.......O...........
...........O...O....................
............OO......................
`);

const lwssDef = parsePattern(`
.O..O
O....
O...O
OOOO.
`);

const pentadecathlonDef = parsePattern(`
..O....O..
OO.OOOO.OO
..O....O..
`);

const acornDef = parsePattern(`
.O.....
...O...
OO..OOO
`);

const rPentominoDef = parsePattern(`
.OO
OO.
.O.
`);

// Block (still life for reference)
const blockDef = parsePattern(`
OO
OO
`);

// Beehive (still life)
const beehiveDef = parsePattern(`
.OO.
O..O
.OO.
`);

// Toad (oscillator)
const toadDef = parsePattern(`
.OOO
OOO.
`);

export const patterns: Pattern[] = [
  {
    name: 'Glider',
    description: 'Moves diagonally across the grid',
    category: 'spaceship',
    ...gliderDef,
  },
  {
    name: 'Blinker',
    description: 'Period 2 oscillator - simplest oscillator',
    category: 'oscillator',
    ...blinkerDef,
  },
  {
    name: 'Beacon',
    description: 'Period 2 oscillator - two diagonal blocks',
    category: 'oscillator',
    ...beaconDef,
  },
  {
    name: 'Toad',
    description: 'Period 2 oscillator - two offset rows',
    category: 'oscillator',
    ...toadDef,
  },
  {
    name: 'Pulsar',
    description: 'Period 3 oscillator - large symmetric pattern',
    category: 'oscillator',
    ...pulsarDef,
  },
  {
    name: 'Gosper Glider Gun',
    description: 'Produces gliders indefinitely',
    category: 'gun',
    ...gliderGunDef,
  },
  {
    name: 'Lightweight Spaceship',
    description: 'Moves horizontally across the grid',
    category: 'spaceship',
    ...lwssDef,
  },
  {
    name: 'Pentadecathlon',
    description: 'Period 15 oscillator',
    category: 'oscillator',
    ...pentadecathlonDef,
  },
  {
    name: 'Acorn',
    description: 'Methuselah - runs for 5206 generations',
    category: 'methuselah',
    ...acornDef,
  },
  {
    name: 'R-pentomino',
    description: 'Methuselah - runs for 1103 generations',
    category: 'methuselah',
    ...rPentominoDef,
  },
  {
    name: 'Block',
    description: 'Simplest still life - stable 2x2 square',
    category: 'still',
    ...blockDef,
  },
  {
    name: 'Beehive',
    description: 'Common still life - hexagonal shape',
    category: 'still',
    ...beehiveDef,
  },
];

export function getPatternsByCategory(category: Pattern['category']): Pattern[] {
  return patterns.filter((p) => p.category === category);
}

export function getPatternByName(name: string): Pattern | undefined {
  return patterns.find((p) => p.name === name);
}
