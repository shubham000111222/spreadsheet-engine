/**
 * Toolbar.jsx
 * Undo/Redo buttons and dynamic grid size controls.
 */

import React from 'react';

export default function Toolbar({
  onUndo, onRedo, canUndo, canRedo,
  numCols, numRows,
  onAddCol, onRemoveCol,
  onAddRow, onRemoveRow,
  maxCols, maxRows,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar__group toolbar__group--history">
        <button
          className="toolbar__btn toolbar__btn--icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          <span>Undo</span>
        </button>
        <button
          className="toolbar__btn toolbar__btn--icon"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 14 20 9 15 4" />
            <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
          </svg>
          <span>Redo</span>
        </button>
      </div>

      <div className="toolbar__divider" />

      <div className="toolbar__group">
        <span className="toolbar__label">Columns</span>
        <button
          className="toolbar__btn toolbar__btn--sm"
          onClick={onRemoveCol}
          disabled={numCols <= 1}
          title="Remove last column"
        >−</button>
        <span className="toolbar__count">{numCols}</span>
        <button
          className="toolbar__btn toolbar__btn--sm"
          onClick={onAddCol}
          disabled={numCols >= maxCols}
          title={`Add column (max ${maxCols})`}
        >+</button>
      </div>

      <div className="toolbar__group">
        <span className="toolbar__label">Rows</span>
        <button
          className="toolbar__btn toolbar__btn--sm"
          onClick={onRemoveRow}
          disabled={numRows <= 1}
          title="Remove last row"
        >−</button>
        <span className="toolbar__count">{numRows}</span>
        <button
          className="toolbar__btn toolbar__btn--sm"
          onClick={onAddRow}
          disabled={numRows >= maxRows}
          title={`Add row (max ${maxRows})`}
        >+</button>
      </div>

      <div className="toolbar__divider" />

      <div className="toolbar__info">
        <span className="toolbar__badge">
          {numCols} × {numRows}
        </span>
      </div>

      <div className="toolbar__right">
        <div className="toolbar__legend">
          <span className="legend__item legend__item--error">#ERROR</span>
          <span className="legend__item legend__item--circular">#CIRCULAR</span>
          <span className="legend__item legend__item--ref">#REF</span>
          <span className="legend__item legend__item--div">#DIV/0</span>
        </div>
      </div>
    </div>
  );
}
