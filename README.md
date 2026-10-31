import { MATERIALS, MATERIAL_ORDER, DEFAULT_BRUSH_SIZE } from './config.js';
import { grid, temperature, life, clearWorld, generateTerrain, idx, inBounds, clearCell, setCell, swapCells, getMaterialById } from './simulation.js';
import { drawWorld } from './render.js';
import { bindInput, paintAt } from './input.js';
import { buildMaterialList, bindToolButtons, updateToolLabel, updateBrushLabel, updateMaterialName, updateCellsCount } from './ui.js';

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const materialGrid = document.getElementById('materialGrid');
const brushSlider = document.getElementById('brushSize');
const brushSizeLabel = document.getElementById('brushSizeLabel');

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
    const r = brushSize;
    for (let yy = y - r; yy <= y + r; yy++) {
      for (let xx = x - r; xx <= x + r; xx++) {
        if (!inBounds(xx, yy)) continue;
        const dx = xx - x;
        const dy = yy - y;
        if (dx * dx + dy * dy > (r + 0.3) * (r + 0.3)) continue;
        clearCell(xx, yy);
      }
    }
    return;
  }

  if (effectiveMode === 'heat') {
    const r = brushSize;
    for (let yy = y - r; yy <= y + r; yy++) {
      for (let xx = x - r; xx <= x + r; xx++) {
        if (!inBounds(xx, yy)) continue;
        const dx = xx - x;
        const dy = yy - y;
        if (dx * dx + dy * dy > (r + 0.3) * (r + 0.3)) continue;
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
      const type = grid[idx(x, y)];
      if (type === MATERIALS.empty.id) continue;

      switch (type) {
        case MATERIALS.sand.id:
          if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y + 1);
          } else {
            const dirs = [-1, 1];
            for (const dir of dirs) {
              const nx = x + dir;
              const ni = idx(nx, y + 1);
              if (inBounds(nx, y + 1) && (grid[ni] === MATERIALS.empty.id || grid[ni] === MATERIALS.water.id)) {
                swapCells(x, y, nx, y + 1);
                break;
              }
            }
          }
          break;
        case MATERIALS.water.id:
          if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y + 1);
          } else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            const nx = x + dir;
            const ny = y + (Math.random() < 0.5 ? 0 : 1);
            if (inBounds(nx, ny) && grid[idx(nx, ny)] === MATERIALS.empty.id) {
              swapCells(x, y, nx, ny);
            }
          }
          break;
        case MATERIALS.oil.id:
          if (temperature[idx(x, y)] > 60) {
            setCell(x, y, 'fire', 18, 150);
          } else if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y + 1);
          }
          break;
        case MATERIALS.fire.id:
          life[idx(x, y)] += 1;
          if (life[idx(x, y)] > 28 || temperature[idx(x, y)] < 22) {
            if (Math.random() < 0.66) setCell(x, y, 'smoke', 10, 30);
            else clearCell(x, y);
            break;
          }
          if (y > 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y - 1);
          }
          break;
        case MATERIALS.steam.id:
          life[idx(x, y)] += 1;
          if (life[idx(x, y)] > 18) {
            clearCell(x, y);
            break;
          }
          if (y > 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y - 1);
          }
          break;
        case MATERIALS.smoke.id:
          life[idx(x, y)] += 1;
          if (life[idx(x, y)] > 25) {
            clearCell(x, y);
            break;
          }
          if (y > 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y - 1);
          }
          break;
        case MATERIALS.lava.id:
          if (temperature[idx(x, y)] < 55) {
            if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
              swapCells(x, y, x, y + 1);
            }
          } else if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.water.id) {
            setCell(x, y, 'steam', 10, 78);
            clearCell(x, y + 1);
          } else if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y + 1);
          }
          break;
        case MATERIALS.acid.id:
          const neighbors = [
            [x, y + 1], [x + 1, y], [x - 1, y], [x, y - 1],
            [x + 1, y + 1], [x - 1, y + 1], [x + 1, y - 1], [x - 1, y - 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (!inBounds(nx, ny)) continue;
            const n = idx(nx, ny);
            const target = grid[n];
            if (target === MATERIALS.empty.id || target === MATERIALS.acid.id) continue;
            if (target === MATERIALS.metal.id || target === MATERIALS.brick.id) continue;
            if (Math.random() < 0.48) {
              clearCell(nx, ny);
              break;
            }
          }
          break;
        case MATERIALS.plant.id:
          if (temperature[idx(x, y)] > 72) {
            setCell(x, y, 'fire', 12, 130);
          } else if (Math.random() < 0.02 && y > 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
            setCell(x, y - 1, 'plant', 0, 24);
          }
          break;
        case MATERIALS.ice.id:
          if (temperature[idx(x, y)] > 24) {
            setCell(x, y, 'water', 0, 18);
          } else if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y + 1);
          }
          break;
        case MATERIALS.salt.id:
          if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.water.id) {
            clearCell(x, y);
          } else if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
            swapCells(x, y, x, y + 1);
          }
          break;
        case MATERIALS.wood.id:
          if (temperature[idx(x, y)] > 62) setCell(x, y, 'fire', 14, 145);
          break;
        default:
          break;
      }
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
    for (let i = 0; i < 2; i++) stepRules();
  }
  drawWorld(canvas, ctx, 180, 110);
  renderCount();
  requestAnimationFrame(loop);
}

function setupEvents() {
  bindToolButtons((nextMode) => {
    toolMode = nextMode;
    updateToolLabel(toolMode);
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
      const order = Object.keys(MATERIALS).filter((k) => k !== 'empty');
      const index = order.indexOf(activeMaterial);
      activeMaterial = order[(index - 1 + order.length) % order.length];
      updateMaterialName(MATERIALS[activeMaterial].name);
      renderMaterials();
    }
    if (key === 'e') {
      const order = Object.keys(MATERIALS).filter((k) => k !== 'empty');
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
