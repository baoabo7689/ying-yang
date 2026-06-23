export const translations = {
  home: {
    title: 'Ying Yang Puzzle',
    description: 'Color each cell black (ying) or white (yang) following the rules.',
  },
  header: {
    title: 'Ying Yang Puzzle',
    language: 'Language',
    toggleLanguage: 'Change language',
    contact: 'Contact',
    help: 'Help',
  },
  help: {
    title: 'Help',
    common: 'Rules',
    commonHelps: [
      'No 2×2 block can be all the same color.',
      'All black (ying) cells must be orthogonally connected.',
      'All white (yang) cells must be orthogonally connected.',
      'Click a gray cell to cycle: gray → black → white → gray.',
      'Clue cells (yellow ring) cannot be changed.',
    ],
  },
  init: {
    sectionTitle: 'Init',
    randomEasy: 'Random Easy',
    randomMedium: 'Random Medium',
    randomHard: 'Random Hard',
    import: 'Import',
    manual: 'Manual',
    size: 'Size',
  },
  functional: {
    sectionTitle: 'Functional',
    validate: 'Validate',
    export: 'Export',
    blockInit: 'Block Init',
    reset: 'Reset',
    solve: 'Solve',
  },
  validation: {
    noErrors: '✓ No validation errors.',
    twoByTwo: '✗ 2×2 block at ({row},{col}) is all {color}.',
    blackDisconnected: '✗ Black cells are disconnected at ({row},{col}).',
    whiteDisconnected: '✗ White cells are disconnected at ({row},{col}).',
  },
  messages: {
    importLoaded: '✓ Puzzle imported.',
    importError: '✗ Invalid import format.',
    blockInitDone: '✓ Puzzle locked as initial state.',
    resetDone: '✓ Non-clue cells cleared.',
    exportTitle: 'Exported puzzle (B=black, W=white, _=unknown):',
  },
};

export default { translations };
