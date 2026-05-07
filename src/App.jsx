/**
 * App.jsx
 * Root component — wires together all sub-components using useSpreadsheet hook.
 */

import React from 'react';
import { useSpreadsheet } from './hooks/useSpreadsheet.js';
import { useFormulaEditor } from './hooks/useFormulaEditor.js';
import Toolbar from './components/Toolbar.jsx';
import FormulaBar from './components/FormulaBar.jsx';
import Grid from './components/Grid.jsx';
import FunctionHelp from './components/FunctionHelp.jsx';
import FunctionSuggestions from './components/FunctionSuggestions.jsx';

export default function App() {
  const {
    cellData,
    numCols, numRows,
    colLabels, rowLabels,
    selectedCell, setSelectedCell,
    commitCell,
    undo, redo, canUndo, canRedo,
    addColumn, removeColumn,
    addRow, removeRow,
    maxCols, maxRows,
  } = useSpreadsheet();

  const editor = useFormulaEditor({
    cellData,
    selectedCell,
    setSelectedCell,
    commitCell,
  });

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span>Spreadsheet Engine</span>
        </div>
        <div className="app__subtitle">Formula Evaluation · Dependency Tracking · Circular Reference Detection</div>
      </header>

      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        numCols={numCols}
        numRows={numRows}
        onAddCol={addColumn}
        onRemoveCol={removeColumn}
        onAddRow={addRow}
        onRemoveRow={removeRow}
        maxCols={maxCols}
        maxRows={maxRows}
      />

      <FunctionHelp />

      <FormulaBar
        cellData={cellData}
        editor={editor}
      />

      <FunctionSuggestions editor={editor} />

      <main className="app__main">
        <Grid
          cellData={cellData}
          numCols={numCols}
          numRows={numRows}
          colLabels={colLabels}
          rowLabels={rowLabels}
          selectedCell={selectedCell}
          onSelectCell={setSelectedCell}
          editor={editor}
        />
      </main>

      <footer className="app__footer">
        <span>Click to select · Type or use Formula Bar to edit · Enter/Tab to confirm · Esc to cancel</span>
        <span className="app__footer-shortcuts">
          <kbd>Ctrl+Z</kbd> Undo &nbsp;·&nbsp; <kbd>Ctrl+Y</kbd> Redo
        </span>
      </footer>
    </div>
  );
}
