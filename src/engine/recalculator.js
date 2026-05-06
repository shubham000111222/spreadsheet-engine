/**
 * recalculator.js
 * Orchestrates cell recalculation after a change.
 * 
 * Given a changed cell, finds all downstream dependents (in topological order)
 * and re-evaluates them against updated cellData.
 */

import { getRecalcOrder } from './dependencyGraph.js';
import { evaluateCell } from './evaluator.js';

/**
 * Recalculate all cells affected by a change to `changedCell`.
 * Mutates and returns a new cellData object.
 *
 * @param {string} changedCell - The cell that changed
 * @param {object} cellData    - Current cell data map (will NOT be mutated)
 * @param {object} graph       - { dependents, dependencies }
 * @param {number} numCols
 * @param {number} numRows
 * @returns {object} newCellData - Updated cell data map
 */
export function recalculate(changedCell, cellData, graph, numCols, numRows) {
  const order = getRecalcOrder(changedCell, graph);
  
  // Shallow-clone so we can mutate
  let newData = { ...cellData };

  for (const cellId of order) {
    const cell = newData[cellId];
    if (!cell || !cell.raw) continue;
    
    const { value, error } = evaluateCell(cell.raw, newData, numCols, numRows);
    newData[cellId] = { ...cell, value, error };
  }

  return newData;
}
