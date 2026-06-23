import { YinYangCellModel, CellColor, createEmptyCell } from './YinYangCellModel';
import { validateGrid } from '@/utilities/validateUtilities';
import type { ValidationIssue } from '@/utilities/validateUtilities';

export interface YinYangGridModel {
  size: number;
  cells: YinYangCellModel[][];
  isBlockedInit: boolean;

  getCell: (row: number, col: number) => YinYangCellModel;
  updateCell: (row: number, col: number, color: CellColor, hint?: boolean) => YinYangGridModel;
  blockInit: () => YinYangGridModel;
  reset: () => YinYangGridModel;
  validate: () => ValidationIssue[];
  export: () => string;
}

export function createEmptyGrid(size = 8): YinYangGridModel {
  const cells = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => createEmptyCell(r, c))
  );

  return buildGrid(size, cells, false);
}

function buildGrid(size: number, cells: YinYangCellModel[][], isBlockedInit: boolean): YinYangGridModel {
  const grid: YinYangGridModel = {
    size,
    cells,
    isBlockedInit,
    getCell: function (row, col) { return this.cells[row][col]; },
    updateCell: function (row, col, color, hint) { return updateCell(this, row, col, color, hint); },
    blockInit: function () { return blockInitGrid(this); },
    reset: function () { return resetGrid(this); },
    validate: function () { return validateGrid(this); },
    export: function () { return exportGrid(this); },
  };
  return grid;
}

export function updateCell(
  grid: YinYangGridModel,
  row: number,
  col: number,
  color: CellColor,
  hint = false
): YinYangGridModel {
  const newCells = grid.cells.map((rowArr, r) =>
    rowArr.map((cell, c) => (r === row && c === col ? cell.setColor(color, hint) : cell))
  );
  return buildGrid(grid.size, newCells, grid.isBlockedInit);
}

export function blockInitGrid(grid: YinYangGridModel): YinYangGridModel {
  const newCells = grid.cells.map((rowArr) => rowArr.map((cell) => cell.blockInit()));
  return buildGrid(grid.size, newCells, true);
}

export function resetGrid(grid: YinYangGridModel): YinYangGridModel {
  const newCells = grid.cells.map((rowArr) => rowArr.map((cell) => cell.reset()));
  return buildGrid(grid.size, newCells, false);
}

export function exportGrid(grid: YinYangGridModel): string {
  return grid.cells
    .map((row) =>
      row.map((cell) => (cell.color === 'black' ? 'B' : cell.color === 'white' ? 'W' : '_')).join(' ')
    )
    .join('\n');
}
