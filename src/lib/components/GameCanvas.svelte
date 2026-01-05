<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    zoom,
    panX,
    panY,
    pan,
    setZoom,
    getLivingCells,
    getColoredCells,
    toggleCell,
    setCell,
    setCells,
    setColoredCells,
    isAlive,
    isRunning,
    speed,
    step,
    paintColor,
    capturedCells,
    BASE_CELL_SIZE,
  } from '../stores/gameStore';
  import { currentTheme } from '../stores/themeStore';
  import { gameMode } from '../stores/gameModeStore';
  import type { Pattern } from '../patterns/patterns';

  // Pattern placement props
  export let selectedPattern: Pattern | null = null;
  export let patternRotation: number = 0; // 0, 90, 180, 270

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

  // Pattern preview position
  let previewGridX = 0;
  let previewGridY = 0;
  let showPreview = false;

  // Capture flash animation
  let flashCells: { x: number; y: number; toColor: 1 | 2; alpha: number }[] = [];
  let flashStartTime = 0;
  const FLASH_DURATION = 400; // ms

  // Zoom sensitivity (lower = less sensitive)
  const ZOOM_SENSITIVITY = 0.03;

  // Reactive values
  let currentZoom: number;
  let currentPanX: number;
  let currentPanY: number;
  let running: boolean;
  let currentSpeed: number;
  let currentPaintColor: 1 | 2;
  let isBattleMode: boolean;

  $: currentZoom = $zoom;
  $: currentPanX = $panX;
  $: currentPanY = $panY;
  $: running = $isRunning;
  $: currentSpeed = $speed;
  $: theme = $currentTheme;
  $: currentPaintColor = $paintColor;
  $: isBattleMode = $gameMode === 'battle';

  // Watch for captured cells and trigger flash
  $: if ($capturedCells.length > 0) {
    flashCells = $capturedCells.map(c => ({ x: c.x, y: c.y, toColor: c.toColor, alpha: 1 }));
    flashStartTime = performance.now();
  }

  // Calculate effective cell size
  $: effectiveCellSize = BASE_CELL_SIZE * currentZoom;

  // Get rotated pattern cells
  $: rotatedPattern = getRotatedPatternCells(selectedPattern, patternRotation);

  function getRotatedPatternCells(pattern: Pattern | null, rotation: number): { cells: { x: number; y: number }[]; width: number; height: number } | null {
    if (!pattern) return null;

    // Deep copy cells
    let cells = pattern.cells.map(c => ({ x: c.x, y: c.y }));
    let width = pattern.width;
    let height = pattern.height;

    const rotations = Math.floor((rotation / 90) % 4);
    for (let i = 0; i < rotations; i++) {
      // Rotate 90 degrees clockwise: (x, y) -> (height - 1 - y, x)
      cells = cells.map((cell) => ({
        x: height - 1 - cell.y,
        y: cell.x,
      }));
      // Swap dimensions
      [width, height] = [height, width];
    }

    // Center the pattern
    const offsetX = Math.floor(width / 2);
    const offsetY = Math.floor(height / 2);
    cells = cells.map((cell) => ({
      x: cell.x - offsetX,
      y: cell.y - offsetY,
    }));

    return { cells, width, height };
  }

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

    // Clear canvas with theme background
    ctx.fillStyle = theme.colors.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible area in grid coordinates
    const offsetX = width / 2 + currentPanX * currentZoom;
    const offsetY = height / 2 + currentPanY * currentZoom;

    // Draw grid lines
    if (theme.effects.gridVisible) {
      drawGrid(width, height, offsetX, offsetY);
    }

    // Draw living cells
    drawCells(offsetX, offsetY);

    // Draw capture flash effects
    if (isBattleMode && flashCells.length > 0) {
      drawCaptureFlash(offsetX, offsetY);
    }

    // Draw pattern preview
    if (showPreview && rotatedPattern) {
      drawPatternPreview(offsetX, offsetY);
    }
  }

  function drawGrid(width: number, height: number, offsetX: number, offsetY: number) {
    if (effectiveCellSize < 4) return; // Don't draw grid when zoomed out too far

    ctx.strokeStyle = theme.colors.grid;
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
    const padding = theme.effects.cellBorderRadius > 0 ? 1 : 0.5;

    if (isBattleMode) {
      // Battle mode: draw colored cells
      const cells = getColoredCells();

      // Group cells by color for batch drawing
      const color1Cells = cells.filter(c => c.color === 1);
      const color2Cells = cells.filter(c => c.color === 2);

      // Draw color 1 cells
      ctx.fillStyle = theme.colors.cell;
      if (theme.effects.cellGlow && effectiveCellSize >= 6) {
        ctx.shadowColor = theme.colors.cellGlow;
        ctx.shadowBlur = theme.effects.glowIntensity;
      }
      drawCellBatch(color1Cells, offsetX, offsetY, padding);
      ctx.shadowBlur = 0;

      // Draw color 2 cells
      ctx.fillStyle = theme.colors.cellSecondary || '#ff6b6b';
      if (theme.effects.cellGlow && effectiveCellSize >= 6) {
        ctx.shadowColor = theme.colors.cellSecondary || '#ff6b6b';
        ctx.shadowBlur = theme.effects.glowIntensity;
      }
      drawCellBatch(color2Cells, offsetX, offsetY, padding);
      ctx.shadowBlur = 0;
    } else {
      // Classic mode: all cells same color
      const cells = getLivingCells();
      ctx.fillStyle = theme.colors.cell;

      if (theme.effects.cellGlow && effectiveCellSize >= 6) {
        ctx.shadowColor = theme.colors.cellGlow;
        ctx.shadowBlur = theme.effects.glowIntensity;
      }

      drawCellBatch(cells, offsetX, offsetY, padding);
      ctx.shadowBlur = 0;
    }
  }

  function drawCellBatch(cells: { x: number; y: number }[], offsetX: number, offsetY: number, padding: number) {
    const radius = theme.effects.cellBorderRadius > 0 && effectiveCellSize >= 6
      ? Math.min(theme.effects.cellBorderRadius, (effectiveCellSize - padding * 2) / 4)
      : 0;

    cells.forEach((cell) => {
      const screenX = offsetX + cell.x * effectiveCellSize;
      const screenY = offsetY + cell.y * effectiveCellSize;

      // Only draw if visible
      if (
        screenX + effectiveCellSize >= 0 &&
        screenX <= canvas.width &&
        screenY + effectiveCellSize >= 0 &&
        screenY <= canvas.height
      ) {
        if (radius > 0) {
          roundRect(
            ctx,
            screenX + padding,
            screenY + padding,
            effectiveCellSize - padding * 2,
            effectiveCellSize - padding * 2,
            radius
          );
        } else {
          ctx.fillRect(
            screenX + padding,
            screenY + padding,
            effectiveCellSize - padding * 2,
            effectiveCellSize - padding * 2
          );
        }
      }
    });
  }

  function drawCaptureFlash(offsetX: number, offsetY: number) {
    const elapsed = performance.now() - flashStartTime;
    const progress = Math.min(elapsed / FLASH_DURATION, 1);

    if (progress >= 1) {
      flashCells = [];
      return;
    }

    // Easing: start bright, fade out
    const alpha = 1 - progress;
    const scale = 1 + (1 - progress) * 0.5; // Start 1.5x, shrink to 1x

    flashCells.forEach((cell) => {
      const screenX = offsetX + cell.x * effectiveCellSize;
      const screenY = offsetY + cell.y * effectiveCellSize;

      // Only draw if visible
      if (
        screenX + effectiveCellSize >= 0 &&
        screenX <= canvas.width &&
        screenY + effectiveCellSize >= 0 &&
        screenY <= canvas.height
      ) {
        const color = cell.toColor === 1 ? theme.colors.cell : (theme.colors.cellSecondary || '#ff6b6b');

        // Draw expanding ring/glow
        const ringSize = effectiveCellSize * scale;
        const ringOffset = (ringSize - effectiveCellSize) / 2;

        ctx.save();
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, effectiveCellSize * 0.15);
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * alpha;

        ctx.strokeRect(
          screenX - ringOffset,
          screenY - ringOffset,
          ringSize,
          ringSize
        );

        ctx.restore();
      }
    });
  }

  function drawPatternPreview(offsetX: number, offsetY: number) {
    if (!rotatedPattern) return;

    const padding = 1;
    ctx.globalAlpha = 0.5;

    // Use paint color in battle mode
    if (isBattleMode) {
      ctx.fillStyle = currentPaintColor === 1 ? theme.colors.cell : (theme.colors.cellSecondary || '#ff6b6b');
    } else {
      ctx.fillStyle = theme.colors.cell;
    }

    if (theme.effects.cellGlow) {
      ctx.shadowColor = isBattleMode && currentPaintColor === 2
        ? (theme.colors.cellSecondary || '#ff6b6b')
        : theme.colors.cellGlow;
      ctx.shadowBlur = theme.effects.glowIntensity / 2;
    }

    rotatedPattern.cells.forEach((cell) => {
      const screenX = offsetX + (previewGridX + cell.x) * effectiveCellSize;
      const screenY = offsetY + (previewGridY + cell.y) * effectiveCellSize;

      ctx.fillRect(
        screenX + padding,
        screenY + padding,
        effectiveCellSize - padding * 2,
        effectiveCellSize - padding * 2
      );
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
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
      // Check if we're placing a pattern
      if (selectedPattern && rotatedPattern) {
        const gridPos = screenToGrid(mouseX, mouseY);
        if (isBattleMode) {
          const patternCells = rotatedPattern.cells.map((cell) => ({
            x: gridPos.x + cell.x,
            y: gridPos.y + cell.y,
            color: currentPaintColor,
          }));
          setColoredCells(patternCells);
        } else {
          const patternCells = rotatedPattern.cells.map((cell) => ({
            x: gridPos.x + cell.x,
            y: gridPos.y + cell.y,
          }));
          setCells(patternCells);
        }
        return;
      }

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

    // Update pattern preview position
    if (selectedPattern) {
      const gridPos = screenToGrid(mouseX, mouseY);
      previewGridX = gridPos.x;
      previewGridY = gridPos.y;
      showPreview = true;
    }

    if (isDragging) {
      const dx = (mouseX - lastMouseX) / currentZoom;
      const dy = (mouseY - lastMouseY) / currentZoom;
      pan(dx, dy);
    } else if (isPainting && !selectedPattern) {
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
    canvas.style.cursor = selectedPattern ? 'copy' : 'crosshair';
  }

  function handleMouseLeave() {
    isDragging = false;
    isPainting = false;
    showPreview = false;
    canvas.style.cursor = selectedPattern ? 'copy' : 'crosshair';
  }

  function handleMouseEnter() {
    if (selectedPattern) {
      showPreview = true;
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    // macOS trackpad: 2-finger scroll = pan (ctrlKey false), pinch = zoom (ctrlKey true)
    // Mouse wheel: always zoom
    const isTrackpadPan = !e.ctrlKey && (Math.abs(e.deltaX) > 0 || e.deltaMode === 0);

    if (isTrackpadPan && Math.abs(e.deltaX) + Math.abs(e.deltaY) > 0) {
      // Trackpad pan: invert for natural scrolling feel
      pan(-e.deltaX / currentZoom, -e.deltaY / currentZoom);
      return;
    }

    // Zoom (mouse wheel or trackpad pinch)
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get the grid position under the mouse BEFORE zoom
    const offsetXBefore = canvas.width / 2 + currentPanX * currentZoom;
    const offsetYBefore = canvas.height / 2 + currentPanY * currentZoom;
    const gridXBefore = (mouseX - offsetXBefore) / effectiveCellSize;
    const gridYBefore = (mouseY - offsetYBefore) / effectiveCellSize;

    // Apply zoom
    const zoomFactor = 1 + (e.deltaY > 0 ? -ZOOM_SENSITIVITY : ZOOM_SENSITIVITY);
    const newZoom = Math.max(0.1, Math.min(5, currentZoom * zoomFactor));
    setZoom(newZoom);

    // Calculate where the same grid position would be AFTER zoom
    const newEffectiveCellSize = BASE_CELL_SIZE * newZoom;
    const offsetXAfter = canvas.width / 2 + currentPanX * newZoom;
    const offsetYAfter = canvas.height / 2 + currentPanY * newZoom;
    const screenXAfter = offsetXAfter + gridXBefore * newEffectiveCellSize;
    const screenYAfter = offsetYAfter + gridYBefore * newEffectiveCellSize;

    // Adjust pan to keep the grid position under the mouse
    const dx = (mouseX - screenXAfter) / newZoom;
    const dy = (mouseY - screenYAfter) / newZoom;
    pan(dx, dy);
  }

  // Update cursor when pattern selection changes
  $: {
    if (canvas) {
      canvas.style.cursor = selectedPattern ? 'copy' : 'crosshair';
    }
  }
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvas}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseLeave}
    on:mouseenter={handleMouseEnter}
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
