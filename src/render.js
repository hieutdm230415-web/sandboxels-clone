import { MATERIALS } from './config.js';
import {
  idx,
  inBounds,
  randomChance,
  avgTemp,
  setCell,
  clearCell,
  swapCells,
  grid,
} from './simulation.js';

function updateSand(x, y) {
  if (avgTemp(x, y, 2) > 85 && randomChance(0.12)) {
    setCell(x, y, 'glass', 0, 28);
    return;
  }

  const under = y + 1;
  if (under < 110) {
    const cell = idx(x, under);
    if (grid[cell] === MATERIALS.empty.id) {
      swapCells(x, y, x, under);
      return;
    }
    if (grid[cell] === MATERIALS.water.id) {
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

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
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
  // life is imported elsewhere? We need keep in state, but in this file we can access from simulation.js? We didn't export life. Need import life from simulation.js.
  const { life } = await import('./simulation.js');
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

  if (randomChance(0.08)) clearCell(x, y);
}

function updateSmoke(x, y) {
  const { life } = await import('./simulation.js');
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

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
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
  const { life } = await import('./simulation.js');
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
    if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
      swapCells(x, y, x, y + 1);
      return;
    }
    setCell(x, y, 'stone', 0, 20);
    return;
  }

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
    return;
  }

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.water.id) {
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
      if (randomChance(0.35)) setCell(nx, ny, 'smoke', 5, 18);
      return;
    }
  }

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
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

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
    swapCells(x, y, x, y + 1);
  }
}

function updateSalt(x, y) {
  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.water.id) {
    clearCell(x, y);
    return;
  }

  if (y + 1 < 110 && grid[idx(x, y + 1)] === MATERIALS.empty.id) {
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

export function updateCell(x, y) {
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
