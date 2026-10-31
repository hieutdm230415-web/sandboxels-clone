export const WORLD_WIDTH = 180;
export const WORLD_HEIGHT = 110;
export const CELL_SIZE = 8;

export const MATERIALS = {
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

export const MATERIAL_ORDER = [
  'sand', 'water', 'stone', 'wood', 'fire', 'plant', 'lava', 'steam', 'smoke',
  'oil', 'acid', 'ice', 'metal', 'salt', 'glass', 'dirt', 'brick'
];

export const DEFAULT_BRUSH_SIZE = 3;
