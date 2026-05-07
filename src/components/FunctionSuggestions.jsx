/**
 * FunctionSuggestions.jsx
 * Floating suggestion list for formula functions.
 */

import React from 'react';
import { FUNCTION_LOOKUP } from '../data/functionCatalog.js';

export default function FunctionSuggestions({ editor }) {
  const { suggestions } = editor;
  if (!suggestions.open || suggestions.items.length === 0 || !suggestions.anchor) return null;

  const style = {
    top: `${suggestions.anchor.top}px`,
    left: `${suggestions.anchor.left}px`,
    minWidth: `${suggestions.anchor.width}px`,
  };

  return (
    <div className="fn-suggest" style={style} role="listbox">
      {suggestions.items.map((name, index) => {
        const meta = FUNCTION_LOOKUP[name];
        const syntax = meta?.syntax || `${name}()`;
        const desc = meta?.desc || '';
        return (
          <div
            key={name}
            className={`fn-suggest__item ${index === suggestions.highlight ? 'fn-suggest__item--active' : ''}`}
            role="option"
            aria-selected={index === suggestions.highlight}
            title={desc ? `${syntax} - ${desc}` : syntax}
            onMouseEnter={() => editor.setSuggestionHighlight(index)}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.applySuggestion(index);
            }}
          >
            <span className="fn-suggest__name">{name}</span>
            <span className="fn-suggest__syntax">{syntax}</span>
          </div>
        );
      })}
    </div>
  );
}
