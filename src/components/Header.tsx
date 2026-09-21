import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Activity,
  Layers,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { PRESET_CIRCUITS } from '../utils/presets';
import { sound } from '../utils/audio';

interface HeaderProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  onStepClock: () => void;
  frequency: number;
  onChangeFrequency: (freq: number) => void;
  onLoadPreset: (presetId: string) => void;
  onClearCircuit: () => void;
  onResetState: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isOscilloscopeOpen: boolean;
  onToggleOscilloscope: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleRunning,
  onStepClock,
  frequency,
  onChangeFrequency,
  onLoadPreset,
  onClearCircuit,
  onResetState,
  onExportJson,
  onImportJson,
  isOscilloscopeOpen,
  onToggleOscilloscope,
  soundEnabled,
  onToggleSound,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="h-14 bg-[#0F172A] border-b border-[#1E293B] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#06B6D4]/10 border border-[#06B6D4]/40 flex items-center justify-center text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Space_Grotesk'] text-sm font-bold tracking-wider text-[#F8FAFC]">
              DIGITAL LOGIC WORKBENCH
            </h1>
            <span className="text-[9px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#1E293B] text-[#94A3B8] border border-[#334155]/60">
              ANSI/IEEE 91
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-['JetBrains_Mono'] text-[#64748B]">
            <span className="inline-flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRunning ? 'bg-[#10B981] animate-pulse shadow-[0_0_6px_#10B981]' : 'bg-[#64748B]'
                }`}
              />
              {isRunning ? 'SIM RUNNING' : 'SIM PAUSED'}
            </span>
            <span>•</span>
            <span>{frequency} Hz CLK</span>
          </div>
        </div>
      </div>

      {/* Center Controls: Simulation Engine */}
      <div className="flex items-center gap-2 bg-[#0A0E17] p-1 rounded-md border border-[#1E293B]">
        <button
          id="btn-run-pause"
          onClick={onToggleRunning}
          title={isRunning ? 'Pause Simulation (Space)' : 'Run Simulation (Space)'}
          className={`px-3 py-1 rounded text-xs font-['JetBrains_Mono'] font-semibold flex items-center gap-1.5 transition-all ${
            isRunning
              ? 'bg-[#06B6D4] text-[#0A0E17] shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC]'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? 'RUNNING' : 'RUN'}</span>
        </button>

        <button
          id="btn-step-clock"
          onClick={onStepClock}
          title="Single Step Simulation Tick (T)"
          className="px-2.5 py-1 rounded text-xs font-['JetBrains_Mono'] bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] flex items-center gap-1 border border-[#334155]/40 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>STEP</span>
        </button>

        <div className="h-4 w-px bg-[#334155]/60 mx-1" />

        <div className="flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] text-[#94A3B8] px-1">
          <label htmlFor="select-freq" className="text-[#64748B]">CLK:</label>
          <select
            id="select-freq"
            value={frequency}
            onChange={(e) => onChangeFrequency(Number(e.target.value))}
            className="bg-[#1E293B] text-[#F8FAFC] border border-[#334155] rounded px-1.5 py-0.5 text-[11px] font-['JetBrains_Mono'] focus:outline-none focus:border-[#06B6D4] cursor-pointer"
          >
            <option value={0.5}>0.5 Hz</option>
            <option value={1}>1.0 Hz</option>
            <option value={2}>2.0 Hz</option>
            <option value={5}>5.0 Hz</option>
            <option value={10}>10 Hz</option>
          </select>
        </div>

        <button
          id="btn-reset-state"
          onClick={onResetState}
          title="Reset Register States"
          className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Controls: Presets, Audio, Waveforms, Import/Export */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-[#0A0E17] px-2 py-1 rounded border border-[#1E293B]">
          <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
          <select
            id="select-presets"
            onChange={(e) => {
              if (e.target.value) {
                onLoadPreset(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="bg-transparent text-xs font-['JetBrains_Mono'] text-[#DFE2EF] focus:outline-none cursor-pointer max-w-[140px] truncate"
          >
            <option value="" disabled className="bg-[#0F172A] text-[#94A3B8]">
              Load Preset...
            </option>
            {PRESET_CIRCUITS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0F172A] text-[#F8FAFC]">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Oscilloscope toggle */}
        <button
          id="btn-toggle-oscilloscope"
          onClick={onToggleOscilloscope}
          title="Toggle Logic Analyzer / Oscilloscope"
          className={`px-2.5 py-1 rounded text-xs font-['JetBrains_Mono'] flex items-center gap-1.5 border transition-all ${
            isOscilloscopeOpen
              ? 'bg-[#06B6D4]/15 border-[#06B6D4] text-[#22D3EE] shadow-[0_0_8px_rgba(6,182,212,0.2)]'
              : 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SCOPE</span>
        </button>

        {/* Tactile Audio SFX toggle */}
        <button
          id="btn-toggle-audio"
          onClick={onToggleSound}
          title={soundEnabled ? 'Relay SFX: Enabled' : 'Relay SFX: Muted'}
          className={`p-1.5 rounded border transition-colors ${
            soundEnabled
              ? 'bg-[#1E293B] border-[#334155] text-[#22D3EE]'
              : 'bg-[#0A0E17] border-[#1E293B] text-[#64748B]'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Export / Import JSON */}
        <button
          id="btn-export-json"
          onClick={onExportJson}
          title="Export Circuit Schema (JSON)"
          className="p-1.5 rounded bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-import-json"
          onClick={() => fileInputRef.current?.click()}
          title="Import Circuit Schema (JSON)"
          className="p-1.5 rounded bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportJson}
          accept=".json"
          className="hidden"
        />

        {/* Clear */}
        <button
          id="btn-clear-canvas"
          onClick={onClearCircuit}
          title="Clear Canvas"
          className="p-1.5 rounded bg-[#1E293B] hover:bg-[#EF4444]/20 border border-[#334155] hover:border-[#EF4444]/50 text-[#94A3B8] hover:text-[#EF4444] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Help */}
        <button
          id="btn-help"
          onClick={() => setShowHelp(true)}
          title="Hardware Testbench Guide"
          className="p-1.5 rounded bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-[#0A0E17]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-[#334155] rounded-lg max-w-lg w-full p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-4">
              <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#06B6D4]" />
                Digital Logic Workbench Guide
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-xs font-['JetBrains_Mono'] text-[#94A3B8] hover:text-[#F8FAFC] px-2 py-1 bg-[#1E293B] rounded"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-4 text-xs font-['Geist'] text-[#DFE2EF] leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <h3 className="font-['JetBrains_Mono'] font-semibold text-[#22D3EE] mb-1">
                  1. Wire Routing & Connections
                </h3>
                <p className="text-[#94A3B8]">
                  Click and drag from any component output terminal (circle on the right) to an input terminal (circle on the left).
                  Traces glow in electric cyan when conducting a HIGH (1) signal.
                </p>
              </div>

              <div>
                <h3 className="font-['JetBrains_Mono'] font-semibold text-[#22D3EE] mb-1">
                  2. Interactive Component Toggling
                </h3>
                <p className="text-[#94A3B8]">
                  Click directly on any <strong>Switch</strong> or <strong>Push Button</strong> to toggle its state.
                  Clocks pulse automatically according to the workbench frequency.
                </p>
              </div>

              <div>
                <h3 className="font-['JetBrains_Mono'] font-semibold text-[#22D3EE] mb-1">
                  3. Truth Table & Karnaugh Map
                </h3>
                <p className="text-[#94A3B8]">
                  Open the right-hand panel to view the live truth table. Click on any truth table row to immediately inject that input combination onto the canvas switches!
                  The K-Map tab visualizes Gray code grouping loops and minimized Sum of Products equations.
                </p>
              </div>

              <div>
                <h3 className="font-['JetBrains_Mono'] font-semibold text-[#22D3EE] mb-1">
                  4. Logic Analyzer Oscilloscope
                </h3>
                <p className="text-[#94A3B8]">
                  Toggle the bottom <strong>SCOPE</strong> drawer to view real-time digital square wave transitions across clock signals, switches, and output probes.
                </p>
              </div>

              <div className="p-3 bg-[#0A0E17] rounded border border-[#1E293B] font-['JetBrains_Mono'] text-[11px] text-[#94A3B8]">
                <span className="text-[#F8FAFC] font-semibold">Shortcuts:</span>
                <ul className="mt-1 space-y-1">
                  <li>• <kbd className="text-[#22D3EE]">Space</kbd>: Run / Pause simulation</li>
                  <li>• <kbd className="text-[#22D3EE]">T</kbd>: Single step clock tick</li>
                  <li>• <kbd className="text-[#22D3EE]">Delete / Backspace</kbd>: Delete selected component or wire</li>
                  <li>• <kbd className="text-[#22D3EE]">Mouse Drag / Wheel</kbd>: Pan canvas and zoom</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
