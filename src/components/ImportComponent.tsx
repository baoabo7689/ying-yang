'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (raw: string) => boolean;
}

export default function ImportComponent({ isOpen, onClose, onImport }: Props) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    setError('');
    const ok = onImport(raw);
    if (ok) {
      setRaw('');
      onClose();
    } else {
      setError('Invalid format. Use B/W/_ tokens, n² total for an n×n grid (n=4..16).');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px] max-w-[95vw]">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Import Puzzle</h2>
        <p className="text-sm text-gray-600 mb-2">
          Paste your puzzle below. Use <strong>B</strong> = black, <strong>W</strong> = white,{' '}
          <strong>_</strong> = unknown. Spaces and newlines are ignored. Total tokens must be n²
          (e.g. 64 for 8×8).
        </p>
        <textarea
          className="w-full h-40 border border-gray-300 rounded-lg p-2 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={'B W _ _ B W _ B\nW _ B W _ _ W _\n...'}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        <div className="flex gap-3 mt-4 justify-end">
          <button className="btn-interaction bg-gray-200 text-gray-700 hover:bg-gray-300" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-interaction" onClick={handleImport}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
