/**
 * useFormulaEditor.js
 * Shared editing state for cell input and formula bar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FUNCTION_NAMES } from '../engine/evaluator.js';
import {
  formatRange,
  getTokenAtCaret,
  insertCellRef,
  insertFunction,
  isInsideString,
  replaceSpan,
} from '../utils/formulaEditor.js';

export function useFormulaEditor({ cellData, selectedCell, setSelectedCell, commitCell }) {
  const [editingCellId, setEditingCellId] = useState(null);
  const [value, setValue] = useState('');
  const [activeSource, setActiveSource] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [suggestions, setSuggestions] = useState({
    open: false,
    items: [],
    highlight: 0,
    tokenSpan: null,
    anchor: null,
  });
  const [rangeHighlight, setRangeHighlight] = useState(null);

  const selectionRef = useRef({ start: 0, end: 0 });
  const activeInputRef = useRef(null);
  const originalValueRef = useRef('');
  const suppressBlurRef = useRef(false);
  const valueRef = useRef(value);

  const rangeRef = useRef({
    dragging: false,
    anchor: null,
    last: null,
    span: null,
    rafId: null,
    pending: null,
  });

  const functionNames = useMemo(() => FUNCTION_NAMES, []);

  const isEditing = editingCellId != null;
  const isFormula = value.startsWith('=');

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const getAnchor = useCallback(() => {
    const el = activeInputRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { top: rect.bottom + 4, left: rect.left, width: rect.width };
  }, []);

  const closeSuggestions = useCallback(() => {
    setSuggestions(prev => (prev.open ? { ...prev, open: false, items: [], tokenSpan: null } : prev));
  }, []);

  const openSuggestions = useCallback((items, tokenSpan) => {
    if (!items || items.length === 0) {
      closeSuggestions();
      return;
    }
    setSuggestions({
      open: true,
      items,
      highlight: 0,
      tokenSpan,
      anchor: getAnchor(),
    });
  }, [closeSuggestions, getAnchor]);

  const updateAnchor = useCallback(() => {
    setSuggestions(prev => (prev.open ? { ...prev, anchor: getAnchor() } : prev));
  }, [getAnchor]);

  useEffect(() => {
    if (!suggestions.open) return;
    const handler = () => updateAnchor();
    handler();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [suggestions.open, updateAnchor]);

  const updateSuggestions = useCallback((nextValue, caret) => {
    if (!nextValue.startsWith('=')) {
      closeSuggestions();
      return;
    }
    if (isInsideString(nextValue, caret)) {
      closeSuggestions();
      return;
    }

    const token = getTokenAtCaret(nextValue, caret);
    if (!token) {
      if (nextValue.trim() === '=' || caret <= 1) {
        openSuggestions(functionNames, null);
      } else {
        closeSuggestions();
      }
      return;
    }

    const prefix = token.token.toUpperCase();
    const filtered = functionNames.filter(name => name.startsWith(prefix));
    if (filtered.length === 0) {
      closeSuggestions();
      return;
    }
    openSuggestions(filtered, { start: token.start, end: token.end });
  }, [closeSuggestions, functionNames, openSuggestions]);

  const setActiveInput = useCallback((ref, source) => {
    if (ref) activeInputRef.current = ref;
    if (source) setActiveSource(source);
    if (isEditing && source) {
      const { start, end } = selectionRef.current;
      setPendingSelection({ start, end });
    }
    if (suggestions.open) updateAnchor();
  }, [isEditing, suggestions.open, updateAnchor]);

  const startEditing = useCallback((cellId, source, inputEl) => {
    if (!cellId) return;

    if (isEditing && editingCellId === cellId) {
      setActiveSource(source);
      if (inputEl) activeInputRef.current = inputEl;
      return;
    }

    const raw = cellData[cellId]?.raw ?? '';
    setEditingCellId(cellId);
    setActiveSource(source);
    setValue(raw);
    originalValueRef.current = raw;
    if (inputEl) activeInputRef.current = inputEl;

    selectionRef.current = { start: raw.length, end: raw.length };
    setPendingSelection({ start: raw.length, end: raw.length });
    setSelectedCell(cellId);
    closeSuggestions();
  }, [cellData, closeSuggestions, editingCellId, isEditing, setSelectedCell]);

  const updateValue = useCallback((nextValue, selStart, selEnd) => {
    setValue(nextValue);
    if (typeof selStart === 'number') {
      selectionRef.current = { start: selStart, end: selEnd ?? selStart };
    }
    const caret = typeof selStart === 'number' ? selStart : selectionRef.current.end;
    updateSuggestions(nextValue, caret);
  }, [updateSuggestions]);

  const updateSelection = useCallback((selStart, selEnd) => {
    if (typeof selStart !== 'number') return;
    selectionRef.current = { start: selStart, end: selEnd ?? selStart };
    updateSuggestions(valueRef.current, selStart);
  }, [updateSuggestions]);

  const commitEditing = useCallback(() => {
    if (!editingCellId) return;
    if (valueRef.current === originalValueRef.current) {
      setEditingCellId(null);
      setActiveSource(null);
      setSelectedCell(editingCellId);
      closeSuggestions();
      setRangeHighlight(null);
      return;
    }
    commitCell(editingCellId, valueRef.current);
    setEditingCellId(null);
    setActiveSource(null);
    setSelectedCell(editingCellId);
    closeSuggestions();
    setRangeHighlight(null);
  }, [closeSuggestions, commitCell, editingCellId, setRangeHighlight, setSelectedCell]);

  const cancelEditing = useCallback(() => {
    if (!editingCellId) return;
    setValue(originalValueRef.current);
    setEditingCellId(null);
    setActiveSource(null);
    setSelectedCell(editingCellId);
    closeSuggestions();
    setRangeHighlight(null);
  }, [closeSuggestions, editingCellId, setRangeHighlight, setSelectedCell]);

  const focusActiveInput = useCallback(() => {
    if (activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, []);

  const applySuggestion = useCallback((index) => {
    const name = suggestions.items[index];
    if (!name) return;
    const span = suggestions.tokenSpan || selectionRef.current;
    const res = insertFunction(valueRef.current, span.start, span.end, name);
    setValue(res.text);
    selectionRef.current = { start: res.caret, end: res.caret };
    setPendingSelection({ start: res.caret, end: res.caret });
    closeSuggestions();
    focusActiveInput();
  }, [closeSuggestions, focusActiveInput, suggestions.items, suggestions.tokenSpan]);

  const setSuggestionHighlight = useCallback((index) => {
    setSuggestions(prev => (prev.open ? { ...prev, highlight: index } : prev));
  }, []);

  const handleKeyDown = useCallback((e, options = {}) => {
    const { commitOnEnter = true, commitOnTab = false } = options;

    if (suggestions.open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestions(prev => ({
          ...prev,
          highlight: (prev.highlight + 1) % prev.items.length,
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestions(prev => ({
          ...prev,
          highlight: (prev.highlight - 1 + prev.items.length) % prev.items.length,
        }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions.highlight);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSuggestions();
        return;
      }
    }

    if (e.key === 'Enter' && commitOnEnter) {
      e.preventDefault();
      commitEditing();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
      return;
    }
    if (e.key === 'Tab' && commitOnTab) {
      e.preventDefault();
      commitEditing();
    }
  }, [applySuggestion, cancelEditing, closeSuggestions, commitEditing, suggestions]);

  const handleBlur = useCallback(() => {
    if (suppressBlurRef.current) return;
    commitEditing();
  }, [commitEditing]);

  const suppressBlur = useCallback(() => {
    suppressBlurRef.current = true;
    requestAnimationFrame(() => {
      suppressBlurRef.current = false;
    });
  }, []);

  const insertCellReference = useCallback((cellId) => {
    if (!isEditing || !isFormula) return false;
    const { start, end } = selectionRef.current;
    const res = insertCellRef(valueRef.current, start, end, cellId);
    setValue(res.text);
    selectionRef.current = { start: res.caret, end: res.caret };
    setPendingSelection({ start: res.caret, end: res.caret });
    closeSuggestions();
    focusActiveInput();
    return true;
  }, [closeSuggestions, focusActiveInput, isEditing, isFormula]);

  const startRangeSelection = useCallback((cellId) => {
    if (!isEditing || !isFormula) return false;
    const { start, end } = selectionRef.current;
    const res = insertCellRef(valueRef.current, start, end, cellId);
    setValue(res.text);

    setRangeHighlight({ start: cellId, end: cellId, active: true });

    rangeRef.current = {
      dragging: true,
      anchor: cellId,
      last: cellId,
      span: { start: res.caret - cellId.length, end: res.caret },
      rafId: null,
      pending: null,
    };

    selectionRef.current = { start: res.caret, end: res.caret };
    setPendingSelection({ start: res.caret, end: res.caret });
    closeSuggestions();
    focusActiveInput();
    return true;
  }, [closeSuggestions, focusActiveInput, isEditing, isFormula]);

  const applyRangeUpdate = useCallback((nextId) => {
    if (!nextId) return;
    rangeRef.current.last = nextId;
    const rangeText = formatRange(rangeRef.current.anchor, nextId);
    const res = replaceSpan(valueRef.current, rangeRef.current.span, rangeText);
    rangeRef.current.span = res.span;

    setRangeHighlight({ start: rangeRef.current.anchor, end: nextId, active: true });
    setValue(res.text);
    selectionRef.current = { start: res.span.end, end: res.span.end };
    setPendingSelection({ start: res.span.end, end: res.span.end });
  }, []);

  const updateRangeSelection = useCallback((cellId) => {
    if (!rangeRef.current.dragging) return;
    if (cellId === rangeRef.current.last) return;

    rangeRef.current.pending = cellId;
    if (rangeRef.current.rafId) return;

    rangeRef.current.rafId = requestAnimationFrame(() => {
      const nextId = rangeRef.current.pending;
      rangeRef.current.pending = null;
      rangeRef.current.rafId = null;
      if (!nextId) return;

      applyRangeUpdate(nextId);
    });
  }, [applyRangeUpdate]);

  const stopRangeSelection = useCallback(() => {
    if (!rangeRef.current.dragging) return;
    if (rangeRef.current.pending) {
      applyRangeUpdate(rangeRef.current.pending);
    }
    rangeRef.current.dragging = false;
    rangeRef.current.pending = null;
    if (rangeRef.current.rafId) {
      cancelAnimationFrame(rangeRef.current.rafId);
      rangeRef.current.rafId = null;
    }
    setRangeHighlight(null);
  }, [applyRangeUpdate]);

  useEffect(() => {
    const onMouseUp = () => stopRangeSelection();
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseleave', onMouseUp);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseleave', onMouseUp);
    };
  }, [stopRangeSelection]);

  const handleCellPointerDown = useCallback((e, cellId) => {
    if (!isEditing || !isFormula) return false;
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    suppressBlur();
    setSelectedCell(cellId);
    return startRangeSelection(cellId);
  }, [isEditing, isFormula, setSelectedCell, startRangeSelection, suppressBlur]);

  const handleCellPointerEnter = useCallback((cellId) => {
    if (!rangeRef.current.dragging) return;
    setSelectedCell(cellId);
    updateRangeSelection(cellId);
  }, [setSelectedCell, updateRangeSelection]);

  const clearPendingSelection = useCallback(() => {
    if (pendingSelection) setPendingSelection(null);
  }, [pendingSelection]);

  const displayCellId = editingCellId || selectedCell;

  return {
    editingCellId,
    displayCellId,
    value,
    isEditing,
    isFormula,
    activeSource,
    pendingSelection,
    suggestions,
    rangeHighlight,
    setActiveInput,
    startEditing,
    updateValue,
    updateSelection,
    commitEditing,
    cancelEditing,
    handleKeyDown,
    handleBlur,
    applySuggestion,
    setSuggestionHighlight,
    suppressBlur,
    insertCellReference,
    handleCellPointerDown,
    handleCellPointerEnter,
    stopRangeSelection,
    clearPendingSelection,
  };
}
