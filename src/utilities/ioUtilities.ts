import { CellColor } from '@/models/YinYangCellModel';
import { YinYangGridModel, createEmptyGrid, updateCell } from '@/models/YinYangGridModel';

export interface ImportResult {
  success: boolean;
  grid?: YinYangGridModel;
  error?: string;
}

function parseToken(ch: string): CellColor | null {
  const u = ch.toUpperCase();
  if (u === 'B' || u === '1') return 'black';
  if (u === 'W' || u === '2') return 'white';
  if (u === '_' || u === '0' || u === '.') return 'gray';
  return null;
}

export const ioUtilities = {
  importGrid(raw: string, width?: number, height?: number): ImportResult {
    const tokens: CellColor[] = [];
    for (const ch of raw) {
      const parsed = parseToken(ch);
      if (parsed !== null) tokens.push(parsed);
    }

    const total = tokens.length;

    // If width/height provided, validate; otherwise infer square
    let w: number, h: number;
    if (width && height) {
      if (total !== width * height) {
        return { success: false, error: `Expected ${width * height} tokens for ${width}×${height}, got ${total}` };
      }
      w = width; h = height;
    } else {
      const side = Math.round(Math.sqrt(total));
      if (side * side !== total || side < 2 || side > 32) {
        return { success: false, error: `Expected n² tokens (n=2..32), got ${total}` };
      }
      w = side; h = side;
    }

    let grid = createEmptyGrid(w, h);
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / w);
      const c = i % w;
      if (tokens[i] !== 'gray') grid = updateCell(grid, r, c, tokens[i]);
    }

    return { success: true, grid };
  },

  exportGrid(grid: YinYangGridModel): string {
    return grid.export();
  },
};
