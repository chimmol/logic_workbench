import { CircuitData, KMapGroup, LogicState, TruthTableRow } from '../types';
import { createComponent } from './circuitEngine';

export interface EvaluatedTruthTable {
  variables: string[];
  rows: TruthTableRow[];
  minterms: number[];
  sopExpression: string;
  rawSopExpression: string;
}

/**
 * Tokenizes and evaluates boolean expressions
 * Supported syntax:
 * AND: &, *, AND, or juxtaposed AB
 * OR: |, +, OR
 * NOT: !, ~, ', NOT
 * XOR: ^, XOR
 */
export function evaluateBooleanExpression(
  expression: string,
  variables: string[],
  values: Record<string, LogicState>
): LogicState {
  try {
    let clean = expression.trim();
    if (!clean) return 0;

    // Replace textual operators
    clean = clean.replace(/\bAND\b/gi, '&');
    clean = clean.replace(/\bOR\b/gi, '|');
    clean = clean.replace(/\bXOR\b/gi, '^');
    clean = clean.replace(/\bNOT\b/gi, '!');

    // Handle postfix apostrophe: A' -> !A, (A+B)' -> !(A+B)
    clean = clean.replace(/([A-Za-z0-9_]+)'/g, '!$1');
    clean = clean.replace(/\)'/g, ')~'); // will handle ~ as !
    clean = clean.replace(/~/g, '!');

    // Convert variables to 0/1
    const sortedVars = [...variables].sort((a, b) => b.length - a.length);
    for (const v of sortedVars) {
      const val = values[v] ?? 0;
      const regex = new RegExp(`\\b${v}\\b`, 'g');
      clean = clean.replace(regex, val.toString());
    }

    // Convert boolean arithmetic: + -> |, * -> &
    clean = clean.replace(/\+/g, '|');
    clean = clean.replace(/\*/g, '&');

    // Safe AST eval using Function or recursive parser
    // Sanitize string to only contain 0, 1, &, |, ^, !, (, ), and spaces
    const sanitized = clean.replace(/[^01&|^!()\s]/g, '');
    if (!sanitized) return 0;

    // Use bitwise operations in JS
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${sanitized}) & 1;`)();
    return result ? 1 : 0;
  } catch {
    return 0;
  }
}

/**
 * Extract variable names from an expression (e.g. "A & B + C" -> ["A", "B", "C"])
 */
export function extractVariables(expression: string): string[] {
  const words = expression.match(/[A-Za-z][A-Za-z0-9_]*/g) || [];
  const reserved = new Set(['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR', 'TRUE', 'FALSE']);
  const vars = Array.from(new Set(words.filter((w) => !reserved.has(w.toUpperCase())))).sort();
  return vars.length > 0 ? vars : ['A', 'B'];
}

/**
 * Generates truth table from boolean expression
 */
export function generateTruthTableFromExpr(
  expression: string,
  customVars?: string[]
): EvaluatedTruthTable {
  const variables = customVars && customVars.length > 0 ? customVars : extractVariables(expression);
  const rowCount = 1 << variables.length; // 2^N
  const rows: TruthTableRow[] = [];
  const minterms: number[] = [];

  for (let i = 0; i < rowCount; i++) {
    const inputVals: Record<string, LogicState> = {};
    for (let bit = 0; bit < variables.length; bit++) {
      const varName = variables[bit];
      const shift = variables.length - 1 - bit;
      inputVals[varName] = ((i >> shift) & 1) as LogicState;
    }

    const outVal = evaluateBooleanExpression(expression, variables, inputVals);
    if (outVal === 1) {
      minterms.push(i);
    }

    rows.push({
      inputs: inputVals,
      outputs: { Y: outVal },
    });
  }

  const rawSop = minterms.length > 0 ? minterms.map((m) => `m(${m})`).join(' + ') : '0';
  const simplifiedSop = simplifyMinterms(variables, minterms);

  return {
    variables,
    rows,
    minterms,
    rawSopExpression: rawSop,
    sopExpression: simplifiedSop,
  };
}

/**
 * Gray code sequence
 */
export const GRAY_CODE_2BIT = ['00', '01', '11', '10'];
export const GRAY_CODE_1BIT = ['0', '1'];

/**
 * Simplifies minterms into a readable Sum-Of-Products expression
 */
export function simplifyMinterms(variables: string[], minterms: number[]): string {
  const n = variables.length;
  if (minterms.length === 0) return '0';
  if (minterms.length === 1 << n) return '1';

  // Quine-McCluskey / Implicant reduction
  let terms: { bits: string; covered: boolean }[] = minterms.map((m) => ({
    bits: m.toString(2).padStart(n, '0'),
    covered: false,
  }));

  const primeImplicants = new Set<string>();

  while (terms.length > 0) {
    const nextTerms: { bits: string; covered: boolean }[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < terms.length; i++) {
      for (let j = i + 1; j < terms.length; j++) {
        const diff = getBitDifference(terms[i].bits, terms[j].bits);
        if (diff !== -1) {
          terms[i].covered = true;
          terms[j].covered = true;
          const merged = terms[i].bits.substring(0, diff) + '-' + terms[i].bits.substring(diff + 1);
          if (!seen.has(merged)) {
            seen.add(merged);
            nextTerms.push({ bits: merged, covered: false });
          }
        }
      }
    }

    for (const t of terms) {
      if (!t.covered) {
        primeImplicants.add(t.bits);
      }
    }

    terms = nextTerms;
  }

  // Convert implicants to expression
  const piList = Array.from(primeImplicants);
  if (piList.length === 0) return '0';

  const exprTerms = piList.map((pi) => {
    let termStr = '';
    for (let i = 0; i < pi.length; i++) {
      const char = pi[i];
      const v = variables[i];
      if (char === '1') {
        termStr += v;
      } else if (char === '0') {
        termStr += `${v}'`;
      }
    }
    return termStr || '1';
  });

  return exprTerms.join(' + ') || '1';
}

function getBitDifference(a: string, b: string): number {
  let diffCount = 0;
  let diffIndex = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diffCount++;
      diffIndex = i;
    }
  }
  return diffCount === 1 ? diffIndex : -1;
}

/**
 * Calculates K-Map grouping loops for 2, 3, or 4 variables
 */
export function calculateKMapGroups(variables: string[], minterms: number[]): KMapGroup[] {
  const n = variables.length;
  const groups: KMapGroup[] = [];
  const mintermSet = new Set(minterms);
  const colors = ['#10B981', '#06B6D4', '#F59E0B', '#A855F7', '#EC4899'];

  if (n === 2) {
    // 2x2 grid: rows A (0, 1), cols B (0, 1)
    // Check 2x2 all 1s
    if ([0, 1, 2, 3].every((m) => mintermSet.has(m))) {
      return [{ id: 'g_all', term: '1', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], color: colors[0] }];
    }
    // Check rows / cols of 2
    let colorIdx = 0;
    // Row 0: A=0 (m0, m1)
    if (mintermSet.has(0) && mintermSet.has(1)) {
      groups.push({ id: 'g_r0', term: "A'", cells: [[0, 0], [0, 1]], color: colors[colorIdx++ % colors.length] });
    }
    // Row 1: A=1 (m2, m3)
    if (mintermSet.has(2) && mintermSet.has(3)) {
      groups.push({ id: 'g_r1', term: 'A', cells: [[1, 0], [1, 1]], color: colors[colorIdx++ % colors.length] });
    }
    // Col 0: B=0 (m0, m2)
    if (mintermSet.has(0) && mintermSet.has(2)) {
      groups.push({ id: 'g_c0', term: "B'", cells: [[0, 0], [1, 0]], color: colors[colorIdx++ % colors.length] });
    }
    // Col 1: B=1 (m1, m3)
    if (mintermSet.has(1) && mintermSet.has(3)) {
      groups.push({ id: 'g_c1', term: 'B', cells: [[0, 1], [1, 1]], color: colors[colorIdx++ % colors.length] });
    }
  } else if (n === 3) {
    // 2x4 grid: row A (0, 1), col BC (00, 01, 11, 10)
    // Gray col map: 00->0, 01->1, 11->3, 10->2
    const cellMinterm = (r: number, c: number) => {
      const bcMap = [0, 1, 3, 2];
      return (r << 2) | bcMap[c];
    };

    let colorIdx = 0;
    // Check for 2x4 full
    if (minterms.length === 8) {
      return [{
        id: 'g_all',
        term: '1',
        cells: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2], [1, 3]],
        color: colors[0],
      }];
    }

    // Check rows of 4
    if ([0, 1, 2, 3].every((c) => mintermSet.has(cellMinterm(0, c)))) {
      groups.push({ id: 'g_r0', term: "A'", cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: colors[colorIdx++ % colors.length] });
    }
    if ([0, 1, 2, 3].every((c) => mintermSet.has(cellMinterm(1, c)))) {
      groups.push({ id: 'g_r1', term: 'A', cells: [[1, 0], [1, 1], [1, 2], [1, 3]], color: colors[colorIdx++ % colors.length] });
    }

    // Check 2x2 blocks
    const colPairs = [[0, 1], [1, 2], [2, 3], [3, 0]]; // wrap around!
    for (const [c1, c2] of colPairs) {
      const mList = [cellMinterm(0, c1), cellMinterm(0, c2), cellMinterm(1, c1), cellMinterm(1, c2)];
      if (mList.every((m) => mintermSet.has(m))) {
        let termName = '';
        if (c1 === 0 && c2 === 1) termName = "B'";
        else if (c1 === 1 && c2 === 2) termName = 'C';
        else if (c1 === 2 && c2 === 3) termName = 'B';
        else if (c1 === 3 && c2 === 0) termName = "C'";
        groups.push({
          id: `g_b_${c1}_${c2}`,
          term: termName,
          cells: [[0, c1], [0, c2], [1, c1], [1, c2]],
          color: colors[colorIdx++ % colors.length],
        });
      }
    }
  }

  return groups;
}

/**
 * Automatically synthesizes a parsed boolean expression into physical gates on the canvas.
 * Example: (A & B) | (~A & C) generates 3 switches (A, B, C), 1 NOT, 2 AND, 1 OR, and 1 PROBE!
 */
export function synthesizeExpressionToCircuit(expression: string): CircuitData {
  const variables = extractVariables(expression);
  const evaluated = generateTruthTableFromExpr(expression, variables);
  const terms = evaluated.sopExpression.split('+').map((t) => t.trim()).filter(Boolean);

  const components: CircuitData['components'] = [];
  const wires: CircuitData['wires'] = [];

  const startX = 120;
  const startY = 96;

  // 1. Create input switches for each variable on the left
  const switchMap = new Map<string, string>(); // VarName -> CompId
  variables.forEach((v, idx) => {
    const sw = createComponent('SWITCH', startX, startY + idx * 72, v);
    components.push(sw);
    switchMap.set(v, sw.id);
  });

  // If simple direct single variable (e.g. "A")
  if (terms.length === 1 && terms[0] === '1') {
    const vcc = createComponent('VCC', startX + 168, startY + 48);
    const probe = createComponent('PROBE', startX + 312, startY + 48, 'OUT (Y)');
    components.push(vcc, probe);
    wires.push({
      id: `w_${Date.now()}_0`,
      fromComponentId: vcc.id,
      fromPinId: vcc.outputs[0].id,
      toComponentId: probe.id,
      toPinId: probe.inputs[0].id,
      state: 1,
    });
    return { components, wires };
  }

  // Build product gates for each term
  const termOutputCompIds: string[] = [];
  let gateY = startY;

  terms.forEach((term, termIdx) => {
    // Parse literals e.g. "AB'" -> [{var: 'A', inv: false}, {var: 'B', inv: true}]
    const literals: { varName: string; inverted: boolean }[] = [];
    const regex = /([A-Za-z0-9_]+)('?)/g;
    let match;
    while ((match = regex.exec(term)) !== null) {
      literals.push({ varName: match[1], inverted: match[2] === "'" });
    }

    if (literals.length === 1) {
      const lit = literals[0];
      const swId = switchMap.get(lit.varName);
      if (!swId) return;
      const swComp = components.find((c) => c.id === swId)!;

      if (lit.inverted) {
        const notGate = createComponent('NOT', startX + 168, gateY);
        components.push(notGate);
        wires.push({
          id: `w_${Date.now()}_n_${termIdx}`,
          fromComponentId: swComp.id,
          fromPinId: swComp.outputs[0].id,
          toComponentId: notGate.id,
          toPinId: notGate.inputs[0].id,
          state: 0,
        });
        termOutputCompIds.push(notGate.id);
      } else {
        termOutputCompIds.push(swComp.id);
      }
      gateY += 72;
    } else if (literals.length >= 2) {
      // AND gate for up to 2 literals (or cascaded)
      const andGate = createComponent('AND', startX + 240, gateY);
      components.push(andGate);

      literals.slice(0, 2).forEach((lit, litIdx) => {
        const swId = switchMap.get(lit.varName);
        if (!swId) return;
        const swComp = components.find((c) => c.id === swId)!;

        let srcCompId = swComp.id;
        let srcPinId = swComp.outputs[0].id;

        if (lit.inverted) {
          const notGate = createComponent('NOT', startX + 144, gateY + (litIdx === 0 ? -12 : 24));
          components.push(notGate);
          wires.push({
            id: `w_inv_${Date.now()}_${termIdx}_${litIdx}`,
            fromComponentId: swComp.id,
            fromPinId: swComp.outputs[0].id,
            toComponentId: notGate.id,
            toPinId: notGate.inputs[0].id,
            state: 0,
          });
          srcCompId = notGate.id;
          srcPinId = notGate.outputs[0].id;
        }

        wires.push({
          id: `w_and_${Date.now()}_${termIdx}_${litIdx}`,
          fromComponentId: srcCompId,
          fromPinId: srcPinId,
          toComponentId: andGate.id,
          toPinId: andGate.inputs[litIdx].id,
          state: 0,
        });
      });

      termOutputCompIds.push(andGate.id);
      gateY += 84;
    }
  });

  // Combine terms with OR gate
  let finalOutCompId = termOutputCompIds[0];
  if (termOutputCompIds.length > 1) {
    const orGate = createComponent('OR', startX + 384, startY + (gateY - startY) / 3);
    components.push(orGate);

    termOutputCompIds.slice(0, 2).forEach((termCompId, idx) => {
      const comp = components.find((c) => c.id === termCompId)!;
      wires.push({
        id: `w_or_${Date.now()}_${idx}`,
        fromComponentId: comp.id,
        fromPinId: comp.outputs[0].id,
        toComponentId: orGate.id,
        toPinId: orGate.inputs[idx].id,
        state: 0,
      });
    });
    finalOutCompId = orGate.id;
  }

  // Connect to Probe
  if (finalOutCompId) {
    const probe = createComponent('PROBE', startX + 504, startY + (gateY - startY) / 3, 'OUT (Y)');
    components.push(probe);
    const finalComp = components.find((c) => c.id === finalOutCompId)!;
    wires.push({
      id: `w_out_${Date.now()}`,
      fromComponentId: finalComp.id,
      fromPinId: finalComp.outputs[0].id,
      toComponentId: probe.id,
      toPinId: probe.inputs[0].id,
      state: 0,
    });
  }

  return { components, wires };
}
