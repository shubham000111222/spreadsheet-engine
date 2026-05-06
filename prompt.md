Build a fully functional React-based Spreadsheet Engine with Formula Evaluation. 
Here are the complete requirements:

---

## PROJECT OVERVIEW

Create a React app (using Vite or Create React App) that implements a 10×10 spreadsheet 
grid with Excel-like formula evaluation, dependency tracking, and circular reference detection.

---

## TECH STACK

- React (functional components + hooks)
- JavaScript (no TypeScript required, but allowed)
- CSS Modules or Tailwind CSS for styling
- No backend needed — client-side only
- Optional: any formula parsing library (e.g., mathjs), but prefer custom parser

---

## CORE FEATURES TO IMPLEMENT

### 1. Grid Setup
- Render a 10×10 grid of editable cells
- Columns labeled A–J, Rows labeled 1–10
- Cell addresses like A1, B4, J10
- Each cell supports:
  - Plain numeric values (e.g., 42)
  - Plain text values (e.g., hello)
  - Formulas starting with "=" (e.g., =A1+B2)
- Clicking a cell shows its raw formula/value in an editable input
- Clicking away (blur) triggers evaluation

### 2. Formula Evaluation
Support these formula patterns:
- =A1+B2         (cell + cell)
- =A1*2          (cell * constant)
- =(C1+D1)/3     (parentheses + division)
- =A1+B2-C3*D4   (mixed arithmetic)

Parser must handle:
- Basic arithmetic: +, -, *, /
- Parentheses for grouping
- Direct cell references (e.g., A1, B3, J10)
- Mixed expressions with both constants and cell refs

### 3. Dependency Management
- Maintain a dependency graph: for each cell, track which cells it depends on
- When a cell value changes, recalculate all cells that depend on it (recursively)
- Use topological sort (Kahn's algorithm or DFS-based) to determine correct 
  recalculation order
- Only recalculate affected cells, not the entire grid (optimization)

### 4. Circular Reference Detection
- Before evaluating, check if the dependency graph has a cycle
- If cell A1 = =B1 and B1 = =A1, both should display: #CIRCULAR
- Detection must happen at formula entry time, not after evaluation
- Must never cause infinite loops or freeze the browser

### 5. Error Handling
- Invalid/malformed formula (e.g., =A1+) → show #ERROR
- Reference to out-of-bounds cell (e.g., =Z99) → show #REF
- Division by zero → show #DIV/0
- Circular reference → show #CIRCULAR
- Errors must not affect other cells

---

## BONUS FEATURES (implement all of these)

### Undo/Redo
- Maintain a history stack of grid states
- Ctrl+Z → undo last change
- Ctrl+Y or Ctrl+Shift+Z → redo
- Limit history to last 50 states

### Dynamic Grid Size
- Add UI controls to add/remove rows and columns
- Grid should scale up to at least 26 columns (A–Z) and 50 rows
- Cell labels should update automatically

### Optimized Recalculation
- Only recalculate cells in the dependency subtree of the changed cell
- Skip cells with no dependents

---

## DATA STRUCTURES

Use these internal data structures:

````js
// Cell state
const cellData = {
  "A1": { raw: "=B1+2", value: 5, error: null },
  "B1": { raw: "10", value: 10, error: null },
  ...
}

// Dependency graph
// dependents[X] = set of cells that depend on X
const dependents = {
  "A1": new Set(["B1", "C3"]),
  ...
}

// Reverse: dependencies[X] = set of cells X depends on
const dependencies = {
  "B1": new Set(["A1"]),
  ...
}
````

---

## COMPONENT STRUCTURE
src/
├── App.jsx                  # Root component, manages grid state
├── components/
│   ├── Grid.jsx             # Renders the full grid table
│   ├── Cell.jsx             # Individual cell (input + display logic)
│   ├── Toolbar.jsx          # Undo/redo buttons, grid size controls
│   └── FormulaBar.jsx       # Shows raw formula of selected cell
├── engine/
│   ├── parser.js            # Formula string → AST or evaluated result
│   ├── evaluator.js         # Resolves cell refs, evaluates expressions
│   ├── dependencyGraph.js   # Tracks deps, topological sort, cycle detection
│   └── recalculator.js      # Triggers recalc in correct order
├── hooks/
│   └── useSpreadsheet.js    # Main hook: manages all grid state + logic
└── utils/
└── cellUtils.js         # Parse cell address (A1 → {col:0, row:0}), etc.

---

## FORMULA PARSER SPECIFICATION

Write a recursive descent parser or regex-based evaluator:

1. Tokenize the formula string into: NUMBER, CELL_REF, OPERATOR, LPAREN, RPAREN
2. Parse using operator precedence:
   - * and / before + and -
   - Parentheses override precedence
3. On evaluation, resolve CELL_REF tokens by looking up their current value 
   from cellData
4. If a referenced cell has an error, propagate the error upward

Example token flow for "=(A1+B2)*3":
  LPAREN → CELL_REF(A1) → PLUS → CELL_REF(B2) → RPAREN → MULTIPLY → NUMBER(3)

---

## STYLING REQUIREMENTS

- Clean spreadsheet-like UI with visible grid lines
- Column headers (A–J) and row headers (1–10) clearly visible
- Selected cell highlighted with a blue border
- Cells with errors shown in red text
- Formula bar at the top showing raw input of selected cell
- Toolbar with Undo / Redo buttons and optional grid size controls
- Responsive layout that doesn't overflow on normal screen sizes

---

## README.md CONTENT

Generate a README.md with these exact sections:

````markdown
# Spreadsheet Engine

A React-based spreadsheet with Excel-like formula evaluation, built as part of the 
Infollion Software Developer Intern assignment.

## Features
- 10×10 editable grid (expandable)
- Formula evaluation with cell references and arithmetic
- Real-time dependency propagation
- Circular reference detection (#CIRCULAR)
- Error handling (#ERROR, #REF, #DIV/0)
- Undo / Redo (Ctrl+Z / Ctrl+Y)
- Dynamic grid resizing

## Getting Started

### Prerequisites
- Node.js >= 16
- npm or yarn

### Installation
```bash
git clone https://github.com/YOUR_USERNAME/spreadsheet-engine.git
cd spreadsheet-engine
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## Usage
- Click any cell to select it
- Type a value or formula (e.g., =A1+B2)
- Press Enter or click away to evaluate
- Use Ctrl+Z to undo, Ctrl+Y to redo

## Formula Examples
| Formula      | Description                    |
|--------------|--------------------------------|
| =A1+B2       | Add two cells                  |
| =A1*2        | Multiply cell by constant      |
| =(A1+B1)/2   | Average of two cells           |
| =A1+B2-C3    | Multi-cell arithmetic          |

## Error Codes
| Code        | Meaning                        |
|-------------|--------------------------------|
| #ERROR      | Invalid or malformed formula   |
| #CIRCULAR   | Circular reference detected    |
| #REF        | Cell reference out of bounds   |
| #DIV/0      | Division by zero               |

## Tech Stack
- React 18
- Vite
- Vanilla CSS / Tailwind CSS

## Deployment
Live demo: [your-app.vercel.app](https://your-app.vercel.app)
````

---

## GITHUB SETUP INSTRUCTIONS (include in your response)

After generating the code, provide these steps:

1. Initialize git repo:
````bash
git init
git add .
git commit -m "feat: initial spreadsheet engine implementation"
````

2. Create GitHub repo named: `spreadsheet-engine`

3. Push code:
````bash
git remote add origin https://github.com/YOUR_USERNAME/spreadsheet-engine.git
git branch -M main
git push -u origin main
````

4. Deploy to Vercel:
   - Go to vercel.com → Import Git Repository
   - Select the repo
   - Framework: Vite
   - Click Deploy

---

## EXAMPLE TEST CASES TO VERIFY

After building, verify these cases work:

1. A1=5, B1==A1+3 → B1 shows 8
2. Change A1 to 10 → B1 auto-updates to 13
3. C1==B1*2 → C1 shows 26 (with A1=10, B1=13)
4. A2==B2, B2==A2 → both show #CIRCULAR
5. C3==A1+ → shows #ERROR, other cells unaffected
6. D1==Z99 → shows #REF
7. E1==A1/0 (where A1=0) → shows #DIV/0
8. Ctrl+Z after changing A1 → reverts to previous value and all dependents update

---

Generate the complete working implementation now. 
Prioritize correctness of the formula engine and dependency graph over visual styling.