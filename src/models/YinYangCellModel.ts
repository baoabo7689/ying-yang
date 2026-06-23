export type CellColor = 'gray' | 'black' | 'white';

export function oppositeColor(color: CellColor): CellColor {
  return color === 'black' ? 'white' : 'black';
}

export interface YinYangCellModel {
  row: number;
  col: number;
  color: CellColor;
  isClue: boolean;
  isHint: boolean;
  // Cached: can a chain of this cell's color reach each border?
  reachLeft: boolean | null;
  reachRight: boolean | null;
  reachTop: boolean | null;
  reachBottom: boolean | null;

  setColor: (color: CellColor, hint?: boolean) => YinYangCellModel;
  blockInit: () => YinYangCellModel;
  reset: () => YinYangCellModel;
  clearCache: () => YinYangCellModel;
}

export function createEmptyCell(row: number, col: number): YinYangCellModel {
  const cell: YinYangCellModel = {
    row,
    col,
    color: 'gray',
    isClue: false,
    isHint: false,
    reachLeft: null,
    reachRight: null,
    reachTop: null,
    reachBottom: null,
    setColor: function (color: CellColor, hint = false) {
      return setColor(this, color, hint);
    },
    blockInit: function () {
      return blockInit(this);
    },
    reset: function () {
      return reset(this);
    },
    clearCache: function () {
      return clearCache(this);
    },
  };
  return cell;
}

export function setColor(cell: YinYangCellModel, color: CellColor, hint = false): YinYangCellModel {
  return { ...cell, color, isHint: hint, reachLeft: null, reachRight: null, reachTop: null, reachBottom: null };
}

export function blockInit(cell: YinYangCellModel): YinYangCellModel {
  if (cell.color === 'gray') return cell;
  return { ...cell, isClue: true, isHint: false };
}

export function reset(cell: YinYangCellModel): YinYangCellModel {
  if (cell.isClue) return cell;
  return { ...cell, color: 'gray', isHint: false, reachLeft: null, reachRight: null, reachTop: null, reachBottom: null };
}

export function clearCache(cell: YinYangCellModel): YinYangCellModel {
  return { ...cell, reachLeft: null, reachRight: null, reachTop: null, reachBottom: null };
}
