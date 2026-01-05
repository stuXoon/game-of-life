<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme } from '../stores/themeStore';

  const dispatch = createEventDispatcher<{ close: void }>();

  $: theme = $currentTheme;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      dispatch('close');
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="modal-backdrop"
  on:click={handleBackdropClick}
  on:keydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  style="
    --modal-bg: {theme.colors.uiBackground};
    --modal-border: {theme.colors.uiBorder};
    --modal-text: {theme.colors.uiText};
    --modal-muted: {theme.colors.uiTextMuted};
    --modal-accent: {theme.colors.uiAccent};
  "
>
  <div class="modal">
    <header>
      <h2>Game of Life</h2>
      <button class="close-btn" on:click={() => dispatch('close')} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </header>

    <div class="content">
      <section>
        <h3>Rules</h3>
        <ul>
          <li>Cell with 2-3 neighbors survives</li>
          <li>Dead cell with exactly 3 neighbors is born</li>
          <li>All other cells die</li>
        </ul>
      </section>

      <section>
        <h3>Controls</h3>
        <ul>
          <li><strong>Click</strong> - Toggle cell on/off</li>
          <li><strong>Click + Drag</strong> - Paint multiple cells</li>
          <li><strong>Shift + Click / Middle Mouse</strong> - Pan view</li>
          <li><strong>Scroll</strong> - Zoom in/out</li>
        </ul>
      </section>

      <section>
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts">
          <div class="shortcut"><kbd>Space</kbd> <span>Play / Pause</span></div>
          <div class="shortcut"><kbd>S</kbd> or <kbd>&#8594;</kbd> <span>Step forward</span></div>
          <div class="shortcut"><kbd>R</kbd> <span>Reset</span></div>
          <div class="shortcut"><kbd>+</kbd> / <kbd>=</kbd> <span>Zoom in</span></div>
          <div class="shortcut"><kbd>-</kbd> <span>Zoom out</span></div>
          <div class="shortcut"><kbd>0</kbd> <span>Reset view</span></div>
          <div class="shortcut"><kbd>C</kbd> <span>Center on cells</span></div>
          <div class="shortcut"><kbd>?</kbd> <span>Toggle help</span></div>
        </div>
      </section>

      <section>
        <h3>Game Modes</h3>
        <ul>
          <li><strong>Classic</strong> - Traditional Conway's Game of Life</li>
          <li><strong>Battle</strong> - Two colonies compete. Cells take majority neighbor color.</li>
        </ul>
      </section>

      <section>
        <h3>Patterns</h3>
        <p>Select a pattern from the dropdown, then click to place. Use rotate button for orientation.</p>
      </section>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: var(--modal-bg);
    border: 1px solid var(--modal-border);
    border-radius: 12px;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--modal-border);
  }

  h2 {
    margin: 0;
    font-size: 18px;
    color: var(--modal-text);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--modal-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: var(--modal-text);
    background: var(--modal-border);
  }

  .content {
    padding: 20px;
    overflow-y: auto;
    color: var(--modal-text);
  }

  section {
    margin-bottom: 20px;
  }

  section:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--modal-accent);
    margin: 0 0 10px 0;
  }

  ul {
    margin: 0;
    padding-left: 20px;
    font-size: 14px;
    line-height: 1.6;
  }

  li {
    color: var(--modal-muted);
  }

  li strong {
    color: var(--modal-text);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--modal-muted);
    line-height: 1.5;
  }

  .shortcuts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .shortcut {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--modal-muted);
  }

  kbd {
    background: var(--modal-border);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    color: var(--modal-text);
    border: 1px solid var(--modal-border);
    min-width: 24px;
    text-align: center;
  }
</style>
