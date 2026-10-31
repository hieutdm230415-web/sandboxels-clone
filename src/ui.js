import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';
import { inBounds } from './simulation.js';

export function bindInput({ canvas, onPaint, onControl }) {
  let drawing = false;
  let lastPointer = null;

  const pointerToCell = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * WORLD_WIDTH);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT);
    return { x, y };
  };

  canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    const pos = pointerToCell(event);
    lastPointer = pos;

    if (event.button === 2) {
      onControl('erase');
      onPaint(pos.x, pos.y, 'erase');
      return;
    }

    onPaint(pos.x, pos.y, 'paint');
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    const pos = pointerToCell(event);
    if (!lastPointer || pos.x !== lastPointer.x || pos.y !== lastPointer.y) {
      onPaint(pos.x, pos.y, 'paint');
      lastPointer = pos;
    }
  });

  canvas.addEventListener('pointerup', () => {
    drawing = false;
    lastPointer = null;
  });

  canvas.addEventListener('pointerleave', () => {
    drawing = false;
    lastPointer = null;
  });

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = Math.sign(event.deltaY);
    onControl('wheel', delta);
  }, { passive: false });
}

export function paintAt(x, y, brushSize, toolMode, activeMaterial, gridState) {
  if (!inBounds(x, y)) return;

  const r = brushSize;
  for (let yy = y - r; yy <= y + r; yy++) {
    for (let xx = x - r; xx <= x + r; xx++) {
      if (!inBounds(xx, yy)) continue;
      const dx = xx - x;
      const dy = yy - y;
      if (dx * dx + dy * dy > (r + 0.3) * (r + 0.3)) continue;

      const i = yy * 180 + xx;
      if (toolMode === 'erase') {
        gridState.grid[i] = 0;
        continue;
      }

      if (toolMode === 'heat') {
        if (gridState.grid[i] !== 0) {
          gridState.temperature[i] += 80;
        }
        continue;
      }

      if (toolMode === 'special') {
        if (activeMaterial === 'water') {
          gridState.grid[i] = 6;
          gridState.temperature[i] = 72;
        } else if (activeMaterial === 'fire') {
          gridState.grid[i] = 5;
          gridState.temperature[i] = 150;
        } else {
          gridState.grid[i] = gridState.materialIds[activeMaterial];
          gridState.temperature[i] = gridState.baseTemps[activeMaterial];
        }
        continue;
      }

      if (activeMaterial === 'empty') {
        gridState.grid[i] = 0;
      } else {
        gridState.grid[i] = gridState.materialIds[activeMaterial];
        gridState.temperature[i] = gridState.baseTemps[activeMaterial];
      }
    }
  }
}
