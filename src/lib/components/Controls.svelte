<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    isRunning,
    speed,
    generation,
    population,
    population1,
    population2,
    capturedBy1,
    capturedBy2,
    births,
    deaths,
    zoom,
    paintColor,
    play,
    pause,
    step,
    reset,
    zoomIn,
    zoomOut,
    resetView,
    centerView,
    setPaintColor,
  } from '../stores/gameStore';
  import { currentTheme, currentThemeName, setTheme, getThemeList, type ThemeName } from '../stores/themeStore';
  import { gameMode, battleWinner, setGameMode, type GameMode } from '../stores/gameModeStore';
  import { patterns, type Pattern } from '../patterns/patterns';

  const dispatch = createEventDispatcher<{
    selectPattern: Pattern | null;
    rotatePattern: void;
  }>();

  export let selectedPattern: Pattern | null = null;
  export let patternRotation: number = 0;

  $: running = $isRunning;
  $: currentSpeed = $speed;
  $: currentZoom = $zoom;
  $: theme = $currentTheme;
  $: themeName = $currentThemeName;
  $: mode = $gameMode;
  $: winner = $battleWinner;
  $: currentPaintColor = $paintColor;

  const themeList = getThemeList();

  let showPatternMenu = false;

  function handleSpeedChange(e: Event) {
    const target = e.target as HTMLInputElement;
    speed.set(parseInt(target.value));
  }

  function togglePlayPause() {
    if (running) {
      pause();
    } else {
      play();
    }
  }

  function handleThemeChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    setTheme(target.value as ThemeName);
  }

  function selectPattern(pattern: Pattern | null) {
    selectedPattern = pattern;
    showPatternMenu = false;
    dispatch('selectPattern', pattern);
  }

  function rotatePattern() {
    patternRotation = (patternRotation + 90) % 360;
    dispatch('rotatePattern');
  }

  function clearPattern() {
    selectedPattern = null;
    patternRotation = 0;
    dispatch('selectPattern', null);
  }

  function handleModeChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    setGameMode(target.value as GameMode);
    reset();
  }

  function selectColor(color: 1 | 2) {
    setPaintColor(color);
  }

  // Group patterns by category
  $: patternsByCategory = {
    oscillator: patterns.filter(p => p.category === 'oscillator'),
    spaceship: patterns.filter(p => p.category === 'spaceship'),
    gun: patterns.filter(p => p.category === 'gun'),
    methuselah: patterns.filter(p => p.category === 'methuselah'),
    still: patterns.filter(p => p.category === 'still'),
  };

  const categoryLabels: Record<string, string> = {
    oscillator: 'Oscillators',
    spaceship: 'Spaceships',
    gun: 'Guns',
    methuselah: 'Methuselahs',
    still: 'Still Lifes',
  };
</script>

<div class="controls" style="
  --ui-bg: {theme.colors.uiBackground};
  --ui-border: {theme.colors.uiBorder};
  --ui-text: {theme.colors.uiText};
  --ui-text-muted: {theme.colors.uiTextMuted};
  --ui-accent: {theme.colors.uiAccent};
  --ui-accent-hover: {theme.colors.uiAccentHover};
  --stats-births: {theme.colors.statsBirths};
  --stats-deaths: {theme.colors.statsDeaths};
">
  <div class="controls-row">
    <div class="control-group mode-control">
      <label for="mode">Mode</label>
      <select id="mode" value={mode} on:change={handleModeChange}>
        <option value="classic">Classic</option>
        <option value="battle">Battle</option>
      </select>
    </div>

    {#if mode === 'battle'}
      <div class="control-group color-control">
        <span class="color-label">Colony:</span>
        <button
          class="color-btn color-1"
          class:active={currentPaintColor === 1}
          on:click={() => selectColor(1)}
          style="background: {theme.colors.cell}"
          title="Colony 1"
        ></button>
        <button
          class="color-btn color-2"
          class:active={currentPaintColor === 2}
          on:click={() => selectColor(2)}
          style="background: {theme.colors.cellSecondary}"
          title="Colony 2"
        ></button>
      </div>
    {/if}

    <div class="control-group">
      <button class="btn primary" on:click={togglePlayPause} title={running ? 'Pause' : 'Play'}>
        {#if running}
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        {/if}
      </button>

      <button class="btn" on:click={step} disabled={running} title="Step">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <polygon points="5,3 13,12 5,21" />
          <rect x="14" y="3" width="4" height="18" />
        </svg>
      </button>

      <button class="btn danger" on:click={reset} title="Reset">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      </button>
    </div>

    <div class="control-group speed-control">
      <label for="speed">Speed: {currentSpeed}/s</label>
      <input
        type="range"
        id="speed"
        min="1"
        max="60"
        value={currentSpeed}
        on:input={handleSpeedChange}
      />
    </div>

    <div class="control-group pattern-control">
      <div class="pattern-selector">
        <button
          class="btn pattern-btn"
          on:click={() => showPatternMenu = !showPatternMenu}
          class:active={selectedPattern !== null}
        >
          {selectedPattern ? selectedPattern.name : 'Patterns'}
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {#if selectedPattern}
          <button class="btn small" on:click={rotatePattern} title="Rotate 90°">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
            </svg>
          </button>
          <button class="btn small danger" on:click={clearPattern} title="Cancel">
            ✕
          </button>
        {/if}

        {#if showPatternMenu}
          <div class="pattern-menu">
            {#each Object.entries(patternsByCategory) as [category, categoryPatterns]}
              {#if categoryPatterns.length > 0}
                <div class="pattern-category">
                  <div class="category-label">{categoryLabels[category]}</div>
                  {#each categoryPatterns as pattern}
                    <button
                      class="pattern-item"
                      on:click={() => selectPattern(pattern)}
                      class:selected={selectedPattern?.name === pattern.name}
                    >
                      <span class="pattern-name">{pattern.name}</span>
                      <span class="pattern-desc">{pattern.description}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="control-group zoom-control">
      <button class="btn small" on:click={zoomOut} title="Zoom Out">−</button>
      <span class="zoom-level">{Math.round(currentZoom * 100)}%</span>
      <button class="btn small" on:click={zoomIn} title="Zoom In">+</button>
      <button class="btn small" on:click={resetView} title="Reset View">⌂</button>
      <button class="btn small" on:click={centerView} title="Center on Cells">◎</button>
    </div>

    <div class="control-group theme-control">
      <label for="theme">Theme</label>
      <select id="theme" value={themeName} on:change={handleThemeChange}>
        {#each themeList as t}
          <option value={t.name}>{t.displayName}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat">
      <span class="stat-label">Generation</span>
      <span class="stat-value">{$generation}</span>
    </div>
    {#if mode === 'battle'}
      <div class="stat">
        <span class="stat-label" style="color: {theme.colors.cell}">Colony 1</span>
        <span class="stat-value" style="color: {theme.colors.cell}">{$population1}</span>
      </div>
      <div class="stat">
        <span class="stat-label" style="color: {theme.colors.cellSecondary}">Colony 2</span>
        <span class="stat-value" style="color: {theme.colors.cellSecondary}">{$population2}</span>
      </div>
      <div class="stat">
        <span class="stat-label" style="color: {theme.colors.cell}">Captured</span>
        <span class="stat-value" style="color: {theme.colors.cell}">{$capturedBy1}</span>
      </div>
      <div class="stat">
        <span class="stat-label" style="color: {theme.colors.cellSecondary}">Captured</span>
        <span class="stat-value" style="color: {theme.colors.cellSecondary}">{$capturedBy2}</span>
      </div>
    {:else}
      <div class="stat">
        <span class="stat-label">Population</span>
        <span class="stat-value">{$population}</span>
      </div>
    {/if}
    <div class="stat">
      <span class="stat-label">Births</span>
      <span class="stat-value births">+{$births}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Deaths</span>
      <span class="stat-value deaths">−{$deaths}</span>
    </div>
    {#if selectedPattern}
      <div class="stat pattern-info">
        <span class="stat-label">Pattern</span>
        <span class="stat-value">{selectedPattern.name} ({patternRotation}°)</span>
      </div>
    {/if}
    {#if winner}
      <div class="stat winner-info">
        <span class="stat-label">Winner</span>
        {#if winner === 'draw'}
          <span class="stat-value">Draw!</span>
        {:else}
          <span class="stat-value" style="color: {winner === 1 ? theme.colors.cell : theme.colors.cellSecondary}">
            Colony {winner}!
          </span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .controls {
    background: var(--ui-bg);
    border-bottom: 1px solid var(--ui-border);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn {
    background: var(--ui-border);
    border: 1px solid var(--ui-border);
    color: var(--ui-text);
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    gap: 4px;
  }

  .btn:hover:not(:disabled) {
    background: var(--ui-accent);
    border-color: var(--ui-accent);
    color: var(--ui-bg);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn.primary {
    background: var(--ui-accent);
    color: var(--ui-bg);
    border-color: var(--ui-accent);
  }

  .btn.primary:hover {
    background: var(--ui-accent-hover);
    border-color: var(--ui-accent-hover);
  }

  .btn.danger:hover:not(:disabled) {
    background: var(--stats-deaths);
    border-color: var(--stats-deaths);
  }

  .btn.small {
    padding: 4px 10px;
    font-size: 14px;
    min-width: 32px;
  }

  .btn.active {
    background: var(--ui-accent);
    color: var(--ui-bg);
  }

  .speed-control {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .speed-control label,
  .theme-control label {
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .speed-control input[type='range'] {
    width: 120px;
    accent-color: var(--ui-accent);
  }

  .zoom-control {
    margin-left: auto;
  }

  .zoom-level {
    min-width: 50px;
    text-align: center;
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .theme-control {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .theme-control select {
    background: var(--ui-border);
    border: 1px solid var(--ui-border);
    color: var(--ui-text);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  .theme-control select:hover {
    border-color: var(--ui-accent);
  }

  .mode-control {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .mode-control label {
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .mode-control select {
    background: var(--ui-border);
    border: 1px solid var(--ui-border);
    color: var(--ui-text);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }

  .mode-control select:hover {
    border-color: var(--ui-accent);
  }

  .color-control {
    gap: 6px;
  }

  .color-label {
    font-size: 12px;
    color: var(--ui-text-muted);
  }

  .color-btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .color-btn:hover {
    transform: scale(1.1);
  }

  .color-btn.active {
    border-color: var(--ui-text);
    box-shadow: 0 0 8px currentColor;
  }

  .winner-info .stat-value {
    font-weight: 700;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .pattern-control {
    position: relative;
  }

  .pattern-selector {
    display: flex;
    align-items: center;
    gap: 4px;
    position: relative;
  }

  .pattern-btn {
    min-width: 120px;
    justify-content: space-between;
  }

  .pattern-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: var(--ui-bg);
    border: 1px solid var(--ui-border);
    border-radius: 8px;
    padding: 8px 0;
    min-width: 280px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .pattern-category {
    padding: 4px 0;
  }

  .pattern-category:not(:last-child) {
    border-bottom: 1px solid var(--ui-border);
    margin-bottom: 4px;
  }

  .category-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--ui-text-muted);
    padding: 4px 12px;
  }

  .pattern-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: var(--ui-text);
    cursor: pointer;
    text-align: left;
  }

  .pattern-item:hover {
    background: var(--ui-border);
  }

  .pattern-item.selected {
    background: var(--ui-accent);
    color: var(--ui-bg);
  }

  .pattern-name {
    font-weight: 500;
    font-size: 14px;
  }

  .pattern-desc {
    font-size: 11px;
    color: var(--ui-text-muted);
  }

  .pattern-item.selected .pattern-desc {
    color: var(--ui-bg);
    opacity: 0.8;
  }

  .stats-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-size: 11px;
    color: var(--ui-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--ui-text);
    font-variant-numeric: tabular-nums;
  }

  .stat-value.births {
    color: var(--stats-births);
  }

  .stat-value.deaths {
    color: var(--stats-deaths);
  }

  .pattern-info .stat-value {
    font-size: 14px;
    color: var(--ui-accent);
  }
</style>
