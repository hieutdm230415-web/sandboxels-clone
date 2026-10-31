import { MATERIALS, MATERIAL_ORDER, DEFAULT_BRUSH_SIZE } from './config.js';
import {
  grid,
  temperature,
  life,
  idx,
  inBounds,
  clearWorld,
  generateTerrain,
  clearCell,
  setCell,
  swapCells,
  updateCell
} from './simulation.js';
import { drawWorld } from './render.js';
import { bindInput, paintAt } from './input.js';
import {
  buildMaterialList,
  bindToolButtons,
  updateToolLabel,
  updateBrushLabel,
  updateMaterialName,
  updateCellsCount
} from './ui.js';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const materialGrid = document.getElementById('materialGrid');
const brushSlider = document.getElementById('brushSize');

let activeMaterial = 'sand';
let toolMode = 'paint';
let brushSize = DEFAULT_BRUSH_SIZE;
let isPaused = false;

const state = {
  grid,
  temperature,
  life,
  materialIds: Object.fromEntries(Object.entries(MATERIALS).map(([key, value]) => [key, value.id])),
  baseTemps: Object.fromEntries(Object.entries(MATERIALS).map(([key, value]) => [key, value.baseTemp]))
};

function renderMaterials() {
  buildMaterialList(materialGrid, activeMaterial, (key) => {
    activeMaterial = key;
    updateMaterialName(MATERIALS[key].name);
    renderMaterials();
  });
}

function updateToolMode(nextMode) {
  toolMode = nextMode;
  updateToolLabel(toolMode);
}

function paint(x, y, mode = 'paint') {
  const effectiveMode = mode === 'erase' ? 'erase' : toolMode;

  if (effectiveMode === 'erase') {
    const radius = brushSize;
    for (let yy = y - radius; yy <= y + radius; yy++) {
      for (let xx = x - radius; xx <= x + radius; xx++) {
        if (!inBounds(xx, yy)) continue;
        const dx = xx - x;
        const dy = yy - y;
        if (dx * dx + dy * dy > (radius + 0.3) * (radius + 0.3)) continue;
        clearCell(xx, yy);
      }
    }
    return;
  }

  if (effectiveMode === 'heat') {
    const radius = brushSize;
    for (let yy = y - radius; yy <= y + radius; yy++) {
      for (let xx = x - radius; xx <= x + radius; xx++) {
        if (!inBounds(xx, yy)) continue;
        const dx = xx - x;
        const dy = yy - y;
        if (dx * dx + dy * dy > (radius + 0.3) * (radius + 0.3)) continue;
        const cellIndex = idx(xx, yy);
        if (grid[cellIndex] !== MATERIALS.empty.id) {
          temperature[cellIndex] += 80;
        }
      }
    }
    return;
  }

  paintAt(x, y, brushSize, effectiveMode, activeMaterial, state);
}

function stepRules() {
  for (let y = 109; y >= 0; y--) {
    for (let x = 179; x >= 0; x--) {
      updateCell(x, y);
    }
  }
}

function renderCount() {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== MATERIALS.empty.id) count++;
  }
  updateCellsCount(count);
}

function loop() {
  if (!isPaused) {
    for (let i = 0; i < 2; i++) {
      stepRules();
    }
  }

  drawWorld(canvas, ctx, 180, 110);
  renderCount();
  requestAnimationFrame(loop);
}

function setupEvents() {
  bindToolButtons((nextMode) => {
    updateToolMode(nextMode);
  });

  bindInput({
    canvas,
    onPaint: (x, y, mode) => paint(x, y, mode),
    onControl: (action, value) => {
      if (action === 'wheel') {
        brushSize = Math.max(1, Math.min(12, brushSize + (value > 0 ? 1 : -1)));
        brushSlider.value = String(brushSize);
        updateBrushLabel(brushSize);
      }

      if (action === 'erase') {
        toolMode = 'erase';
        updateToolLabel(toolMode);
      }
    }
  });

  brushSlider.addEventListener('input', () => {
    brushSize = Number(brushSlider.value);
    updateBrushLabel(brushSize);
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    clearWorld();
  });

  document.getElementById('terrainBtn').addEventListener('click', () => {
    generateTerrain();
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'particle-forge.png';
    link.click();
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'q') {
      const order = MATERIAL_ORDER;
      const index = order.indexOf(activeMaterial);
      activeMaterial = order[(index - 1 + order.length) % order.length];
      updateMaterialName(MATERIALS[activeMaterial].name);
      renderMaterials();
    }

    if (key === 'e') {
      const order = MATERIAL_ORDER;
      const index = order.indexOf(activeMaterial);
      activeMaterial = order[(index + 1) % order.length];
      updateMaterialName(MATERIALS[activeMaterial].name);
      renderMaterials();
    }
  });
}

function init() {
  renderMaterials();
  updateMaterialName(MATERIALS[activeMaterial].name);
  updateToolLabel(toolMode);
  updateBrushLabel(brushSize);
  generateTerrain();
  setupEvents();
  requestAnimationFrame(loop);
}

init();
