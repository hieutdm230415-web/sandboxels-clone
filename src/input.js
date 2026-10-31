import { CELL_SIZE, MATERIALS } from './config.js';
import { grid, idx, getMaterialById } from './simulation.js';

export function drawWorld(canvas, ctx, worldWidth, worldHeight) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#050b12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      const cell = grid[idx(x, y)];
      if (cell === MATERIALS.empty.id) continue;

      const material = getMaterialById(cell);
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
