import { writable, derived, get, type Readable } from 'svelte/store';
import { GameEngine, type GameStats, type Cell, type ColoredCell, type ColonyColor, type CapturedCell } from '../engine/GameEngine';
import { gameMode, battleWinner, setBattleWinner } from './gameModeStore';

// Game engine instance
const engine = new GameEngine();

// Core stores
export const isRunning = writable<boolean>(false);
export const speed = writable<number>(10); // generations per second
export const generation = writable<number>(0);
export const population = writable<number>(0);
export const births = writable<number>(0);
export const deaths = writable<number>(0);

// Battle mode population stores
export const population1 = writable<number>(0);
export const population2 = writable<number>(0);

// Current painting color for battle mode
export const paintColor = writable<ColonyColor>(1);

// Captured cells for flash animation
export const capturedCells = writable<CapturedCell[]>([]);

// Capture counters (total captured by each colony)
export const capturedBy1 = writable<number>(0);
export const capturedBy2 = writable<number>(0);

// History for stats graph
export const populationHistory = writable<number[]>([]);
const MAX_HISTORY_LENGTH = 200;

// Viewport stores
export const zoom = writable<number>(1);
export const panX = writable<number>(0);
export const panY = writable<number>(0);

// Cell size in pixels (at zoom level 1)
export const BASE_CELL_SIZE = 10;

// Derived store for effective cell size
export const cellSize: Readable<number> = derived(zoom, $zoom => BASE_CELL_SIZE * $zoom);

// Sync battle mode with engine
gameMode.subscribe(mode => {
  engine.setBattleMode(mode === 'battle');
});

// Update stats from engine
function updateStats(stats: GameStats): void {
  generation.set(stats.generation);
  population.set(stats.population);
  births.set(stats.births);
  deaths.set(stats.deaths);

  if (stats.population1 !== undefined) {
    population1.set(stats.population1);
  }
  if (stats.population2 !== undefined) {
    population2.set(stats.population2);
  }
  if (stats.captured !== undefined) {
    capturedCells.set(stats.captured);
    // Update capture counters
    stats.captured.forEach(c => {
      if (c.toColor === 1) {
        capturedBy1.update(n => n + 1);
      } else {
        capturedBy2.update(n => n + 1);
      }
    });
  } else {
    capturedCells.set([]);
  }

  populationHistory.update(history => {
    const newHistory = [...history, stats.population];
    if (newHistory.length > MAX_HISTORY_LENGTH) {
      newHistory.shift();
    }
    return newHistory;
  });

  // Check for battle winner
  if (get(gameMode) === 'battle' && stats.generation > 0) {
    const result = engine.checkBattleResult();
    if (result.winner !== null) {
      setBattleWinner(result.winner);
      isRunning.set(false);
    }
  }
}

// Game actions
export function toggleCell(x: number, y: number): void {
  const color = get(paintColor);
  engine.toggleCell(x, y, color);
  const stats = engine.getStats();
  updateStats(stats);
}

export function setCell(x: number, y: number): void {
  const color = get(paintColor);
  engine.setCell(x, y, color);
  const stats = engine.getStats();
  updateStats(stats);
}

export function step(): void {
  const stats = engine.nextGeneration();
  updateStats(stats);
}

export function reset(): void {
  engine.clear();
  isRunning.set(false);
  generation.set(0);
  population.set(0);
  births.set(0);
  deaths.set(0);
  population1.set(0);
  population2.set(0);
  capturedBy1.set(0);
  capturedBy2.set(0);
  populationHistory.set([]);
  setBattleWinner(null);
}

export function play(): void {
  isRunning.set(true);
}

export function pause(): void {
  isRunning.set(false);
}

export function toggleRunning(): void {
  isRunning.update(running => !running);
}

export function getLivingCells(): Cell[] {
  return engine.getLivingCells();
}

export function getColoredCells(): ColoredCell[] {
  return engine.getColoredCells();
}

export function isAlive(x: number, y: number): boolean {
  return engine.isAlive(x, y);
}

export function getCellColor(x: number, y: number): ColonyColor | undefined {
  return engine.getCellColor(x, y);
}

export function getBounds() {
  return engine.getBounds();
}

export function setCells(cells: Cell[]): void {
  engine.setCells(cells);
  const stats = engine.getStats();
  updateStats(stats);
}

export function setColoredCells(cells: ColoredCell[]): void {
  engine.setColoredCells(cells);
  const stats = engine.getStats();
  updateStats(stats);
}

export function setPaintColor(color: ColonyColor): void {
  paintColor.set(color);
}

// Zoom functions
export function zoomIn(): void {
  zoom.update(z => Math.min(z * 1.2, 5));
}

export function zoomOut(): void {
  zoom.update(z => Math.max(z / 1.2, 0.1));
}

export function setZoom(level: number): void {
  zoom.set(Math.max(0.1, Math.min(5, level)));
}

// Pan functions
export function pan(dx: number, dy: number): void {
  panX.update(x => x + dx);
  panY.update(y => y + dy);
}

export function centerView(): void {
  const bounds = engine.getBounds();
  if (bounds) {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    panX.set(-centerX * BASE_CELL_SIZE);
    panY.set(-centerY * BASE_CELL_SIZE);
  } else {
    panX.set(0);
    panY.set(0);
  }
}

export function resetView(): void {
  zoom.set(1);
  panX.set(0);
  panY.set(0);
}
