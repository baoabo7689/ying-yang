'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { createEmptyGrid, updateCell } from '@/models/YinYangGridModel';
import { CellColor } from '@/models/YinYangCellModel';
import YinYangGridComponent from '@/components/YinYangGridComponent';
import ImportComponent from '@/components/ImportComponent';
import { initUtilities } from '@/utilities/initUtilities';
import { ioUtilities } from '@/utilities/ioUtilities';
import { solveUtilities } from '@/utilities/solveUtilities';

const DEFAULT_W = 15;
const DEFAULT_H = 15;
const MIN_DIM = 2;
const MAX_DIM = 32;

function nextColor(current: CellColor): CellColor {
  if (current === 'gray') return 'black';
  if (current === 'black') return 'white';
  return 'gray';
}

function clampDim(v: number) {
  return Math.max(MIN_DIM, Math.min(MAX_DIM, v));
}

export default function HomePage() {
  const { translations } = useLanguage();

  const [width, setWidth]   = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  // Pending input values (strings, before Apply)
  const [widthInput, setWidthInput]   = useState(String(DEFAULT_W));
  const [heightInput, setHeightInput] = useState(String(DEFAULT_H));

  const [grid, setGrid] = useState(() => createEmptyGrid(DEFAULT_W, DEFAULT_H));
  const [message, setMessage] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ── Apply size ────────────────────────────────────────────────────────────

  const applySize = () => {
    const w = clampDim(parseInt(widthInput) || DEFAULT_W);
    const h = clampDim(parseInt(heightInput) || DEFAULT_H);
    setWidth(w); setHeight(h);
    setWidthInput(String(w)); setHeightInput(String(h));
    setGrid(createEmptyGrid(w, h));
    setMessage('');
  };

  // ── Init ──────────────────────────────────────────────────────────────────

  const handleRandom = () => {
    const board = initUtilities.random(width, height);
    let g = createEmptyGrid(width, height);
    for (let r = 0; r < height; r++)
      for (let c = 0; c < width; c++)
        if (board[r][c] !== 'gray') g = updateCell(g, r, c, board[r][c]);
    setGrid(g);
    setMessage('');
  };

  const handleManual = () => { setGrid(createEmptyGrid(width, height)); setMessage(''); };

  const handleImport = (raw: string): boolean => {
    const result = ioUtilities.importGrid(raw);
    if (!result.success || !result.grid) { setMessage('Import failed: ' + (result.error ?? '')); return false; }
    const g = result.grid;
    setWidth(g.width); setHeight(g.height);
    setWidthInput(String(g.width)); setHeightInput(String(g.height));
    setGrid(g.blockInit());
    setMessage('Imported.');
    return true;
  };

  // ── Cell click ────────────────────────────────────────────────────────────

  const handleCellClick = (r: number, c: number) => {
    const cell = grid.cells[r][c];
    if (cell.isClue) return;
    setGrid(updateCell(grid, r, c, nextColor(cell.color)));
  };

  // ── Functional ────────────────────────────────────────────────────────────

  const handleValidate = () => {
    const issues = grid.validate();
    setMessage(issues.length === 0 ? '✓ No validation errors.' : issues.map((i: any) => i.message).join('\n'));
  };

  const handleExport = () => {
    setMessage('Exported (B=black, W=white, _=unknown):\n' + ioUtilities.exportGrid(grid));
  };

  const handleBlockInit = () => { setGrid(grid.blockInit()); setMessage('Puzzle locked as initial state.'); };

  const handleReset = () => { setGrid(grid.reset()); setMessage('Non-clue cells cleared.'); };

  const handleSolve = () => {
    const result = solveUtilities.solve(grid);
    setGrid(result.grid);
    setMessage(result.message);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const btn = 'btn-interaction';
  const rowLabel = 'font-bold text-gray-900 w-28 shrink-0';
  const dimInput =
    'w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <main className="flex-1 bg-gradient-to-br from-blue-100 via-white to-pink-100 p-4 overflow-auto">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">

        {/* ── Size row ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className={rowLabel}>Size</span>
          <label className="text-sm text-gray-600">W</label>
          <input
            type="number" min={MIN_DIM} max={MAX_DIM}
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={applySize}
            onKeyDown={(e) => e.key === 'Enter' && applySize()}
            className={dimInput}
          />
          <span className="text-gray-400">×</span>
          <label className="text-sm text-gray-600">H</label>
          <input
            type="number" min={MIN_DIM} max={MAX_DIM}
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            onBlur={applySize}
            onKeyDown={(e) => e.key === 'Enter' && applySize()}
            className={dimInput}
          />
          <button className={`${btn} w-20`} onClick={applySize}>Apply</button>
        </div>

        {/* ── Init row ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className={rowLabel}>Init</span>
          <button className={btn} onClick={handleRandom}>Random</button>
          <button className={btn} onClick={() => setIsImportOpen(true)}>Import</button>
          <button className={btn} onClick={handleManual}>Manual</button>
        </div>

        {/* ── Functional rows ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className={rowLabel}>Functional</span>
          <button className={btn} onClick={handleValidate}>Validate</button>
          <button className={btn} onClick={handleExport}>Export</button>
          <button className={`${btn} bg-emerald-600 hover:bg-emerald-700`} onClick={handleSolve}>Solve</button>
        </div>
        <div className="flex items-center gap-3">
          <span className={rowLabel} />
          <button className={btn} onClick={handleReset}>Reset</button>
          <button className={btn} onClick={handleBlockInit}>Block Init</button>
        </div>

        <hr className="border-gray-200 my-1" />

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* Grid */}
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-600">
              Ying Yang Grid &nbsp;<span className="font-normal text-gray-400">{width}×{height}</span>
            </h2>
            <YinYangGridComponent grid={grid} onCellClick={handleCellClick} />
            <p className="text-xs text-gray-400">
              Click: gray → black → white → gray &nbsp;·&nbsp; yellow ring = clue
            </p>
          </div>

          {/* Message */}
          <div className="flex-1 flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-600">Message</h2>
            <textarea
              readOnly
              value={message}
              className="w-full h-[600px] border border-gray-300 rounded-lg p-3 font-mono text-sm bg-white resize-none focus:outline-none"
              placeholder="Messages and exported data appear here…"
            />
          </div>

        </div>
      </div>

      <ImportComponent
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />
    </main>
  );
}
