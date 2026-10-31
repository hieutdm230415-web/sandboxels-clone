import { MATERIALS, WORLD_HEIGHT, WORLD_WIDTH } from './config.js';

export const grid = new Uint16Array(WORLD_WIDTH * WORLD_HEIGHT);
export const temperature = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
export const life = new Uint16Array(WORLD_WIDTH * WORLD_HEIGHT);

export function idx(x, y) {
  return y * WORLD_WIDTH + x;
}

export function inBounds(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

export function randomChance(value) {
  return Math.random() < value;
}

export function getMaterialByName(name) {
  return MATERIALS[name] || MATERIALS.empty;
}

export function getMaterialById(id) {
  const map = new Map();
  Object.entries(MATERIALS).forEach(([name, material]) => map.set(material.id, name));
  return MATERIALS[map.get(id)] || MATERIALS.empty;
}

export function setCell(x, y, type, lifeValue = 0, temp = getMaterialByName(type).baseTemp) {
  if (!inBounds(x, y)) return;
  const i = idx(x, y);
  grid[i] = getMaterialByName(type).id;
  life[i] = lifeValue;
  temperature[i] = temp;
}

export function clearCell(x, y) {
  if (!inBounds(x, y)) return;
  const i = idx(x, y);
  grid[i] = MATERIALS.empty.id;
  life[i] = 0;
  temperature[i] = 0;
}

export function swapCells(x1, y1, x2, y2) {
  if (!inBounds(x1, y1) || !inBounds(x2, y2)) return;

  const a = idx(x1, y1);
  const b = idx(x2, y2);

  const tempId = grid[a];
  const tempTemp = temperature[a];
  const tempLife = life[a];

  grid[a] = grid[b];
  temperature[a] = temperature[b];
  life[a] = life[b];

  grid[b] = tempId;
  temperature[b] = tempTemp;
  life[b] = tempLife;
}

export function avgTemp(x, y, radius = 1) {
  let sum = 0;
  let count = 0;

  for (let yy = y - radius; yy <= y + radius; yy++) {
    for (let xx = x - radius; xx <= x + radius; xx++) {
      if (!inBounds(xx, yy)) continue;
      sum += temperature[idx(xx, yy)];
      count += 1;
    }
  }

  return count ? sum / count : 0;
}

export function clearWorld() {
  for (let i = 0; i < grid.length; i++) {
    grid[i] = MATERIALS.empty.id;
    temperature[i] = 0;
    life[i] = 0;
  }
}

export function generateTerrain() {
  clearWorld();

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
    const cy = Math.floor(Math.random() * (WORLD_HEIGHT - 30)) + 18;
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
