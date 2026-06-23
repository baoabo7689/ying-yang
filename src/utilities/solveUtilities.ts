import { YinYangGridModel, updateCell } from '@/models/YinYangGridModel';
import { CellColor, oppositeColor } from '@/models/YinYangCellModel';

function inBounds(width: number, height: number, r: number, c: number): boolean {
  return r >= 0 && r < height && c >= 0 && c < width;
}

function getColor(grid: YinYangGridModel, r: number, c: number): CellColor | null {
  if (!inBounds(grid.width, grid.height, r, c)) return null;
  return grid.cells[r][c].color;
}

function trySet(grid: YinYangGridModel, r: number, c: number, color: CellColor): YinYangGridModel | null {
  if (!inBounds(grid.width, grid.height, r, c)) return null;
  const cell = grid.cells[r][c];
  if (cell.isClue || cell.color !== 'gray') return null;
  return updateCell(grid, r, c, color);
}

// ─── Reach-border caches (DP on same-color chains) ───────────────────────────

type ReachCache = boolean[][];

function buildReachLeft(grid: YinYangGridModel): ReachCache {
  const { width, height, cells } = grid;
  const cache: ReachCache = Array.from({ length: height }, () => Array(width).fill(false));
  for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      cache[r][c] = c === 0 || (cells[r][c - 1].color === color && cache[r][c - 1]);
    }
  return cache;
}

function buildReachRight(grid: YinYangGridModel): ReachCache {
  const { width, height, cells } = grid;
  const cache: ReachCache = Array.from({ length: height }, () => Array(width).fill(false));
  for (let r = 0; r < height; r++)
    for (let c = width - 1; c >= 0; c--) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      cache[r][c] = c === width - 1 || (cells[r][c + 1].color === color && cache[r][c + 1]);
    }
  return cache;
}

function buildReachTop(grid: YinYangGridModel): ReachCache {
  const { width, height, cells } = grid;
  const cache: ReachCache = Array.from({ length: height }, () => Array(width).fill(false));
  for (let c = 0; c < width; c++)
    for (let r = 0; r < height; r++) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      cache[r][c] = r === 0 || (cells[r - 1][c].color === color && cache[r - 1][c]);
    }
  return cache;
}

function buildReachBottom(grid: YinYangGridModel): ReachCache {
  const { width, height, cells } = grid;
  const cache: ReachCache = Array.from({ length: height }, () => Array(width).fill(false));
  for (let c = 0; c < width; c++)
    for (let r = height - 1; r >= 0; r--) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      cache[r][c] = r === height - 1 || (cells[r + 1][c].color === color && cache[r + 1][c]);
    }
  return cache;
}

// ─── Rule 1: 2×2 completion ───────────────────────────────────────────────────

function applyRule1(grid: YinYangGridModel): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { width, height } = grid;

  for (let r = 0; r <= height - 2; r++) {
    for (let c = 0; c <= width - 2; c++) {
      const positions: [number, number][] = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
      const colors = positions.map(([pr, pc]) => current.cells[pr][pc].color);

      const grayCount = colors.filter((v) => v === 'gray').length;
      if (grayCount !== 1) continue;
      const nonGray = colors.filter((v) => v !== 'gray');
      const first = nonGray[0];
      if (!nonGray.every((v) => v === first)) continue;

      const grayIdx = colors.indexOf('gray');
      const [gr, gc] = positions[grayIdx];
      const next = trySet(current, gr, gc, oppositeColor(first));
      if (next) { current = next; changed = true; }
    }
  }

  return { grid: current, changed };
}

// ─── Rule 2: Horizontal sandwich + border-reach deduction ────────────────────

function applyRule2(
  grid: YinYangGridModel,
  reachLeft: ReachCache,
  reachRight: ReachCache
): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { width, height, cells } = grid;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const colorX = cells[r][c].color;
      if (colorX === 'gray') continue;
      const colorB = oppositeColor(colorX);

      if (getColor(current, r, c - 1) !== colorB) continue;
      if (getColor(current, r, c + 1) !== colorB) continue;

      // Spread B leftward from L (diagonal + left, not directly up/down from L)
      for (const [sr, sc] of [[r - 1, c - 1], [r, c - 2], [r + 1, c - 1], [r - 1, c - 2], [r + 1, c - 2]] as [number,number][]) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Spread B rightward from R (diagonal + right, not directly up/down from R)
      for (const [sr, sc] of [[r - 1, c + 2], [r, c + 2], [r + 1, c + 2]] as [number,number][]) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Border-reach deduction
      if (!reachLeft[r]?.[c - 1] || !reachRight[r]?.[c + 1]) continue;

      const hasAbove = cells.some((rowArr, ri) => ri < r && rowArr.some((cell) => cell.color === colorX));
      const hasBelow = cells.some((rowArr, ri) => ri > r && rowArr.some((cell) => cell.color === colorX));

      if (hasAbove) {
        const next = trySet(current, r - 1, c + 1, colorX);
        if (next) { current = next; changed = true; }
      }
      if (hasBelow) {
        const next = trySet(current, r + 1, c + 1, colorX);
        if (next) { current = next; changed = true; }
      }
    }
  }

  return { grid: current, changed };
}

// ─── Rule 3: Vertical sandwich + border-reach deduction ──────────────────────

function applyRule3(
  grid: YinYangGridModel,
  reachTop: ReachCache,
  reachBottom: ReachCache
): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { width, height, cells } = grid;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const colorX = cells[r][c].color;
      if (colorX === 'gray') continue;
      const colorB = oppositeColor(colorX);

      if (getColor(current, r - 1, c) !== colorB) continue;
      if (getColor(current, r + 1, c) !== colorB) continue;

      // Spread B upward from U
      for (const [sr, sc] of [[r - 1, c - 1], [r - 1, c + 1], [r - 2, c - 1], [r - 2, c], [r - 2, c + 1]] as [number,number][]) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Spread B downward from D (diagonal + down only)
      for (const [sr, sc] of [[r + 2, c - 1], [r + 2, c], [r + 2, c + 1]] as [number,number][]) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Border-reach deduction
      if (!reachTop[r - 1]?.[c] || !reachBottom[r + 1]?.[c]) continue;

      const hasLeft  = cells[r].slice(0, c).some((cell) => cell.color === colorX);
      const hasRight = cells[r].slice(c + 1).some((cell) => cell.color === colorX);

      if (hasLeft) {
        const next = trySet(current, r + 1, c - 1, colorX);
        if (next) { current = next; changed = true; }
      }
      if (hasRight) {
        const next = trySet(current, r + 1, c + 1, colorX);
        if (next) { current = next; changed = true; }
      }
    }
  }

  return { grid: current, changed };
}

// ─── Main solve loop ──────────────────────────────────────────────────────────

export interface SolveResult {
  grid: YinYangGridModel;
  steps: number;
  message: string;
}

export function solve(grid: YinYangGridModel, maxIterations = 100): SolveResult {
  let current = grid;
  let steps = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    let anyChanged = false;

    const r1 = applyRule1(current);
    if (r1.changed) { current = r1.grid; anyChanged = true; }

    const reachLeft   = buildReachLeft(current);
    const reachRight  = buildReachRight(current);
    const reachTop    = buildReachTop(current);
    const reachBottom = buildReachBottom(current);

    const r2 = applyRule2(current, reachLeft, reachRight);
    if (r2.changed) { current = r2.grid; anyChanged = true; }

    const r3 = applyRule3(current, reachTop, reachBottom);
    if (r3.changed) { current = r3.grid; anyChanged = true; }

    if (anyChanged) steps++;
    else break;
  }

  const grayLeft = current.cells.flat().filter((c) => c.color === 'gray').length;
  const message = grayLeft === 0
    ? `Solved in ${steps} step(s)!`
    : `Applied ${steps} step(s); ${grayLeft} cell(s) still unknown.`;

  return { grid: current, steps, message };
}

export const solveUtilities = { solve };
