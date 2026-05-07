/**
 * evaluator.js
 * Evaluates a parsed AST against the current cellData map.
 *
 * Supports:
 *  - Basic arithmetic: +, -, *, /
 *  - Cell references and ranges
 *  - Built-in functions: SUM, AVERAGE, AVG, MIN, MAX, COUNT, COUNTA,
 *    ABS, ROUND, ROUNDUP, ROUNDDOWN, SQRT, POWER, POW,
 *    IF, AND, OR, NOT,
 *    MOD, CEILING, FLOOR, INT, SIGN,
 *    LOG, LOG10, LN, EXP,
 *    CONCAT, LEN, UPPER, LOWER, TRIM,
 *    PI, RAND
 */

import { parseFormula } from './parser.js';
import { parseCellAddress, buildCellAddress, colLetterToIndex, colIndexToLetter } from '../utils/cellUtils.js';

// ─── Error codes ─────────────────────────────────────────────────────────────

const ERR_REF      = '#REF';
const ERR_DIV0     = '#DIV/0';
const ERR_CIRCULAR = '#CIRCULAR';
const ERR_ERROR    = '#ERROR';
const ERR_NAME     = '#NAME?';
const ERR_VALUE    = '#VALUE!';
const ERR_NA       = '#N/A';

function mkErr(code, msg) { throw { code, message: msg }; }

// ─── Range expansion ─────────────────────────────────────────────────────────

/**
 * Expand a range (e.g. "A1:C3") into a list of cell IDs.
 */
function expandRange(startRef, endRef, numCols, numRows) {
  const start = parseCellAddress(startRef);
  const end   = parseCellAddress(endRef);
  if (!start || !end) mkErr(ERR_REF, `Invalid range: ${startRef}:${endRef}`);

  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const cells = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (c < numCols && r < numRows) {
        cells.push(buildCellAddress(c, r));
      } else {
        mkErr(ERR_REF, `Range cell out of bounds`);
      }
    }
  }
  return cells;
}

/**
 * Resolve a range or expression arg into a flat array of numeric values.
 * Skips empty cells (treats them as 0 for numeric funcs).
 */
function resolveArgToValues(argNode, cellData, numCols, numRows, options = {}) {
  const { includeText = false, includeEmpty = false } = options;

  if (argNode.type === 'Range') {
    const ids = expandRange(argNode.start, argNode.end, numCols, numRows);
    const values = [];
    for (const id of ids) {
      const cell = cellData[id];
      if (!cell || cell.raw === '' || cell.raw == null) {
        if (includeEmpty) values.push(null);
        continue;
      }
      if (cell.error) mkErr(cell.error, `Error from ${id}`);
      const v = cell.value;
      if (typeof v === 'number') values.push(v);
      else if (includeText) values.push(v);
    }
    return values;
  }

  // Single expression
  const v = evalNode(argNode, cellData, numCols, numRows);
  return [v];
}

// ─── Built-in functions ───────────────────────────────────────────────────────

const FUNCTIONS = {
  // ── Aggregation ─────────────────────────────────────────────────────────
  SUM(args, cellData, numCols, numRows) {
    const values = args.flatMap(a => resolveArgToValues(a, cellData, numCols, numRows));
    return values.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
  },

  AVERAGE(args, cellData, numCols, numRows) {
    const values = args.flatMap(a => resolveArgToValues(a, cellData, numCols, numRows))
                       .filter(v => typeof v === 'number');
    if (values.length === 0) mkErr(ERR_DIV0, 'AVERAGE of empty set');
    return values.reduce((a, b) => a + b, 0) / values.length;
  },

  AVG(args, cellData, numCols, numRows) {
    return FUNCTIONS.AVERAGE(args, cellData, numCols, numRows);
  },

  MIN(args, cellData, numCols, numRows) {
    const values = args.flatMap(a => resolveArgToValues(a, cellData, numCols, numRows))
                       .filter(v => typeof v === 'number');
    if (values.length === 0) mkErr(ERR_NA, 'MIN of empty set');
    return Math.min(...values);
  },

  MAX(args, cellData, numCols, numRows) {
    const values = args.flatMap(a => resolveArgToValues(a, cellData, numCols, numRows))
                       .filter(v => typeof v === 'number');
    if (values.length === 0) mkErr(ERR_NA, 'MAX of empty set');
    return Math.max(...values);
  },

  COUNT(args, cellData, numCols, numRows) {
    const values = args.flatMap(a => resolveArgToValues(a, cellData, numCols, numRows));
    return values.filter(v => typeof v === 'number').length;
  },

  COUNTA(args, cellData, numCols, numRows) {
    const values = args.flatMap(a => resolveArgToValues(a, cellData, numCols, numRows, { includeText: true }));
    return values.filter(v => v !== null && v !== '').length;
  },

  // ── Math ────────────────────────────────────────────────────────────────
  ABS(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'ABS requires 1 argument');
    return Math.abs(evalNode(args[0], cellData, numCols, numRows));
  },

  ROUND(args, cellData, numCols, numRows) {
    if (args.length < 1) mkErr(ERR_ERROR, 'ROUND requires at least 1 argument');
    const val    = evalNode(args[0], cellData, numCols, numRows);
    const digits = args.length > 1 ? evalNode(args[1], cellData, numCols, numRows) : 0;
    return parseFloat(val.toFixed(Math.max(0, Math.round(digits))));
  },

  ROUNDUP(args, cellData, numCols, numRows) {
    if (args.length < 1) mkErr(ERR_ERROR, 'ROUNDUP requires at least 1 argument');
    const val    = evalNode(args[0], cellData, numCols, numRows);
    const digits = args.length > 1 ? evalNode(args[1], cellData, numCols, numRows) : 0;
    const factor = Math.pow(10, digits);
    return Math.ceil(val * factor) / factor;
  },

  ROUNDDOWN(args, cellData, numCols, numRows) {
    if (args.length < 1) mkErr(ERR_ERROR, 'ROUNDDOWN requires at least 1 argument');
    const val    = evalNode(args[0], cellData, numCols, numRows);
    const digits = args.length > 1 ? evalNode(args[1], cellData, numCols, numRows) : 0;
    const factor = Math.pow(10, digits);
    return Math.floor(val * factor) / factor;
  },

  SQRT(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'SQRT requires 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    if (v < 0) mkErr(ERR_VALUE, 'SQRT of negative number');
    return Math.sqrt(v);
  },

  POWER(args, cellData, numCols, numRows) {
    if (args.length !== 2) mkErr(ERR_ERROR, 'POWER requires 2 arguments');
    return Math.pow(evalNode(args[0], cellData, numCols, numRows),
                    evalNode(args[1], cellData, numCols, numRows));
  },

  POW(args, cellData, numCols, numRows) {
    return FUNCTIONS.POWER(args, cellData, numCols, numRows);
  },

  MOD(args, cellData, numCols, numRows) {
    if (args.length !== 2) mkErr(ERR_ERROR, 'MOD requires 2 arguments');
    const a = evalNode(args[0], cellData, numCols, numRows);
    const b = evalNode(args[1], cellData, numCols, numRows);
    if (b === 0) mkErr(ERR_DIV0, 'MOD by zero');
    return ((a % b) + b) % b; // always positive
  },

  CEILING(args, cellData, numCols, numRows) {
    if (args.length < 1) mkErr(ERR_ERROR, 'CEILING requires at least 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    const sig = args.length > 1 ? evalNode(args[1], cellData, numCols, numRows) : 1;
    if (sig === 0) return 0;
    return Math.ceil(v / sig) * sig;
  },

  FLOOR(args, cellData, numCols, numRows) {
    if (args.length < 1) mkErr(ERR_ERROR, 'FLOOR requires at least 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    const sig = args.length > 1 ? evalNode(args[1], cellData, numCols, numRows) : 1;
    if (sig === 0) return 0;
    return Math.floor(v / sig) * sig;
  },

  INT(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'INT requires 1 argument');
    return Math.floor(evalNode(args[0], cellData, numCols, numRows));
  },

  SIGN(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'SIGN requires 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    return v > 0 ? 1 : v < 0 ? -1 : 0;
  },

  PI(args) {
    return Math.PI;
  },

  RAND(args) {
    return Math.random();
  },

  // ── Logarithm / Exponential ──────────────────────────────────────────────
  LOG(args, cellData, numCols, numRows) {
    if (args.length < 1) mkErr(ERR_ERROR, 'LOG requires at least 1 argument');
    const v    = evalNode(args[0], cellData, numCols, numRows);
    const base = args.length > 1 ? evalNode(args[1], cellData, numCols, numRows) : 10;
    if (v <= 0) mkErr(ERR_VALUE, 'LOG of non-positive number');
    return Math.log(v) / Math.log(base);
  },

  LOG10(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'LOG10 requires 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    if (v <= 0) mkErr(ERR_VALUE, 'LOG10 of non-positive number');
    return Math.log10(v);
  },

  LN(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'LN requires 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    if (v <= 0) mkErr(ERR_VALUE, 'LN of non-positive number');
    return Math.log(v);
  },

  EXP(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'EXP requires 1 argument');
    return Math.exp(evalNode(args[0], cellData, numCols, numRows));
  },

  // ── Logic ────────────────────────────────────────────────────────────────
  IF(args, cellData, numCols, numRows) {
    if (args.length < 2) mkErr(ERR_ERROR, 'IF requires at least 2 arguments');
    const condition = evalNode(args[0], cellData, numCols, numRows);
    const truthy    = condition !== 0 && condition !== false && condition !== '' && condition !== null;
    return truthy
      ? evalNode(args[1], cellData, numCols, numRows)
      : args.length > 2 ? evalNode(args[2], cellData, numCols, numRows) : 0;
  },

  AND(args, cellData, numCols, numRows) {
    return args.every(a => {
      const v = evalNode(a, cellData, numCols, numRows);
      return v !== 0 && v !== false && v !== '';
    }) ? 1 : 0;
  },

  OR(args, cellData, numCols, numRows) {
    return args.some(a => {
      const v = evalNode(a, cellData, numCols, numRows);
      return v !== 0 && v !== false && v !== '';
    }) ? 1 : 0;
  },

  NOT(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'NOT requires 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    return (v === 0 || v === false || v === '') ? 1 : 0;
  },

  // ── Text ─────────────────────────────────────────────────────────────────
  CONCAT(args, cellData, numCols, numRows) {
    return args.map(a => {
      const v = evalNode(a, cellData, numCols, numRows);
      return v == null ? '' : String(v);
    }).join('');
  },

  LEN(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'LEN requires 1 argument');
    const v = evalNode(args[0], cellData, numCols, numRows);
    return String(v == null ? '' : v).length;
  },

  UPPER(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'UPPER requires 1 argument');
    return String(evalNode(args[0], cellData, numCols, numRows)).toUpperCase();
  },

  LOWER(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'LOWER requires 1 argument');
    return String(evalNode(args[0], cellData, numCols, numRows)).toLowerCase();
  },

  TRIM(args, cellData, numCols, numRows) {
    if (args.length !== 1) mkErr(ERR_ERROR, 'TRIM requires 1 argument');
    return String(evalNode(args[0], cellData, numCols, numRows)).trim();
  },
};

export const FUNCTION_NAMES = Object.keys(FUNCTIONS).sort();

// ─── AST node evaluator ───────────────────────────────────────────────────────

function evalNode(node, cellData, numCols, numRows) {
  switch (node.type) {

    case 'Number':
      return node.value;

    case 'StringLiteral':
      return node.value;

    case 'CellRef': {
      const ref = node.ref;
      const parsed = parseCellAddress(ref);
      if (!parsed || parsed.col >= numCols || parsed.row >= numRows || parsed.col < 0 || parsed.row < 0) {
        mkErr(ERR_REF, `Out-of-bounds reference: ${ref}`);
      }
      const cell = cellData[ref];
      if (!cell || cell.raw === '' || cell.raw == null) return 0;
      if (cell.error) mkErr(cell.error, `Error propagated from ${ref}`);
      return cell.value ?? 0;
    }

    case 'Range':
      // A bare range in arithmetic context → sum of values (Excel compat)
      return FUNCTIONS.SUM([node], cellData, numCols, numRows);

    case 'UnaryMinus':
      return -evalNode(node.operand, cellData, numCols, numRows);

    case 'BinaryOp': {
      const left  = evalNode(node.left,  cellData, numCols, numRows);
      const right = evalNode(node.right, cellData, numCols, numRows);
      switch (node.op) {
        case 'PLUS':     return left + right;
        case 'MINUS':    return left - right;
        case 'MULTIPLY': return left * right;
        case 'DIVIDE':
          if (right === 0) mkErr(ERR_DIV0, 'Division by zero');
          return left / right;
        // Comparison operators — return 1 (true) or 0 (false), Excel-style
        case 'GT':  return left >  right ? 1 : 0;
        case 'LT':  return left <  right ? 1 : 0;
        case 'GTE': return left >= right ? 1 : 0;
        case 'LTE': return left <= right ? 1 : 0;
        case 'NEQ': return left !== right ? 1 : 0;
        case 'EQ':  return left === right ? 1 : 0;
        default:
          mkErr(ERR_ERROR, `Unknown operator: ${node.op}`);
      }
      break;
    }

    case 'FuncCall': {
      const fn = FUNCTIONS[node.name];
      if (!fn) mkErr(ERR_NAME, `Unknown function: ${node.name}`);
      return fn(node.args, cellData, numCols, numRows);
    }

    default:
      mkErr(ERR_ERROR, `Unknown AST node: ${node.type}`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate a raw cell string against the current cellData.
 * Returns { value, error } — error is null on success.
 */
export function evaluateCell(raw, cellData, numCols, numRows) {
  if (raw === '' || raw == null) return { value: '', error: null };

  // Not a formula
  if (!raw.toString().startsWith('=')) {
    const num = Number(raw);
    if (!isNaN(num) && raw.toString().trim() !== '') return { value: num, error: null };
    return { value: raw, error: null };
  }

  const formulaStr = raw.slice(1).trim();
  if (formulaStr === '') return { value: '', error: ERR_ERROR };

  try {
    const ast    = parseFormula(formulaStr);
    const result = evalNode(ast, cellData, numCols, numRows);

    // Clean up floating point noise
    if (typeof result === 'number') {
      const cleaned = parseFloat(result.toPrecision(12));
      return { value: cleaned, error: null };
    }
    return { value: result, error: null };
  } catch (err) {
    if (err && err.code) return { value: err.code, error: err.code };
    return { value: ERR_ERROR, error: ERR_ERROR };
  }
}

/** Export function list for autocomplete / help panel */
export const SUPPORTED_FUNCTIONS = Object.keys(FUNCTIONS);
