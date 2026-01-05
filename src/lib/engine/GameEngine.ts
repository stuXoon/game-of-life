/**
 * Game of Life Engine
 * Uses a sparse data structure (Map/Set) for infinite grid support
 * Supports classic mode and battle mode (two colonies)
 */

export type Cell = { x: number; y: number };
export type ColoredCell = Cell & { color: 1 | 2 };
export type CellKey = string;
export type ColonyColor = 1 | 2;

export interface GameState {
  livingCells: Set<CellKey>;
  cellColors: Map<CellKey, ColonyColor>;
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
  population1?: number;
  population2?: number;
  captured?: CapturedCell[]; // cells that changed color this generation
}

export interface CapturedCell {
  x: number;
  y: number;
  fromColor: ColonyColor;
  toColor: ColonyColor;
}

export interface BattleResult {
  winner: ColonyColor | 'draw' | null;
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
  private cellColors: Map<CellKey, ColonyColor> = new Map();
  private generation: number = 0;
  private lastBirths: number = 0;
  private lastDeaths: number = 0;
  private lastCaptured: CapturedCell[] = [];
  private battleMode: boolean = false;

  constructor(initialCells?: Cell[]) {
    if (initialCells) {
      this.setCells(initialCells);
    }
  }

  /**
   * Enable/disable battle mode
   */
  setBattleMode(enabled: boolean): void {
    this.battleMode = enabled;
    if (!enabled) {
      // Clear colors when switching to classic
      this.cellColors.clear();
    }
  }

  isBattleMode(): boolean {
    return this.battleMode;
  }

  /**
   * Set multiple cells as alive (classic mode)
   */
  setCells(cells: Cell[]): void {
    cells.forEach(cell => {
      this.livingCells.add(cellToKey(cell.x, cell.y));
    });
  }

  /**
   * Set multiple cells with color (battle mode)
   */
  setColoredCells(cells: ColoredCell[]): void {
    cells.forEach(cell => {
      const key = cellToKey(cell.x, cell.y);
      this.livingCells.add(key);
      this.cellColors.set(key, cell.color);
    });
  }

  /**
   * Clear all cells and reset generation
   */
  clear(): void {
    this.livingCells.clear();
    this.cellColors.clear();
    this.generation = 0;
    this.lastBirths = 0;
    this.lastDeaths = 0;
    this.lastCaptured = [];
  }

  /**
   * Toggle a cell's state (alive <-> dead)
   */
  toggleCell(x: number, y: number, color?: ColonyColor): boolean {
    const key = cellToKey(x, y);
    if (this.livingCells.has(key)) {
      this.livingCells.delete(key);
      this.cellColors.delete(key);
      return false;
    } else {
      this.livingCells.add(key);
      if (this.battleMode && color) {
        this.cellColors.set(key, color);
      }
      return true;
    }
  }

  /**
   * Set a cell as alive
   */
  setCell(x: number, y: number, color?: ColonyColor): void {
    const key = cellToKey(x, y);
    this.livingCells.add(key);
    if (this.battleMode && color) {
      this.cellColors.set(key, color);
    }
  }

  /**
   * Kill a cell
   */
  killCell(x: number, y: number): void {
    const key = cellToKey(x, y);
    this.livingCells.delete(key);
    this.cellColors.delete(key);
  }

  /**
   * Check if a cell is alive
   */
  isAlive(x: number, y: number): boolean {
    return this.livingCells.has(cellToKey(x, y));
  }

  /**
   * Get cell color (for battle mode)
   */
  getCellColor(x: number, y: number): ColonyColor | undefined {
    return this.cellColors.get(cellToKey(x, y));
  }

  /**
   * Get all living cells
   */
  getLivingCells(): Cell[] {
    return Array.from(this.livingCells).map(keyToCell);
  }

  /**
   * Get all living cells with colors
   */
  getColoredCells(): ColoredCell[] {
    return Array.from(this.livingCells).map(key => {
      const cell = keyToCell(key);
      return {
        ...cell,
        color: this.cellColors.get(key) || 1,
      };
    });
  }

  /**
   * Get the count of living neighbors for a cell (classic mode)
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
   * Count neighbors by color (battle mode)
   */
  private countNeighborsByColor(x: number, y: number): { total: number; color1: number; color2: number } {
    let color1 = 0;
    let color2 = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const key = cellToKey(x + dx, y + dy);
        if (this.livingCells.has(key)) {
          const color = this.cellColors.get(key) || 1;
          if (color === 1) color1++;
          else color2++;
        }
      }
    }
    return { total: color1 + color2, color1, color2 };
  }

  /**
   * Get majority color from neighbor counts
   */
  private getMajorityColor(color1: number, color2: number): ColonyColor {
    return color1 >= color2 ? 1 : 2;
  }

  /**
   * Compute the next generation using Conway's rules:
   * 1. Any live cell with 2 or 3 neighbors survives
   * 2. Any dead cell with exactly 3 neighbors becomes alive
   * 3. All other cells die or stay dead
   */
  nextGeneration(): GameStats {
    if (this.battleMode) {
      return this.nextGenerationBattle();
    }

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
   * Battle mode rules:
   * 1. Survival: cell survives with 2-3 neighbors (any color).
   *    Surviving cell takes majority color of its neighbors.
   * 2. Birth: dead cell with exactly 3 neighbors becomes alive with majority color.
   * 3. Death: cells with <2 or >3 neighbors die (underpopulation/overpopulation).
   */
  private nextGenerationBattle(): GameStats {
    const newLivingCells = new Set<CellKey>();
    const newCellColors = new Map<CellKey, ColonyColor>();
    const cellsToCheck = new Set<CellKey>();
    const captured: CapturedCell[] = [];

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

    // Apply battle rules to each cell
    cellsToCheck.forEach(key => {
      const { x, y } = keyToCell(key);
      const { total, color1, color2 } = this.countNeighborsByColor(x, y);
      const isCurrentlyAlive = this.livingCells.has(key);

      if (isCurrentlyAlive) {
        // Survival: 2-3 neighbors (any color)
        if (total >= 2 && total <= 3) {
          newLivingCells.add(key);
          const oldColor = this.cellColors.get(key) || 1;
          const newColor = this.getMajorityColor(color1, color2);
          newCellColors.set(key, newColor);

          // Track captured cells (color changed)
          if (oldColor !== newColor) {
            captured.push({ x, y, fromColor: oldColor, toColor: newColor });
          }
        } else {
          deaths++;
        }
      } else {
        // Birth: exactly 3 neighbors
        if (total === 3) {
          newLivingCells.add(key);
          newCellColors.set(key, this.getMajorityColor(color1, color2));
          births++;
        }
      }
    });

    this.livingCells = newLivingCells;
    this.cellColors = newCellColors;
    this.generation++;
    this.lastBirths = births;
    this.lastDeaths = deaths;
    this.lastCaptured = captured;

    return this.getStats();
  }

  /**
   * Check battle result
   */
  checkBattleResult(): BattleResult {
    if (!this.battleMode) {
      return { winner: null };
    }

    let pop1 = 0;
    let pop2 = 0;

    this.cellColors.forEach(color => {
      if (color === 1) pop1++;
      else pop2++;
    });

    if (pop1 === 0 && pop2 === 0) {
      return { winner: 'draw' };
    } else if (pop1 === 0) {
      return { winner: 2 };
    } else if (pop2 === 0) {
      return { winner: 1 };
    }

    return { winner: null };
  }

  /**
   * Get current game statistics
   */
  getStats(): GameStats {
    const stats: GameStats = {
      generation: this.generation,
      population: this.livingCells.size,
      births: this.lastBirths,
      deaths: this.lastDeaths,
    };

    if (this.battleMode) {
      let pop1 = 0;
      let pop2 = 0;
      this.cellColors.forEach(color => {
        if (color === 1) pop1++;
        else pop2++;
      });
      stats.population1 = pop1;
      stats.population2 = pop2;
      stats.captured = this.lastCaptured;
    }

    return stats;
  }

  /**
   * Get last captured cells (for animation)
   */
  getCapturedCells(): CapturedCell[] {
    return this.lastCaptured;
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
      cellColors: new Map(this.cellColors),
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
    this.cellColors = new Map(state.cellColors);
    this.generation = state.generation;
    this.lastBirths = state.births;
    this.lastDeaths = state.deaths;
  }
}
