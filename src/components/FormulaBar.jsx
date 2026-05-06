/**
 * FormulaBar.jsx
 * Displays the raw formula/value of the currently selected cell.
 */

import React from 'react';

export default function FormulaBar({ selectedCell, cellData, onCommit }) {
  const cell = selectedCell ? cellData[selectedCell] : null;
  const raw  = cell?.raw ?? '';

  const [localVal, setLocalVal] = React.useState(raw);
  const [focused,  setFocused]  = React.useState(false);

  // Sync when selection changes (but not while typing)
  React.useEffect(() => {
    if (!focused) setLocalVal(raw);
  }, [raw, focused]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && selectedCell) {
      e.preventDefault();
      onCommit(selectedCell, localVal);
      setFocused(false);
    } else if (e.key === 'Escape') {
      setLocalVal(raw);
      setFocused(false);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (selectedCell && localVal !== raw) {
      onCommit(selectedCell, localVal);
    }
  };

  return (
    <div className="formula-bar">
      <div className="formula-bar__cell-id">
        {selectedCell || ''}
      </div>
      <div className="formula-bar__fx">fx</div>
      <input
        className="formula-bar__input"
        value={focused ? localVal : raw}
        placeholder={selectedCell ? 'Enter value or formula (e.g. =A1+B2)' : ''}
        disabled={!selectedCell}
        onChange={e => setLocalVal(e.target.value)}
        onFocus={() => { setFocused(true); setLocalVal(raw); }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  );
}
