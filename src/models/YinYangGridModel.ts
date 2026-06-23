import { YinYangCellModel, CellColor, createEmptyCell } from './YinYangCellModel';
import { validateGrid } from '@/utilities/validateUtilities';
import type { ValidationIssue } from '@/utilities/validateUtilities';

export interface YinYangGridModel {
  width: number;
  height: number;
  cells: YinYangCellModel[][];
  isBlockedInit: boolean;

  getCell: (row: number, col: number) => YinYangCellModel;
  updateCell: (row: number, col: number, color: CellColor) => YinYangGridModel;
  blockInit: () => YinYangGridModel;
  reset: () => YinYangGridModel;
  validate: () => ValidationIssue[];
  export: () => string;
}

export function createEmptyGrid(width = 15, height = 15): YinYangGridModel {
  const cells = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (_, c) => createEmptyCell(r, c))
  );
  return buildGrid(width, height, cells, false);
}

function buildGrid(
  width: number,
  height: number,
  cells: YinYangCellModel[][],
  isBlockedInit: boolean
): YinYangGridModel {
  return {
    width,
    height,
    cells,
    isBlockedInit,
    getCell: function (row, col) { return this.cells[row][col]; },
    updateCell: function (row, col, color) { return updateCell(this, row, col, color); },
    blockInit: function () { return blockInitGrid(this); },
    reset: function () { return resetGrid(this); },
    validate: function () { return validateGrid(this); },
    export: function () { return exportGrid(this); },
  };
}

export function updateCell(
  grid: YinYangGridModel,
  row: number,
  col: number,
  color: CellColor
): YinYangGridModel {
  const newCells = grid.cells.map((rowArr, r) =>
    rowArr.map((cell, c) => (r === row && c === col ? cell.setColor(color) : cell))
  );
  return buildGrid(grid.width, grid.height, newCells, grid.isBlockedInit);
}

export function blockInitGrid(grid: YinYangGridModel): YinYangGridModel {
  const newCells = grid.cells.map((rowArr) => rowArr.map((cell) => cell.blockInit()));
  return buildGrid(grid.width, grid.height, newCells, true);
}

export function resetGrid(grid: YinYangGridModel): YinYangGridModel {
  const newCells = grid.cells.map((rowArr) => rowArr.map((cell) => cell.reset()));
  return buildGrid(grid.width, grid.height, newCells, false);
}

export function exportGrid(grid: YinYangGridModel): string {
  return grid.cells
    .map((row) =>
      row.map((cell) => (cell.color === 'black' ? 'B' : cell.color === 'white' ? 'W' : '_')).join(' ')
    )
    .join('\n');
}
