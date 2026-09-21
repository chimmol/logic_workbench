import { CircuitData } from '../types';
import { createComponent } from './circuitEngine';

export interface PresetCircuit {
  id: string;
  name: string;
  category: string;
  description: string;
  build: () => CircuitData;
}

export const PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: 'half_full_adder',
    name: 'Full Adder with Probes',
    category: 'Arithmetic',
    description: '1-bit full adder computing Sum = A ^ B ^ Cin, Cout = (A & B) | (Cin & (A ^ B)).',
    build: () => {
      const swA = createComponent('SWITCH', 96, 96, 'A');
      const swB = createComponent('SWITCH', 96, 192, 'B');
      const swCin = createComponent('SWITCH', 96, 288, 'Cin');

      const fa = createComponent('FULL_ADDER', 288, 144, '74HC283 FA');

      const probeSum = createComponent('PROBE', 504, 144, 'SUM (S)');
      const probeCout = createComponent('PROBE', 504, 216, 'CARRY (Cout)');

      const wires: CircuitData['wires'] = [
        {
          id: 'w_fa_a',
          fromComponentId: swA.id,
          fromPinId: swA.outputs[0].id,
          toComponentId: fa.id,
          toPinId: fa.inputs[0].id,
          state: 0,
        },
        {
          id: 'w_fa_b',
          fromComponentId: swB.id,
          fromPinId: swB.outputs[0].id,
          toComponentId: fa.id,
          toPinId: fa.inputs[1].id,
          state: 0,
        },
        {
          id: 'w_fa_cin',
          fromComponentId: swCin.id,
          fromPinId: swCin.outputs[0].id,
          toComponentId: fa.id,
          toPinId: fa.inputs[2].id,
          state: 0,
        },
        {
          id: 'w_fa_sum',
          fromComponentId: fa.id,
          fromPinId: fa.outputs[0].id,
          toComponentId: probeSum.id,
          toPinId: probeSum.inputs[0].id,
          state: 0,
        },
        {
          id: 'w_fa_cout',
          fromComponentId: fa.id,
          fromPinId: fa.outputs[1].id,
          toComponentId: probeCout.id,
          toPinId: probeCout.inputs[0].id,
          state: 0,
        },
      ];

      return {
        components: [swA, swB, swCin, fa, probeSum, probeCout],
        wires,
      };
    },
  },
  {
    id: 'd_flip_flop_clock',
    name: 'D Flip-Flop Register',
    category: 'Sequential',
    description: 'Positive-edge triggered D flip-flop with clock generator and inverted feedback toggle (T-Flip-Flop mode).',
    build: () => {
      const clk = createComponent('CLOCK', 96, 168, 'CLK (1Hz)');
      const dff = createComponent('D_FLIP_FLOP', 288, 144, '74HC74 DFF');
      const probeQ = createComponent('PROBE', 480, 144, 'Q');
      const probeQBar = createComponent('PROBE', 480, 216, "Q'");

      const wires: CircuitData['wires'] = [
        // Connect clock to DFF CLK
        {
          id: 'w_clk_dff',
          fromComponentId: clk.id,
          fromPinId: clk.outputs[0].id,
          toComponentId: dff.id,
          toPinId: dff.inputs[1].id,
          state: 0,
        },
        // Inverted feedback: Q' connected to D for toggle divide-by-2
        {
          id: 'w_qbar_to_d',
          fromComponentId: dff.id,
          fromPinId: dff.outputs[1].id,
          toComponentId: dff.id,
          toPinId: dff.inputs[0].id,
          state: 1,
        },
        // Probes
        {
          id: 'w_q_probe',
          fromComponentId: dff.id,
          fromPinId: dff.outputs[0].id,
          toComponentId: probeQ.id,
          toPinId: probeQ.inputs[0].id,
          state: 0,
        },
        {
          id: 'w_qbar_probe',
          fromComponentId: dff.id,
          fromPinId: dff.outputs[1].id,
          toComponentId: probeQBar.id,
          toPinId: probeQBar.inputs[0].id,
          state: 1,
        },
      ];

      return {
        components: [clk, dff, probeQ, probeQBar],
        wires,
      };
    },
  },
  {
    id: 'hex_display_counter',
    name: '4-Bit Binary Inputs to 7-Segment Display',
    category: 'Displays',
    description: '4-bit weighted binary inputs (D3:8, D2:4, D1:2, D0:1) decoded to a glowing 7-segment hex character.',
    build: () => {
      const sw3 = createComponent('SWITCH', 96, 96, 'D3 (8)');
      const sw2 = createComponent('SWITCH', 96, 168, 'D2 (4)');
      const sw1 = createComponent('SWITCH', 96, 240, 'D1 (2)');
      const sw0 = createComponent('SWITCH', 96, 312, 'D0 (1)');

      // Turn on sw1 & sw3 for number 10 ('A') default
      if (sw3.state) sw3.state.value = 1;
      sw3.outputs[0].state = 1;
      if (sw1.state) sw1.state.value = 1;
      sw1.outputs[0].state = 1;

      const hexDisp = createComponent('HEX_DISPLAY', 336, 144, '74LS47 HEX');

      const wires: CircuitData['wires'] = [
        {
          id: 'w_b3',
          fromComponentId: sw3.id,
          fromPinId: sw3.outputs[0].id,
          toComponentId: hexDisp.id,
          toPinId: hexDisp.inputs[0].id,
          state: 1,
        },
        {
          id: 'w_b2',
          fromComponentId: sw2.id,
          fromPinId: sw2.outputs[0].id,
          toComponentId: hexDisp.id,
          toPinId: hexDisp.inputs[1].id,
          state: 0,
        },
        {
          id: 'w_b1',
          fromComponentId: sw1.id,
          fromPinId: sw1.outputs[0].id,
          toComponentId: hexDisp.id,
          toPinId: hexDisp.inputs[2].id,
          state: 1,
        },
        {
          id: 'w_b0',
          fromComponentId: sw0.id,
          fromPinId: sw0.outputs[0].id,
          toComponentId: hexDisp.id,
          toPinId: hexDisp.inputs[3].id,
          state: 0,
        },
      ];

      return {
        components: [sw3, sw2, sw1, sw0, hexDisp],
        wires,
      };
    },
  },
  {
    id: 'nand_xor',
    name: 'XOR from 4 NAND Gates',
    category: 'Universal Gates',
    description: 'Demonstrates universal logic: 4 NAND gates synthesize an XOR function (A ^ B).',
    build: () => {
      const swA = createComponent('SWITCH', 72, 120, 'A');
      const swB = createComponent('SWITCH', 72, 264, 'B');

      const nand1 = createComponent('NAND', 216, 192, 'NAND 1');
      const nand2 = createComponent('NAND', 360, 120, 'NAND 2');
      const nand3 = createComponent('NAND', 360, 264, 'NAND 3');
      const nand4 = createComponent('NAND', 504, 192, 'NAND 4');

      const probe = createComponent('PROBE', 648, 192, 'Y = A ^ B');

      const wires: CircuitData['wires'] = [
        // swA to NAND1 pin A, NAND2 pin A
        {
          id: 'w_a_n1',
          fromComponentId: swA.id,
          fromPinId: swA.outputs[0].id,
          toComponentId: nand1.id,
          toPinId: nand1.inputs[0].id,
          state: 0,
        },
        {
          id: 'w_a_n2',
          fromComponentId: swA.id,
          fromPinId: swA.outputs[0].id,
          toComponentId: nand2.id,
          toPinId: nand2.inputs[0].id,
          state: 0,
        },
        // swB to NAND1 pin B, NAND3 pin B
        {
          id: 'w_b_n1',
          fromComponentId: swB.id,
          fromPinId: swB.outputs[0].id,
          toComponentId: nand1.id,
          toPinId: nand1.inputs[1].id,
          state: 0,
        },
        {
          id: 'w_b_n3',
          fromComponentId: swB.id,
          fromPinId: swB.outputs[0].id,
          toComponentId: nand3.id,
          toPinId: nand3.inputs[1].id,
          state: 0,
        },
        // NAND1 out to NAND2 pin B, NAND3 pin A
        {
          id: 'w_n1_n2',
          fromComponentId: nand1.id,
          fromPinId: nand1.outputs[0].id,
          toComponentId: nand2.id,
          toPinId: nand2.inputs[1].id,
          state: 1,
        },
        {
          id: 'w_n1_n3',
          fromComponentId: nand1.id,
          fromPinId: nand1.outputs[0].id,
          toComponentId: nand3.id,
          toPinId: nand3.inputs[0].id,
          state: 1,
        },
        // NAND2 & NAND3 out to NAND4
        {
          id: 'w_n2_n4',
          fromComponentId: nand2.id,
          fromPinId: nand2.outputs[0].id,
          toComponentId: nand4.id,
          toPinId: nand4.inputs[0].id,
          state: 0,
        },
        {
          id: 'w_n3_n4',
          fromComponentId: nand3.id,
          fromPinId: nand3.outputs[0].id,
          toComponentId: nand4.id,
          toPinId: nand4.inputs[1].id,
          state: 0,
        },
        // NAND4 to Probe
        {
          id: 'w_n4_out',
          fromComponentId: nand4.id,
          fromPinId: nand4.outputs[0].id,
          toComponentId: probe.id,
          toPinId: probe.inputs[0].id,
          state: 0,
        },
      ];

      return {
        components: [swA, swB, nand1, nand2, nand3, nand4, probe],
        wires,
      };
    },
  },
  {
    id: 'mux_selector',
    name: '2:1 Data Multiplexer',
    category: 'Multiplexers',
    description: 'Selects between data line I0 and I1 based on select control pin S.',
    build: () => {
      const sw0 = createComponent('SWITCH', 96, 96, 'Data I0');
      const sw1 = createComponent('SWITCH', 96, 192, 'Data I1');
      const swSel = createComponent('SWITCH', 96, 312, 'Select (S)');

      const mux = createComponent('MUX_2TO1', 288, 144, '74HC157 MUX');
      const probe = createComponent('PROBE', 456, 168, 'OUT (Y)');

      if (sw1.state) sw1.state.value = 1;
      sw1.outputs[0].state = 1;

      const wires: CircuitData['wires'] = [
        {
          id: 'w_m_i0',
          fromComponentId: sw0.id,
          fromPinId: sw0.outputs[0].id,
          toComponentId: mux.id,
          toPinId: mux.inputs[0].id,
          state: 0,
        },
        {
          id: 'w_m_i1',
          fromComponentId: sw1.id,
          fromPinId: sw1.outputs[0].id,
          toComponentId: mux.id,
          toPinId: mux.inputs[1].id,
          state: 1,
        },
        {
          id: 'w_m_sel',
          fromComponentId: swSel.id,
          fromPinId: swSel.outputs[0].id,
          toComponentId: mux.id,
          toPinId: mux.inputs[2].id,
          state: 0,
        },
        {
          id: 'w_m_out',
          fromComponentId: mux.id,
          fromPinId: mux.outputs[0].id,
          toComponentId: probe.id,
          toPinId: probe.inputs[0].id,
          state: 0,
        },
      ];

      return {
        components: [sw0, sw1, swSel, mux, probe],
        wires,
      };
    },
  },
];
