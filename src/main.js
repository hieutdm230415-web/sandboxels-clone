import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';
import { MATERIALS, WORLD_HEIGHT as WORLD_HEIGHT_CONST } from './config.js';
import { inBounds, grid, idx } from './simulation.js';

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

export function paintAt(x, y, brushSize, toolMode, activeMaterial, state) {
  if (!inBounds(x, y)) return;
  const radius = brushSize;

  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (!inBounds(xx, yy)) continue;
      const dx = xx - x;
      const dy = yy - y;
      if (dx * dx + dy * dy > (radius + 0.3) * (radius + 0.3)) continue;

      const i = idx(xx, yy);
      if (toolMode === 'erase') {
        state.grid[i] = MATERIALS.empty.id;
        state.temperature[i] = 0;
        state.life[i] = 0;
        continue;
      }

      if (toolMode === 'heat') {
        if (state.grid[i] !== MATERIALS.empty.id) {
          state.temperature[i] += 80;
        }
        continue;
      }

      if (toolMode === 'special') {
        if (activeMaterial === 'water') {
          state.grid[i] = MATERIALS.steam.id;
          state.temperature[i] = 72;
        } else if (activeMaterial === 'fire') {
          state.grid[i] = MATERIALS.fire.id;
          state.temperature[i] = 150;
        } else {
          state.grid[i] = state.materialIds[activeMaterial];
          state.temperature[i] = state.baseTemps[activeMaterial];
        }
        continue;
      }

      if (activeMaterial === 'empty') {
        state.grid[i] = MATERIALS.empty.id;
      } else {
        state.grid[i] = state.materialIds[activeMaterial];
        state.temperature[i] = state.baseTemps[activeMaterial];
      }
    }
  }
}
