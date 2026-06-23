'use client';

import { YinYangGridModel } from '@/models/YinYangGridModel';
import { CellColor } from '@/models/YinYangCellModel';

interface Props {
  grid: YinYangGridModel;
  onCellClick?: (row: number, col: number) => void;
  readonly?: boolean;
}

function cellBg(color: CellColor, isClue: boolean, isHint: boolean): string {
  if (color === 'black') return isClue ? 'bg-gray-900' : isHint ? 'bg-gray-700' : 'bg-gray-800';
  if (color === 'white') return isClue ? 'bg-white border border-gray-400' : isHint ? 'bg-gray-50 border border-gray-300' : 'bg-white border border-gray-300';
  return 'bg-gray-400'; // gray = unknown
}

function cellLabel(color: CellColor): string {
  if (color === 'black') return '●';
  if (color === 'white') return '○';
  return '';
}

function cellTextColor(color: CellColor): string {
  if (color === 'black') return 'text-white';
  if (color === 'white') return 'text-gray-800';
  return 'text-gray-600';
}

export default function YinYangGridComponent({ grid, onCellClick, readonly = false }: Props) {
  const { size, cells } = grid;
  const cellSize = size <= 8 ? 48 : size <= 10 ? 40 : 32;

  return (
    <div
      className="inline-block border-2 border-gray-700"
      style={{ userSelect: 'none' }}
    >
      {cells.map((rowArr, r) => (
        <div key={r} className="flex">
          {rowArr.map((cell, c) => {
            const isClickable = !readonly && !cell.isClue;
            return (
              <div
                key={c}
                onClick={() => isClickable && onCellClick?.(r, c)}
                className={[
                  cellBg(cell.color, cell.isClue, cell.isHint),
                  cellTextColor(cell.color),
                  'flex items-center justify-center font-bold select-none',
                  'border border-gray-300',
                  isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
                  cell.isClue ? 'ring-2 ring-inset ring-yellow-400' : '',
                ].join(' ')}
                style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.5 }}
                title={`(${r + 1},${c + 1}) ${cell.color}${cell.isClue ? ' [clue]' : ''}${cell.isHint ? ' [hint]' : ''}`}
              >
                {cellLabel(cell.color)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
