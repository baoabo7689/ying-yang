import type { YinYangGridModel } from '@/models/YinYangGridModel';
import type { CellColor } from '@/models/YinYangCellModel';

export type ValidationIssueType = 'twoByTwo' | 'blackDisconnected' | 'whiteDisconnected';

export interface ValidationIssue {
  type: ValidationIssueType;
  row?: number;
  col?: number;
  message: string;
}

function validateTwoByTwo(grid: YinYangGridModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { width, height, cells } = grid;

  for (let r = 0; r <= height - 2; r++) {
    for (let c = 0; c <= width - 2; c++) {
      const quad = [cells[r][c], cells[r][c + 1], cells[r + 1][c], cells[r + 1][c + 1]];
      const nonGray = quad.filter((cell) => cell.color !== 'gray');
      if (nonGray.length < 4) continue;
      const firstColor = nonGray[0].color;
      if (nonGray.every((cell) => cell.color === firstColor)) {
        issues.push({
          type: 'twoByTwo',
          row: r,
          col: c,
          message: `2×2 block at (${r + 1},${c + 1}) is all ${firstColor}`,
        });
      }
    }
  }

  return issues;
}

function floodFill(
  cells: YinYangGridModel['cells'],
  width: number,
  height: number,
  startR: number,
  startC: number,
  color: CellColor,
  visited: boolean[][]
): void {
  const stack: [number, number][] = [[startR, startC]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= height || c < 0 || c >= width) continue;
    if (visited[r][c]) continue;
    if (cells[r][c].color !== color) continue;
    visited[r][c] = true;
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
}

function validateConnectivity(grid: YinYangGridModel, color: CellColor): ValidationIssue[] {
  const { width, height, cells } = grid;
  const colorCells: [number, number][] = [];

  for (let r = 0; r < height; r++)
    for (let c = 0; c < width; c++)
      if (cells[r][c].color === color) colorCells.push([r, c]);

  if (colorCells.length <= 1) return [];

  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  floodFill(cells, width, height, colorCells[0][0], colorCells[0][1], color, visited);

  const disconnected = colorCells.filter(([r, c]) => !visited[r][c]);
  if (disconnected.length === 0) return [];

  return [{
    type: color === 'black' ? 'blackDisconnected' : 'whiteDisconnected',
    row: disconnected[0][0],
    col: disconnected[0][1],
    message: `${color} cells are not fully connected (at ${disconnected[0][0] + 1},${disconnected[0][1] + 1})`,
  }];
}

export function validateGrid(grid: YinYangGridModel): ValidationIssue[] {
  return [
    ...validateTwoByTwo(grid),
    ...validateConnectivity(grid, 'black'),
    ...validateConnectivity(grid, 'white'),
  ];
}
