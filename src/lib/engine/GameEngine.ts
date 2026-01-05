/**
 * Game of Life Engine
 * Uses a sparse data structure (Set) for infinite grid support
 */

export type Cell = { x: number; y: number };
export type CellKey = string;

export interface GameState {
  livingCells: Set<CellKey>;
  generation: number;
  population: number;
  births: number;
  deaths: number;
}

export interface GameStats {
  generation: number;
  population: number;
  births: number;
  deaths: number;
}

// Convert cell coordinates to a unique string key
export function cellToKey(x: number, y: number): CellKey {
  return `${x},${y}`;
}

// Convert a key back to cell coordinates
export function keyToCell(key: CellKey): Cell {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export class GameEngine {
  private livingCells: Set<CellKey> = new Set();
  private generation: number = 0;
  private lastBirths: number = 0;
  private lastDeaths: number = 0;

  constructor(initialCells?: Cell[]) {
    if (initialCells) {
      this.setCells(initialCells);
    }
  }

  /**
   * Set multiple cells as alive
   */
  setCells(cells: Cell[]): void {
    cells.forEach(cell => {
      this.livingCells.add(cellToKey(cell.x, cell.y));
    });
  }

  /**
   * Clear all cells and reset generation
   */
  clear(): void {
    this.livingCells.clear();
    this.generation = 0;
    this.lastBirths = 0;
    this.lastDeaths = 0;
  }

  /**
   * Toggle a cell's state (alive <-> dead)
   */
  toggleCell(x: number, y: number): boolean {
    const key = cellToKey(x, y);
    if (this.livingCells.has(key)) {
      this.livingCells.delete(key);
      return false;
    } else {
      this.livingCells.add(key);
      return true;
    }
  }

  /**
   * Set a cell as alive
   */
  setCell(x: number, y: number): void {
    this.livingCells.add(cellToKey(x, y));
  }

  /**
   * Kill a cell
   */
  killCell(x: number, y: number): void {
    this.livingCells.delete(cellToKey(x, y));
  }

  /**
   * Check if a cell is alive
   */
  isAlive(x: number, y: number): boolean {
    return this.livingCells.has(cellToKey(x, y));
  }

  /**
   * Get all living cells
   */
  getLivingCells(): Cell[] {
    return Array.from(this.livingCells).map(keyToCell);
  }

  /**
   * Get the count of living neighbors for a cell
   */
  private countNeighbors(x: number, y: number): number {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (this.livingCells.has(cellToKey(x + dx, y + dy))) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Compute the next generation using Conway's rules:
   * 1. Any live cell with 2 or 3 neighbors survives
   * 2. Any dead cell with exactly 3 neighbors becomes alive
   * 3. All other cells die or stay dead
   */
  nextGeneration(): GameStats {
    const newLivingCells = new Set<CellKey>();
    const cellsToCheck = new Set<CellKey>();

    // Add all living cells and their neighbors to the check set
    this.livingCells.forEach(key => {
      const { x, y } = keyToCell(key);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          cellsToCheck.add(cellToKey(x + dx, y + dy));
        }
      }
    });

    let births = 0;
    let deaths = 0;

    // Apply rules to each cell that needs checking
    cellsToCheck.forEach(key => {
      const { x, y } = keyToCell(key);
      const neighbors = this.countNeighbors(x, y);
      const isCurrentlyAlive = this.livingCells.has(key);

      if (isCurrentlyAlive) {
        if (neighbors === 2 || neighbors === 3) {
          newLivingCells.add(key);
        } else {
          deaths++;
        }
      } else {
        if (neighbors === 3) {
          newLivingCells.add(key);
          births++;
        }
      }
    });

    this.livingCells = newLivingCells;
    this.generation++;
    this.lastBirths = births;
    this.lastDeaths = deaths;

    return this.getStats();
  }

  /**
   * Get current game statistics
   */
  getStats(): GameStats {
    return {
      generation: this.generation,
      population: this.livingCells.size,
      births: this.lastBirths,
      deaths: this.lastDeaths,
    };
  }

  /**
   * Get the bounding box of all living cells
   */
  getBounds(): { minX: number; maxX: number; minY: number; maxY: number } | null {
    if (this.livingCells.size === 0) {
      return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.livingCells.forEach(key => {
      const { x, y } = keyToCell(key);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    return { minX, maxX, minY, maxY };
  }

  /**
   * Get the current generation number
   */
  getGeneration(): number {
    return this.generation;
  }

  /**
   * Get population count
   */
  getPopulation(): number {
    return this.livingCells.size;
  }

  /**
   * Export current state
   */
  exportState(): GameState {
    return {
      livingCells: new Set(this.livingCells),
      generation: this.generation,
      population: this.livingCells.size,
      births: this.lastBirths,
      deaths: this.lastDeaths,
    };
  }

  /**
   * Import a state
   */
  importState(state: GameState): void {
    this.livingCells = new Set(state.livingCells);
    this.generation = state.generation;
    this.lastBirths = state.births;
    this.lastDeaths = state.deaths;
  }
}
