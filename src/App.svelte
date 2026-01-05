<script lang="ts">
  import GameCanvas from './lib/components/GameCanvas.svelte';
  import Controls from './lib/components/Controls.svelte';
  import HelpModal from './lib/components/HelpModal.svelte';
  import { currentTheme } from './lib/stores/themeStore';
  import {
    isRunning,
    play,
    pause,
    step,
    reset,
    zoomIn,
    zoomOut,
    resetView,
    centerView,
  } from './lib/stores/gameStore';
  import type { Pattern } from './lib/patterns/patterns';

  let selectedPattern: Pattern | null = null;
  let patternRotation = 0;
  let showHelp = false;

  function handleSelectPattern(e: CustomEvent<Pattern | null>) {
    selectedPattern = e.detail;
    if (!e.detail) {
      patternRotation = 0;
    }
  }

  function handleRotatePattern() {
    // Rotation is already updated via bind:patternRotation
  }

  function handleToggleHelp() {
    showHelp = !showHelp;
  }

  function handleKeydown(e: KeyboardEvent) {
    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        $isRunning ? pause() : play();
        break;
      case 's':
      case 'S':
      case 'ArrowRight':
        if (!$isRunning) {
          e.preventDefault();
          step();
        }
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        reset();
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetView();
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        centerView();
        break;
      case '?':
        e.preventDefault();
        showHelp = !showHelp;
        break;
      case 'Escape':
        if (showHelp) {
          showHelp = false;
        } else if (selectedPattern) {
          selectedPattern = null;
          patternRotation = 0;
        }
        break;
    }
  }

  $: theme = $currentTheme;
</script>

<svelte:window on:keydown={handleKeydown} />

<main class="app" style="background-color: {theme.colors.background}">
  <Controls
    bind:selectedPattern
    bind:patternRotation
    on:selectPattern={handleSelectPattern}
    on:rotatePattern={handleRotatePattern}
    on:toggleHelp={handleToggleHelp}
  />
  <div class="game-area">
    <GameCanvas {selectedPattern} {patternRotation} />
  </div>
</main>

{#if showHelp}
  <HelpModal on:close={() => showHelp = false} />
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    transition: background-color 0.3s ease;
  }

  .game-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
</style>
