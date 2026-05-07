import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../App.jsx';

function getCell(container, cellId) {
  return container.querySelector(`[data-cell-id="${cellId}"]`);
}

function getActiveInput(container) {
  return container.querySelector('.cell__input') || container.querySelector('.formula-bar__input');
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 100,
    bottom: 20,
    width: 200,
    height: 20,
    toJSON: () => {},
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('formula editor', () => {
  it('opens suggestions and inserts a function', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const cellA1 = getCell(container, 'A1');
    await user.click(cellA1);

    const input = getActiveInput(container);
    await user.type(input, '=su');

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(input.value).toBe('=SUM()');
    await waitFor(() => expect(input.selectionStart).toBe(5));
  });

  it('inserts a cell reference on click while editing', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const cellA1 = getCell(container, 'A1');
    await user.click(cellA1);

    const input = getActiveInput(container);
    await user.type(input, '=');

    const cellB2 = getCell(container, 'B2');
    fireEvent.mouseDown(cellB2);

    expect(input.value).toBe('=B2');
  });

  it('updates range text while dragging', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const cellA1 = getCell(container, 'A1');
    await user.click(cellA1);

    const input = getActiveInput(container);
    await user.type(input, '=');

    fireEvent.mouseDown(cellA1);

    const cellB2 = getCell(container, 'B2');
    fireEvent.mouseEnter(cellB2);
    fireEvent.mouseUp(window);

    await waitFor(() => expect(input.value).toBe('=A1:B2'));
  });
});
