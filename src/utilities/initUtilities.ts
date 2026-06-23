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

function violates2x2(board: Board, size: number, r: number, c: number): boolean {
  // Check all 2x2 blocks that include (r,c)
  for (let dr = 0; dr >= -1; dr -= 1) {
    for (let dc = 0; dc >= -1; dc -= 1) {
      const tr = r + dr;
      const tc = c + dc;
      if (tr < 0 || tc < 0 || tr + 1 >= size || tc + 1 >= size) continue;
      const quad = [board[tr][tc], board[tr][tc + 1], board[tr + 1][tc], board[tr + 1][tc + 1]];
      if (quad.some((v) => v === 'gray')) continue;
      const firstColor = quad[0];
      if (quad.every((v) => v === firstColor)) return true;
    }
  }
  return false;
}

function floodCount(board: Board, size: number, color: CellColor): number {
  let start: [number, number] | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === color) { start = [r, c]; break; }
    }
    if (start) break;
  }
  if (!start) return 0;

  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const stack: [number, number][] = [start];
  let count = 0;
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= size || c < 0 || c >= size || visited[r][c] || board[r][c] !== color) continue;
    visited[r][c] = true;
    count++;
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return count;
}

function totalCount(board: Board, size: number, color: CellColor): number {
  let n = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (board[r][c] === color) n++;
  return n;
}

function isConnected(board: Board, size: number, color: CellColor): boolean {
  const total = totalCount(board, size, color);
  if (total <= 1) return true;
  return floodCount(board, size, color) === total;
}

function fillBoard(board: Board, size: number, index: number): boolean {
  if (index >= size * size) {
    return isConnected(board, size, 'black') && isConnected(board, size, 'white');
  }
  const r = Math.floor(index / size);
  const c = index % size;
  const colors = shuffle<CellColor>(['black', 'white']);

  for (const color of colors) {
    board[r][c] = color;
    if (!violates2x2(board, size, r, c)) {
      if (fillBoard(board, size, index + 1)) return true;
    }
    board[r][c] = 'gray';
  }
  return false;
}

function generateFullBoard(size: number): Board | null {
  const board: Board = Array.from({ length: size }, () => Array(size).fill('gray'));
  if (fillBoard(board, size, 0)) return board;
  return null;
}

function generatePuzzle(size: number, clues: number): Board | null {
  const full = generateFullBoard(size);
  if (!full) return null;

  const total = size * size;
  const positions = shuffle(Array.from({ length: total }, (_, i) => i));
  const puzzle: Board = full.map((row) => [...row]);
  const toRemove = total - clues;

  for (let i = 0; i < toRemove; i++) {
    const pos = positions[i];
    puzzle[Math.floor(pos / size)][pos % size] = 'gray';
  }

  return puzzle;
}

const EASY_CLUES: Record<number, number> = { 6: 20, 8: 36, 10: 56 };
const MEDIUM_CLUES: Record<number, number> = { 6: 14, 8: 28, 10: 44 };
const HARD_CLUES: Record<number, number> = { 6: 10, 8: 20, 10: 32 };

export const initUtilities = {
  random(difficulty: 'easy' | 'medium' | 'hard', size = 8): Board | null {
    const map = difficulty === 'easy' ? EASY_CLUES : difficulty === 'medium' ? MEDIUM_CLUES : HARD_CLUES;
    return generatePuzzle(size, map[size] ?? Math.floor((size * size) * 0.4));
  },
  generateFull(size = 8): Board | null {
    return generateFullBoard(size);
  },
};
