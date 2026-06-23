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

// ─── Reach-border caches ──────────────────────────────────────────────────────
// reachLeft[r][c]  = true if there is a continuous chain of (r,c)'s color going left to column 0
// reachRight[r][c] = true if chain reaches column width-1
// reachTop[r][c]   = true if chain reaches row 0
// reachBottom[r][c]= true if chain reaches row height-1

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
      if (colors.filter((v) => v === 'gray').length !== 1) continue;
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

// ─── Rule 2: Horizontal border-reach deduction ───────────────────────────────
//
// For each cell X at (r,c) with color A, colorB = opposite(A):
//
// LEFT-BLOCKED variant (X is at left border, or left neighbor L=B reaches left border):
//   R = right neighbor (r, c+1), color B
//   • R reaches TOP  but NOT right  →  any A below X  →  (r+1, c+1) = A
//   • R reaches BOT  but NOT right  →  any A above X  →  (r-1, c+1) = A
//
// RIGHT-BLOCKED variant (X is at right border, or right neighbor R=B reaches right border):
//   L = left neighbor (r, c-1), color B
//   • L reaches TOP  but NOT left   →  any A below X  →  (r+1, c-1) = A
//   • L reaches BOT  but NOT left   →  any A above X  →  (r-1, c-1) = A
//
// LEFT-RIGHT variant (L=B reaches left border AND R=B reaches right border):
//   • any A above X  →  (r-1, c+1) = A
//   • any A below X  →  (r+1, c+1) = A

function applyRule2(
  grid: YinYangGridModel,
  reachLeft: ReachCache,
  reachRight: ReachCache,
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

      const anyBelow = cells.some((rowArr, ri) => ri > r && rowArr.some((cell) => cell.color === colorX));
      const anyAbove = cells.some((rowArr, ri) => ri < r && rowArr.some((cell) => cell.color === colorX));

      // ── Left-blocked: X at left border, or L (color B) reaches left border ──
      const leftBlocked =
        c === 0 || (getColor(current, r, c - 1) === colorB && (reachLeft[r]?.[c - 1] ?? false));

      if (leftBlocked && c + 1 < width && getColor(current, r, c + 1) === colorB) {
        const rRight  = reachRight[r]?.[c + 1] ?? false;
        const rTop    = reachTop[r]?.[c + 1]   ?? false;
        const rBottom = reachBottom[r]?.[c + 1] ?? false;

        const notRRight = c + 1 === width - 1 || !rRight;
        if (notRRight && rTop && anyBelow) {
          const next = trySet(current, r + 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
        if (notRRight && rBottom && anyAbove) {
          const next = trySet(current, r - 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
      }

      // ── Right-blocked: X at right border, or R (color B) reaches right border ──
      const rightBlocked =
        c === width - 1 || (getColor(current, r, c + 1) === colorB && (reachRight[r]?.[c + 1] ?? false));

      if (rightBlocked && c - 1 >= 0 && getColor(current, r, c - 1) === colorB) {
        const rLeft   = reachLeft[r]?.[c - 1]   ?? false;
        const rTop    = reachTop[r]?.[c - 1]    ?? false;
        const rBottom = reachBottom[r]?.[c - 1] ?? false;

        const notRLeft = c - 1 === 0 || !rLeft;
        if (notRLeft && rTop && anyBelow) {
          const next = trySet(current, r + 1, c - 1, colorX);
          if (next) { current = next; changed = true; }
        }
        if (notRLeft && rBottom && anyAbove) {
          const next = trySet(current, r - 1, c - 1, colorX);
          if (next) { current = next; changed = true; }
        }
      }

      // ── Left-right: L=B reaches left border AND R=B reaches right border ──
      const lColor = getColor(current, r, c - 1);
      const rColor = getColor(current, r, c + 1);
      if (
        c - 1 >= 0 && lColor === colorB && (reachLeft[r]?.[c - 1] ?? false) &&
        c + 1 < width && rColor === colorB && (reachRight[r]?.[c + 1] ?? false)
      ) {
        if (anyAbove) {
          const next = trySet(current, r - 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
        if (anyBelow) {
          const next = trySet(current, r + 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
      }
    }
  }

  return { grid: current, changed };
}

// ─── Rule 3: Vertical border-reach deduction ─────────────────────────────────
//
// Mirror of Rule 2, rotated 90°. For each cell X at (r,c) with color A:
//
// TOP-BLOCKED variant (X at top border, or top neighbor U=B reaches top border):
//   D = down neighbor (r+1, c), color B
//   • D reaches LEFT  but NOT bottom  →  any A to the right of X  →  (r+1, c+1) = A
//   • D reaches RIGHT but NOT bottom  →  any A to the left  of X  →  (r+1, c-1) = A
//
// BOTTOM-BLOCKED variant (X at bottom border, or down neighbor D=B reaches bottom border):
//   U = up neighbor (r-1, c), color B
//   • U reaches LEFT  but NOT top  →  any A to the right of X  →  (r-1, c+1) = A
//   • U reaches RIGHT but NOT top  →  any A to the left  of X  →  (r-1, c-1) = A
//
// TOP-DOWN variant (U=B reaches top border AND D=B reaches bottom border):
//   • any A to the left  of X  →  (r+1, c-1) = A
//   • any A to the right of X  →  (r+1, c+1) = A

function applyRule3(
  grid: YinYangGridModel,
  reachLeft: ReachCache,
  reachRight: ReachCache,
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

      const anyRight = cells[r].slice(c + 1).some((cell) => cell.color === colorX);
      const anyLeft  = cells[r].slice(0, c).some((cell) => cell.color === colorX);

      // ── Top-blocked: X at top border, or U (color B) reaches top border ──
      const topBlocked =
        r === 0 || (getColor(current, r - 1, c) === colorB && (reachTop[r - 1]?.[c] ?? false));

      if (topBlocked && r + 1 < height && getColor(current, r + 1, c) === colorB) {
        const rBottom = reachBottom[r + 1]?.[c] ?? false;
        const rLeft   = reachLeft[r + 1]?.[c]   ?? false;
        const rRight  = reachRight[r + 1]?.[c]  ?? false;

        const notRBottom = r + 1 === height - 1 || !rBottom;
        if (notRBottom && rLeft && anyRight) {
          const next = trySet(current, r + 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
        if (notRBottom && rRight && anyLeft) {
          const next = trySet(current, r + 1, c - 1, colorX);
          if (next) { current = next; changed = true; }
        }
      }

      // ── Bottom-blocked: X at bottom border, or D (color B) reaches bottom border ──
      const bottomBlocked =
        r === height - 1 || (getColor(current, r + 1, c) === colorB && (reachBottom[r + 1]?.[c] ?? false));

      if (bottomBlocked && r - 1 >= 0 && getColor(current, r - 1, c) === colorB) {
        const rTop    = reachTop[r - 1]?.[c]    ?? false;
        const rLeft   = reachLeft[r - 1]?.[c]   ?? false;
        const rRight  = reachRight[r - 1]?.[c]  ?? false;

        const notRTop = r - 1 === 0 || !rTop;
        if (notRTop && rLeft && anyRight) {
          const next = trySet(current, r - 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
        if (notRTop && rRight && anyLeft) {
          const next = trySet(current, r - 1, c - 1, colorX);
          if (next) { current = next; changed = true; }
        }
      }

      // ── Top-down: U=B reaches top border AND D=B reaches bottom border ──
      const uColor = getColor(current, r - 1, c);
      const dColor = getColor(current, r + 1, c);
      if (
        r - 1 >= 0 && uColor === colorB && (reachTop[r - 1]?.[c] ?? false) &&
        r + 1 < height && dColor === colorB && (reachBottom[r + 1]?.[c] ?? false)
      ) {
        if (anyLeft) {
          const next = trySet(current, r + 1, c - 1, colorX);
          if (next) { current = next; changed = true; }
        }
        if (anyRight) {
          const next = trySet(current, r + 1, c + 1, colorX);
          if (next) { current = next; changed = true; }
        }
      }
    }
  }

  return { grid: current, changed };
}

// ─── Rule 4: Forced-corridor deduction ───────────────────────────────────────
//
// Connectivity invariant: all cells of each color must form one connected region.
// If two same-color cells are currently disconnected, any colored cell that has
// exactly ONE gray neighbor is forced: that gray cell must become the same color,
// because it is the only direction the cell can spread to eventually reconnect.

function applyRule4(grid: YinYangGridModel): { grid: YinYangGridModel; changed: boolean } {
  let current = grid;
  let changed = false;
  const { width, height } = grid;

  for (const color of ['black', 'white'] as CellColor[]) {
    // Collect all cells of this color in current state
    const colorCells: [number, number][] = [];
    for (let r = 0; r < height; r++)
      for (let c = 0; c < width; c++)
        if (current.cells[r][c].color === color) colorCells.push([r, c]);

    if (colorCells.length <= 1) continue;

    // Flood-fill from the first cell to measure reachable count
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const stk: [number, number][] = [colorCells[0]];
    let reach = 0;
    while (stk.length) {
      const [r, c] = stk.pop()!;
      if (!inBounds(width, height, r, c) || visited[r][c] || current.cells[r][c].color !== color) continue;
      visited[r][c] = true;
      reach++;
      stk.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    if (reach === colorCells.length) continue; // Already fully connected

    // Some cells are disconnected. Any color cell with exactly 1 gray neighbor
    // must spread through that neighbor.
    for (const [r, c] of colorCells) {
      const grayNeighbors: [number, number][] = [];
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(width, height, nr, nc) && current.cells[nr][nc].color === 'gray')
          grayNeighbors.push([nr, nc]);
      }
      if (grayNeighbors.length !== 1) continue;
      const next = trySet(current, grayNeighbors[0][0], grayNeighbors[0][1], color);
      if (next) { current = next; changed = true; }
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

    // Rebuild all caches after rule 1 (may have placed new cells)
    const reachLeft   = buildReachLeft(current);
    const reachRight  = buildReachRight(current);
    const reachTop    = buildReachTop(current);
    const reachBottom = buildReachBottom(current);

    const r2 = applyRule2(current, reachLeft, reachRight, reachTop, reachBottom);
    if (r2.changed) { current = r2.grid; anyChanged = true; }

    // Rebuild after rule 2 so rule 3 sees any newly placed cells
    const reachLeft2   = buildReachLeft(current);
    const reachRight2  = buildReachRight(current);
    const reachTop2    = buildReachTop(current);
    const reachBottom2 = buildReachBottom(current);

    const r3 = applyRule3(current, reachLeft2, reachRight2, reachTop2, reachBottom2);
    if (r3.changed) { current = r3.grid; anyChanged = true; }

    const r4 = applyRule4(current);
    if (r4.changed) { current = r4.grid; anyChanged = true; }

    if (anyChanged) steps++;
    else break;
  }

  const grayLeft = current.cells.flat().filter((c) => c.color === 'gray').length;
  const message =
    grayLeft === 0
      ? `Solved in ${steps} step(s)!`
      : `Applied ${steps} step(s); ${grayLeft} cell(s) still unknown.`;

  return { grid: current, steps, message };
}

export const solveUtilities = { solve };
