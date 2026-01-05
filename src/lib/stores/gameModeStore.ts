import { writable, derived } from 'svelte/store';

export type GameMode = 'classic' | 'battle';
export type ColonyColor = 1 | 2; // 1 = primary, 2 = secondary

export const gameMode = writable<GameMode>('classic');

// Battle mode winner: null = no winner yet, 1 or 2 = colony won, 'draw' = both died
export const battleWinner = writable<ColonyColor | 'draw' | null>(null);

export function setGameMode(mode: GameMode): void {
  gameMode.set(mode);
  battleWinner.set(null);
}

export function toggleGameMode(): void {
  gameMode.update(m => m === 'classic' ? 'battle' : 'classic');
  battleWinner.set(null);
}

export function setBattleWinner(winner: ColonyColor | 'draw' | null): void {
  battleWinner.set(winner);
}
