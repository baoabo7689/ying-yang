import { YinYangGridModel, updateCell } from '@/models/YinYangGridModel';
import { CellColor, YinYangCellModel, oppositeColor } from '@/models/YinYangCellModel';

// ─── helpers ──────────────────────────────────────────────────────────────────

function inBounds(size: number, r: number, c: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

function getColor(grid: YinYangGridModel, r: number, c: number): CellColor | null {
  if (!inBounds(grid.size, r, c)) return null;
  return grid.cells[r][c].color;
}

// Apply a color to a gray cell; return new grid or same if cell not gray / already same color
function trySet(grid: YinYangGridModel, r: number, c: number, color: CellColor, hint = true): YinYangGridModel | null {
  if (!inBounds(grid.size, r, c)) return null;
  const cell = grid.cells[r][c];
  if (cell.isClue) return null;
  if (cell.color === color) return null;
  if (cell.color !== 'gray') return null; // conflict – skip
  return updateCell(grid, r, c, color, hint);
}

// ─── reach-border cache ────────────────────────────────────────────────────────
//
// reachLeft[r][c]  = can we walk left from (r,c) through cells of the SAME color as (r,c) and hit col 0?
// Computed left→right so we can use DP.
// We only cache for non-gray cells.

type ReachCache = boolean[][];

function buildReachLeft(grid: YinYangGridModel): ReachCache {
  const { size, cells } = grid;
  const cache: ReachCache = Array.from({ length: size }, () => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      if (c === 0) { cache[r][c] = true; continue; }
      if (cells[r][c - 1].color === color && cache[r][c - 1]) cache[r][c] = true;
    }
  }
  return cache;
}

function buildReachRight(grid: YinYangGridModel): ReachCache {
  const { size, cells } = grid;
  const cache: ReachCache = Array.from({ length: size }, () => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    for (let c = size - 1; c >= 0; c--) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      if (c === size - 1) { cache[r][c] = true; continue; }
      if (cells[r][c + 1].color === color && cache[r][c + 1]) cache[r][c] = true;
    }
  }
  return cache;
}

function buildReachTop(grid: YinYangGridModel): ReachCache {
  const { size, cells } = grid;
  const cache: ReachCache = Array.from({ length: size }, () => Array(size).fill(false));
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      if (r === 0) { cache[r][c] = true; continue; }
      if (cells[r - 1][c].color === color && cache[r - 1][c]) cache[r][c] = true;
    }
  }
  return cache;
}

function buildReachBottom(grid: YinYangGridModel): ReachCache {
  const { size, cells } = grid;
  const cache: ReachCache = Array.from({ length: size }, () => Array(size).fill(false));
  for (let c = 0; c < size; c++) {
    for (let r = size - 1; r >= 0; r--) {
      const color = cells[r][c].color;
      if (color === 'gray') continue;
      if (r === size - 1) { cache[r][c] = true; continue; }
      if (cells[r + 1][c].color === color && cache[r + 1][c]) cache[r][c] = true;
    }
  }
  return cache;
}

// ─── Rule 1: 2×2 completion ───────────────────────────────────────────────────
//
// For each 2×2 block: if 3 cells are the same color A, the 4th gray cell becomes opposite(A).

function applyRule1(grid: YinYangGridModel): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { size } = grid;

  for (let r = 0; r <= size - 2; r++) {
    for (let c = 0; c <= size - 2; c++) {
      const positions: [number, number][] = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]];
      const colors = positions.map(([pr, pc]) => current.cells[pr][pc].color);

      const grayCount = colors.filter((v) => v === 'gray').length;
      if (grayCount !== 1) continue;

      const nonGray = colors.filter((v) => v !== 'gray');
      const first = nonGray[0];
      if (!nonGray.every((v) => v === first)) continue;

      // 3 cells are all `first`, find the gray one and set to opposite
      const grayIdx = colors.indexOf('gray');
      const [gr, gc] = positions[grayIdx];
      const next = trySet(current, gr, gc, oppositeColor(first));
      if (next) { current = next; changed = true; }
    }
  }

  return { grid: current, changed };
}

// ─── Rule 2: Horizontal sandwich + border-reach deduction ────────────────────
//
// For each cell X at (r,c) with color A:
//   If left L=(r,c-1) is color B and right R=(r,c+1) is color B:
//     Spread B to L's left-neighborhood: (r-1,c-1),(r+1,c-1),(r-1,c-2),(r,c-2),(r+1,c-2)
//     Spread B to R's right-neighborhood: (r-1,c+1),(r+1,c+1),(r-1,c+2),(r,c+2),(r+1,c+2)
//     If reachLeft[r][c-1] AND reachRight[r][c+1]:
//       If any A-colored cell exists with row < r  →  (r-1,c+1) becomes A
//       If any A-colored cell exists with row > r  →  (r+1,c+1) becomes A

function applyRule2(
  grid: YinYangGridModel,
  reachLeft: ReachCache,
  reachRight: ReachCache
): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { size, cells } = grid;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const colorX = cells[r][c].color;
      if (colorX === 'gray') continue;
      const colorB = oppositeColor(colorX);

      if (getColor(current, r, c - 1) !== colorB) continue;
      if (getColor(current, r, c + 1) !== colorB) continue;

      // Spread B from L into its left-side neighbors
      const spreadL: [number, number][] = [
        [r - 1, c - 1], [r + 1, c - 1],
        [r - 1, c - 2], [r, c - 2], [r + 1, c - 2],
      ];
      for (const [sr, sc] of spreadL) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Spread B from R rightward (diagonal + right only; exclude directly above/below R
      // since those cells are what the border-reach deduction may assign color A)
      const spreadR: [number, number][] = [
        [r - 1, c + 2], [r, c + 2], [r + 1, c + 2],
      ];
      for (const [sr, sc] of spreadR) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Border-reach deduction
      if (!reachLeft[r]?.[c - 1] || !reachRight[r]?.[c + 1]) continue;

      const hasColorXAbove = cells.some((rowArr, ri) => ri < r && rowArr.some((cell) => cell.color === colorX));
      const hasColorXBelow = cells.some((rowArr, ri) => ri > r && rowArr.some((cell) => cell.color === colorX));

      if (hasColorXAbove) {
        const next = trySet(current, r - 1, c + 1, colorX);
        if (next) { current = next; changed = true; }
      }
      if (hasColorXBelow) {
        const next = trySet(current, r + 1, c + 1, colorX);
        if (next) { current = next; changed = true; }
      }
    }
  }

  return { grid: current, changed };
}

// ─── Rule 3: Vertical sandwich + border-reach deduction ──────────────────────
//
// Mirror of Rule 2 for the up/down direction.
// For each cell X at (r,c) with color A:
//   If top U=(r-1,c) is B and bottom D=(r+1,c) is B:
//     Spread B to U's up-neighborhood and D's down-neighborhood
//     If reachTop[r-1][c] AND reachBottom[r+1][c]:
//       If any A-colored cell exists with col < c  →  (r+1,c-1) becomes A
//       If any A-colored cell exists with col > c  →  (r+1,c+1) becomes A

function applyRule3(
  grid: YinYangGridModel,
  reachTop: ReachCache,
  reachBottom: ReachCache
): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { size, cells } = grid;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const colorX = cells[r][c].color;
      if (colorX === 'gray') continue;
      const colorB = oppositeColor(colorX);

      if (getColor(current, r - 1, c) !== colorB) continue;
      if (getColor(current, r + 1, c) !== colorB) continue;

      // Spread B from U into its upward neighbors
      const spreadU: [number, number][] = [
        [r - 1, c - 1], [r - 1, c + 1],
        [r - 2, c - 1], [r - 2, c], [r - 2, c + 1],
      ];
      for (const [sr, sc] of spreadU) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Spread B from D downward (diagonal + down only; exclude directly left/right of D)
      const spreadD: [number, number][] = [
        [r + 2, c - 1], [r + 2, c], [r + 2, c + 1],
      ];
      for (const [sr, sc] of spreadD) {
        const next = trySet(current, sr, sc, colorB);
        if (next) { current = next; changed = true; }
      }

      // Border-reach deduction
      if (!reachTop[r - 1]?.[c] || !reachBottom[r + 1]?.[c]) continue;

      const hasColorXLeft  = cells[r].slice(0, c).some((cell) => cell.color === colorX);
      const hasColorXRight = cells[r].slice(c + 1).some((cell) => cell.color === colorX);

      if (hasColorXLeft) {
        const next = trySet(current, r + 1, c - 1, colorX);
        if (next) { current = next; changed = true; }
      }
      if (hasColorXRight) {
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

    // Rule 1
    const r1 = applyRule1(current);
    if (r1.changed) { current = r1.grid; anyChanged = true; }

    // Rebuild reach caches (after rule 1 may have placed new cells)
    const reachLeft   = buildReachLeft(current);
    const reachRight  = buildReachRight(current);
    const reachTop    = buildReachTop(current);
    const reachBottom = buildReachBottom(current);

    // Rule 2
    const r2 = applyRule2(current, reachLeft, reachRight);
    if (r2.changed) { current = r2.grid; anyChanged = true; }

    // Rule 3
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
