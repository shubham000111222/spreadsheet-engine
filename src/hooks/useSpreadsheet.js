/**
 * useSpreadsheet.js
 * Main hook managing all grid state, formula evaluation, dependency tracking,
 * undo/redo history, and dynamic grid sizing.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { parseFormula, collectRefs } from '../engine/parser.js';
import { evaluateCell } from '../engine/evaluator.js';
import { createGraph, updateDeps, detectCycle, getRecalcOrder } from '../engine/dependencyGraph.js';
import { buildCellAddress, colIndexToLetter } from '../utils/cellUtils.js';

const INITIAL_COLS = 10;
const INITIAL_ROWS = 10;
const MAX_COLS = 26;
const MAX_ROWS = 50;
const MAX_HISTORY = 50;

const ERR_CIRCULAR = '#CIRCULAR';

/**
 * Build an empty cellData map for a given grid size.
 */
function buildEmptyCellData(numCols, numRows) {
  const data = {};
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const id = buildCellAddress(c, r);
      data[id] = { raw: '', value: '', error: null };
    }
  }
  return data;
}

/**
 * Extract dependency refs from a raw formula string.
 * Returns a Set of cell IDs, expanding range nodes (A1:C3) to all included cells.
 * numCols/numRows are optional — if omitted, only endpoints are registered.
 */
function extractDeps(raw, numCols = 26, numRows = 50) {
  if (!raw || !raw.startsWith('=')) return new Set();
  try {
    const ast = parseFormula(raw.slice(1));
    const refs = collectRefs(ast); // gets CellRefs + range endpoints

    // Also walk the AST to expand Range nodes fully
    function walkForRanges(node) {
      if (!node) return;
      if (node.type === 'Range') {
        try {
          const { parseCellAddress, buildCellAddress } = window.__cellUtils || {};
          // Inline expansion to avoid circular import issues
          const expandRange = (s, e) => {
            const sa = parseAddr(s), ea = parseAddr(e);
            if (!sa || !ea) return;
            for (let r = Math.min(sa.row, ea.row); r <= Math.max(sa.row, ea.row); r++) {
              for (let c = Math.min(sa.col, ea.col); c <= Math.max(sa.col, ea.col); c++) {
                if (c < numCols && r < numRows) {
                  refs.add(`${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[c]}${r + 1}`);
                }
              }
            }
          };
          expandRange(node.start, node.end);
        } catch { /* ignore */ }
        return;
      }
      if (node.left)    walkForRanges(node.left);
      if (node.right)   walkForRanges(node.right);
      if (node.operand) walkForRanges(node.operand);
      if (node.args)    node.args.forEach(walkForRanges);
    }

    // Simple inline address parser
    function parseAddr(addr) {
      const m = addr.match(/^([A-Z]+)(\d+)$/);
      if (!m) return null;
      const col = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(m[1]);
      const row = parseInt(m[2], 10) - 1;
      return col === -1 ? null : { col, row };
    }

    walkForRanges(ast);
    return refs;
  } catch {
    return new Set();
  }
}

export function useSpreadsheet() {
  const [numCols, setNumCols] = useState(INITIAL_COLS);
  const [numRows, setNumRows] = useState(INITIAL_ROWS);
  const [cellData, setCellData] = useState(() => buildEmptyCellData(INITIAL_COLS, INITIAL_ROWS));
  const [selectedCell, setSelectedCell] = useState(null);

  // Undo/Redo stacks hold { cellData, numCols, numRows } snapshots
  const [history, setHistory]     = useState([]);
  const [future,  setFuture]      = useState([]);

  // Graph is kept in a ref — it's mutable and doesn't need to trigger renders
  const graphRef = useRef(createGraph());

  // ── Snapshot helper ──────────────────────────────────────────────────────
  const snapshot = useCallback((data, cols, rows) => ({
    cellData: JSON.parse(JSON.stringify(data)), // deep clone
    numCols: cols,
    numRows: rows,
  }), []);

  // ── Push history ─────────────────────────────────────────────────────────
  const pushHistory = useCallback((prevData, prevCols, prevRows) => {
    setHistory(h => {
      const next = [...h, snapshot(prevData, prevCols, prevRows)];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setFuture([]);
  }, [snapshot]);

  // ── Core: update a single cell ───────────────────────────────────────────
  const updateCell = useCallback((cellId, raw, prevData, prevCols, prevRows) => {
    const graph = graphRef.current;
    const newDeps = extractDeps(raw);

    // Cycle detection
    if (detectCycle(cellId, newDeps, graph)) {
      // Mark this cell and all cells in the cycle as #CIRCULAR
      const newData = { ...prevData };
      // Update dependencies so cycle is registered
      updateDeps(cellId, newDeps, graph);
      newData[cellId] = { raw, value: ERR_CIRCULAR, error: ERR_CIRCULAR };

      // Also mark all cells that transitively depend on cellId as circular
      const order = getRecalcOrder(cellId, graph);
      for (const dep of order) {
        if (newData[dep]) {
          newData[dep] = { ...newData[dep], value: ERR_CIRCULAR, error: ERR_CIRCULAR };
        }
      }
      return newData;
    }

    // Update dependency graph
    updateDeps(cellId, newDeps, graph);

    // Evaluate changed cell
    let newData = { ...prevData };
    const { value, error } = evaluateCell(raw, newData, prevCols, prevRows);
    newData[cellId] = { raw, value, error };

    // Recalculate dependents in topological BFS order
    const order = getRecalcOrder(cellId, graph);
    for (const dep of order) {
      const depCell = newData[dep];
      if (!depCell || depCell.raw == null) continue;
      const res = evaluateCell(depCell.raw, newData, prevCols, prevRows);
      newData[dep] = { ...depCell, value: res.value, error: res.error };
    }

    return newData;
  }, []);

  // ── Public: commit a cell edit ───────────────────────────────────────────
  const commitCell = useCallback((cellId, raw) => {
    setCellData(prev => {
      pushHistory(prev, numCols, numRows);
      return updateCell(cellId, raw, prev, numCols, numRows);
    });
  }, [numCols, numRows, pushHistory, updateCell]);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      const rest = h.slice(0, -1);

      setFuture(f => [snapshot(cellData, numCols, numRows), ...f].slice(0, MAX_HISTORY));
      setCellData(prev.cellData);
      setNumCols(prev.numCols);
      setNumRows(prev.numRows);

      // Rebuild graph from restored state
      const graph = createGraph();
      for (const [id, cell] of Object.entries(prev.cellData)) {
        const deps = extractDeps(cell.raw);
        updateDeps(id, deps, graph);
      }
      graphRef.current = graph;

      return rest;
    });
  }, [cellData, numCols, numRows, snapshot]);

  // ── Redo ─────────────────────────────────────────────────────────────────
  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      const rest = f.slice(1);

      setHistory(h => [...h, snapshot(cellData, numCols, numRows)].slice(-MAX_HISTORY));
      setCellData(next.cellData);
      setNumCols(next.numCols);
      setNumRows(next.numRows);

      // Rebuild graph
      const graph = createGraph();
      for (const [id, cell] of Object.entries(next.cellData)) {
        const deps = extractDeps(cell.raw);
        updateDeps(id, deps, graph);
      }
      graphRef.current = graph;

      return rest;
    });
  }, [cellData, numCols, numRows, snapshot]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Dynamic grid size ────────────────────────────────────────────────────
  const addColumn = useCallback(() => {
    if (numCols >= MAX_COLS) return;
    pushHistory(cellData, numCols, numRows);
    const newCols = numCols + 1;
    setCellData(prev => {
      const next = { ...prev };
      for (let r = 0; r < numRows; r++) {
        const id = buildCellAddress(numCols, r); // new col index
        next[id] = { raw: '', value: '', error: null };
      }
      return next;
    });
    setNumCols(newCols);
  }, [numCols, numRows, cellData, pushHistory]);

  const removeColumn = useCallback(() => {
    if (numCols <= 1) return;
    pushHistory(cellData, numCols, numRows);
    const newCols = numCols - 1;
    setCellData(prev => {
      const next = { ...prev };
      for (let r = 0; r < numRows; r++) {
        const id = buildCellAddress(newCols, r);
        delete next[id];
      }
      return next;
    });
    setNumCols(newCols);
    // Clean up graph
    const graph = graphRef.current;
    for (let r = 0; r < numRows; r++) {
      const id = buildCellAddress(newCols, r);
      updateDeps(id, new Set(), graph);
    }
  }, [numCols, numRows, cellData, pushHistory]);

  const addRow = useCallback(() => {
    if (numRows >= MAX_ROWS) return;
    pushHistory(cellData, numCols, numRows);
    const newRows = numRows + 1;
    setCellData(prev => {
      const next = { ...prev };
      for (let c = 0; c < numCols; c++) {
        const id = buildCellAddress(c, numRows);
        next[id] = { raw: '', value: '', error: null };
      }
      return next;
    });
    setNumRows(newRows);
  }, [numCols, numRows, cellData, pushHistory]);

  const removeRow = useCallback(() => {
    if (numRows <= 1) return;
    pushHistory(cellData, numCols, numRows);
    const newRows = numRows - 1;
    setCellData(prev => {
      const next = { ...prev };
      for (let c = 0; c < numCols; c++) {
        const id = buildCellAddress(c, newRows);
        delete next[id];
      }
      return next;
    });
    setNumRows(newRows);
    const graph = graphRef.current;
    for (let c = 0; c < numCols; c++) {
      const id = buildCellAddress(c, newRows);
      updateDeps(id, new Set(), graph);
    }
  }, [numCols, numRows, cellData, pushHistory]);

  // ── Column labels ────────────────────────────────────────────────────────
  const colLabels = Array.from({ length: numCols }, (_, i) => colIndexToLetter(i));
  const rowLabels = Array.from({ length: numRows }, (_, i) => i + 1);

  return {
    cellData,
    numCols,
    numRows,
    colLabels,
    rowLabels,
    selectedCell,
    setSelectedCell,
    commitCell,
    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    addColumn,
    removeColumn,
    addRow,
    removeRow,
    maxCols: MAX_COLS,
    maxRows: MAX_ROWS,
  };
}
