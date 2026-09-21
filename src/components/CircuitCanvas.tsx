import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CircuitComponent, CircuitData, ComponentType, PinDefinition, Wire } from '../types';
import { GateSymbol } from './GateSymbol';
import { ZoomIn, ZoomOut, Maximize2, Trash2, Crosshair } from 'lucide-react';

interface CircuitCanvasProps {
  circuit: CircuitData;
  onUpdateCircuit: (circuit: CircuitData) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onToggleSwitch: (componentId: string) => void;
  onPressButton: (componentId: string, pressed: boolean) => void;
  onAddComponentAt: (type: ComponentType, x: number, y: number) => void;
}

interface DragState {
  type: 'component' | 'pan' | 'wire';
  compId?: string;
  pin?: PinDefinition;
  startX: number;
  startY: number;
  initialCompX?: number;
  initialCompY?: number;
  currentMouseX: number;
  currentMouseY: number;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  onUpdateCircuit,
  selectedComponentId,
  onSelectComponent,
  onToggleSwitch,
  onPressButton,
  onAddComponentAt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 48, y: 48 });
  const [zoom, setZoom] = useState<number>(1);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Convert mouse screen coordinates to canvas world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setPan({ x: 48, y: 48 });
    setZoom(1);
  };

  // Keyboard delete listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          // Remove component and connected wires
          const newComps = circuit.components.filter((c) => c.id !== selectedComponentId);
          const newWires = circuit.wires.filter(
            (w) => w.fromComponentId !== selectedComponentId && w.toComponentId !== selectedComponentId
          );
          onUpdateCircuit({ components: newComps, wires: newWires });
          onSelectComponent(null);
        } else if (selectedWireId) {
          // Remove wire
          const newWires = circuit.wires.filter((w) => w.id !== selectedWireId);
          onUpdateCircuit({ components: circuit.components, wires: newWires });
          setSelectedWireId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [circuit, selectedComponentId, selectedWireId, onUpdateCircuit, onSelectComponent]);

  // Handle Wheel for zoom & pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
      handleZoom(zoomFactor);
    } else {
      // Pan
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Start panning on canvas background
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only left click or middle click
    if (e.button === 0 || e.button === 1) {
      onSelectComponent(null);
      setSelectedWireId(null);
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        currentMouseX: e.clientX,
        currentMouseY: e.clientY,
      });
    }
  };

  // Start dragging component
  const handleComponentMouseDown = (e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    onSelectComponent(comp.id);
    setSelectedWireId(null);

    const world = screenToWorld(e.clientX, e.clientY);
    setDragState({
      type: 'component',
      compId: comp.id,
      startX: world.x,
      startY: world.y,
      initialCompX: comp.x,
      initialCompY: comp.y,
      currentMouseX: world.x,
      currentMouseY: world.y,
    });
  };

  // Start dragging wire from a pin
  const handlePinMouseDown = (e: React.MouseEvent, compId: string, pin: PinDefinition) => {
    e.stopPropagation();
    const world = screenToWorld(e.clientX, e.clientY);
    setDragState({
      type: 'wire',
      compId,
      pin,
      startX: world.x,
      startY: world.y,
      currentMouseX: world.x,
      currentMouseY: world.y,
    });
  };

  // End wire drag on a pin
  const handlePinMouseUp = (e: React.MouseEvent, targetCompId: string, targetPin: PinDefinition) => {
    e.stopPropagation();
    if (!dragState || dragState.type !== 'wire' || !dragState.compId || !dragState.pin) return;

    const sourceCompId = dragState.compId;
    const sourcePin = dragState.pin;

    // Prevent connecting to same component
    if (sourceCompId === targetCompId) {
      setDragState(null);
      return;
    }

    // Determine fromPin (output) and toPin (input)
    let fromCompId = sourceCompId;
    let fromPinId = sourcePin.id;
    let toCompId = targetCompId;
    let toPinId = targetPin.id;

    if (sourcePin.type === 'input' && targetPin.type === 'output') {
      fromCompId = targetCompId;
      fromPinId = targetPin.id;
      toCompId = sourceCompId;
      toPinId = sourcePin.id;
    } else if (sourcePin.type === 'output' && targetPin.type === 'input') {
      // Valid direction
    } else {
      // Can't connect input to input or output to output
      setDragState(null);
      return;
    }

    // Remove any existing wire to the destination input (inputs only accept 1 wire in standard logic)
    const filteredWires = circuit.wires.filter(
      (w) => !(w.toComponentId === toCompId && w.toPinId === toPinId)
    );

    const newWire: Wire = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromComponentId: fromCompId,
      fromPinId,
      toComponentId: toCompId,
      toPinId,
      state: sourcePin.state,
    };

    onUpdateCircuit({
      components: circuit.components,
      wires: [...filteredWires, newWire],
    });

    setDragState(null);
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState) return;

    if (dragState.type === 'pan') {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragState((prev) => prev && { ...prev, startX: e.clientX, startY: e.clientY });
    } else if (dragState.type === 'component' && dragState.compId) {
      const world = screenToWorld(e.clientX, e.clientY);
      const dx = world.x - dragState.startX;
      const dy = world.y - dragState.startY;

      const newX = Math.round(((dragState.initialCompX ?? 0) + dx) / 24) * 24;
      const newY = Math.round(((dragState.initialCompY ?? 0) + dy) / 24) * 24;

      const newComps = circuit.components.map((c) =>
        c.id === dragState.compId ? { ...c, x: Math.max(0, newX), y: Math.max(0, newY) } : c
      );
      onUpdateCircuit({ components: newComps, wires: circuit.wires });
    } else if (dragState.type === 'wire') {
      const world = screenToWorld(e.clientX, e.clientY);
      setDragState((prev) => prev && { ...prev, currentMouseX: world.x, currentMouseY: world.y });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  // Drag & drop from palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/component-type') as ComponentType;
    if (type) {
      const world = screenToWorld(e.clientX, e.clientY);
      onAddComponentAt(type, world.x, world.y);
    }
  };

  // Helper to get pin coordinate in canvas space
  const getPinPos = (compId: string, pinId: string) => {
    const comp = circuit.components.find((c) => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const pin = [...comp.inputs, ...comp.outputs].find((p) => p.id === pinId);
    if (!pin) return { x: comp.x, y: comp.y };
    return {
      x: comp.x + pin.x,
      y: comp.y + pin.y,
    };
  };

  // Render SVG wire curve
  const renderWirePath = (wire: Wire) => {
    const start = getPinPos(wire.fromComponentId, wire.fromPinId);
    const end = getPinPos(wire.toComponentId, wire.toPinId);
    const isSelected = wire.id === selectedWireId;
    const isHigh = wire.state === 1;

    // Smooth horizontal bezier wire
    const dx = Math.abs(end.x - start.x) * 0.5;
    const pathData = `M ${start.x} ${start.y} C ${start.x + Math.max(24, dx)} ${start.y}, ${
      end.x - Math.max(24, dx)
    } ${end.y}, ${end.x} ${end.y}`;

    return (
      <g
        key={wire.id}
        className="cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedWireId(wire.id);
          onSelectComponent(null);
        }}
      >
        {/* Transparent thick hit area for easy clicking */}
        <path d={pathData} fill="none" stroke="transparent" strokeWidth="14" />

        {/* Glow halo when signal is HIGH */}
        {isHigh && (
          <path
            d={pathData}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="6"
            strokeOpacity="0.25"
            strokeLinecap="round"
            className="transition-all"
          />
        )}

        {/* Main wire trace */}
        <path
          d={pathData}
          fill="none"
          stroke={isSelected ? '#F59E0B' : isHigh ? '#22D3EE' : '#334155'}
          strokeWidth={isSelected ? '2.5' : isHigh ? '2' : '1.5'}
          strokeLinecap="round"
          strokeDasharray={isSelected ? '4 2' : undefined}
          filter={isHigh ? 'drop-shadow(0 0 4px #06B6D4)' : undefined}
          className="transition-colors group-hover:stroke-[#22D3EE]"
        />

        {/* Terminal solder dots at start & end */}
        <circle cx={start.x} cy={start.y} r="3" fill={isHigh ? '#22D3EE' : '#475569'} />
        <circle cx={end.x} cy={end.y} r="3" fill={isHigh ? '#22D3EE' : '#475569'} />
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex-1 h-full w-full overflow-hidden bg-[#0A0E17] select-none cursor-default"
      style={{
        backgroundImage: 'radial-gradient(circle, #1E293B 1.2px, transparent 1.2px)',
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Floating Canvas View Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-[#0F172A]/80 backdrop-blur-md p-1 rounded-md border border-[#1E293B] shadow-lg">
        <button
          onClick={() => handleZoom(0.15)}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-['JetBrains_Mono'] text-[#94A3B8] px-1 w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => handleZoom(-0.15)}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="h-3 w-px bg-[#334155]/60 mx-0.5" />
        <button
          onClick={resetView}
          title="Reset View"
          className="p-1.5 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Delete quick action if item is selected */}
      {(selectedComponentId || selectedWireId) && (
        <div className="absolute top-3 left-36 z-10 flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/40 px-2.5 py-1 rounded-md backdrop-blur-sm shadow-md animate-in fade-in duration-150">
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#F8FAFC]">
            {selectedComponentId ? 'Component Selected' : 'Wire Selected'}
          </span>
          <button
            onClick={() => {
              if (selectedComponentId) {
                const newComps = circuit.components.filter((c) => c.id !== selectedComponentId);
                const newWires = circuit.wires.filter(
                  (w) => w.fromComponentId !== selectedComponentId && w.toComponentId !== selectedComponentId
                );
                onUpdateCircuit({ components: newComps, wires: newWires });
                onSelectComponent(null);
              } else if (selectedWireId) {
                const newWires = circuit.wires.filter((w) => w.id !== selectedWireId);
                onUpdateCircuit({ components: circuit.components, wires: newWires });
                setSelectedWireId(null);
              }
            }}
            className="px-2 py-0.5 rounded bg-[#EF4444] text-[#0A0E17] font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1 hover:bg-[#ff5c5c] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>DELETE</span>
          </button>
        </div>
      )}

      {/* Main SVG Render Stage */}
      <svg className="w-full h-full pointer-events-auto">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Layer 1: Wires */}
          {circuit.wires.map(renderWirePath)}

          {/* Layer 2: Wire under construction preview */}
          {dragState && dragState.type === 'wire' && dragState.compId && dragState.pin && (
            (() => {
              const comp = circuit.components.find((c) => c.id === dragState.compId);
              if (!comp) return null;
              const startX = comp.x + dragState.pin.x;
              const startY = comp.y + dragState.pin.y;
              const endX = dragState.currentMouseX;
              const endY = dragState.currentMouseY;
              const dx = Math.abs(endX - startX) * 0.5;

              return (
                <g>
                  <path
                    d={`M ${startX} ${startY} C ${startX + Math.max(24, dx)} ${startY}, ${
                      endX - Math.max(24, dx)
                    } ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    filter="drop-shadow(0 0 6px #06B6D4)"
                  />
                  <circle cx={endX} cy={endY} r="4" fill="#22D3EE" />
                </g>
              );
            })()
          )}

          {/* Layer 3: Components */}
          {circuit.components.map((comp) => (
            <g
              key={comp.id}
              onMouseDown={(e) => handleComponentMouseDown(e, comp)}
              className="cursor-move"
            >
              <GateSymbol
                component={comp}
                isSelected={comp.id === selectedComponentId}
                onToggleSwitch={onToggleSwitch}
                onPressButton={onPressButton}
                onPinMouseDown={handlePinMouseDown}
                onPinMouseUp={handlePinMouseUp}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};
