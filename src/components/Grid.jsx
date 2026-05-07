/**
 * Grid.jsx
 * Renders the full spreadsheet grid table.
 */

import React from 'react';
import Cell from './Cell.jsx';
import { buildCellAddress, parseCellAddress } from '../utils/cellUtils.js';

export default function Grid({
  cellData,
  numCols,
  numRows,
  colLabels,
  rowLabels,
  selectedCell,
  onSelectCell,
  editor,
}) {
  const rangeHighlight = editor?.rangeHighlight;
  const rangeBounds = React.useMemo(() => {
    const range = rangeHighlight;
    if (!range || !range.active) return null;
    const start = parseCellAddress(range.start);
    const end = parseCellAddress(range.end);
    if (!start || !end) return null;
    return {
      minCol: Math.min(start.col, end.col),
      maxCol: Math.max(start.col, end.col),
      minRow: Math.min(start.row, end.row),
      maxRow: Math.max(start.row, end.row),
      anchor: range.start,
    };
  }, [rangeHighlight]);
  return (
    <div className="grid-wrapper">
      <div className="grid-scroll">
        <table className="grid-table" role="grid" aria-label="Spreadsheet">
          <thead>
            <tr>
              {/* Corner cell */}
              <th className="header-cell header-cell--corner" aria-hidden="true" />
              {colLabels.map(col => (
                <th key={col} className="header-cell header-cell--col" scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowNum, rowIdx) => (
              <tr key={rowNum}>
                <th className="header-cell header-cell--row" scope="row">
                  {rowNum}
                </th>
                {colLabels.map((col, colIdx) => {
                  const cellId = buildCellAddress(colIdx, rowIdx);
                  const isInRange = !!rangeBounds
                    && colIdx >= rangeBounds.minCol
                    && colIdx <= rangeBounds.maxCol
                    && rowIdx >= rangeBounds.minRow
                    && rowIdx <= rangeBounds.maxRow;
                  const isRangeAnchor = !!rangeBounds && rangeBounds.anchor === cellId;
                  return (
                    <Cell
                      key={cellId}
                      cellId={cellId}
                      cell={cellData[cellId]}
                      isSelected={selectedCell === cellId}
                      isInRange={isInRange}
                      isRangeAnchor={isRangeAnchor}
                      onSelect={onSelectCell}
                      editor={editor}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
