import { CircuitComponent, CircuitData, ComponentType, LogicState, PinDefinition, Wire } from '../types';

let idCounter = 100;
export function generateId(prefix = 'comp'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function createComponent(
  type: ComponentType,
  x: number,
  y: number,
  customLabel?: string
): CircuitComponent {
  const id = generateId('c');
  const snapX = Math.round(x / 24) * 24;
  const snapY = Math.round(y / 24) * 24;

  switch (type) {
    case 'SWITCH':
      return {
        id,
        type,
        label: customLabel || 'SW1',
        x: snapX,
        y: snapY,
        width: 72,
        height: 48,
        inputs: [],
        outputs: [{ id: `${id}_out`, name: 'OUT', type: 'output', x: 72, y: 24, state: 0 }],
        state: { value: 0 },
      };

    case 'PUSH_BUTTON':
      return {
        id,
        type,
        label: customLabel || 'BTN',
        x: snapX,
        y: snapY,
        width: 72,
        height: 48,
        inputs: [],
        outputs: [{ id: `${id}_out`, name: 'OUT', type: 'output', x: 72, y: 24, state: 0 }],
        state: { pressed: false, value: 0 },
      };

    case 'CLOCK':
      return {
        id,
        type,
        label: customLabel || 'CLK',
        x: snapX,
        y: snapY,
        width: 72,
        height: 48,
        inputs: [],
        outputs: [{ id: `${id}_out`, name: 'CLK', type: 'output', x: 72, y: 24, state: 0 }],
        state: { value: 0, frequency: 1 },
      };

    case 'VCC':
      return {
        id,
        type,
        label: customLabel || 'VCC (+5V)',
        x: snapX,
        y: snapY,
        width: 48,
        height: 48,
        inputs: [],
        outputs: [{ id: `${id}_out`, name: '1', type: 'output', x: 48, y: 24, state: 1 }],
        state: { value: 1 },
      };

    case 'GND':
      return {
        id,
        type,
        label: customLabel || 'GND',
        x: snapX,
        y: snapY,
        width: 48,
        height: 48,
        inputs: [],
        outputs: [{ id: `${id}_out`, name: '0', type: 'output', x: 48, y: 24, state: 0 }],
        state: { value: 0 },
      };

    case 'PROBE':
      return {
        id,
        type,
        label: customLabel || 'OUT',
        x: snapX,
        y: snapY,
        width: 48,
        height: 48,
        inputs: [{ id: `${id}_in`, name: 'IN', type: 'input', x: 0, y: 24, state: 0 }],
        outputs: [],
        state: { value: 0 },
      };

    case 'LED':
      return {
        id,
        type,
        label: customLabel || 'LED',
        x: snapX,
        y: snapY,
        width: 48,
        height: 48,
        inputs: [{ id: `${id}_in`, name: 'IN', type: 'input', x: 0, y: 24, state: 0 }],
        outputs: [],
        state: { value: 0 },
      };

    case 'NOT':
      return {
        id,
        type,
        label: customLabel || 'NOT',
        x: snapX,
        y: snapY,
        width: 72,
        height: 48,
        inputs: [{ id: `${id}_inA`, name: 'A', type: 'input', x: 0, y: 24, state: 0 }],
        outputs: [{ id: `${id}_out`, name: 'Y', type: 'output', x: 72, y: 24, state: 1 }],
      };

    case 'BUFFER':
      return {
        id,
        type,
        label: customLabel || 'BUF',
        x: snapX,
        y: snapY,
        width: 72,
        height: 48,
        inputs: [{ id: `${id}_inA`, name: 'A', type: 'input', x: 0, y: 24, state: 0 }],
        outputs: [{ id: `${id}_out`, name: 'Y', type: 'output', x: 72, y: 24, state: 0 }],
      };

    case 'AND':
    case 'OR':
    case 'NAND':
    case 'NOR':
    case 'XOR':
    case 'XNOR':
      return {
        id,
        type,
        label: customLabel || type,
        x: snapX,
        y: snapY,
        width: 72,
        height: 48,
        inputs: [
          { id: `${id}_inA`, name: 'A', type: 'input', x: 0, y: 12, state: 0 },
          { id: `${id}_inB`, name: 'B', type: 'input', x: 0, y: 36, state: 0 },
        ],
        outputs: [{ id: `${id}_out`, name: 'Y', type: 'output', x: 72, y: 24, state: 0 }],
      };

    case 'HALF_ADDER':
      return {
        id,
        type,
        label: customLabel || 'HALF ADDER',
        x: snapX,
        y: snapY,
        width: 96,
        height: 72,
        inputs: [
          { id: `${id}_inA`, name: 'A', type: 'input', x: 0, y: 24, state: 0 },
          { id: `${id}_inB`, name: 'B', type: 'input', x: 0, y: 48, state: 0 },
        ],
        outputs: [
          { id: `${id}_outSum`, name: 'SUM', type: 'output', x: 96, y: 24, state: 0 },
          { id: `${id}_outCout`, name: 'CARRY', type: 'output', x: 96, y: 48, state: 0 },
        ],
      };

    case 'FULL_ADDER':
      return {
        id,
        type,
        label: customLabel || 'FULL ADDER',
        x: snapX,
        y: snapY,
        width: 96,
        height: 96,
        inputs: [
          { id: `${id}_inA`, name: 'A', type: 'input', x: 0, y: 24, state: 0 },
          { id: `${id}_inB`, name: 'B', type: 'input', x: 0, y: 48, state: 0 },
          { id: `${id}_inCin`, name: 'CIN', type: 'input', x: 0, y: 72, state: 0 },
        ],
        outputs: [
          { id: `${id}_outSum`, name: 'SUM', type: 'output', x: 96, y: 24, state: 0 },
          { id: `${id}_outCout`, name: 'COUT', type: 'output', x: 96, y: 72, state: 0 },
        ],
      };

    case 'MUX_2TO1':
      return {
        id,
        type,
        label: customLabel || '2:1 MUX',
        x: snapX,
        y: snapY,
        width: 72,
        height: 72,
        inputs: [
          { id: `${id}_in0`, name: 'I0', type: 'input', x: 0, y: 18, state: 0 },
          { id: `${id}_in1`, name: 'I1', type: 'input', x: 0, y: 42, state: 0 },
          { id: `${id}_sel`, name: 'S', type: 'input', x: 36, y: 72, state: 0 },
        ],
        outputs: [{ id: `${id}_out`, name: 'Y', type: 'output', x: 72, y: 30, state: 0 }],
      };

    case 'D_FLIP_FLOP':
      return {
        id,
        type,
        label: customLabel || 'D FLIP-FLOP',
        x: snapX,
        y: snapY,
        width: 96,
        height: 72,
        inputs: [
          { id: `${id}_inD`, name: 'D', type: 'input', x: 0, y: 24, state: 0 },
          { id: `${id}_inClk`, name: 'CLK', type: 'input', x: 0, y: 48, state: 0 },
        ],
        outputs: [
          { id: `${id}_outQ`, name: 'Q', type: 'output', x: 96, y: 24, state: 0 },
          { id: `${id}_outQBar`, name: "Q'", type: 'output', x: 96, y: 48, state: 1 },
        ],
        state: { q: 0, prevClock: 0 },
      };

    case 'JK_FLIP_FLOP':
      return {
        id,
        type,
        label: customLabel || 'JK FLIP-FLOP',
        x: snapX,
        y: snapY,
        width: 96,
        height: 96,
        inputs: [
          { id: `${id}_inJ`, name: 'J', type: 'input', x: 0, y: 24, state: 0 },
          { id: `${id}_inClk`, name: 'CLK', type: 'input', x: 0, y: 48, state: 0 },
          { id: `${id}_inK`, name: 'K', type: 'input', x: 0, y: 72, state: 0 },
        ],
        outputs: [
          { id: `${id}_outQ`, name: 'Q', type: 'output', x: 96, y: 24, state: 0 },
          { id: `${id}_outQBar`, name: "Q'", type: 'output', x: 96, y: 72, state: 1 },
        ],
        state: { q: 0, prevClock: 0 },
      };

    case 'SR_LATCH':
      return {
        id,
        type,
        label: customLabel || 'SR LATCH',
        x: snapX,
        y: snapY,
        width: 96,
        height: 72,
        inputs: [
          { id: `${id}_inS`, name: 'S', type: 'input', x: 0, y: 24, state: 0 },
          { id: `${id}_inR`, name: 'R', type: 'input', x: 0, y: 48, state: 0 },
        ],
        outputs: [
          { id: `${id}_outQ`, name: 'Q', type: 'output', x: 96, y: 24, state: 0 },
          { id: `${id}_outQBar`, name: "Q'", type: 'output', x: 96, y: 48, state: 1 },
        ],
        state: { q: 0 },
      };

    case 'SEVEN_SEGMENT':
    case 'HEX_DISPLAY':
      return {
        id,
        type: 'HEX_DISPLAY',
        label: customLabel || 'HEX DISP',
        x: snapX,
        y: snapY,
        width: 84,
        height: 120,
        inputs: [
          { id: `${id}_b3`, name: 'D3 (8)', type: 'input', x: 0, y: 24, state: 0 },
          { id: `${id}_b2`, name: 'D2 (4)', type: 'input', x: 0, y: 48, state: 0 },
          { id: `${id}_b1`, name: 'D1 (2)', type: 'input', x: 0, y: 72, state: 0 },
          { id: `${id}_b0`, name: 'D0 (1)', type: 'input', x: 0, y: 96, state: 0 },
        ],
        outputs: [],
        state: { hexValue: '0', segments: [true, true, true, true, true, true, false] },
      };

    default:
      throw new Error(`Unsupported component type: ${type}`);
  }
}

// 7-segment hex decoding map for segments [a, b, c, d, e, f, g]
export const HEX_SEGMENTS_MAP: Record<number, boolean[]> = {
  0: [true, true, true, true, true, true, false],
  1: [false, true, true, false, false, false, false],
  2: [true, true, false, true, true, false, true],
  3: [true, true, true, true, false, false, true],
  4: [false, true, true, false, false, true, true],
  5: [true, false, true, true, false, true, true],
  6: [true, false, true, true, true, true, true],
  7: [true, true, true, false, false, false, false],
  8: [true, true, true, true, true, true, true],
  9: [true, true, true, true, false, true, true],
  10: [true, true, true, false, true, true, true], // A
  11: [false, false, true, true, true, true, true], // b
  12: [true, false, false, true, true, true, false], // C
  13: [false, true, true, true, true, false, true], // d
  14: [true, false, false, true, true, true, true], // E
  15: [true, false, false, false, true, true, true], // F
};

/**
 * Executes a single simulation step across all components and wires.
 * Resolves propagation using multiple relaxation sweeps to settle combinational logic.
 */
export function simulateCircuit(circuit: CircuitData, clockToggled = false): CircuitData {
  const compMap = new Map<string, CircuitComponent>();
  circuit.components.forEach((c) => {
    // Deep clone component
    compMap.set(c.id, {
      ...c,
      inputs: c.inputs.map((p) => ({ ...p })),
      outputs: c.outputs.map((p) => ({ ...p })),
      state: c.state ? { ...c.state } : undefined,
    });
  });

  const wires: Wire[] = circuit.wires.map((w) => ({ ...w }));

  // 1. Update source components (Clocks, switches, VCC, GND)
  compMap.forEach((comp) => {
    if (comp.type === 'VCC') {
      comp.outputs.forEach((o) => (o.state = 1));
    } else if (comp.type === 'GND') {
      comp.outputs.forEach((o) => (o.state = 0));
    } else if (comp.type === 'SWITCH') {
      const val = comp.state?.value ?? 0;
      comp.outputs.forEach((o) => (o.state = val));
    } else if (comp.type === 'PUSH_BUTTON') {
      const val = comp.state?.pressed ? 1 : 0;
      comp.outputs.forEach((o) => (o.state = val));
    } else if (comp.type === 'CLOCK' && clockToggled) {
      const current = comp.state?.value ?? 0;
      const next: LogicState = current === 1 ? 0 : 1;
      if (comp.state) comp.state.value = next;
      comp.outputs.forEach((o) => (o.state = next));
    }
  });

  // 2. Perform relaxation iterations (up to 8 rounds to settle combinational feedback loops)
  for (let round = 0; round < 8; round++) {
    // A. Transfer outputs to inputs through wires
    wires.forEach((wire) => {
      const srcComp = compMap.get(wire.fromComponentId);
      if (!srcComp) return;
      const srcPin = srcComp.outputs.find((p) => p.id === wire.fromPinId);
      if (!srcPin) return;

      wire.state = srcPin.state;

      const dstComp = compMap.get(wire.toComponentId);
      if (!dstComp) return;
      const dstPin = dstComp.inputs.find((p) => p.id === wire.toPinId);
      if (dstPin) {
        dstPin.state = wire.state;
      }
    });

    // B. Evaluate each component's outputs from its inputs
    compMap.forEach((comp) => {
      const inA = comp.inputs[0]?.state ?? 0;
      const inB = comp.inputs[1]?.state ?? 0;
      const inC = comp.inputs[2]?.state ?? 0;

      switch (comp.type) {
        case 'NOT':
          if (comp.outputs[0]) comp.outputs[0].state = inA === 1 ? 0 : 1;
          break;

        case 'BUFFER':
          if (comp.outputs[0]) comp.outputs[0].state = inA;
          break;

        case 'AND':
          if (comp.outputs[0]) comp.outputs[0].state = inA === 1 && inB === 1 ? 1 : 0;
          break;

        case 'OR':
          if (comp.outputs[0]) comp.outputs[0].state = inA === 1 || inB === 1 ? 1 : 0;
          break;

        case 'NAND':
          if (comp.outputs[0]) comp.outputs[0].state = !(inA === 1 && inB === 1) ? 1 : 0;
          break;

        case 'NOR':
          if (comp.outputs[0]) comp.outputs[0].state = !(inA === 1 || inB === 1) ? 1 : 0;
          break;

        case 'XOR':
          if (comp.outputs[0]) comp.outputs[0].state = inA !== inB ? 1 : 0;
          break;

        case 'XNOR':
          if (comp.outputs[0]) comp.outputs[0].state = inA === inB ? 1 : 0;
          break;

        case 'HALF_ADDER': {
          const sum: LogicState = inA !== inB ? 1 : 0;
          const carry: LogicState = inA === 1 && inB === 1 ? 1 : 0;
          if (comp.outputs[0]) comp.outputs[0].state = sum;
          if (comp.outputs[1]) comp.outputs[1].state = carry;
          break;
        }

        case 'FULL_ADDER': {
          const sum: LogicState = ((inA ^ inB) ^ inC) as LogicState;
          const carry: LogicState = (inA & inB) | (inB & inC) | (inA & inC) ? 1 : 0;
          if (comp.outputs[0]) comp.outputs[0].state = sum;
          if (comp.outputs[1]) comp.outputs[1].state = carry;
          break;
        }

        case 'MUX_2TO1': {
          const i0 = comp.inputs.find((p) => p.name === 'I0')?.state ?? 0;
          const i1 = comp.inputs.find((p) => p.name === 'I1')?.state ?? 0;
          const sel = comp.inputs.find((p) => p.name === 'S')?.state ?? 0;
          const out = sel === 1 ? i1 : i0;
          if (comp.outputs[0]) comp.outputs[0].state = out;
          break;
        }

        case 'D_FLIP_FLOP': {
          const dPin = comp.inputs.find((p) => p.name === 'D')?.state ?? 0;
          const clkPin = comp.inputs.find((p) => p.name === 'CLK')?.state ?? 0;
          const prevClk = comp.state?.prevClock ?? 0;
          let q = comp.state?.q ?? 0;

          // Positive edge triggered (0 -> 1)
          if (prevClk === 0 && clkPin === 1) {
            q = dPin;
            if (comp.state) {
              comp.state.q = q;
            }
          }
          if (comp.state) {
            comp.state.prevClock = clkPin;
          }

          if (comp.outputs[0]) comp.outputs[0].state = q;
          if (comp.outputs[1]) comp.outputs[1].state = q === 1 ? 0 : 1;
          break;
        }

        case 'JK_FLIP_FLOP': {
          const jPin = comp.inputs.find((p) => p.name === 'J')?.state ?? 0;
          const clkPin = comp.inputs.find((p) => p.name === 'CLK')?.state ?? 0;
          const kPin = comp.inputs.find((p) => p.name === 'K')?.state ?? 0;
          const prevClk = comp.state?.prevClock ?? 0;
          let q = comp.state?.q ?? 0;

          // Rising edge
          if (prevClk === 0 && clkPin === 1) {
            if (jPin === 0 && kPin === 1) q = 0;
            else if (jPin === 1 && kPin === 0) q = 1;
            else if (jPin === 1 && kPin === 1) q = q === 1 ? 0 : 1; // Toggle
            if (comp.state) comp.state.q = q;
          }
          if (comp.state) comp.state.prevClock = clkPin;

          if (comp.outputs[0]) comp.outputs[0].state = q;
          if (comp.outputs[1]) comp.outputs[1].state = q === 1 ? 0 : 1;
          break;
        }

        case 'SR_LATCH': {
          const sPin = comp.inputs.find((p) => p.name === 'S')?.state ?? 0;
          const rPin = comp.inputs.find((p) => p.name === 'R')?.state ?? 0;
          let q = comp.state?.q ?? 0;
          if (sPin === 1 && rPin === 0) q = 1;
          else if (sPin === 0 && rPin === 1) q = 0;
          // In SR latch S=1, R=1 is invalid/hazard, keep current or 0
          if (comp.state) comp.state.q = q;
          if (comp.outputs[0]) comp.outputs[0].state = q;
          if (comp.outputs[1]) comp.outputs[1].state = q === 1 ? 0 : 1;
          break;
        }

        case 'PROBE':
        case 'LED': {
          const inVal = comp.inputs[0]?.state ?? 0;
          if (comp.state) comp.state.value = inVal;
          break;
        }

        case 'SEVEN_SEGMENT':
        case 'HEX_DISPLAY': {
          const b3 = comp.inputs.find((p) => p.name.includes('D3'))?.state ?? 0;
          const b2 = comp.inputs.find((p) => p.name.includes('D2'))?.state ?? 0;
          const b1 = comp.inputs.find((p) => p.name.includes('D1'))?.state ?? 0;
          const b0 = comp.inputs.find((p) => p.name.includes('D0'))?.state ?? 0;
          const num = (b3 << 3) | (b2 << 2) | (b1 << 1) | b0;
          const hexStr = num.toString(16).toUpperCase();
          const segs = HEX_SEGMENTS_MAP[num] || HEX_SEGMENTS_MAP[0];
          if (comp.state) {
            comp.state.hexValue = hexStr;
            comp.state.segments = segs;
          }
          break;
        }
      }
    });
  }

  // Final sync for wires
  wires.forEach((wire) => {
    const srcComp = compMap.get(wire.fromComponentId);
    if (srcComp) {
      const srcPin = srcComp.outputs.find((p) => p.id === wire.fromPinId);
      if (srcPin) wire.state = srcPin.state;
    }
  });

  return {
    components: Array.from(compMap.values()),
    wires,
  };
}

/**
 * Finds all absolute input pins and output pins in a circuit.
 */
export function getCircuitInterface(circuit: CircuitData) {
  const inputSources = circuit.components.filter(
    (c) => c.type === 'SWITCH' || c.type === 'PUSH_BUTTON' || c.type === 'CLOCK'
  );
  const outputProbes = circuit.components.filter(
    (c) => c.type === 'PROBE' || c.type === 'LED' || c.type === 'HEX_DISPLAY'
  );
  return { inputSources, outputProbes };
}
