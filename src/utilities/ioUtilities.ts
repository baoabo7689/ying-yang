import { CellColor } from '@/models/YinYangCellModel';
import { YinYangGridModel, createEmptyGrid, updateCell } from '@/models/YinYangGridModel';

export interface ImportResult {
  success: boolean;
  grid?: YinYangGridModel;
  error?: string;
}

// Accepted import format: rows separated by newlines, cells by space or nothing
// B or b = black, W or w = white, _ or 0 or . = gray
// Example 8x8: "B W _ _ B W _ B\n..."
function parseToken(ch: string): CellColor | null {
  const u = ch.toUpperCase();
  if (u === 'B' || u === '1') return 'black';
  if (u === 'W' || u === '2') return 'white';
  if (u === '_' || u === '0' || u === '.') return 'gray';
  return null;
}

export const ioUtilities = {
  importGrid(raw: string): ImportResult {
    // Tokenize: extract all valid tokens
    const tokens: CellColor[] = [];
    for (const ch of raw) {
      const parsed = parseToken(ch);
      if (parsed !== null) tokens.push(parsed);
    }

    // Determine grid size from token count
    const total = tokens.length;
    const size = Math.round(Math.sqrt(total));
    if (size * size !== total || size < 4 || size > 16) {
      return { success: false, error: `Expected n² tokens (n=4..16), got ${total}` };
    }

    let grid = createEmptyGrid(size);
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (tokens[i] !== 'gray') {
        grid = updateCell(grid, r, c, tokens[i]);
      }
    }

    return { success: true, grid };
  },

  exportGrid(grid: YinYangGridModel): string {
    return grid.export();
  },
};
