<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    zoom,
    panX,
    panY,
    pan,
    setZoom,
    getLivingCells,
    toggleCell,
    setCell,
    isAlive,
    isRunning,
    speed,
    step,
    BASE_CELL_SIZE,
  } from '../stores/gameStore';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrameId: number;
  let lastStepTime = 0;

  // Interaction state
  let isDragging = false;
  let isPainting = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let paintMode: 'set' | 'toggle' = 'set';

  // Reactive values
  let currentZoom: number;
  let currentPanX: number;
  let currentPanY: number;
  let running: boolean;
  let currentSpeed: number;

  $: currentZoom = $zoom;
  $: currentPanX = $panX;
  $: currentPanY = $panY;
  $: running = $isRunning;
  $: currentSpeed = $speed;

  // Calculate effective cell size
  $: effectiveCellSize = BASE_CELL_SIZE * currentZoom;

  // Theme colors (will be made reactive in Phase 2)
  const colors = {
    background: '#1a1a2e',
    grid: '#2a2a4e',
    cell: '#00ff88',
    cellGlow: 'rgba(0, 255, 136, 0.3)',
  };

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startRenderLoop();
  });

  onDestroy(() => {
    window.removeEventListener('resize', resizeCanvas);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  function resizeCanvas() {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }

  function startRenderLoop() {
    function loop(timestamp: number) {
      // Handle simulation steps
      if (running && currentSpeed > 0) {
        const stepInterval = 1000 / currentSpeed;
        if (timestamp - lastStepTime >= stepInterval) {
          step();
          lastStepTime = timestamp;
        }
      }

      render();
      animationFrameId = requestAnimationFrame(loop);
    }
    animationFrameId = requestAnimationFrame(loop);
  }

  function render() {
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible area in grid coordinates
    const offsetX = width / 2 + currentPanX * currentZoom;
    const offsetY = height / 2 + currentPanY * currentZoom;

    // Draw grid lines
    drawGrid(width, height, offsetX, offsetY);

    // Draw living cells
    drawCells(offsetX, offsetY);
  }

  function drawGrid(width: number, height: number, offsetX: number, offsetY: number) {
    if (effectiveCellSize < 4) return; // Don't draw grid when zoomed out too far

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    // Calculate grid line positions
    const startX = offsetX % effectiveCellSize;
    const startY = offsetY % effectiveCellSize;

    ctx.beginPath();

    // Vertical lines
    for (let x = startX; x < width; x += effectiveCellSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = startY; y < height; y += effectiveCellSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();
  }

  function drawCells(offsetX: number, offsetY: number) {
    const cells = getLivingCells();
    const padding = 1;

    ctx.fillStyle = colors.cell;

    // Optional glow effect
    if (effectiveCellSize >= 8) {
      ctx.shadowColor = colors.cellGlow;
      ctx.shadowBlur = 8;
    }

    cells.forEach(cell => {
      const screenX = offsetX + cell.x * effectiveCellSize;
      const screenY = offsetY + cell.y * effectiveCellSize;

      // Only draw if visible
      if (
        screenX + effectiveCellSize >= 0 &&
        screenX <= canvas.width &&
        screenY + effectiveCellSize >= 0 &&
        screenY <= canvas.height
      ) {
        ctx.fillRect(
          screenX + padding,
          screenY + padding,
          effectiveCellSize - padding * 2,
          effectiveCellSize - padding * 2
        );
      }
    });

    ctx.shadowBlur = 0;
  }

  function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const offsetX = canvas.width / 2 + currentPanX * currentZoom;
    const offsetY = canvas.height / 2 + currentPanY * currentZoom;

    const gridX = Math.floor((screenX - offsetX) / effectiveCellSize);
    const gridY = Math.floor((screenY - offsetY) / effectiveCellSize);

    return { x: gridX, y: gridY };
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle click or shift+click for panning
      isDragging = true;
      canvas.style.cursor = 'grabbing';
    } else if (e.button === 0) {
      // Left click for painting
      isPainting = true;
      const gridPos = screenToGrid(mouseX, mouseY);

      // Check if we're toggling on or off
      if (isAlive(gridPos.x, gridPos.y)) {
        paintMode = 'toggle';
        toggleCell(gridPos.x, gridPos.y);
      } else {
        paintMode = 'set';
        setCell(gridPos.x, gridPos.y);
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = (mouseX - lastMouseX) / currentZoom;
      const dy = (mouseY - lastMouseY) / currentZoom;
      pan(dx, dy);
    } else if (isPainting) {
      const gridPos = screenToGrid(mouseX, mouseY);
      const lastGridPos = screenToGrid(lastMouseX, lastMouseY);

      // Only update if we've moved to a new cell
      if (gridPos.x !== lastGridPos.x || gridPos.y !== lastGridPos.y) {
        if (paintMode === 'set') {
          setCell(gridPos.x, gridPos.y);
        } else {
          if (isAlive(gridPos.x, gridPos.y)) {
            toggleCell(gridPos.x, gridPos.y);
          }
        }
      }
    }

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }

  function handleMouseUp() {
    isDragging = false;
    isPainting = false;
    canvas.style.cursor = 'crosshair';
  }

  function handleMouseLeave() {
    isDragging = false;
    isPainting = false;
    canvas.style.cursor = 'crosshair';
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate mouse position in grid coordinates before zoom
    const gridPosBefore = screenToGrid(mouseX, mouseY);

    // Apply zoom
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, currentZoom * zoomFactor));
    setZoom(newZoom);

    // Calculate mouse position in grid coordinates after zoom
    // and adjust pan to keep the same grid position under the mouse
    const newEffectiveCellSize = BASE_CELL_SIZE * newZoom;
    const offsetX = canvas.width / 2 + currentPanX * newZoom;
    const offsetY = canvas.height / 2 + currentPanY * newZoom;

    const newGridX = Math.floor((mouseX - offsetX) / newEffectiveCellSize);
    const newGridY = Math.floor((mouseY - offsetY) / newEffectiveCellSize);

    // Adjust pan to keep grid position stable
    const dx = (gridPosBefore.x - newGridX) * BASE_CELL_SIZE;
    const dy = (gridPosBefore.y - newGridY) * BASE_CELL_SIZE;
    pan(dx, dy);
  }
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseLeave}
    on:wheel={handleWheel}
    on:contextmenu|preventDefault
  ></canvas>
</div>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }
</style>
