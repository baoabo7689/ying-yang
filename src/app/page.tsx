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

const SIZES = [6, 8, 10];

function nextColor(current: CellColor): CellColor {
  if (current === 'gray') return 'black';
  if (current === 'black') return 'white';
  return 'gray';
}

export default function HomePage() {
  const { translations } = useLanguage();
  const t = translations as any;

  const [size, setSize] = useState(8);
  const [grid, setGrid] = useState(() => createEmptyGrid(8));
  const [message, setMessage] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────

  const handleRandom = (difficulty: 'easy' | 'medium' | 'hard') => {
    const board = initUtilities.random(difficulty, size);
    if (!board) { setMessage('Could not generate puzzle. Try again.'); return; }
    let g = createEmptyGrid(size);
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (board[r][c] !== 'gray') g = updateCell(g, r, c, board[r][c]);
    g = g.blockInit();
    setGrid(g);
    setMessage('');
  };

  const handleManual = () => {
    setGrid(createEmptyGrid(size));
    setMessage('');
  };

  const handleImport = (raw: string): boolean => {
    const result = ioUtilities.importGrid(raw);
    if (!result.success || !result.grid) { setMessage(t.messages?.importError ?? 'Import failed.'); return false; }
    setGrid(result.grid.blockInit());
    setMessage(t.messages?.importLoaded ?? 'Imported.');
    return true;
  };

  // ── Cell click (manual coloring) ──────────────────────────────────────────

  const handleCellClick = (r: number, c: number) => {
    const cell = grid.cells[r][c];
    if (cell.isClue) return;
    const next = nextColor(cell.color);
    setGrid(updateCell(grid, r, c, next));
  };

  // ── Functional ────────────────────────────────────────────────────────────

  const handleValidate = () => {
    const issues = grid.validate();
    if (issues.length === 0) { setMessage(t.validation?.noErrors ?? '✓ No errors.'); return; }
    setMessage(issues.map((i) => i.message).join('\n'));
  };

  const handleExport = () => {
    setMessage((t.messages?.exportTitle ?? 'Exported:') + '\n' + ioUtilities.exportGrid(grid));
  };

  const handleBlockInit = () => {
    setGrid(grid.blockInit());
    setMessage(t.messages?.blockInitDone ?? 'Locked.');
  };

  const handleReset = () => {
    setGrid(grid.reset());
    setMessage(t.messages?.resetDone ?? 'Reset.');
  };

  const handleSolve = () => {
    const result = solveUtilities.solve(grid);
    setGrid(result.grid);
    setMessage(result.message);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const btn = 'btn-interaction';
  const sectionLabel = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1';

  return (
    <main className="flex-1 bg-gradient-to-br from-blue-100 via-white to-pink-100 p-4 overflow-auto">
      <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto">

        {/* Left panel: controls */}
        <div className="flex flex-col gap-4 min-w-[180px]">

          {/* Size picker */}
          <div>
            <p className={sectionLabel}>Grid size</p>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSize(s); setGrid(createEmptyGrid(s)); setMessage(''); }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
                    size === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {s}×{s}
                </button>
              ))}
            </div>
          </div>

          {/* Init section */}
          <div>
            <p className={sectionLabel}>{t.init?.sectionTitle ?? 'Init'}</p>
            <div className="flex flex-col gap-2">
              <button className={btn} onClick={() => handleRandom('easy')}>{t.init?.randomEasy ?? 'Random Easy'}</button>
              <button className={btn} onClick={() => handleRandom('medium')}>{t.init?.randomMedium ?? 'Random Medium'}</button>
              <button className={btn} onClick={() => handleRandom('hard')}>{t.init?.randomHard ?? 'Random Hard'}</button>
              <button className={btn} onClick={() => setIsImportOpen(true)}>{t.init?.import ?? 'Import'}</button>
              <button className={btn} onClick={handleManual}>{t.init?.manual ?? 'Manual'}</button>
            </div>
          </div>

          {/* Functional section */}
          <div>
            <p className={sectionLabel}>{t.functional?.sectionTitle ?? 'Functional'}</p>
            <div className="flex flex-col gap-2">
              <button className={btn} onClick={handleValidate}>{t.functional?.validate ?? 'Validate'}</button>
              <button className={btn} onClick={handleExport}>{t.functional?.export ?? 'Export'}</button>
              <button className={btn} onClick={handleBlockInit}>{t.functional?.blockInit ?? 'Block Init'}</button>
              <button className={btn} onClick={handleReset}>{t.functional?.reset ?? 'Reset'}</button>
              <button className={`${btn} bg-emerald-600 hover:bg-emerald-700`} onClick={handleSolve}>
                {t.functional?.solve ?? 'Solve'}
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="text-xs text-gray-500 leading-5">
            <p className="font-semibold mb-1">Legend</p>
            <span className="inline-block w-4 h-4 bg-gray-800 rounded-sm mr-1 align-middle" />black (ying)<br />
            <span className="inline-block w-4 h-4 bg-white border border-gray-400 rounded-sm mr-1 align-middle" />white (yang)<br />
            <span className="inline-block w-4 h-4 bg-gray-400 rounded-sm mr-1 align-middle" />unknown<br />
            <span className="inline-block w-4 h-4 bg-gray-800 ring-2 ring-yellow-400 rounded-sm mr-1 align-middle" />clue cell<br />
            <span className="inline-block w-4 h-4 bg-gray-700 rounded-sm mr-1 align-middle" />hint (auto)
          </div>
        </div>

        {/* Center: grid */}
        <div className="flex flex-col items-center gap-4">
          <YinYangGridComponent grid={grid} onCellClick={handleCellClick} />
          <p className="text-sm text-gray-500">Click a non-clue cell to cycle: gray → black → white → gray</p>
        </div>

        {/* Right: message */}
        <div className="flex-1">
          <p className={sectionLabel}>Output</p>
          <textarea
            readOnly
            value={message}
            className="w-full h-64 border border-gray-300 rounded-lg p-3 font-mono text-sm bg-gray-50 resize-none focus:outline-none"
            placeholder="Messages and exported data appear here…"
          />
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
