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
Live demo: [spreadsheet-engine-theta.vercel.app](https://spreadsheet-engine-theta.vercel.app)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shubham000111222/spreadsheet-engine)
