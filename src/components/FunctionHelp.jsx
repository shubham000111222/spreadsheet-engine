/**
 * FunctionHelp.jsx
 * Collapsible panel showing all supported functions with syntax & examples.
 */
import React, { useState } from 'react';
import { FUNCTION_GROUPS } from '../data/functionCatalog.js';

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
            {FUNCTION_GROUPS.map(group => (
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
