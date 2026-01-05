<script lang="ts">
  import GameCanvas from './lib/components/GameCanvas.svelte';
  import Controls from './lib/components/Controls.svelte';
</script>

<main class="app">
  <Controls />
  <div class="game-area">
    <GameCanvas />
  </div>
</main>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .game-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
</style>
