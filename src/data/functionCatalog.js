/**
 * functionCatalog.js
 * Shared function metadata for help and suggestions.
 */

export const FUNCTION_GROUPS = [
  {
    label: 'Aggregation',
    color: '#3b82f6',
    funcs: [
      { name: 'SUM',     syntax: 'SUM(A1:C3)',          desc: 'Sum of all values in range' },
      { name: 'AVERAGE', syntax: 'AVERAGE(A1:A10)',      desc: 'Arithmetic mean' },
      { name: 'MIN',     syntax: 'MIN(A1:D1)',           desc: 'Smallest value' },
      { name: 'MAX',     syntax: 'MAX(A1:D1)',           desc: 'Largest value' },
      { name: 'COUNT',   syntax: 'COUNT(A1:C3)',         desc: 'Count numeric cells' },
      { name: 'COUNTA',  syntax: 'COUNTA(A1:C3)',        desc: 'Count non-empty cells' },
    ],
  },
  {
    label: 'Math',
    color: '#22c55e',
    funcs: [
      { name: 'ABS',       syntax: 'ABS(A1)',            desc: 'Absolute value' },
      { name: 'ROUND',     syntax: 'ROUND(A1, 2)',       desc: 'Round to N decimals' },
      { name: 'ROUNDUP',   syntax: 'ROUNDUP(A1, 0)',     desc: 'Round up' },
      { name: 'ROUNDDOWN', syntax: 'ROUNDDOWN(A1, 0)',   desc: 'Round down' },
      { name: 'SQRT',      syntax: 'SQRT(A1)',           desc: 'Square root' },
      { name: 'POWER',     syntax: 'POWER(A1, 3)',       desc: 'Exponentiation' },
      { name: 'MOD',       syntax: 'MOD(A1, 3)',         desc: 'Remainder after division' },
      { name: 'INT',       syntax: 'INT(A1)',            desc: 'Floor to integer' },
      { name: 'SIGN',      syntax: 'SIGN(A1)',           desc: '1, -1, or 0' },
      { name: 'PI',        syntax: 'PI()',               desc: 'Value of PI' },
    ],
  },
  {
    label: 'Log / Exp',
    color: '#f59e0b',
    funcs: [
      { name: 'LOG',   syntax: 'LOG(A1, 10)',   desc: 'Log base N (default 10)' },
      { name: 'LOG10', syntax: 'LOG10(A1)',      desc: 'Base-10 logarithm' },
      { name: 'LN',    syntax: 'LN(A1)',         desc: 'Natural logarithm' },
      { name: 'EXP',   syntax: 'EXP(A1)',        desc: 'e raised to power' },
    ],
  },
  {
    label: 'Logic',
    color: '#a78bfa',
    funcs: [
      { name: 'IF',  syntax: 'IF(A1>0, "yes", "no")', desc: 'Conditional value' },
      { name: 'AND', syntax: 'AND(A1, B1)',            desc: '1 if all truthy' },
      { name: 'OR',  syntax: 'OR(A1, B1)',             desc: '1 if any truthy' },
      { name: 'NOT', syntax: 'NOT(A1)',                desc: 'Logical negation' },
    ],
  },
  {
    label: 'Text',
    color: '#fb7185',
    funcs: [
      { name: 'CONCAT', syntax: 'CONCAT(A1, " ", B1)', desc: 'Join text values' },
      { name: 'LEN',    syntax: 'LEN(A1)',             desc: 'Length of text' },
      { name: 'UPPER',  syntax: 'UPPER(A1)',           desc: 'Uppercase text' },
      { name: 'LOWER',  syntax: 'LOWER(A1)',           desc: 'Lowercase text' },
      { name: 'TRIM',   syntax: 'TRIM(A1)',            desc: 'Remove extra spaces' },
    ],
  },
];

export const FUNCTION_LOOKUP = FUNCTION_GROUPS.reduce((acc, group) => {
  group.funcs.forEach((fn) => {
    acc[fn.name] = fn;
  });
  return acc;
}, {});
