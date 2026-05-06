/**
 * Grid.jsx
 * Renders the full spreadsheet grid table.
 */

import React from 'react';
import Cell from './Cell.jsx';
import { buildCellAddress } from '../utils/cellUtils.js';

export default function Grid({
  cellData,
  numCols,
  numRows,
  colLabels,
  rowLabels,
  selectedCell,
  onSelectCell,
  onCommitCell,
}) {
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
                  return (
                    <Cell
                      key={cellId}
                      cellId={cellId}
                      cell={cellData[cellId]}
                      isSelected={selectedCell === cellId}
                      onSelect={onSelectCell}
                      onCommit={onCommitCell}
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
