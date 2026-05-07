/**
 * Cell.jsx
 * Individual spreadsheet cell — handles selection, editing, and display.
 */

import React, { useEffect, useRef, memo } from 'react';

const Cell = memo(function Cell({
  cellId,
  cell,
  isSelected,
  isInRange,
  isRangeAnchor,
  onSelect,
  editor,
}) {
  const inputRef = useRef(null);

  const isActiveEdit = editor.isEditing && editor.editingCellId === cellId;
  const { pendingSelection, clearPendingSelection } = editor;

  useEffect(() => {
    if (!isActiveEdit) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActiveEdit]);

  useEffect(() => {
    if (!isActiveEdit) return;
    if (!pendingSelection) return;
    if (!inputRef.current) return;
    inputRef.current.setSelectionRange(pendingSelection.start, pendingSelection.end);
    clearPendingSelection();
  }, [clearPendingSelection, isActiveEdit, pendingSelection]);

  const handleMouseDown = (e) => {
    editor.suppressBlur();
    if (editor.isEditing && editor.isFormula) {
      editor.handleCellPointerDown(e, cellId);
      return;
    }
    if (editor.isEditing && editor.editingCellId && editor.editingCellId !== cellId) {
      editor.commitEditing();
    }
    onSelect(cellId);
    editor.startEditing(cellId, 'cell', inputRef.current);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        editor.setActiveInput(inputRef.current, 'cell');
      }
    });
  };

  const handleMouseEnter = () => {
    if (editor.isEditing && editor.isFormula) {
      editor.handleCellPointerEnter(cellId);
    }
  };

  const handleDoubleClick = () => {
    if (editor.isEditing && editor.editingCellId && editor.editingCellId !== cellId) {
      editor.commitEditing();
    }
    onSelect(cellId);
    editor.startEditing(cellId, 'cell', inputRef.current);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        editor.setActiveInput(inputRef.current, 'cell');
      }
    });
  };

  // Determine display value
  const displayValue = cell?.error ? cell.error : (cell?.value ?? '');

  const hasError = !!cell?.error;
  const isCircular = cell?.error === '#CIRCULAR';
  const isRef = cell?.error === '#REF';

  let cellClass = 'cell';
  if (isSelected)  cellClass += ' cell--selected';
  if (hasError)    cellClass += ' cell--error';
  if (isCircular)  cellClass += ' cell--circular';
  if (isActiveEdit)     cellClass += ' cell--editing';
  if (isInRange)   cellClass += ' cell--range';
  if (isRangeAnchor) cellClass += ' cell--range-anchor';

  return (
    <td
      className={cellClass}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onDoubleClick={handleDoubleClick}
      data-cell-id={cellId}
    >
      {isActiveEdit ? (
        <input
          ref={inputRef}
          className="cell__input"
          value={editor.value}
          autoFocus
          onChange={e => editor.updateValue(e.target.value, e.target.selectionStart, e.target.selectionEnd)}
          onKeyDown={e => editor.handleKeyDown(e, { commitOnEnter: true, commitOnTab: true })}
          onBlur={() => { if (editor.activeSource === 'cell') editor.handleBlur(); }}
          onFocus={() => editor.setActiveInput(inputRef.current, 'cell')}
          onSelect={e => editor.updateSelection(e.target.selectionStart, e.target.selectionEnd)}
          onKeyUp={e => editor.updateSelection(e.target.selectionStart, e.target.selectionEnd)}
          spellCheck={false}
        />
      ) : (
        <span className="cell__display" title={hasError ? cell.error : cell?.raw}>
          {displayValue === '' ? '\u00A0' : String(displayValue)}
        </span>
      )}
    </td>
  );
});

export default Cell;
