/**
 * FunctionHelp.jsx
 * Collapsible panel showing all supported functions with syntax & examples.
 */
import React, { useState } from 'react';

const FUNC_GROUPS = [
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
      { name: 'PI',        syntax: 'PI()',               desc: 'Value of π' },
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

export default function FunctionHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fn-help">
      <button
        className={`fn-help__toggle ${open ? 'fn-help__toggle--active' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Show supported functions"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Functions
      </button>

      {open && (
        <div className="fn-help__panel">
          <div className="fn-help__header">
            <span>Supported Functions</span>
            <button className="fn-help__close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="fn-help__body">
            {FUNC_GROUPS.map(group => (
              <div key={group.label} className="fn-group">
                <div className="fn-group__label" style={{ color: group.color }}>
                  {group.label}
                </div>
                <table className="fn-table">
                  <tbody>
                    {group.funcs.map(fn => (
                      <tr key={fn.name} className="fn-row">
                        <td className="fn-row__name">{fn.name}</td>
                        <td className="fn-row__syntax">{fn.syntax}</td>
                        <td className="fn-row__desc">{fn.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="fn-help__tip">
              💡 Ranges: <code>A1:C3</code> · Cell refs: <code>A1</code> · Constants: <code>42</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
