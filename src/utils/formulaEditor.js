/**
 * formulaEditor.js
 * Helpers for inline formula editing and insertion.
 */

import { parseCellAddress, buildCellAddress } from './cellUtils.js';

export function isInsideString(text, caret) {
  const before = text.slice(0, caret);
  const quotes = (before.match(/"/g) || []).length;
  return quotes % 2 === 1;
}

export function getTokenAtCaret(text, caret) {
  const before = text.slice(0, caret);
  const match = before.match(/([A-Za-z]+)$/);
  if (!match) return null;
  const token = match[1];
  return { token, start: caret - token.length, end: caret };
}

export function insertAtCaret(text, start, end, insertText, caretPos) {
  const next = text.slice(0, start) + insertText + text.slice(end);
  const caret = typeof caretPos === 'number' ? caretPos : start + insertText.length;
  return { text: next, caret };
}

export function insertFunction(text, start, end, fnName) {
  const insertText = `${fnName}()`;
  const caret = start + fnName.length + 1; // inside parentheses
  return insertAtCaret(text, start, end, insertText, caret);
}

export function insertCellRef(text, start, end, cellId) {
  return insertAtCaret(text, start, end, cellId, start + cellId.length);
}

export function replaceSpan(text, span, nextText) {
  const next = text.slice(0, span.start) + nextText + text.slice(span.end);
  return { text: next, span: { start: span.start, end: span.start + nextText.length } };
}

export function formatRange(startId, endId) {
  if (!startId || !endId) return '';
  if (startId === endId) return startId;
  const start = parseCellAddress(startId);
  const end = parseCellAddress(endId);
  if (!start || !end) return startId;
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const a = buildCellAddress(minCol, minRow);
  const b = buildCellAddress(maxCol, maxRow);
  return `${a}:${b}`;
}
