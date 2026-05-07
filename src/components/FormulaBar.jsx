/**
 * FormulaBar.jsx
 * Displays the raw formula/value of the currently selected cell.
 */

import React, { useEffect, useRef } from 'react';

export default function FormulaBar({ cellData, editor }) {
  const inputRef = useRef(null);
  const displayCellId = editor.displayCellId;
  const cell = displayCellId ? cellData[displayCellId] : null;
  const raw = cell?.raw ?? '';
  const value = editor.isEditing ? editor.value : raw;
  const { pendingSelection, activeSource, clearPendingSelection } = editor;

  useEffect(() => {
    if (!pendingSelection) return;
    if (activeSource !== 'formula') return;
    if (!inputRef.current) return;
    inputRef.current.setSelectionRange(pendingSelection.start, pendingSelection.end);
    clearPendingSelection();
  }, [activeSource, clearPendingSelection, pendingSelection]);

  const handleFocus = () => {
    if (!displayCellId) return;
    editor.suppressBlur();
    editor.startEditing(displayCellId, 'formula', inputRef.current);
    editor.setActiveInput(inputRef.current, 'formula');
  };

  const handleChange = (e) => {
    if (!displayCellId) return;
    if (!editor.isEditing) {
      editor.startEditing(displayCellId, 'formula', inputRef.current);
    }
    editor.updateValue(e.target.value, e.target.selectionStart, e.target.selectionEnd);
  };

  const handleKeyDown = (e) => {
    editor.handleKeyDown(e, { commitOnEnter: true, commitOnTab: false });
  };

  const handleBlur = () => {
    if (editor.activeSource === 'formula') editor.handleBlur();
  };

  const handleSelect = (e) => {
    editor.updateSelection(e.target.selectionStart, e.target.selectionEnd);
  };

  return (
    <div className="formula-bar">
      <div className="formula-bar__cell-id">
        {displayCellId || ''}
      </div>
      <div className="formula-bar__fx">fx</div>
      <input
        ref={inputRef}
        className="formula-bar__input"
        value={value}
        placeholder={displayCellId ? 'Enter value or formula (e.g. =A1+B2)' : ''}
        disabled={!displayCellId}
        onChange={handleChange}
        onMouseDown={() => editor.suppressBlur()}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onKeyUp={handleSelect}
        spellCheck={false}
      />
    </div>
  );
}
