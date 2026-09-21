import React from 'react';
import { ChevronDown, ChevronUp, Trash2, Activity, Play, Pause } from 'lucide-react';
import { OscilloscopeTrace } from '../types';

interface OscilloscopeDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  traces: OscilloscopeTrace[];
  onClearHistory: () => void;
  isRunning: boolean;
  onToggleRunning: () => void;
}

export const OscilloscopeDrawer: React.FC<OscilloscopeDrawerProps> = ({
  isOpen,
  onToggle,
  traces,
  onClearHistory,
  isRunning,
  onToggleRunning,
}) => {
  if (!isOpen) return null;

  const maxSamples = 60;
  const stepWidth = 14; // pixels per time step
  const trackHeight = 32; // height per signal channel

  return (
    <div className="h-48 bg-[#0F172A] border-t border-[#1E293B] flex flex-col select-none shrink-0 z-20 overflow-hidden shadow-2xl">
      {/* Scope Header */}
      <div className="h-8 px-3 bg-[#0A0E17] border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span className="font-['Space_Grotesk'] text-xs font-bold text-[#F8FAFC] tracking-wider">
            LOGIC ANALYZER / OSCILLOSCOPE
          </span>
          <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">
            CHANNELS: {traces.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRunning}
            className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#1E293B] hover:bg-[#334155] text-[#DFE2EF] flex items-center gap-1"
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isRunning ? 'FREEZE' : 'ARM'}</span>
          </button>

          <button
            onClick={onClearHistory}
            title="Clear Trace Buffer"
            className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-[#EF4444] flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>

          <button
            onClick={onToggle}
            title="Minimize Drawer"
            className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Waveform Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Signal Labels */}
        <div className="w-36 bg-[#0F172A] border-r border-[#1E293B] divide-y divide-[#1E293B]/60 shrink-0">
          {traces.length === 0 ? (
            <div className="p-3 text-[10px] font-['JetBrains_Mono'] text-[#64748B]">
              No channels active. Add Clock or Probe to sample.
            </div>
          ) : (
            traces.map((trace) => {
              const currentVal = trace.history[trace.history.length - 1] ?? 0;
              return (
                <div
                  key={`${trace.componentId}_${trace.pinId}`}
                  className="h-8 px-2 flex items-center justify-between text-[11px] font-['JetBrains_Mono']"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: trace.color }}
                    />
                    <span className="text-[#DFE2EF] truncate">{trace.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1 rounded ${
                      currentVal === 1
                        ? 'bg-[#06B6D4]/20 text-[#22D3EE]'
                        : 'bg-[#1E293B] text-[#64748B]'
                    }`}
                  >
                    {currentVal}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right Scrollable Waveform Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0A0E17] relative">
          {/* Time Division Grid Rulers */}
          <div className="h-4 border-b border-[#1E293B] flex items-center bg-[#070A10] font-['JetBrains_Mono'] text-[9px] text-[#64748B]">
            {Array.from({ length: maxSamples }).map((_, i) => (
              <div
                key={i}
                style={{ width: `${stepWidth}px` }}
                className="shrink-0 text-center border-r border-[#1E293B]/30"
              >
                {i % 5 === 0 ? `${i * 10}ns` : ''}
              </div>
            ))}
          </div>

          {/* Square Wave Traces */}
          <div className="divide-y divide-[#1E293B]/40">
            {traces.map((trace) => {
              // Build step path
              const history = trace.history.slice(-maxSamples);
              // Pad left if history has fewer items than maxSamples
              const padded = [
                ...Array(Math.max(0, maxSamples - history.length)).fill(0),
                ...history,
              ];

              let pathD = '';
              padded.forEach((val, idx) => {
                const x = idx * stepWidth;
                const y = val === 1 ? 4 : trackHeight - 6; // 1 is high, 0 is low

                if (idx === 0) {
                  pathD = `M ${x} ${y}`;
                } else {
                  const prevVal = padded[idx - 1];
                  const prevY = prevVal === 1 ? 4 : trackHeight - 6;
                  // Sharp perpendicular transition
                  if (prevY !== y) {
                    pathD += ` L ${x} ${prevY} L ${x} ${y}`;
                  } else {
                    pathD += ` L ${x} ${y}`;
                  }
                }
              });

              return (
                <div
                  key={`${trace.componentId}_${trace.pinId}`}
                  style={{ height: `${trackHeight}px` }}
                  className="relative flex items-center"
                >
                  <svg
                    style={{ width: `${maxSamples * stepWidth}px`, height: `${trackHeight}px` }}
                    className="overflow-visible"
                  >
                    {/* Baseline reference */}
                    <line
                      x1="0"
                      y1={trackHeight - 6}
                      x2={maxSamples * stepWidth}
                      y2={trackHeight - 6}
                      stroke="#1E293B"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />

                    {/* Step wave line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={trace.color}
                      strokeWidth="2"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      filter={`drop-shadow(0 0 3px ${trace.color})`}
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
