<script lang="ts">
  import { populationHistory } from '../stores/gameStore';
  import { currentTheme } from '../stores/themeStore';

  export let width = 200;
  export let height = 60;

  $: theme = $currentTheme;
  $: history = $populationHistory;

  // Calculate graph data
  $: maxPop = Math.max(...history, 1);
  $: points = history.map((pop, i) => ({
    x: (i / Math.max(history.length - 1, 1)) * width,
    y: height - (pop / maxPop) * (height - 4) - 2,
  }));

  // Create SVG path
  $: pathD = points.length > 1
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  // Area fill path
  $: areaD = points.length > 1
    ? `M 0,${height} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${width},${height} Z`
    : '';

  $: currentPop = history.length > 0 ? history[history.length - 1] : 0;
</script>

<div class="graph-container" style="
  --graph-stroke: {theme.colors.uiAccent};
  --graph-fill: {theme.colors.uiAccent}22;
  --graph-bg: {theme.colors.uiBorder};
  --graph-text: {theme.colors.uiTextMuted};
">
  <svg {width} {height} viewBox="0 0 {width} {height}">
    <!-- Background -->
    <rect x="0" y="0" {width} {height} fill="var(--graph-bg)" rx="4" />

    {#if history.length > 1}
      <!-- Area fill -->
      <path d={areaD} fill="var(--graph-fill)" />

      <!-- Line -->
      <path d={pathD} fill="none" stroke="var(--graph-stroke)" stroke-width="1.5" />

      <!-- Current value dot -->
      {#if points.length > 0}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill="var(--graph-stroke)"
        />
      {/if}
    {:else}
      <text x={width / 2} y={height / 2 + 4} text-anchor="middle" fill="var(--graph-text)" font-size="10">
        No data yet
      </text>
    {/if}
  </svg>

  {#if history.length > 0}
    <div class="graph-labels">
      <span class="current">{currentPop}</span>
      <span class="max">max: {maxPop}</span>
    </div>
  {/if}
</div>

<style>
  .graph-container {
    position: relative;
  }

  svg {
    display: block;
    border-radius: 4px;
  }

  .graph-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    margin-top: 2px;
    color: var(--graph-text);
  }

  .current {
    font-weight: 600;
    color: var(--graph-stroke);
  }
</style>
