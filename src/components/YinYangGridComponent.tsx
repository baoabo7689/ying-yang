'use client';

import { YinYangGridModel } from '@/models/YinYangGridModel';
import { CellColor } from '@/models/YinYangCellModel';

interface Props {
  grid: YinYangGridModel;
  onCellClick?: (row: number, col: number) => void;
  readonly?: boolean;
}

// Max pixel width the grid should occupy
const MAX_GRID_PX = 520;

function cellStyle(color: CellColor): { bg: string; label: string } {
  if (color === 'black') return { bg: '#1a1a1a', label: '' };
  if (color === 'white') return { bg: '#ffffff', label: '' };
  return { bg: '#9ca3af', label: '' }; // gray-400 for unknown
}

export default function YinYangGridComponent({ grid, onCellClick, readonly = false }: Props) {
  const { width, height, cells } = grid;
  const cellPx = Math.max(16, Math.min(40, Math.floor(MAX_GRID_PX / Math.max(width, height))));
  const borderOuter = 2;
  const borderCell = 1;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        border: `${borderOuter}px solid #374151`,
        boxSizing: 'content-box',
      }}
    >
      {cells.map((rowArr, r) => (
        <div key={r} style={{ display: 'flex' }}>
          {rowArr.map((cell, c) => {
            const { bg } = cellStyle(cell.color);
            const isClickable = !readonly && !cell.isClue;
            return (
              <div
                key={c}
                onClick={() => isClickable && onCellClick?.(r, c)}
                title={`(${r + 1},${c + 1}) ${cell.color}${cell.isClue ? ' [clue]' : ''}`}
                style={{
                  width: cellPx,
                  height: cellPx,
                  backgroundColor: bg,
                  border: `${borderCell}px solid #6b7280`,
                  boxSizing: 'border-box',
                  cursor: isClickable ? 'pointer' : 'default',
                  // Yellow ring for clue cells
                  outline: cell.isClue ? '2px solid #facc15' : undefined,
                  outlineOffset: cell.isClue ? '-2px' : undefined,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
