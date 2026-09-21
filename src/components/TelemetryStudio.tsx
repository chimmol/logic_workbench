import React, { useState, useMemo } from 'react';
import { CircuitComponent, CircuitData, LogicState } from '../types';
import {
  Table,
  Grid,
  Code2,
  Sliders,
  Check,
  Play,
  ArrowRight,
  HelpCircle,
  Wand2,
} from 'lucide-react';
import {
  generateTruthTableFromExpr,
  calculateKMapGroups,
  synthesizeExpressionToCircuit,
  GRAY_CODE_2BIT,
  GRAY_CODE_1BIT,
  simplifyMinterms,
} from '../utils/booleanSolver';

interface TelemetryStudioProps {
  circuit: CircuitData;
  onUpdateCircuit: (circuit: CircuitData) => void;
  selectedComponent: CircuitComponent | null;
  onUpdateComponentLabel: (id: string, newLabel: string) => void;
  onInjectInputVector: (vector: Record<string, LogicState>) => void;
}

type TabType = 'truth_table' | 'kmap' | 'synthesizer' | 'inspector';

export const TelemetryStudio: React.FC<TelemetryStudioProps> = ({
  circuit,
  onUpdateCircuit,
  selectedComponent,
  onUpdateComponentLabel,
  onInjectInputVector,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('truth_table');

  // Synthesizer input state
  const [expressionInput, setExpressionInput] = useState<string>('A & B | ~C');

  // Find all input switches / sources in circuit
  const inputComps = useMemo(
    () => circuit.components.filter((c) => c.type === 'SWITCH' || c.type === 'PUSH_BUTTON'),
    [circuit.components]
  );
  // Find all output probes in circuit
  const outputComps = useMemo(
    () => circuit.components.filter((c) => c.type === 'PROBE' || c.type === 'LED'),
    [circuit.components]
  );

  // K-Map custom minterm state (when manually exploring or synced with expression)
  const [kmapNumVars, setKmapNumVars] = useState<2 | 3>(3);
  const [customMinterms, setCustomMinterms] = useState<number[]>([1, 3, 5, 7]); // default e.g. C

  // Generate truth table from current expression
  const exprAnalysis = useMemo(() => {
    try {
      return generateTruthTableFromExpr(expressionInput);
    } catch {
      return null;
    }
  }, [expressionInput]);

  // Handle synthesize expression to canvas
  const handleSynthesize = () => {
    try {
      const newCircuit = synthesizeExpressionToCircuit(expressionInput);
      onUpdateCircuit(newCircuit);
    } catch {
      // Error parsing
    }
  };

  // K-Map calculation
  const kmapVars = useMemo(() => {
    return kmapNumVars === 2 ? ['A', 'B'] : ['A', 'B', 'C'];
  }, [kmapNumVars]);

  const kmapGroups = useMemo(() => {
    return calculateKMapGroups(kmapVars, customMinterms);
  }, [kmapVars, customMinterms]);

  const minimizedKmapExpr = useMemo(() => {
    return simplifyMinterms(kmapVars, customMinterms);
  }, [kmapVars, customMinterms]);

  const toggleKmapCell = (minterm: number) => {
    setCustomMinterms((prev) =>
      prev.includes(minterm) ? prev.filter((m) => m !== minterm) : [...prev, minterm].sort((a, b) => a - b)
    );
  };

  return (
    <aside className="w-80 bg-[#0F172A] border-l border-[#1E293B] flex flex-col select-none shrink-0 z-20 overflow-hidden">
      {/* Studio Tab Header */}
      <div className="h-10 px-2 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0E17]/60">
        <div className="flex items-center gap-1 w-full">
          <button
            id="tab-truth-table"
            onClick={() => setActiveTab('truth_table')}
            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-['JetBrains_Mono'] flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'truth_table'
                ? 'bg-[#1E293B] text-[#22D3EE] font-semibold border border-[#06B6D4]/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>TABLE</span>
          </button>

          <button
            id="tab-kmap"
            onClick={() => setActiveTab('kmap')}
            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-['JetBrains_Mono'] flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'kmap'
                ? 'bg-[#1E293B] text-[#10B981] font-semibold border border-[#10B981]/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>K-MAP</span>
          </button>

          <button
            id="tab-synthesizer"
            onClick={() => setActiveTab('synthesizer')}
            className={`flex-1 py-1 px-1.5 rounded text-[11px] font-['JetBrains_Mono'] flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'synthesizer'
                ? 'bg-[#1E293B] text-[#F59E0B] font-semibold border border-[#F59E0B]/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Wand2 className="w-3 h-3" />
            <span>SOLVER</span>
          </button>

          <button
            id="tab-inspector"
            onClick={() => setActiveTab('inspector')}
            className={`py-1 px-2 rounded text-[11px] font-['JetBrains_Mono'] flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'inspector'
                ? 'bg-[#1E293B] text-[#F8FAFC] font-semibold border border-[#334155]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            title="Component Inspector"
          >
            <Sliders className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 text-xs font-['Geist'] text-[#DFE2EF]">
        {/* ================= TAB 1: TRUTH TABLE ================= */}
        {activeTab === 'truth_table' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-xs font-bold text-[#F8FAFC] tracking-wider">
                CIRCUIT TRUTH TABLE
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">
                {inputComps.length} IN / {outputComps.length} OUT
              </span>
            </div>

            {inputComps.length === 0 ? (
              <div className="p-4 bg-[#0A0E17] rounded border border-[#1E293B] text-center text-xs text-[#94A3B8] space-y-1">
                <p>No input switches detected on canvas.</p>
                <p className="text-[10px] text-[#64748B]">
                  Add a <strong>Toggle Switch</strong> or load a preset to inspect truth vectors.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] text-[#94A3B8]">
                  Click any row to <strong className="text-[#22D3EE]">inject</strong> that state into the canvas switches.
                </div>

                <div className="border border-[#1E293B] rounded overflow-hidden bg-[#0A0E17]">
                  <table className="w-full text-left font-['JetBrains_Mono'] text-[11px]">
                    <thead className="bg-[#181B25] text-[#94A3B8] border-b border-[#1E293B]">
                      <tr>
                        {inputComps.map((c) => (
                          <th key={c.id} className="p-1.5 text-center text-[#22D3EE]">
                            {c.label}
                          </th>
                        ))}
                        <th className="p-1.5 text-center text-[#334155]">|</th>
                        {outputComps.map((c) => (
                          <th key={c.id} className="p-1.5 text-center text-[#10B981]">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]/40">
                      {/* Enumerate combinations up to 16 rows */}
                      {Array.from({ length: Math.min(16, 1 << inputComps.length) }).map((_, rIdx) => {
                        const rowVals: Record<string, LogicState> = {};
                        inputComps.forEach((c, cIdx) => {
                          const shift = inputComps.length - 1 - cIdx;
                          rowVals[c.id] = ((rIdx >> shift) & 1) as LogicState;
                        });

                        // Check if this row matches the currently active switch state on canvas
                        const isCurrentActive = inputComps.every(
                          (c) => (c.state?.value ?? 0) === rowVals[c.id]
                        );

                        return (
                          <tr
                            key={rIdx}
                            onClick={() => onInjectInputVector(rowVals)}
                            className={`cursor-pointer transition-colors ${
                              isCurrentActive
                                ? 'bg-[#06B6D4]/15 font-bold'
                                : rIdx % 2 === 0
                                ? 'bg-[#0F172A]/50 hover:bg-[#1E293B]'
                                : 'bg-[#0A0E17] hover:bg-[#1E293B]'
                            }`}
                          >
                            {inputComps.map((c) => (
                              <td
                                key={c.id}
                                className={`p-1 text-center ${
                                  rowVals[c.id] === 1 ? 'text-[#22D3EE] font-semibold' : 'text-[#64748B]'
                                }`}
                              >
                                {rowVals[c.id]}
                              </td>
                            ))}
                            <td className="p-1 text-center text-[#334155]">|</td>
                            {outputComps.map((c) => {
                              const val = c.state?.value ?? 0;
                              return (
                                <td
                                  key={c.id}
                                  className={`p-1 text-center ${
                                    val === 1 && isCurrentActive
                                      ? 'text-[#10B981] font-bold'
                                      : 'text-[#64748B]'
                                  }`}
                                >
                                  {isCurrentActive ? val : '·'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: KARNAUGH MAP ================= */}
        {activeTab === 'kmap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-xs font-bold text-[#F8FAFC] tracking-wider">
                KARNAUGH MAP (K-MAP)
              </span>
              <div className="flex items-center gap-1 bg-[#0A0E17] p-0.5 rounded border border-[#1E293B]">
                <button
                  onClick={() => setKmapNumVars(2)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] ${
                    kmapNumVars === 2 ? 'bg-[#10B981] text-[#0A0E17] font-bold' : 'text-[#94A3B8]'
                  }`}
                >
                  2-Var
                </button>
                <button
                  onClick={() => setKmapNumVars(3)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] ${
                    kmapNumVars === 3 ? 'bg-[#10B981] text-[#0A0E17] font-bold' : 'text-[#94A3B8]'
                  }`}
                >
                  3-Var
                </button>
              </div>
            </div>

            {/* Minimized Sum of Products readout */}
            <div className="p-2.5 bg-[#0A0E17] border border-[#1E293B] rounded-md space-y-1">
              <div className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">
                MINIMIZED SUM-OF-PRODUCTS (SOP):
              </div>
              <div className="font-['JetBrains_Mono'] text-sm font-bold text-[#10B981] tracking-wide break-words">
                Y = {minimizedKmapExpr}
              </div>
              <div className="text-[9px] font-['JetBrains_Mono'] text-[#94A3B8]">
                Minterms: {customMinterms.length > 0 ? customMinterms.map((m) => `m${m}`).join(', ') : 'None'}
              </div>
            </div>

            {/* Interactive Grid */}
            <div className="border border-[#1E293B] rounded bg-[#0A0E17] p-2">
              <div className="text-[10px] font-['JetBrains_Mono'] text-[#94A3B8] mb-2 flex items-center justify-between">
                <span>Click cells to toggle 0 / 1</span>
                <button
                  onClick={() => setCustomMinterms([])}
                  className="text-[9px] text-[#64748B] hover:text-[#EF4444]"
                >
                  Clear
                </button>
              </div>

              {kmapNumVars === 2 ? (
                // 2-Variable: Row A, Col B
                <div className="inline-block font-['JetBrains_Mono'] text-xs">
                  <div className="flex items-center">
                    <div className="w-8 h-8 text-[10px] text-[#64748B] flex items-center justify-center">A \ B</div>
                    {GRAY_CODE_1BIT.map((b) => (
                      <div key={b} className="w-12 h-8 text-center text-[#94A3B8] flex items-center justify-center font-bold">
                        {b}
                      </div>
                    ))}
                  </div>

                  {GRAY_CODE_1BIT.map((a, rIdx) => (
                    <div key={a} className="flex items-center">
                      <div className="w-8 h-12 text-center text-[#94A3B8] flex items-center justify-center font-bold">
                        {a}
                      </div>
                      {GRAY_CODE_1BIT.map((b, cIdx) => {
                        const m = (rIdx << 1) | cIdx;
                        const isOne = customMinterms.includes(m);
                        return (
                          <div
                            key={b}
                            onClick={() => toggleKmapCell(m)}
                            className={`w-12 h-12 border border-[#1E293B] flex flex-col items-center justify-center cursor-pointer transition-all ${
                              isOne
                                ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]'
                                : 'bg-[#0F172A] hover:bg-[#1E293B] text-[#475569]'
                            }`}
                          >
                            <span className="text-sm">{isOne ? '1' : '0'}</span>
                            <span className="text-[8px] text-[#64748B]">m{m}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                // 3-Variable: Row A (0, 1), Col BC (00, 01, 11, 10)
                <div className="inline-block font-['JetBrains_Mono'] text-xs overflow-x-auto max-w-full">
                  <div className="flex items-center">
                    <div className="w-8 h-8 text-[9px] text-[#64748B] flex items-center justify-center">A \ BC</div>
                    {GRAY_CODE_2BIT.map((bc) => (
                      <div key={bc} className="w-12 h-8 text-center text-[#94A3B8] flex items-center justify-center font-bold">
                        {bc}
                      </div>
                    ))}
                  </div>

                  {[0, 1].map((a) => (
                    <div key={a} className="flex items-center">
                      <div className="w-8 h-12 text-center text-[#94A3B8] flex items-center justify-center font-bold">
                        {a}
                      </div>
                      {[0, 1, 3, 2].map((bcVal, cIdx) => {
                        const m = (a << 2) | bcVal;
                        const isOne = customMinterms.includes(m);
                        return (
                          <div
                            key={cIdx}
                            onClick={() => toggleKmapCell(m)}
                            className={`w-12 h-12 border border-[#1E293B] flex flex-col items-center justify-center cursor-pointer transition-all ${
                              isOne
                                ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold shadow-[inset_0_0_8px_rgba(16,185,129,0.2)]'
                                : 'bg-[#0F172A] hover:bg-[#1E293B] text-[#475569]'
                            }`}
                          >
                            <span className="text-sm">{isOne ? '1' : '0'}</span>
                            <span className="text-[8px] text-[#64748B]">m{m}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Implicant Groups List */}
            {kmapGroups.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">
                  IDENTIFIED PRIME IMPLICANTS:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {kmapGroups.map((g) => (
                    <span
                      key={g.id}
                      className="px-2 py-0.5 rounded text-[11px] font-['JetBrains_Mono'] bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30"
                    >
                      Term: {g.term} ({g.cells.length} cells)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BOOLEAN SYNTHESIZER ================= */}
        {activeTab === 'synthesizer' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-xs font-bold text-[#F8FAFC] tracking-wider">
                BOOLEAN SYNTHESIZER
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#F59E0B]">
                AUTO-CIRCUIT
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-['JetBrains_Mono'] text-[#94A3B8]">
                Enter Boolean Expression:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={expressionInput}
                  onChange={(e) => setExpressionInput(e.target.value)}
                  placeholder="e.g. A & B | ~C"
                  className="w-full bg-[#0A0E17] text-[#22D3EE] font-['JetBrains_Mono'] text-xs px-3 py-2 rounded border border-[#334155] focus:outline-none focus:border-[#06B6D4] shadow-inner"
                />
              </div>

              {/* Quick symbol buttons */}
              <div className="flex items-center gap-1 text-xs font-['JetBrains_Mono']">
                {['&', '|', '~', '^', "'", '(', ')'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setExpressionInput((prev) => prev + sym)}
                    className="px-2 py-1 bg-[#181B25] hover:bg-[#1E293B] border border-[#1E293B] rounded text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {/* Preset Expressions */}
              <div className="pt-1">
                <div className="text-[10px] font-['JetBrains_Mono'] text-[#64748B] mb-1">
                  PRESET EQUATIONS:
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { label: 'Carry Logic', expr: '(A & B) | (B & C) | (A & C)' },
                    { label: '2-Input XOR', expr: "(A & ~B) | (~A & B)" },
                    { label: 'MUX Equation', expr: "(I0 & ~S) | (I1 & S)" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setExpressionInput(p.expr)}
                      className="text-left px-2 py-1 rounded bg-[#0A0E17] hover:bg-[#1E293B] text-[10px] font-['JetBrains_Mono'] text-[#94A3B8] flex items-center justify-between border border-[#1E293B]"
                    >
                      <span>{p.label}</span>
                      <span className="text-[#22D3EE]">{p.expr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Synthesize Button */}
              <button
                id="btn-synthesize-circuit"
                onClick={handleSynthesize}
                className="w-full mt-2 py-2 px-3 rounded bg-[#06B6D4] hover:bg-[#22D3EE] text-[#0A0E17] font-['JetBrains_Mono'] text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>SYNTHESIZE GATES TO CANVAS</span>
              </button>

              {/* Evaluated Equation summary */}
              {exprAnalysis && (
                <div className="p-2.5 bg-[#0A0E17] border border-[#1E293B] rounded text-[11px] font-['JetBrains_Mono'] space-y-1 mt-2">
                  <div className="text-[#64748B]">ANALYSIS:</div>
                  <div className="text-[#DFE2EF]">
                    Variables: <span className="text-[#22D3EE]">{exprAnalysis.variables.join(', ')}</span>
                  </div>
                  <div className="text-[#DFE2EF]">
                    Simplified SOP: <span className="text-[#10B981]">{exprAnalysis.sopExpression}</span>
                  </div>
                  <div className="text-[#64748B] text-[10px]">
                    Raw: {exprAnalysis.rawSopExpression}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: INSPECTOR ================= */}
        {activeTab === 'inspector' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-['Space_Grotesk'] text-xs font-bold text-[#F8FAFC] tracking-wider">
                COMPONENT INSPECTOR
              </span>
            </div>

            {selectedComponent ? (
              <div className="space-y-3 bg-[#0A0E17] p-3 rounded border border-[#1E293B]">
                <div className="space-y-1">
                  <label className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">COMPONENT LABEL</label>
                  <input
                    type="text"
                    value={selectedComponent.label}
                    onChange={(e) => onUpdateComponentLabel(selectedComponent.id, e.target.value)}
                    className="w-full bg-[#181B25] text-[#F8FAFC] font-['JetBrains_Mono'] text-xs px-2.5 py-1.5 rounded border border-[#334155] focus:outline-none focus:border-[#06B6D4]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-['JetBrains_Mono'] text-[#94A3B8]">
                  <div className="p-2 bg-[#181B25] rounded border border-[#1E293B]">
                    <div className="text-[#64748B]">TYPE</div>
                    <div className="text-[#F8FAFC] font-bold mt-0.5">{selectedComponent.type}</div>
                  </div>
                  <div className="p-2 bg-[#181B25] rounded border border-[#1E293B]">
                    <div className="text-[#64748B]">POSITION</div>
                    <div className="text-[#F8FAFC] font-bold mt-0.5">
                      X:{selectedComponent.x}, Y:{selectedComponent.y}
                    </div>
                  </div>
                </div>

                {/* Pins status */}
                <div className="space-y-1">
                  <div className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">TERMINAL PINS</div>
                  <div className="space-y-1 font-['JetBrains_Mono'] text-[10px]">
                    {selectedComponent.inputs.map((pin) => (
                      <div key={pin.id} className="flex items-center justify-between px-2 py-1 bg-[#181B25] rounded">
                        <span className="text-[#94A3B8]">IN: {pin.name}</span>
                        <span className={pin.state === 1 ? 'text-[#22D3EE] font-bold' : 'text-[#64748B]'}>
                          {pin.state} ({pin.state === 1 ? 'HIGH' : 'LOW'})
                        </span>
                      </div>
                    ))}
                    {selectedComponent.outputs.map((pin) => (
                      <div key={pin.id} className="flex items-center justify-between px-2 py-1 bg-[#181B25] rounded">
                        <span className="text-[#94A3B8]">OUT: {pin.name}</span>
                        <span className={pin.state === 1 ? 'text-[#22D3EE] font-bold' : 'text-[#64748B]'}>
                          {pin.state} ({pin.state === 1 ? 'HIGH' : 'LOW'})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#0A0E17] rounded border border-[#1E293B] text-center text-xs text-[#94A3B8]">
                Click any component on the canvas to inspect and modify its properties.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
