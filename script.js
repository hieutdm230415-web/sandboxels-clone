const WORLD_WIDTH = 180;
const WORLD_HEIGHT = 110;
const CELL_SIZE = 7;

const MATERIALS = {
  empty: { id: 0, name: 'Empty', color: '#000000', baseTemp: 0 },
  sand: { id: 1, name: 'Sand', color: '#d6b15b', baseTemp: 20 },
  water: { id: 2, name: 'Water', color: '#4cb9ff', baseTemp: 10 },
  stone: { id: 3, name: 'Stone', color: '#70798a', baseTemp: 18 },
  wood: { id: 4, name: 'Wood', color: '#805832', baseTemp: 18 },
  fire: { id: 5, name: 'Fire', color: '#ff8c42', baseTemp: 120 },
  steam: { id: 6, name: 'Steam', color: '#d9edf7', baseTemp: 60 },
  smoke: { id: 7, name: 'Smoke', color: '#8c8e9d', baseTemp: 35 },
  oil: { id: 8, name: 'Oil', color: '#3b3129', baseTemp: 21 },
  lava: { id: 9, name: 'Lava', color: '#ff4d00', baseTemp: 180 },
  ice: { id: 10, name: 'Ice', color: '#97d9ff', baseTemp: -5 },
  metal: { id: 11, name: 'Metal', color: '#b3becb', baseTemp: 22 },
  acid: { id: 12, name: 'Acid', color: '#8fe55c', baseTemp: 18 },
  plant: { id: 13, name: 'Plant', color: '#4ade80', baseTemp: 22 },
  salt: { id: 14, name: 'Salt', color: '#f0f2f6', baseTemp: 22 },
  glass: { id: 15, name: 'Glass', color: '#73d7d8', baseTemp: 25 },
  dirt: { id: 16, name: 'Dirt', color: '#6f4d32', baseTemp: 18 },
  brick: { id: 17, name: 'Brick', color: '#c96d4d', baseTemp: 18 },
};

const MATERIAL_ORDER = [
  'sand', 'water', 'stone', 'wood', 'fire', 'plant', 'lava', 'steam', 'smoke',
  'oil', 'acid', 'ice', 'metal', 'salt', 'glass', 'dirt', 'brick'
];

const idToMaterial = new Map();
Object.entries(MATERIALS).forEach(([key, material]) => idToMaterial.set(material.id, key));

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const materialList = document.getElementById('materialList');
const selectedMaterialName = document.getElementById('selectedMaterialName');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeLabel = document.getElementById('brushSizeLabel');
const toolModeLabel = document.getElementById('toolModeLabel');
const cellCountLabel = document.getElementById('cellCount');
const pauseBtn = document.getElementById('pauseBtn');
const clearBtn = document.getElementById('clearBtn');
const terrainBtn = document.getElementById('terrainBtn');
const saveBtn = document.getElementById('saveBtn');

const grid = new Uint16Array(WORLD_WIDTH * WORLD_HEIGHT);
const temperature = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
const life = new Uint16Array(WORLD_WIDTH * WORLD_HEIGHT);

let activeMaterial = 'sand';
let toolMode = 'paint';
let brushSize = Number(brushSizeSlider.value);
let isPaused = false;
let drawing = false;
let lastPointer = null;

const EMPTY = MATERIALS.empty.id;

function index(x, y) {
  return y * WORLD_WIDTH + x;
}

function inBounds(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

function materialNameForId(id) {
  return idToMaterial.get(id) || 'empty';
}

function materialForType(type) {
  return MATERIALS[type] || MATERIALS.empty;
}

function materialForId(id) {
  return MATERIALS[materialNameForId(id)] || MATERIALS.empty;
}

function setCell(x, y, type, customLife = 0, customTemp = materialForType(type).baseTemp) {
  if (!inBounds(x, y)) return;
  const idx = index(x, y);
  grid[idx] = materialForType(type).id;
  life[idx] = customLife;
  temperature[idx] = customTemp;
}

function clearCell(x, y) {
  if (!inBounds(x, y)) return;
  const idx = index(x, y);
  grid[idx] = EMPTY;
  life[idx] = 0;
  temperature[idx] = 0;
}

function swapCells(x1, y1, x2, y2) {
  if (!inBounds(x1, y1) || !inBounds(x2, y2)) return;
  const a = index(x1, y1);
  const b = index(x2, y2);

  const tempA = grid[a];
  const tempB = temperature[a];
  const lifeA = life[a];

  grid[a] = grid[b];
  temperature[a] = temperature[b];
  life[a] = life[b];

  grid[b] = tempA;
  temperature[b] = tempB;
  life[b] = lifeA;
}

function randomChance(value) {
  return Math.random() < value;
}

function getAverageTemp(x, y, radius = 1) {
  let sum = 0;
  let count = 0;

  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (!inBounds(xx, yy)) continue;
      sum += temperature[index(xx, yy)];
      count += 1;
    }
  }

  return count ? sum / count : 0;
}

function moveParticle(x, y, nx, ny) {
  if (!inBounds(nx, ny)) return false;

  const currentType = grid[index(x, y)];
  const targetType = grid[index(nx, ny)];

  if (targetType === EMPTY) {
    swapCells(x, y, nx, ny);
    return true;
  }

  if (currentType === MATERIALS.sand.id && targetType === MATERIALS.water.id) {
    swapCells(x, y, nx, ny);
    return true;
  }

  if (currentType === MATERIALS.water.id && targetType === MATERIALS.sand.id) {
    swapCells(x, y, nx, ny);
    return true;
  }

  if (currentType === MATERIALS.lava.id && targetType === MATERIALS.water.id) {
    setCell(x, y, 'steam', 12, 80);
    clearCell(nx, ny);
    return true;
  }

  return false;
}

function updateSand(x, y) {
  if (Math.random() < 0.1 && getAverageTemp(x, y) > 80) {
    setCell(x, y, 'glass', 0, 40);
    return;
  }

  const below = y + 1;
  if (below < WORLD_HEIGHT) {
    const belowIndex = index(x, below);
    if (grid[belowIndex] === EMPTY) {
      swapCells(x, y, x, below);
      return;
    }

    if (grid[belowIndex] === MATERIALS.water.id) {
      swapCells(x, y, x, below);
      return;
    }
  }

  const dirs = [-1, 1];
  for (let i = 0; i < 2; i++) {
    const direction = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = x + direction;
    const ny = y + 1;
    if (inBounds(nx, ny) && grid[index(nx, ny)] === EMPTY) {
      swapCells(x, y, nx, ny);
      return;
    }
    if (inBounds(nx, ny) && grid[index(nx, ny)] === MATERIALS.water.id) {
      swapCells(x, y, nx, ny);
      return;
    }
  }
}

function updateWater(x, y) {
  if (getAverageTemp(x, y, 1) > 46) {
    setCell(x, y, 'steam', 8, 80);
    return;
  }

  const options = [0, -1, 1];
  const dir = options[Math.floor(Math.random() * options.length)];
  const below = y + 1;

  if (below < WORLD_HEIGHT && grid[index(x, below)] === EMPTY) {
    swapCells(x, y, x, below);
    return;
  }

  const nx = x + (Math.random() < 0.5 ? -1 : 1);
  const ny = y + (Math.random() < 0.5 ? 0 : 1);
  if (inBounds(nx, ny) && grid[index(nx, ny)] === EMPTY) {
    swapCells(x, y, nx, ny);
    return;
  }

  if (inBounds(x + dir, y) && grid[index(x + dir, y)] === EMPTY) {
    swapCells(x, y, x + dir, y);
  }
}

function updateOil(x, y) {
  if (getAverageTemp(x, y, 1) > 55) {
    setCell(x, y, 'fire', 18, 140);
    return;
  }

  const below = y + 1;
  if (below < WORLD_HEIGHT && grid[index(x, below)] === EMPTY) {
    swapCells(x, y, x, below);
    return;
  }

  const side = Math.random() < 0.5 ? -1 : 1;
  if (inBounds(x + side, y) && grid[index(x + side, y)] === EMPTY) {
    swapCells(x, y, x + side, y);
  }
}

function updateSteam(x, y) {
  life[index(x, y)] += 1;
  if (life[index(x, y)] > 18) {
    clearCell(x, y);
    return;
  }

  if (randomChance(0.25)) {
    const offset = Math.random() < 0.5 ? -1 : 1;
    const nx = x + offset;
    const ny = y - 1;
    if (inBounds(nx, ny) && grid[index(nx, ny)] === EMPTY) {
      swapCells(x, y, nx, ny);
      return;
    }
  }

  const above = y - 1;
  if (above >= 0 && grid[index(x, above)] === EMPTY) {
    swapCells(x, y, x, above);
  }
}

function updateSmoke(x, y) {
  life[index(x, y)] += 1;
  if (life[index(x, y)] > 24) {
    clearCell(x, y);
    return;
  }

  const dir = Math.random() < 0.5 ? -1 : 1;
  const nx = x + dir;
  const ny = y - 1;

  if (inBounds(nx, ny) && grid[index(nx, ny)] === EMPTY) {
    swapCells(x, y, nx, ny);
    return;
  }

  const up = y - 1;
  if (up >= 0 && grid[index(x, up)] === EMPTY) {
    swapCells(x, y, x, up);
  }
}

function updateFire(x, y) {
  const idx = index(x, y);
  life[idx] += 1;

  if (life[idx] > 22 || getAverageTemp(x, y) < 20) {
    if (randomChance(0.62)) {
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
    const nid = index(nx, ny);
    const target = grid[nid];

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

  const up = y - 1;
  if (up >= 0 && grid[index(x, up)] === EMPTY) {
    swapCells(x, y, x, up);
  }
}

function updateLava(x, y) {
  if (getAverageTemp(x, y, 1) < 55) {
    const below = y + 1;
    if (below < WORLD_HEIGHT && grid[index(x, below)] === EMPTY) {
      swapCells(x, y, x, below);
      return;
    }
    setCell(x, y, 'stone', 0, 20);
    return;
  }

  const below = y + 1;
  if (below < WORLD_HEIGHT && grid[index(x, below)] === EMPTY) {
    swapCells(x, y, x, below);
    return;
  }

  if (below < WORLD_HEIGHT && grid[index(x, below)] === MATERIALS.water.id) {
    setCell(x, y, 'steam', 10, 75);
    clearCell(x, below);
    return;
  }

  const side = Math.random() < 0.5 ? -1 : 1;
  const nx = x + side;
  const ny = y + (Math.random() < 0.5 ? 0 : 1);
  if (inBounds(nx, ny) && grid[index(nx, ny)] === EMPTY) {
    swapCells(x, y, nx, ny);
    return;
  }

  if (Math.random() < 0.12 && inBounds(x + 1, y) && grid[index(x + 1, y)] === MATERIALS.sand.id) {
    setCell(x + 1, y, 'glass', 0, 32);
  }
}

function updateAcid(x, y) {
  const neighbors = [
    [x, y + 1], [x + 1, y], [x - 1, y], [x, y - 1],
    [x + 1, y + 1], [x - 1, y + 1], [x + 1, y - 1], [x - 1, y - 1]
  ];

  for (const [nx, ny] of neighbors) {
    if (!inBounds(nx, ny)) continue;
    const nid = index(nx, ny);
    const targetType = grid[nid];

    if (targetType === EMPTY || targetType === MATERIALS.acid.id) continue;
    if (targetType === MATERIALS.metal.id || targetType === MATERIALS.brick.id) {
      continue;
    }

    if (randomChance(0.5)) {
      clearCell(nx, ny);
      if (randomChance(0.4)) {
        setCell(nx, ny, 'smoke', 5, 20);
      }
      return;
    }
  }

  const down = y + 1;
  if (down < WORLD_HEIGHT && grid[index(x, down)] === EMPTY) {
    swapCells(x, y, x, down);
  }
}

function updatePlant(x, y) {
  const waterNearby = [
    [x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1],
    [x - 1, y + 1], [x + 1, y + 1]
  ].some(([nx, ny]) => inBounds(nx, ny) && grid[index(nx, ny)] === MATERIALS.water.id);

  if (waterNearby && randomChance(0.08)) {
    setCell(x, y, 'plant', 0, 24);
  }

  if (getAverageTemp(x, y) > 70) {
    setCell(x, y, 'fire', 12, 130);
    return;
  }

  if (randomChance(0.02) && y > 0 && grid[index(x, y - 1)] === EMPTY) {
    setCell(x, y - 1, 'plant', 0, 24);
  }
}

function updateIce(x, y) {
  if (getAverageTemp(x, y, 1) > 22) {
    setCell(x, y, 'water', 0, 18);
    return;
  }

  const below = y + 1;
  if (below < WORLD_HEIGHT && grid[index(x, below)] === EMPTY) {
    swapCells(x, y, x, below);
  }
}

function updateSalt(x, y) {
  const below = y + 1;
  if (below < WORLD_HEIGHT) {
    if (grid[index(x, below)] === MATERIALS.water.id) {
      clearCell(x, y);
      return;
    }
    if (grid[index(x, below)] === EMPTY) {
      swapCells(x, y, x, below);
      return;
    }
  }

  const side = Math.random() < 0.5 ? -1 : 1;
  if (inBounds(x + side, y) && grid[index(x + side, y)] === EMPTY) {
    swapCells(x, y, x + side, y);
  }
}

function updateWood(x, y) {
  if (getAverageTemp(x, y, 1) > 62) {
    setCell(x, y, 'fire', 12, 140);
    return;
  }

  if (randomChance(0.01) && inBounds(x, y - 1) && grid[index(x, y - 1)] === EMPTY) {
    setCell(x, y - 1, 'plant', 0, 22);
  }
}

function stepSimulation() {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
    for (let x = WORLD_WIDTH - 1; x >= 0; x--) {
      const idx = index(x, y);
      const type = grid[idx];
      if (type === EMPTY) continue;

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
  }
}

function fillRectWithRoundSquare(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#040915';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const off = 1;

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const cell = grid[index(x, y)];
      if (cell === EMPTY) continue;

      const material = materialForId(cell);
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;

      ctx.fillStyle = material.color;
      ctx.fillRect(px + off, py + off, CELL_SIZE - off, CELL_SIZE - off);

      if (cell === MATERIALS.fire.id) {
        ctx.fillStyle = 'rgba(255, 206, 94, 0.3)';
        ctx.fillRect(px - 1, py - 1, CELL_SIZE + 2, CELL_SIZE + 2);
      }

      if (cell === MATERIALS.lava.id) {
        ctx.fillStyle = 'rgba(255, 92, 0, 0.18)';
        ctx.fillRect(px - 1, py - 1, CELL_SIZE + 2, CELL_SIZE + 2);
      }
    }
  }
}

function renderCountLabel() {
  let filled = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== EMPTY) filled += 1;
  }
  cellCountLabel.textContent = filled.toLocaleString();
}

function renderMaterialMenu() {
  materialList.innerHTML = '';

  MATERIAL_ORDER.forEach((key) => {
    const material = MATERIALS[key];
    const button = document.createElement('button');
    button.className = `material-btn ${activeMaterial === key ? 'active' : ''}`;
    button.type = 'button';
    button.innerHTML = `
      <span class="material-swatch" style="background:${material.color};"></span>
      <span class="material-name">${material.name}</span>
    `;

    button.addEventListener('click', () => {
      activeMaterial = key;
      renderMaterialMenu();
      selectedMaterialName.textContent = material.name;
    });

    materialList.appendChild(button);
  });
}

function updateToolModeButtons() {
  document.querySelectorAll('.tool-btn').forEach((button) => {
    const isActive = button.dataset.mode === toolMode;
    button.classList.toggle('active', isActive);
  });
  toolModeLabel.textContent = toolMode.charAt(0).toUpperCase() + toolMode.slice(1);
}

function paintAt(x, y) {
  if (!inBounds(x, y)) return;

  const radius = brushSize;
  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (!inBounds(xx, yy)) continue;
      const dx = xx - x;
      const dy = yy - y;
      if (dx * dx + dy * dy > radius * radius + 1) continue;

      if (toolMode === 'erase') {
        clearCell(xx, yy);
      } else if (toolMode === 'heat') {
        if (inBounds(xx, yy)) {
          const currentType = materialNameForId(grid[index(xx, yy)]);
          if (currentType !== 'empty') {
            temperature[index(xx, yy)] += 90;
          }
        }
      } else {
        if (activeMaterial === 'empty') {
          clearCell(xx, yy);
        } else {
          const target = MATERIALS[activeMaterial];
          if (target.name === 'Fire') {
            setCell(xx, yy, 'fire', 10, 140);
          } else {
            setCell(xx, yy, activeMaterial, 0, target.baseTemp);
          }
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
    const oldTool = toolMode;
    toolMode = 'erase';
    updateToolModeButtons();
    paintAt(pos.x, pos.y);
    toolMode = oldTool;
    updateToolModeButtons();
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
  brushSize = Math.max(1, Math.min(9, brushSize + (delta > 0 ? 1 : -1)));
  brushSizeSlider.value = String(brushSize);
  brushSizeLabel.textContent = String(brushSize);
}, { passive: false });

brushSizeSlider.addEventListener('input', () => {
  brushSize = Number(brushSizeSlider.value);
  brushSizeLabel.textContent = String(brushSize);
});

document.querySelectorAll('.tool-btn').forEach((button) => {
  button.addEventListener('click', () => {
    toolMode = button.dataset.mode;
    updateToolModeButtons();
  });
});

pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
});

function generateTerrain() {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = EMPTY;
    temperature[i] = 0;
    life[i] = 0;
  }

  for (let x = 0; x < WORLD_WIDTH; x++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const floor = WORLD_HEIGHT - 14;
      if (y >= floor) {
        setCell(x, y, 'stone', 0, 18);
        if (y > floor + 2 && Math.random() < 0.18) setCell(x, y, 'dirt', 0, 18);
        if (y > floor + 5 && Math.random() < 0.12) setCell(x, y, 'sand', 0, 20);
        if (y > floor + 8 && Math.random() < 0.08) setCell(x, y, 'brick', 0, 18);
      }
    }
  }

  for (let i = 0; i < 20; i++) {
    const centerX = Math.floor(Math.random() * WORLD_WIDTH);
    const centerY = Math.floor(Math.random() * (WORLD_HEIGHT - 30)) + 24;
    const radius = 6 + Math.random() * 10;
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        if (!inBounds(x, y)) continue;
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy <= radius * radius) {
          setCell(x, y, 'water', 0, 12);
        }
      }
    }
  }

  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * WORLD_WIDTH);
    const y = Math.floor(Math.random() * (WORLD_HEIGHT - 10));
    if (y < WORLD_HEIGHT - 25) {
      setCell(x, y, 'plant', 0, 22);
    }
  }

  for (let i = 0; i < 35; i++) {
    const x = Math.floor(Math.random() * WORLD_WIDTH);
    const y = Math.floor(Math.random() * (WORLD_HEIGHT - 35));
    if (y > 14) {
      setCell(x, y, 'wood', 0, 18);
    }
  }
}

function clearWorld() {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = EMPTY;
    temperature[i] = 0;
    life[i] = 0;
  }
}

clearBtn.addEventListener('click', () => {
  clearWorld();
});

terrainBtn.addEventListener('click', () => {
  generateTerrain();
});

saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'particle-forge.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'q') {
    const index = MATERIAL_ORDER.indexOf(activeMaterial);
    activeMaterial = MATERIAL_ORDER[(index - 1 + MATERIAL_ORDER.length) % MATERIAL_ORDER.length];
    selectedMaterialName.textContent = MATERIALS[activeMaterial].name;
    renderMaterialMenu();
  }

  if (event.key.toLowerCase() === 'e') {
    const index = MATERIAL_ORDER.indexOf(activeMaterial);
    activeMaterial = MATERIAL_ORDER[(index + 1) % MATERIAL_ORDER.length];
    selectedMaterialName.textContent = MATERIALS[activeMaterial].name;
    renderMaterialMenu();
  }
});

function loop() {
  if (!isPaused) {
    for (let i = 0; i < 2; i++) {
      stepSimulation();
    }
  }

  drawGrid();
  renderCountLabel();
  requestAnimationFrame(loop);
}

function initialize() {
  renderMaterialMenu();
  updateToolModeButtons();
  brushSizeLabel.textContent = String(brushSize);
  selectedMaterialName.textContent = MATERIALS[activeMaterial].name;
  generateTerrain();
  requestAnimationFrame(loop);
}

initialize();
