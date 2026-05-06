/**
 * cellUtils.js
 * Utility helpers for cell address parsing and validation.
 */

const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Convert a column index (0-based) to a letter: 0→'A', 25→'Z'
 */
export function colIndexToLetter(index) {
  return COL_LETTERS[index] || '';
}

/**
 * Convert a column letter to a 0-based index: 'A'→0, 'Z'→25
 */
export function colLetterToIndex(letter) {
  return COL_LETTERS.indexOf(letter.toUpperCase());
}

/**
 * Parse a cell address like "A1" into { col: 0, row: 0 } (both 0-based).
 * Returns null if invalid.
 */
export function parseCellAddress(addr) {
  const match = addr.trim().match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const col = colLetterToIndex(match[1].toUpperCase());
  const row = parseInt(match[2], 10) - 1; // 0-based
  if (col === -1) return null;
  return { col, row };
}

/**
 * Build a cell address string from 0-based col and row indices.
 */
export function buildCellAddress(col, row) {
  return `${colIndexToLetter(col)}${row + 1}`;
}

/**
 * Check if a cell address is within bounds given numCols and numRows.
 */
export function isInBounds(addr, numCols, numRows) {
  const parsed = parseCellAddress(addr);
  if (!parsed) return false;
  return parsed.col >= 0 && parsed.col < numCols && parsed.row >= 0 && parsed.row < numRows;
}

/**
 * Extract all cell references from a formula string.
 * Returns an array of uppercase cell address strings.
 */
export function extractCellRefs(formula) {
  const refs = [];
  const regex = /\b([A-Z]+)(\d+)\b/gi;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    refs.push(match[0].toUpperCase());
  }
  return refs;
}
