export type LogicState = 0 | 1;

export type ComponentType =
  // Inputs & Power
  | 'SWITCH'
  | 'PUSH_BUTTON'
  | 'CLOCK'
  | 'VCC'
  | 'GND'
  // Basic Gates
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'
  // Sequential & Complex
  | 'D_FLIP_FLOP'
  | 'JK_FLIP_FLOP'
  | 'SR_LATCH'
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'MUX_2TO1'
  // Displays & Indicators
  | 'PROBE'
  | 'LED'
  | 'SEVEN_SEGMENT'
  | 'HEX_DISPLAY';

export interface PinDefinition {
  id: string;
  name: string;
  type: 'input' | 'output';
  // Relative offset in px from component origin (x, y)
  x: number;
  y: number;
  state: LogicState;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // 0, 90, 180, 270
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  state?: {
    // For switches/buttons/clocks
    value?: LogicState;
    pressed?: boolean;
    frequency?: number; // Hz for clock
    lastToggleTime?: number;
    // Internal state for flip-flops (Q, prevClock)
    q?: LogicState;
    prevClock?: LogicState;
    // For 7-segment display (7 segments a-g)
    segments?: boolean[];
    hexValue?: string;
  };
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  state: LogicState;
}

export interface CircuitData {
  components: CircuitComponent[];
  wires: Wire[];
}

export interface OscilloscopeTrace {
  componentId: string;
  pinId: string;
  label: string;
  color: string;
  history: LogicState[]; // up to 100 historical sample steps
}

export interface TruthTableRow {
  inputs: Record<string, LogicState>;
  outputs: Record<string, LogicState>;
}

export interface KMapGroup {
  id: string;
  term: string; // e.g., "A'B"
  cells: [number, number][]; // [row, col] coordinates
  color: string;
}
