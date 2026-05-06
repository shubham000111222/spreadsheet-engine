/**
 * parser.js
 * Recursive-descent formula parser with function call + range support.
 *
 * Supported token types:
 *   NUMBER, CELL_REF, FUNC_NAME, OPERATOR(+,-,*,/), LPAREN, RPAREN, COMMA, COLON
 *
 * Grammar:
 *   expr      → term   (('+' | '-') term)*
 *   term      → factor (('*' | '/') factor)*
 *   factor    → NUMBER | cell_or_range | func_call | '(' expr ')' | '-' factor
 *   func_call → FUNC_NAME '(' arg_list ')'
 *   arg_list  → (arg (',' arg)*)?
 *   arg       → CELL_REF ':' CELL_REF   (range)
 *              | expr
 *   cell_or_range → CELL_REF (':' CELL_REF)?
 */

// ─── Token types ────────────────────────────────────────────────────────────

const TOKEN = {
  NUMBER:    'NUMBER',
  CELL_REF:  'CELL_REF',
  FUNC_NAME: 'FUNC_NAME',
  PLUS:      'PLUS',
  MINUS:     'MINUS',
  MULTIPLY:  'MULTIPLY',
  DIVIDE:    'DIVIDE',
  LPAREN:    'LPAREN',
  RPAREN:    'RPAREN',
  COMMA:     'COMMA',
  COLON:     'COLON',
  // Comparison operators
  GT:        'GT',   // >
  LT:        'LT',   // <
  GTE:       'GTE',  // >=
  LTE:       'LTE',  // <=
  NEQ:       'NEQ',  // <>
  EQ:        'EQ',   // = (inside formula, not leading =)
  PERCENT:   'PERCENT', // %
  EOF:       'EOF',
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(input) {
  const tokens = [];
  let i = 0;
  const src = input.trim();

  while (i < src.length) {
    const ch = src[i];

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Number (integer or decimal)
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) {
      let num = '';
      while (i < src.length && /[\d.]/.test(src[i])) num += src[i++];
      tokens.push({ type: TOKEN.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Letter sequence → cell ref (e.g. A1) or function name (e.g. SUM)
    if (/[A-Za-z]/.test(ch)) {
      let name = '';
      while (i < src.length && /[A-Za-z]/.test(src[i])) name += src[i++];
      let digits = '';
      while (i < src.length && /\d/.test(src[i])) digits += src[i++];

      if (digits === '') {
        // Pure letters → function name (must be followed by '(')
        tokens.push({ type: TOKEN.FUNC_NAME, value: name.toUpperCase() });
      } else {
        // Letters + digits → cell reference
        tokens.push({ type: TOKEN.CELL_REF, value: (name + digits).toUpperCase() });
      }
      continue;
    }

    switch (ch) {
      case '+': tokens.push({ type: TOKEN.PLUS });     i++; break;
      case '-': tokens.push({ type: TOKEN.MINUS });    i++; break;
      case '*': tokens.push({ type: TOKEN.MULTIPLY }); i++; break;
      case '/': tokens.push({ type: TOKEN.DIVIDE });   i++; break;
      case '(': tokens.push({ type: TOKEN.LPAREN });   i++; break;
      case ')': tokens.push({ type: TOKEN.RPAREN });   i++; break;
      case ',': tokens.push({ type: TOKEN.COMMA });    i++; break;
      case ':': tokens.push({ type: TOKEN.COLON });    i++; break;
      case '%': tokens.push({ type: TOKEN.PERCENT });  i++; break;
      case '>': {
        if (src[i+1] === '=') { tokens.push({ type: TOKEN.GTE }); i += 2; }
        else                  { tokens.push({ type: TOKEN.GT  }); i += 1; }
        break;
      }
      case '<': {
        if (src[i+1] === '=') { tokens.push({ type: TOKEN.LTE }); i += 2; }
        else if (src[i+1] === '>') { tokens.push({ type: TOKEN.NEQ }); i += 2; }
        else                  { tokens.push({ type: TOKEN.LT  }); i += 1; }
        break;
      }
      case '=': {
        // Inside a formula, '=' acts as equality comparison
        tokens.push({ type: TOKEN.EQ }); i++;
        break;
      }
      case '"': {
        // String literal
        let str = '';
        i++; // skip opening quote
        while (i < src.length && src[i] !== '"') str += src[i++];
        if (i < src.length) i++; // skip closing quote
        tokens.push({ type: TOKEN.NUMBER, value: str, isString: true });
        break;
      }
      default:
        throw new Error(`Unexpected character: ${ch}`);
    }
  }

  tokens.push({ type: TOKEN.EOF });
  return tokens;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek()    { return this.tokens[this.pos]; }
  consume() { return this.tokens[this.pos++]; }

  expect(type) {
    const tok = this.consume();
    if (tok.type !== type) throw new Error(`Expected ${type}, got ${tok.type}`);
    return tok;
  }

  /** comparison → expr (('<'|'<='|'>'|'>='|'<>'|'=') expr)? */
  parseComparison() {
    let node = this.parseExpr();
    const cmpTypes = [TOKEN.GT, TOKEN.LT, TOKEN.GTE, TOKEN.LTE, TOKEN.NEQ, TOKEN.EQ];
    while (cmpTypes.includes(this.peek().type)) {
      const op = this.consume().type;
      node = { type: 'BinaryOp', op, left: node, right: this.parseExpr() };
    }
    return node;
  }

  /** expr → term (('+' | '-') term)* */
  parseExpr() {
    let node = this.parseTerm();
    while (this.peek().type === TOKEN.PLUS || this.peek().type === TOKEN.MINUS) {
      const op = this.consume().type;
      node = { type: 'BinaryOp', op, left: node, right: this.parseTerm() };
    }
    return node;
  }

  /** term → factor (('*' | '/') factor)* */
  parseTerm() {
    let node = this.parseFactor();
    while (this.peek().type === TOKEN.MULTIPLY || this.peek().type === TOKEN.DIVIDE) {
      const op = this.consume().type;
      node = { type: 'BinaryOp', op, left: node, right: this.parseFactor() };
    }
    return node;
  }

  /**
   * factor → '-' factor
   *         | NUMBER
   *         | FUNC_NAME '(' arg_list ')'
   *         | CELL_REF (':' CELL_REF)?
   *         | '(' expr ')'
   */
  parseFactor() {
    const tok = this.peek();

    // Unary minus
    if (tok.type === TOKEN.MINUS) {
      this.consume();
      return { type: 'UnaryMinus', operand: this.parseFactor() };
    }

    // Number literal (or string treated as number node)
    if (tok.type === TOKEN.NUMBER) {
      this.consume();
      return tok.isString
        ? { type: 'StringLiteral', value: tok.value }
        : { type: 'Number', value: tok.value };
    }

    // Function call
    if (tok.type === TOKEN.FUNC_NAME) {
      this.consume();
      this.expect(TOKEN.LPAREN);
      const args = this.parseArgList();
      this.expect(TOKEN.RPAREN);
      return { type: 'FuncCall', name: tok.value, args };
    }

    // Cell reference (or range — but bare ranges are only valid inside funcs)
    if (tok.type === TOKEN.CELL_REF) {
      this.consume();
      // Range inside expression context (rare but allow: A1:B3 as bare)
      if (this.peek().type === TOKEN.COLON) {
        this.consume();
        const end = this.expect(TOKEN.CELL_REF);
        return { type: 'Range', start: tok.value, end: end.value };
      }
      return { type: 'CellRef', ref: tok.value };
    }

    // Parenthesised expression
    if (tok.type === TOKEN.LPAREN) {
      this.consume();
      const node = this.parseComparison();
      this.expect(TOKEN.RPAREN);
      return node;
    }

    throw new Error(`Unexpected token: ${tok.type} (${JSON.stringify(tok)})`);
  }

  /** arg_list → (arg (',' arg)*)? */
  parseArgList() {
    const args = [];
    if (this.peek().type === TOKEN.RPAREN) return args;
    args.push(this.parseArg());
    while (this.peek().type === TOKEN.COMMA) {
      this.consume(); // consume ','
      if (this.peek().type === TOKEN.RPAREN) break;
      args.push(this.parseArg());
    }
    return args;
  }

  /**
   * arg → CELL_REF ':' CELL_REF   (range notation)
   *      | comparison (which covers expr and comparisons)
   */
  parseArg() {
    if (this.peek().type === TOKEN.CELL_REF) {
      const savedPos = this.pos;
      const startTok = this.consume();
      if (this.peek().type === TOKEN.COLON) {
        this.consume();
        if (this.peek().type === TOKEN.CELL_REF) {
          const endTok = this.consume();
          return { type: 'Range', start: startTok.value, end: endTok.value };
        }
        this.pos = savedPos;
      } else {
        this.pos = savedPos;
      }
    }
    return this.parseComparison();
  }

  parse() {
    const ast = this.parseComparison();
    if (this.peek().type !== TOKEN.EOF) {
      throw new Error(`Unexpected tokens after expression at position ${this.pos}`);
    }
    return ast;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a formula string (without the leading '=') into an AST.
 * Throws on syntax errors.
 */
export function parseFormula(formula) {
  const tokens = tokenize(formula);
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Walk AST and collect all CELL_REF node ref strings.
 * Also expands Range nodes using row/col range logic.
 */
export function collectRefs(ast) {
  const refs = new Set();

  function walk(node) {
    if (!node) return;
    switch (node.type) {
      case 'CellRef':
        refs.add(node.ref);
        break;
      case 'Range': {
        // We can't fully expand without bounds info here, so collect endpoints
        // Full expansion happens in evaluator
        refs.add(node.start);
        refs.add(node.end);
        // Mark as range so the dep graph gets at least partial coverage
        node._rangeNode = true;
        break;
      }
      case 'BinaryOp':
        walk(node.left);
        walk(node.right);
        break;
      case 'UnaryMinus':
        walk(node.operand);
        break;
      case 'FuncCall':
        node.args.forEach(walk);
        break;
      default:
        break;
    }
  }

  walk(ast);
  return refs;
}
