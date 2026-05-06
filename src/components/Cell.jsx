/**
 * Cell.jsx
 * Individual spreadsheet cell — handles selection, editing, and display.
 */

import React, { useState, useEffect, useRef, memo } from 'react';

const Cell = memo(function Cell({
  cellId,
  cell,
  isSelected,
  onSelect,
  onCommit,
}) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState('');
  const inputRef = useRef(null);

  // When this cell becomes selected via keyboard/click, focus it
  useEffect(() => {
    if (isSelected && editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, editing]);

  const startEdit = () => {
    setDraft(cell?.raw ?? '');
    setEditing(true);
  };

  const handleClick = () => {
    onSelect(cellId);
    if (!editing) startEdit();
  };

  const handleDoubleClick = () => {
    startEdit();
  };

  const commit = () => {
    setEditing(false);
    onCommit(cellId, draft);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setDraft(cell?.raw ?? '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit();
    }
  };

  const handleBlur = () => {
    if (editing) commit();
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
  if (editing)     cellClass += ' cell--editing';

  return (
    <td
      className={cellClass}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-cell-id={cellId}
    >
      {editing && isSelected ? (
        <input
          ref={inputRef}
          className="cell__input"
          value={draft}
          autoFocus
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
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
