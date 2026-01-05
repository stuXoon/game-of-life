<script lang="ts">
  import {
    isRunning,
    speed,
    generation,
    population,
    births,
    deaths,
    zoom,
    play,
    pause,
    step,
    reset,
    zoomIn,
    zoomOut,
    resetView,
    centerView,
  } from '../stores/gameStore';

  $: running = $isRunning;
  $: currentSpeed = $speed;
  $: currentZoom = $zoom;

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
</script>

<div class="controls">
  <div class="controls-row">
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

    <div class="control-group zoom-control">
      <button class="btn small" on:click={zoomOut} title="Zoom Out">−</button>
      <span class="zoom-level">{Math.round(currentZoom * 100)}%</span>
      <button class="btn small" on:click={zoomIn} title="Zoom In">+</button>
      <button class="btn small" on:click={resetView} title="Reset View">⌂</button>
      <button class="btn small" on:click={centerView} title="Center on Cells">◎</button>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat">
      <span class="stat-label">Generation</span>
      <span class="stat-value">{$generation}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Population</span>
      <span class="stat-value">{$population}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Births</span>
      <span class="stat-value births">+{$births}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Deaths</span>
      <span class="stat-value deaths">−{$deaths}</span>
    </div>
  </div>
</div>

<style>
  .controls {
    background: rgba(26, 26, 46, 0.95);
    border-bottom: 1px solid #2a2a4e;
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
    background: #2a2a4e;
    border: 1px solid #3a3a6e;
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .btn:hover:not(:disabled) {
    background: #3a3a6e;
    border-color: #4a4a8e;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #00ff88;
    color: #1a1a2e;
    border-color: #00ff88;
  }

  .btn.primary:hover {
    background: #00cc6a;
    border-color: #00cc6a;
  }

  .btn.danger:hover:not(:disabled) {
    background: #ff4444;
    border-color: #ff4444;
  }

  .btn.small {
    padding: 4px 10px;
    font-size: 14px;
    min-width: 32px;
  }

  .speed-control {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .speed-control label {
    font-size: 12px;
    color: #888;
  }

  .speed-control input[type='range'] {
    width: 120px;
    accent-color: #00ff88;
  }

  .zoom-control {
    margin-left: auto;
  }

  .zoom-level {
    min-width: 50px;
    text-align: center;
    font-size: 12px;
    color: #888;
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
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }

  .stat-value.births {
    color: #00ff88;
  }

  .stat-value.deaths {
    color: #ff6666;
  }
</style>
