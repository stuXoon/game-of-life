import { writable, derived } from 'svelte/store';

export type ThemeName = 'minimal' | 'dark' | 'cyberpunk';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    grid: string;
    cell: string;
    cellGlow: string;
    cellSecondary?: string;
    uiBackground: string;
    uiBorder: string;
    uiText: string;
    uiTextMuted: string;
    uiAccent: string;
    uiAccentHover: string;
    statsBirths: string;
    statsDeaths: string;
  };
  effects: {
    cellGlow: boolean;
    glowIntensity: number;
    gridVisible: boolean;
    cellBorderRadius: number;
  };
}

const themes: Record<ThemeName, Theme> = {
  minimal: {
    name: 'minimal',
    displayName: 'Minimal',
    colors: {
      background: '#f5f5f5',
      grid: '#e0e0e0',
      cell: '#1a1a1a',
      cellGlow: 'transparent',
      cellSecondary: '#e53935',
      uiBackground: '#ffffff',
      uiBorder: '#e0e0e0',
      uiText: '#1a1a1a',
      uiTextMuted: '#666666',
      uiAccent: '#1a1a1a',
      uiAccentHover: '#333333',
      statsBirths: '#22c55e',
      statsDeaths: '#ef4444',
    },
    effects: {
      cellGlow: false,
      glowIntensity: 0,
      gridVisible: true,
      cellBorderRadius: 0,
    },
  },
  dark: {
    name: 'dark',
    displayName: 'Modern Dark',
    colors: {
      background: '#1a1a2e',
      grid: '#2a2a4e',
      cell: '#00ff88',
      cellGlow: 'rgba(0, 255, 136, 0.3)',
      cellSecondary: '#ff6b6b',
      uiBackground: 'rgba(26, 26, 46, 0.95)',
      uiBorder: '#2a2a4e',
      uiText: '#ffffff',
      uiTextMuted: '#888888',
      uiAccent: '#00ff88',
      uiAccentHover: '#00cc6a',
      statsBirths: '#00ff88',
      statsDeaths: '#ff6666',
    },
    effects: {
      cellGlow: true,
      glowIntensity: 8,
      gridVisible: true,
      cellBorderRadius: 1,
    },
  },
  cyberpunk: {
    name: 'cyberpunk',
    displayName: 'Cyberpunk',
    colors: {
      background: '#0a0a0f',
      grid: '#2a1a2a',
      cell: '#fcee0a',
      cellGlow: 'rgba(252, 238, 10, 0.5)',
      cellSecondary: '#00ffff',
      uiBackground: 'rgba(10, 10, 15, 0.95)',
      uiBorder: '#ff00ff44',
      uiText: '#ffffff',
      uiTextMuted: '#ff00ff99',
      uiAccent: '#ff00ff',
      uiAccentHover: '#ff66ff',
      statsBirths: '#fcee0a',
      statsDeaths: '#ff3366',
    },
    effects: {
      cellGlow: true,
      glowIntensity: 15,
      gridVisible: true,
      cellBorderRadius: 0,
    },
  },
};

// Current theme store
export const currentThemeName = writable<ThemeName>('dark');

// Derived theme object
export const currentTheme = derived(currentThemeName, ($name) => themes[$name]);

// Theme actions
export function setTheme(name: ThemeName): void {
  currentThemeName.set(name);
}

export function cycleTheme(): void {
  currentThemeName.update((current) => {
    const themeOrder: ThemeName[] = ['minimal', 'dark', 'cyberpunk'];
    const currentIndex = themeOrder.indexOf(current);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    return themeOrder[nextIndex];
  });
}

export function getThemeList(): { name: ThemeName; displayName: string }[] {
  return Object.values(themes).map((t) => ({
    name: t.name,
    displayName: t.displayName,
  }));
}

export { themes };
