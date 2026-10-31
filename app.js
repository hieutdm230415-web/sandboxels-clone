const WORLD_WIDTH = 180;
const WORLD_HEIGHT = 110;
const CELL_SIZE = 8;

const MATERIALS = {
  empty: { id: 0, name: 'Empty', color: '#000000', baseTemp: 0 },
  sand: { id: 1, name: 'Sand', color: '#d6b36a', baseTemp: 22 },
  water: { id: 2, name: 'Water', color: '#4ab7ff', baseTemp: 12 },
  stone: { id: 3, name: 'Stone', color: '#757f90', baseTemp: 18 },
  wood: { id: 4, name: 'Wood', color: '#8b5d3b', baseTemp: 18 },
  fire: { id: 5, name: 'Fire', color: '#ff8b3d', baseTemp: 140 },
  steam: { id: 6, name: 'Steam', color: '#dfeaf5', baseTemp: 60 },
  smoke: { id: 7, name: 'Smoke', color: '#9aa7b8', baseTemp: 28 },
  oil: { id: 8, name: 'Oil', color: '#2f2a27', baseTemp: 20 },
  lava: { id: 9, name: 'Lava', color: '#ff4e05', baseTemp: 190 },
  ice: { id: 10, name: 'Ice', color: '#9adbf9', baseTemp: -5 },
  metal: { id: 11, name: 'Metal', color: '#c1cad5', baseTemp: 21 },
  acid: { id: 12, name: 'Acid', color: '#95ee72', baseTemp: 18 },
  plant: { id: 13, name: 'Plant', color: '#4fd56b', baseTemp: 23 },
  salt: { id: 14, name: 'Salt', color: '#edf4ff', baseTemp: 22 },
  glass: { id: 15, name: 'Glass', color: '#7ad9d7', baseTemp: 25 },
  dirt: { id: 16, name: 'Dirt', color: '#6f4633', baseTemp: 18 },
  brick: { id: 17, name: 'Brick', color: '#c86f54', baseTemp: 18 }
};

const MATERIAL_ORDER = [
  'sand', 'water', 'stone', 'wood', 'fire', 'plant', 'lava', 'steam', 'smoke',
  'oil', 'acid', 'ice', 'metal', 'salt', 'glass', 'dirt', 'brick'
];

const idToName = new Map();
Object.entries(MATERIALS).forEach(([name, material]) => idToName.set(material.id, name));

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const materialGrid = document.getElementById('materialGrid');
const selectedMaterialName = document.getElementById('selectedMaterialName');
const cellCountLabel = document.getElementById('cellCount');
const brushSizeLabel = document.getElementById('brushSizeLabel');
const toolModeLabel = document.getElementById('toolModeLabel');
const brushSlider = document.getElementById('brushSize');

const grid = new Uint16Array(WORLD_WIDTH * WORLD_HEIGHT);
const temperature = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
const life = new Uint16Array(WORLD_WIDTH * WORLD_HEIGHT);

let activeMaterial = 'sand';
let toolMode = 'paint';
let brushSize = Number(brushSlider.value);
let isPaused = false;
let drawing = false;
let lastPointer = null;

function idx(x, y) {
  return y * WORLD_WIDTH + x;
}

function inBounds(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

function matByName(name) {
  return MATERIALS[name] || MATERIALS.empty;
}

function matById(id) {
  return MATERIALS[idToName.get(id)] || MATERIALS.empty;
}

function setCell(x, y, type, lifeValue = 0, temp = matByName(type).baseTemp) {
  if (!inBounds(x, y)) return;
  const i = idx(x, y);
  grid[i] = matByName(type).id;
  life[i] = lifeValue;
  temperature[i] = temp;
}

function clearCell(x, y) {
  if (!inBounds(x, y)) return;
  const i = idx(x, y);
  grid[i] = MATERIALS.empty.id;
  life[i] = 0;
  temperature[i] = 0;
}

function swapCells(x1, y1, x2, y2) {
  if (!inBounds(x1, y1) || !inBounds(x2, y2)) return;
  const a = idx(x1, y1);
  const b = idx(x2, y2);

  const tmpId = grid[a];
  const tmpTemp = temperature[a];
  const tmpLife = life[a];

  grid[a] = grid[b];
  temperature[a] = temperature[b];
  life[a] = life[b];

  grid[b] = tmpId;
  temperature[b] = tmpTemp;
  life[b] = tmpLife;
}

function randomChance(prob) {
  return Math.random() < prob;
}

function avgTemp(x, y, radius = 1) {
  let sum = 0;
  let count = 0;
  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (!inBounds(xx, yy)) continue;
      sum += temperature[idx(xx, yy)];
      count++;
    }
  }
  return count ? sum / count : 0;
}

function updateSand(x, y) {
  if (avgTemp(x, y, 2) > 85 && randomChance(0.12)) {
    setCell(x, y, 'glass', 0, 28);
    return;
  }

  const under = y + 1;
  if (under < WORLD_HEIGHT) {
    const u = idx(x, under);
    if (grid[u] === MATERIALS.empty.id) {
      swapCells(x, y, x, under);
      return;
    }
    if (grid[u] === MATERIALS.water.id) {
      swapCells(x, y, x, under);
      return;
    }
  }

  const dirs = [-1, 1];
  for (let i = 0; i < 2; i++) {
    const d = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + d;
    const ny = y + 1;
    if (inBounds(nx, ny)) {
      const n = idx(nx, ny);
      if (grid[n] === MATERIALS.empty.id || grid[n] === MATERIALS.water.id) {
        swapCells(x, y, nx, ny);
        return;
      }
    }
  }
}

function updateWater(x, y) {
  if (avgTemp(x, y, 1) > 52) {
    setCell(x, y, 'steam', 6, 74);
    return;
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
    return;
  }

  const dir = Math.random() < 0.5 ? -1 : 1;
  const nx = x + dir;
  const ny = y + (Math.random() < 0.5 ? 0 : 1);
  if (inBounds(nx, ny) && grid[idx(nx, ny)] === MATERIALS.empty.id) {
    swapCells(x, y, nx, ny);
    return;
  }

  const alt = x + (Math.random() < 0.5 ? -1 : 1);
  if (inBounds(alt, y) && grid[idx(alt, y)] === MATERIALS.empty.id) {
    swapCells(x, y, alt, y);
  }
}

function updateSteam(x, y) {
  const i = idx(x, y);
  life[i] += 1;
  if (life[i] > 18) {
    clearCell(x, y);
    return;
  }

  if (y - 1 >= 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y - 1);
    return;
  }

  if (randomChance(0.35)) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const nx = x + dir;
    const ny = y - 1;
    if (inBounds(nx, ny) && grid[idx(nx, ny)] === MATERIALS.empty.id) {
      swapCells(x, y, nx, ny);
      return;
    }
  }

  if (randomChance(0.08)) {
    clearCell(x, y);
  }
}

function updateSmoke(x, y) {
  const i = idx(x, y);
  life[i] += 1;
  if (life[i] > 25) {
    clearCell(x, y);
    return;
  }

  if (y - 1 >= 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y - 1);
    return;
  }

  const dir = Math.random() < 0.5 ? -1 : 1;
  const nx = x + dir;
  const ny = y - 1;
  if (inBounds(nx, ny) && grid[idx(nx, ny)] === MATERIALS.empty.id) {
    swapCells(x, y, nx, ny);
  }
}

function updateOil(x, y) {
  if (avgTemp(x, y, 1) > 60) {
    setCell(x, y, 'fire', 18, 150);
    return;
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
    return;
  }

  const side = Math.random() < 0.5 ? -1 : 1;
  const nx = x + side;
  if (inBounds(nx, y) && grid[idx(nx, y)] === MATERIALS.empty.id) {
    swapCells(x, y, nx, y);
  }
}

function updateFire(x, y) {
  const i = idx(x, y);
  life[i] += 1;

  if (life[i] > 28 || avgTemp(x, y, 1) < 22) {
    if (randomChance(0.66)) {
      setCell(x, y, 'smoke', 10, 30);
    } else {
      clearCell(x, y);
    }
    return;
  }

  const neighbors = [
    [x, y - 1], [x - 1, y], [x + 1, y],
    [x, y + 1], [x - 1, y - 1], [x + 1, y - 1]
  ];

  for (const [nx, ny] of neighbors) {
    if (!inBounds(nx, ny)) continue;
    const n = idx(nx, ny);
    const target = grid[n];

    if (target === MATERIALS.wood.id || target === MATERIALS.plant.id) {
      setCell(nx, ny, 'fire', 18, 140);
    }

    if (target === MATERIALS.oil.id) {
      setCell(nx, ny, 'fire', 18, 150);
    }

    if (target === MATERIALS.water.id || target === MATERIALS.steam.id) {
      clearCell(x, y);
      return;
    }
  }

  if (y - 1 >= 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y - 1);
  }
}

function updateLava(x, y) {
  if (avgTemp(x, y, 1) < 55) {
    if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
      swapCells(x, y, x, y + 1);
      return;
    }
    setCell(x, y, 'stone', 0, 20);
    return;
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
    return;
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.water.id) {
    setCell(x, y, 'steam', 10, 78);
    clearCell(x, y + 1);
    return;
  }

  const side = Math.random() < 0.5 ? -1 : 1;
  const nx = x + side;
  const ny = y + (Math.random() < 0.5 ? 0 : 1);
  if (inBounds(nx, ny) && grid[idx(nx, ny)] === MATERIALS.empty.id) {
    swapCells(x, y, nx, ny);
    return;
  }

  if (randomChance(0.12) && inBounds(x + 1, y) && grid[idx(x + 1, y)] === MATERIALS.sand.id) {
    setCell(x + 1, y, 'glass', 0, 30);
  }
}

function updateAcid(x, y) {
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

    if (randomChance(0.48)) {
      clearCell(nx, ny);
      if (randomChance(0.35)) {
        setCell(nx, ny, 'smoke', 5, 18);
      }
      return;
    }
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
  }
}

function updatePlant(x, y) {
  const waterNearby = [
    [x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1],
    [x - 1, y + 1], [x + 1, y + 1]
  ].some(([nx, ny]) => inBounds(nx, ny) && grid[idx(nx, ny)] === MATERIALS.water.id);

  if (waterNearby && randomChance(0.08)) {
    setCell(x, y, 'plant', 0, 24);
  }

  if (avgTemp(x, y, 1) > 72) {
    setCell(x, y, 'fire', 12, 130);
    return;
  }

  if (randomChance(0.03) && y > 0 && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
    setCell(x, y - 1, 'plant', 0, 24);
  }
}

function updateIce(x, y) {
  if (avgTemp(x, y, 1) > 24) {
    setCell(x, y, 'water', 0, 18);
    return;
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
  }
}

function updateSalt(x, y) {
  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.water.id) {
    clearCell(x, y);
    return;
  }

  if (y + 1 < WORLD_HEIGHT && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
    return;
  }

  const side = Math.random() < 0.5 ? -1 : 1;
  const nx = x + side;
  if (inBounds(nx, y) && grid[idx(nx, y)] === MATERIALS.empty.id) {
    swapCells(x, y, nx, y);
  }
}

function updateWood(x, y) {
  if (avgTemp(x, y, 1) > 62) {
    setCell(x, y, 'fire', 14, 145);
    return;
  }

  if (randomChance(0.01) && inBounds(x, y - 1) && grid[idx(x, y - 1)] === MATERIALS.empty.id) {
    setCell(x, y - 1, 'plant', 0, 22);
  }
}

function updateCell(x, y) {
  const type = grid[idx(x, y)];
  if (type === MATERIALS.empty.id) return;

  switch (type) {
    case MATERIALS.sand.id:
      updateSand(x, y);
      break;
    case MATERIALS.water.id:
      updateWater(x, y);
      break;
    case MATERIALS.oil.id:
      updateOil(x, y);
      break;
    case MATERIALS.steam.id:
      updateSteam(x, y);
      break;
    case MATERIALS.smoke.id:
      updateSmoke(x, y);
      break;
    case MATERIALS.fire.id:
      updateFire(x, y);
      break;
    case MATERIALS.lava.id:
      updateLava(x, y);
      break;
    case MATERIALS.acid.id:
      updateAcid(x, y);
      break;
    case MATERIALS.plant.id:
      updatePlant(x, y);
      break;
    case MATERIALS.ice.id:
      updateIce(x, y);
      break;
    case MATERIALS.salt.id:
      updateSalt(x, y);
      break;
    case MATERIALS.wood.id:
      updateWood(x, y);
      break;
    default:
      break;
  }
}

function stepSimulation() {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    for (let x = WORLD_WIDTH - 1; x >= 0; x--) {
      updateCell(x, y);
    }
  }
}

function renderMaterials() {
  materialGrid.innerHTML = '';
  MATERIAL_ORDER.forEach((key) => {
    const material = MATERIALS[key];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `material-btn ${activeMaterial === key ? 'active' : ''}`;
    button.innerHTML = `
      <span class="swatch" style="background:${material.color};"></span>
      <span class="material-name">${material.name}</span>
    `;
    button.addEventListener('click', () => {
      activeMaterial = key;
      selectedMaterialName.textContent = material.name;
      renderMaterials();
    });
    materialGrid.appendChild(button);
  });
}

function updateToolButtons() {
  document.querySelectorAll('.tool-btn[data-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === toolMode);
  });
  toolModeLabel.textContent = toolMode.charAt(0).toUpperCase() + toolMode.slice(1);
}

function paintAt(x, y) {
  if (!inBounds(x, y)) return;

  const r = brushSize;
  for (let yy = y - r; yy <= y + r; yy++) {
    for (let xx = x - r; xx <= x + r; xx++) {
      if (!inBounds(xx, yy)) continue; 
      const dx = xx - x;
      const dy = yy - y;
      if (dx * dx + dy * dy > (r + 0.3) * (r + 0.3)) continue;

      if (toolMode === 'erase') {
        clearCell(xx, yy);
        continue;
      }

      if (toolMode === 'heat') {
        const i = idx(xx, yy);
        if (grid[i] !== MATERIALS.empty.id) {
          temperature[i] += 90;
        }
        continue;
      }

      if (toolMode === 'special') {
        if (activeMaterial === 'water' && Math.random() < 0.45) {
          setCell(xx, yy, 'steam', 6, 72);
        } else if (activeMaterial === 'fire') {
          setCell(xx, yy, 'fire', 12, 150);
        } else {
          setCell(xx, yy, activeMaterial, 0, matByName(activeMaterial).baseTemp);
        }
        continue;
      }

      if (activeMaterial === 'empty') {
        clearCell(xx, yy);
      } else {
        const materialName = activeMaterial;
        if (materialName === 'fire') {
          setCell(xx, yy, 'fire', 10, 140);
        } else {
          setCell(xx, yy, materialName, 0, matByName(materialName).baseTemp);
        }
      }
    }
  }
}

function pointerToCell(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * WORLD_WIDTH);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT);
  return { x, y };
}

canvas.addEventListener('pointerdown', (event) => {
  drawing = true;
  const pos = pointerToCell(event);
  lastPointer = pos;

  if (event.button === 2) {
    const prev = toolMode;
    toolMode = 'erase';
    updateToolButtons();
    paintAt(pos.x, pos.y);
    toolMode = prev;
    updateToolButtons();
    return;
  }

  paintAt(pos.x, pos.y);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drawing) return;
  const pos = pointerToCell(event);
  if (!lastPointer || pos.x !== lastPointer.x || pos.y !== lastPointer.y) {
    paintAt(pos.x, pos.y);
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
  brushSize = Math.max(1, Math.min(12, brushSize + (delta > 0 ? 1 : -1)));
  brushSlider.value = String(brushSize);
  brushSizeLabel.textContent = String(brushSize);
}, { passive: false });

brushSlider.addEventListener('input', () => {
  brushSize = Number(brushSlider.value);
  brushSizeLabel.textContent = String(brushSize);
});

document.querySelectorAll('.tool-btn[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    toolMode = button.dataset.mode;
    updateToolButtons();
  });
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  isPaused = !isPaused;
  document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
});

document.getElementById('clearBtn').addEventListener('click', () => {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = MATERIALS.empty.id;
    temperature[i] = 0;
    life[i] = 0;
  }
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'particle-forge.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function generateTerrain() {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = MATERIALS.empty.id;
    temperature[i] = 0;
    life[i] = 0;
  }

  for (let x = 0; x < WORLD_WIDTH; x++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const floor = WORLD_HEIGHT - 16;
      if (y >= floor) {
        setCell(x, y, 'stone', 0, 18);
        if (y > floor + 2 && Math.random() < 0.18) setCell(x, y, 'dirt', 0, 18);
        if (y > floor + 5 && Math.random() < 0.12) setCell(x, y, 'sand', 0, 21);
        if (y > floor + 8 && Math.random() < 0.06) setCell(x, y, 'brick', 0, 18);
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    const cx = Math.floor(Math.random() * WORLD_WIDTH);
    const cy = Math.floor(Math.random() * (WORLD_HEIGHT - 28)) + 18;
    const r = 6 + Math.random() * 10;
    for (let yy = cy - r; yy <= cy + r; yy++) {
      for (let xx = cx - r; xx <= cx + r; xx++) {
        if (!inBounds(xx, yy)) continue;
        const dx = xx - cx;
        const dy = yy - cy;
        if (dx * dx + dy * dy <= r * r) {
          setCell(xx, yy, 'water', 0, 12);
        }
      }
    }
  }

  for (let i = 0; i < 170; i++) {
    const x = Math.floor(Math.random() * WORLD_WIDTH);
    const y = Math.floor(Math.random() * (WORLD_HEIGHT - 18));
    if (y < WORLD_HEIGHT - 30) setCell(x, y, 'plant', 0, 21);
  }

  for (let i = 0; i < 60; i++) {
    const x = Math.floor(Math.random() * WORLD_WIDTH);
    const y = Math.floor(Math.random() * (WORLD_HEIGHT - 35));
    if (y > 12) setCell(x, y, 'wood', 0, 18);
  }
}

document.getElementById('terrainBtn').addEventListener('click', generateTerrain);

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'q') {
    const index = MATERIAL_ORDER.indexOf(activeMaterial);
    activeMaterial = MATERIAL_ORDER[(index - 1 + MATERIAL_ORDER.length) % MATERIAL_ORDER.length];
    selectedMaterialName.textContent = MATERIALS[activeMaterial].name;
    renderMaterials();
  }
  if (key === 'e') {
    const index = MATERIAL_ORDER.indexOf(activeMaterial);
    activeMaterial = MATERIAL_ORDER[(index + 1) % MATERIAL_ORDER.length];
    selectedMaterialName.textContent = MATERIALS[activeMaterial].name;
    renderMaterials();
  }
});

function renderCount() {
  let count = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== MATERIALS.empty.id) count++;
  }
  cellCountLabel.textContent = count.toLocaleString();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#050b12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const cell = grid[idx(x, y)];
      if (cell === MATERIALS.empty.id) continue;

      const material = matById(cell);
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;

      ctx.fillStyle = material.color;
      ctx.fillRect(px + 1, py + 1, CELL_SIZE - 1, CELL_SIZE - 1);

      if (cell === MATERIALS.fire.id) {
        ctx.fillStyle = 'rgba(255, 214, 130, 0.28)';
        ctx.fillRect(px - 1, py - 1, CELL_SIZE + 2, CELL_SIZE + 2);
      }

      if (cell === MATERIALS.lava.id) {
        ctx.fillStyle = 'rgba(255, 105, 18, 0.18)';
        ctx.fillRect(px - 1, py - 1, CELL_SIZE + 2, CELL_SIZE + 2);
      }

      if (cell === MATERIALS.steam.id || cell === MATERIALS.smoke.id) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function loop() {
  if (!isPaused) {
    for (let i = 0; i < 2; i++) {
      stepSimulation();
    }
  }

  draw();
  renderCount();
  requestAnimationFrame(loop);
}

function init() {
  renderMaterials();
  updateToolButtons();
  brushSizeLabel.textContent = String(brushSize);
  selectedMaterialName.textContent = MATERIALS[activeMaterial].name;
  generateTerrain();
  requestAnimationFrame(loop);
}

init();
