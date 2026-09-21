import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircuitComponent, CircuitData, ComponentType, LogicState, OscilloscopeTrace } from './types';
import { Header } from './components/Header';
import { ComponentPalette } from './components/ComponentPalette';
import { CircuitCanvas } from './components/CircuitCanvas';
import { TelemetryStudio } from './components/TelemetryStudio';
import { OscilloscopeDrawer } from './components/OscilloscopeDrawer';
import { PRESET_CIRCUITS } from './utils/presets';
import { createComponent, simulateCircuit } from './utils/circuitEngine';
import { sound } from './utils/audio';

const TRACE_COLORS = ['#22D3EE', '#10B981', '#F59E0B', '#A855F7', '#EC4899', '#38BDF8'];

export default function App() {
  // Initial circuit: load the Full Adder preset so the user sees a rich, functional instrumentation screen immediately!
  const [circuit, setCircuit] = useState<CircuitData>(() => PRESET_CIRCUITS[0].build());
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [frequency, setFrequency] = useState<number>(1); // Hz
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isOscilloscopeOpen, setIsOscilloscopeOpen] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Oscilloscope traces
  const [traces, setTraces] = useState<OscilloscopeTrace[]>([]);

  // Selected component
  const selectedComponent = circuit.components.find((c) => c.id === selectedComponentId) || null;

  // Sound engine sync
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  // Sync oscilloscope channels with monitored components (Clocks, switches, probes)
  useEffect(() => {
    setTraces((prevTraces) => {
      const monitoredComps = circuit.components.filter(
        (c) => c.type === 'CLOCK' || c.type === 'SWITCH' || c.type === 'PROBE' || c.type === 'LED'
      );

      return monitoredComps.map((comp, idx) => {
        const pinId = comp.outputs[0]?.id || comp.inputs[0]?.id || 'p0';
        const existing = prevTraces.find(
          (t) => t.componentId === comp.id && t.pinId === pinId
        );

        return {
          componentId: comp.id,
          pinId,
          label: comp.label || comp.type,
          color: TRACE_COLORS[idx % TRACE_COLORS.length],
          history: existing ? existing.history : Array(30).fill(0),
        };
      });
    });
  }, [circuit.components.length]);

  // Simulation tick step
  const executeSimulationStep = useCallback(
    (clockToggled: boolean) => {
      setCircuit((current) => {
        const nextCircuit = simulateCircuit(current, clockToggled);

        // Update oscilloscope trace samples
        setTraces((prevTraces) => {
          return prevTraces.map((trace) => {
            const comp = nextCircuit.components.find((c) => c.id === trace.componentId);
            let stateVal: LogicState = 0;
            if (comp) {
              const pin = [...comp.inputs, ...comp.outputs].find((p) => p.id === trace.pinId);
              stateVal = pin ? pin.state : comp.state?.value ?? 0;
            }
            const updatedHist = [...trace.history.slice(-59), stateVal];
            return {
              ...trace,
              history: updatedHist,
            };
          });
        });

        if (clockToggled && soundEnabled) {
          sound.playClockTick();
        }

        return nextCircuit;
      });
    },
    [soundEnabled]
  );

  // Simulation loop timer
  useEffect(() => {
    if (!isRunning) return;

    // Run half period ticks to toggle clock high and low
    const intervalMs = Math.max(50, (1000 / frequency) / 2);
    const timer = setInterval(() => {
      executeSimulationStep(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, frequency, executeSimulationStep]);

  // Global hotkeys (Space to run/pause, T to step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        executeSimulationStep(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executeSimulationStep]);

  // Actions
  const handleToggleSwitch = (componentId: string) => {
    setCircuit((current) => {
      const comp = current.components.find((c) => c.id === componentId);
      if (!comp || comp.type !== 'SWITCH') return current;

      const currentVal = comp.state?.value ?? 0;
      const nextVal: LogicState = currentVal === 1 ? 0 : 1;

      sound.playRelayClick(nextVal);

      const newComps = current.components.map((c) =>
        c.id === componentId
          ? {
              ...c,
              state: { ...c.state, value: nextVal },
              outputs: c.outputs.map((o) => ({ ...o, state: nextVal })),
            }
          : c
      );

      return simulateCircuit({ components: newComps, wires: current.wires });
    });
  };

  const handlePressButton = (componentId: string, pressed: boolean) => {
    setCircuit((current) => {
      const comp = current.components.find((c) => c.id === componentId);
      if (!comp || comp.type !== 'PUSH_BUTTON') return current;

      const val: LogicState = pressed ? 1 : 0;
      if (pressed && soundEnabled) {
        sound.playRelayClick(1);
      }

      const newComps = current.components.map((c) =>
        c.id === componentId
          ? {
              ...c,
              state: { ...c.state, pressed, value: val },
              outputs: c.outputs.map((o) => ({ ...o, state: val })),
            }
          : c
      );

      return simulateCircuit({ components: newComps, wires: current.wires });
    });
  };

  const handleAddComponentAt = (type: ComponentType, x: number, y: number) => {
    const newComp = createComponent(type, x, y);
    setCircuit((current) => {
      const updated = {
        components: [...current.components, newComp],
        wires: current.wires,
      };
      return simulateCircuit(updated);
    });
    setSelectedComponentId(newComp.id);
  };

  const handleAddFromPalette = (type: ComponentType) => {
    // Add near center of canvas viewport
    const x = 360 + Math.round((Math.random() * 48 - 24) / 24) * 24;
    const y = 240 + Math.round((Math.random() * 48 - 24) / 24) * 24;
    handleAddComponentAt(type, x, y);
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_CIRCUITS.find((p) => p.id === presetId);
    if (preset) {
      const newCircuit = preset.build();
      setCircuit(simulateCircuit(newCircuit));
      setSelectedComponentId(null);
    }
  };

  const handleClearCircuit = () => {
    setCircuit({ components: [], wires: [] });
    setSelectedComponentId(null);
  };

  const handleResetState = () => {
    setCircuit((current) => {
      const resetComps: CircuitComponent[] = current.components.map((c) => {
        if (c.type === 'SWITCH') {
          return {
            ...c,
            state: { ...c.state, value: 0 as LogicState },
            outputs: c.outputs.map((o) => ({ ...o, state: 0 as LogicState })),
          };
        }
        if (c.type === 'D_FLIP_FLOP' || c.type === 'JK_FLIP_FLOP' || c.type === 'SR_LATCH') {
          return {
            ...c,
            state: { ...c.state, q: 0 as LogicState, prevClock: 0 as LogicState },
            outputs: c.outputs.map((o, idx) => ({ ...o, state: (idx === 0 ? 0 : 1) as LogicState })),
          };
        }
        return c;
      });
      return simulateCircuit({ components: resetComps, wires: current.wires });
    });
  };

  const handleUpdateComponentLabel = (id: string, newLabel: string) => {
    setCircuit((current) => ({
      ...current,
      components: current.components.map((c) => (c.id === id ? { ...c, label: newLabel } : c)),
    }));
  };

  const handleInjectInputVector = (vector: Record<string, LogicState>) => {
    setCircuit((current) => {
      const newComps = current.components.map((c) => {
        if (vector[c.id] !== undefined) {
          const val = vector[c.id];
          return {
            ...c,
            state: { ...c.state, value: val },
            outputs: c.outputs.map((o) => ({ ...o, state: val })),
          };
        }
        return c;
      });
      sound.playRelayClick(1);
      return simulateCircuit({ components: newComps, wires: current.wires });
    });
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(circuit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `digital_circuit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.components && parsed.wires) {
            setCircuit(simulateCircuit(parsed));
          }
        } catch {
          // invalid json
        }
      };
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0E17] text-[#DFE2EF] overflow-hidden">
      {/* Instrumentation Top Header */}
      <Header
        isRunning={isRunning}
        onToggleRunning={() => setIsRunning((prev) => !prev)}
        onStepClock={() => executeSimulationStep(true)}
        frequency={frequency}
        onChangeFrequency={setFrequency}
        onLoadPreset={handleLoadPreset}
        onClearCircuit={handleClearCircuit}
        onResetState={handleResetState}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        isOscilloscopeOpen={isOscilloscopeOpen}
        onToggleOscilloscope={() => setIsOscilloscopeOpen((prev) => !prev)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main 3-Pane Workbench Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Component & IC Palette */}
        <ComponentPalette onAddComponent={handleAddFromPalette} />

        {/* Center: Infinite Schematic Canvas Plane */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <CircuitCanvas
            circuit={circuit}
            onUpdateCircuit={(newCircuit) => setCircuit(simulateCircuit(newCircuit))}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
            onToggleSwitch={handleToggleSwitch}
            onPressButton={handlePressButton}
            onAddComponentAt={handleAddComponentAt}
          />

          {/* Bottom: Logic Analyzer Waveform Oscilloscope Drawer */}
          <OscilloscopeDrawer
            isOpen={isOscilloscopeOpen}
            onToggle={() => setIsOscilloscopeOpen((prev) => !prev)}
            traces={traces}
            onClearHistory={() =>
              setTraces((prev) => prev.map((t) => ({ ...t, history: Array(30).fill(0) })))
            }
            isRunning={isRunning}
            onToggleRunning={() => setIsRunning((prev) => !prev)}
          />
        </div>

        {/* Right: Telemetry & Simplifier Studio */}
        <TelemetryStudio
          circuit={circuit}
          onUpdateCircuit={(newCircuit) => setCircuit(simulateCircuit(newCircuit))}
          selectedComponent={selectedComponent}
          onUpdateComponentLabel={handleUpdateComponentLabel}
          onInjectInputVector={handleInjectInputVector}
        />
      </div>
    </div>
  );
}
