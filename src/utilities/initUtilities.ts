import { CellColor } from '@/models/YinYangCellModel';

type Board = CellColor[][];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function violates2x2(board: Board, width: number, height: number, r: number, c: number): boolean {
  for (let dr = 0; dr >= -1; dr--) {
    for (let dc = 0; dc >= -1; dc--) {
      const tr = r + dr;
      const tc = c + dc;
      if (tr < 0 || tc < 0 || tr + 1 >= height || tc + 1 >= width) continue;
      const quad = [board[tr][tc], board[tr][tc + 1], board[tr + 1][tc], board[tr + 1][tc + 1]];
      if (quad.some((v) => v === 'gray')) continue;
      const firstColor = quad[0];
      if (quad.every((v) => v === firstColor)) return true;
    }
  }
  return false;
}

function floodCount(board: Board, width: number, height: number, color: CellColor): number {
  let start: [number, number] | null = null;
  outer: for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++)
      if (board[r][c] === color) { start = [r, c]; break outer; }
  if (!start) return 0;

  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const stack: [number, number][] = [start];
  let count = 0;
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= height || c < 0 || c >= width || visited[r][c] || board[r][c] !== color) continue;
    visited[r][c] = true;
    count++;
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return count;
}

function totalCount(board: Board, width: number, height: number, color: CellColor): number {
  let n = 0;
  for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++)
      if (board[r][c] === color) n++;
  return n;
}

function isConnected(board: Board, width: number, height: number, color: CellColor): boolean {
  const total = totalCount(board, width, height, color);
  if (total <= 1) return true;
  return floodCount(board, width, height, color) === total;
}

function fillBoard(board: Board, width: number, height: number, index: number): boolean {
  const total = width * height;
  if (index >= total) {
    return isConnected(board, width, height, 'black') && isConnected(board, width, height, 'white');
  }
  const r = Math.floor(index / width);
  const c = index % width;
  const colors = shuffle<CellColor>(['black', 'white']);

  for (const color of colors) {
    board[r][c] = color;
    if (!violates2x2(board, width, height, r, c)) {
      if (fillBoard(board, width, height, index + 1)) return true;
    }
    board[r][c] = 'gray';
  }
  return false;
}

function generateFullBoard(width: number, height: number): Board | null {
  const board: Board = Array.from({ length: height }, () => Array(width).fill('gray'));
  if (fillBoard(board, width, height, 0)) return board;
  return null;
}

function generatePuzzle(width: number, height: number, clues: number): Board | null {
  const full = generateFullBoard(width, height);
  if (!full) return null;

  const total = width * height;
  const positions = shuffle(Array.from({ length: total }, (_, i) => i));
  const puzzle: Board = full.map((row) => [...row]);

  for (let i = 0; i < total - clues; i++) {
    const pos = positions[i];
    puzzle[Math.floor(pos / width)][pos % width] = 'gray';
  }

  return puzzle;
}

function defaultClues(width: number, height: number): number {
  const total = width * height;
  return Math.round(total * 0.35);
}

const COLORS: CellColor[] = ['gray', 'black', 'white'];

function randomColor(forbidden: CellColor | null): CellColor {
  const choices = forbidden ? COLORS.filter((c) => c !== forbidden) : COLORS;
  return choices[Math.floor(Math.random() * choices.length)];
}

export const initUtilities = {
  // Fill each cell randomly, ensuring no 2×2 block is all the same color.
  // When placing (r,c) in row-major order, only the block where (r,c) is the
  // bottom-right corner can become complete. If the other three cells share a
  // single color, exclude it — with 3 choices at least 2 are always valid.
  random(width = 15, height = 15): Board {
    const board: Board = Array.from({ length: height }, () => Array(width).fill('gray' as CellColor));
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        let forbidden: CellColor | null = null;
        if (r > 0 && c > 0) {
          const tl = board[r - 1][c - 1];
          const tr = board[r - 1][c];
          const bl = board[r][c - 1];
          if (tl === tr && tr === bl) forbidden = tl;
        }
        board[r][c] = randomColor(forbidden);
      }
    }
    return board;
  },
  generateFull(width = 15, height = 15): Board | null {
    return generateFullBoard(width, height);
  },
};
