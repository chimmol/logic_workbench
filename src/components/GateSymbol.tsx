import React from 'react';
import { CircuitComponent, PinDefinition } from '../types';

interface GateSymbolProps {
  component: CircuitComponent;
  isSelected: boolean;
  onToggleSwitch?: (componentId: string) => void;
  onPressButton?: (componentId: string, pressed: boolean) => void;
  onPinMouseDown: (e: React.MouseEvent, compId: string, pin: PinDefinition) => void;
  onPinMouseUp: (e: React.MouseEvent, compId: string, pin: PinDefinition) => void;
}

export const GateSymbol: React.FC<GateSymbolProps> = ({
  component,
  isSelected,
  onToggleSwitch,
  onPressButton,
  onPinMouseDown,
  onPinMouseUp,
}) => {
  const { type, width, height, state, label, inputs, outputs } = component;

  // Render SVG symbol for logic gates according to ANSI/IEEE standard
  const renderShape = () => {
    switch (type) {
      case 'AND':
        // D-shaped curve: M 0,0 L 36,0 A 24,24 0 0,1 36,48 L 0,48 Z
        return (
          <path
            d="M 12 6 L 36 6 A 18 18 0 0 1 36 42 L 12 42 Z"
            fill="#0F172A"
            stroke={isSelected ? '#F59E0B' : '#475569'}
            strokeWidth="2"
          />
        );

      case 'NAND':
        return (
          <g>
            <path
              d="M 12 6 L 34 6 A 18 18 0 0 1 34 42 L 12 42 Z"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
            <circle
              cx="56"
              cy="24"
              r="4"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
          </g>
        );

      case 'OR':
        // Curved back and pointed front
        return (
          <path
            d="M 10 6 Q 22 24 10 42 Q 38 42 56 24 Q 38 6 10 6 Z"
            fill="#0F172A"
            stroke={isSelected ? '#F59E0B' : '#475569'}
            strokeWidth="2"
          />
        );

      case 'NOR':
        return (
          <g>
            <path
              d="M 8 6 Q 20 24 8 42 Q 36 42 52 24 Q 36 6 8 6 Z"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
            <circle
              cx="58"
              cy="24"
              r="4"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
          </g>
        );

      case 'XOR':
        return (
          <g>
            {/* Back curved input arc */}
            <path
              d="M 6 6 Q 18 24 6 42"
              fill="none"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
            {/* Main pointed body */}
            <path
              d="M 12 6 Q 24 24 12 42 Q 40 42 58 24 Q 40 6 12 6 Z"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
          </g>
        );

      case 'XNOR':
        return (
          <g>
            <path
              d="M 4 6 Q 16 24 4 42"
              fill="none"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
            <path
              d="M 10 6 Q 22 24 10 42 Q 38 42 52 24 Q 38 6 10 6 Z"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
            <circle
              cx="58"
              cy="24"
              r="4"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
          </g>
        );

      case 'NOT':
        return (
          <g>
            <polygon
              points="12,8 12,40 46,24"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
            <circle
              cx="52"
              cy="24"
              r="4"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#475569'}
              strokeWidth="2"
            />
          </g>
        );

      case 'BUFFER':
        return (
          <polygon
            points="12,8 12,40 52,24"
            fill="#0F172A"
            stroke={isSelected ? '#F59E0B' : '#475569'}
            strokeWidth="2"
          />
        );

      case 'SWITCH': {
        const val = state?.value ?? 0;
        return (
          <g
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSwitch?.(component.id);
            }}
          >
            <rect
              x="6"
              y="6"
              width="50"
              height="36"
              rx="4"
              fill="#181B25"
              stroke={isSelected ? '#F59E0B' : val === 1 ? '#06B6D4' : '#334155'}
              strokeWidth="2"
            />
            {/* Toggle slot */}
            <rect x="12" y="16" width="38" height="16" rx="8" fill="#0A0E17" />
            {/* Knob */}
            <circle
              cx={val === 1 ? '40' : '22'}
              cy="24"
              r="6"
              fill={val === 1 ? '#22D3EE' : '#64748B'}
              filter={val === 1 ? 'drop-shadow(0 0 4px #06B6D4)' : undefined}
              className="transition-all duration-150"
            />
            <text
              x="31"
              y="40"
              textAnchor="middle"
              className="text-[9px] font-['JetBrains_Mono'] fill-[#94A3B8] select-none pointer-events-none"
            >
              {val === 1 ? '1 (HIGH)' : '0 (LOW)'}
            </text>
          </g>
        );
      }

      case 'PUSH_BUTTON': {
        const pressed = state?.pressed ?? false;
        return (
          <g
            className="cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPressButton?.(component.id, true);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPressButton?.(component.id, false);
            }}
            onMouseLeave={() => onPressButton?.(component.id, false)}
          >
            <rect
              x="6"
              y="6"
              width="50"
              height="36"
              rx="4"
              fill="#181B25"
              stroke={isSelected ? '#F59E0B' : pressed ? '#06B6D4' : '#334155'}
              strokeWidth="2"
            />
            <circle
              cx="31"
              cy="24"
              r={pressed ? '9' : '11'}
              fill={pressed ? '#22D3EE' : '#334155'}
              filter={pressed ? 'drop-shadow(0 0 6px #06B6D4)' : undefined}
              stroke="#475569"
              strokeWidth="1.5"
            />
          </g>
        );
      }

      case 'CLOCK': {
        const clkVal = state?.value ?? 0;
        return (
          <g>
            <rect
              x="6"
              y="6"
              width="50"
              height="36"
              rx="4"
              fill="#181B25"
              stroke={isSelected ? '#F59E0B' : clkVal === 1 ? '#10B981' : '#334155'}
              strokeWidth="2"
            />
            {/* Square wave icon */}
            <path
              d="M 18 28 L 24 28 L 24 18 L 36 18 L 36 28 L 44 28"
              fill="none"
              stroke={clkVal === 1 ? '#10B981' : '#64748B'}
              strokeWidth="2"
              filter={clkVal === 1 ? 'drop-shadow(0 0 4px #10B981)' : undefined}
            />
          </g>
        );
      }

      case 'VCC':
        return (
          <g>
            <rect
              x="6"
              y="6"
              width="36"
              height="36"
              rx="4"
              fill="#181B25"
              stroke={isSelected ? '#F59E0B' : '#06B6D4'}
              strokeWidth="2"
            />
            <text
              x="24"
              y="28"
              textAnchor="middle"
              className="text-xs font-['JetBrains_Mono'] font-bold fill-[#22D3EE]"
            >
              +5V
            </text>
          </g>
        );

      case 'GND':
        return (
          <g>
            <rect
              x="6"
              y="6"
              width="36"
              height="36"
              rx="4"
              fill="#181B25"
              stroke={isSelected ? '#F59E0B' : '#64748B'}
              strokeWidth="2"
            />
            <path
              d="M 14 20 L 34 20 M 18 25 L 30 25 M 22 30 L 26 30"
              stroke="#94A3B8"
              strokeWidth="2"
            />
          </g>
        );

      case 'PROBE':
      case 'LED': {
        const val = state?.value ?? (inputs[0]?.state ?? 0);
        return (
          <g>
            <circle
              cx="24"
              cy="24"
              r="18"
              fill={val === 1 ? 'rgba(6, 182, 212, 0.2)' : '#0F172A'}
              stroke={isSelected ? '#F59E0B' : val === 1 ? '#22D3EE' : '#475569'}
              strokeWidth="2"
              filter={val === 1 ? 'drop-shadow(0 0 8px #06B6D4)' : undefined}
            />
            <circle
              cx="24"
              cy="24"
              r="10"
              fill={val === 1 ? '#22D3EE' : '#1E293B'}
              filter={val === 1 ? 'drop-shadow(0 0 10px #22D3EE)' : undefined}
            />
            <text
              x="24"
              y="28"
              textAnchor="middle"
              className={`text-xs font-['JetBrains_Mono'] font-bold select-none pointer-events-none ${
                val === 1 ? 'fill-[#0A0E17]' : 'fill-[#64748B]'
              }`}
            >
              {val}
            </text>
          </g>
        );
      }

      case 'HEX_DISPLAY': {
        const hexVal = state?.hexValue ?? '0';
        const segs = state?.segments ?? [true, true, true, true, true, true, false];
        // Segments: a:top, b:top-right, c:bottom-right, d:bottom, e:bottom-left, f:top-left, g:middle
        const segColor = (active: boolean) => (active ? '#22D3EE' : '#1E293B');
        const segGlow = (active: boolean) => (active ? 'drop-shadow(0 0 4px #06B6D4)' : undefined);

        return (
          <g>
            {/* Display Enclosure */}
            <rect
              x="8"
              y="6"
              width="68"
              height="108"
              rx="6"
              fill="#0A0E17"
              stroke={isSelected ? '#F59E0B' : '#06B6D4'}
              strokeWidth="2"
            />
            {/* Hex Display Bezel */}
            <rect x="18" y="16" width="48" height="74" rx="4" fill="#070A10" />

            {/* 7 Segments */}
            {/* a (top) */}
            <rect x="28" y="22" width="28" height="5" rx="2" fill={segColor(segs[0])} filter={segGlow(segs[0])} />
            {/* b (top-right) */}
            <rect x="52" y="28" width="5" height="24" rx="2" fill={segColor(segs[1])} filter={segGlow(segs[1])} />
            {/* c (bottom-right) */}
            <rect x="52" y="55" width="5" height="24" rx="2" fill={segColor(segs[2])} filter={segGlow(segs[2])} />
            {/* d (bottom) */}
            <rect x="28" y="80" width="28" height="5" rx="2" fill={segColor(segs[3])} filter={segGlow(segs[3])} />
            {/* e (bottom-left) */}
            <rect x="27" y="55" width="5" height="24" rx="2" fill={segColor(segs[4])} filter={segGlow(segs[4])} />
            {/* f (top-left) */}
            <rect x="27" y="28" width="5" height="24" rx="2" fill={segColor(segs[5])} filter={segGlow(segs[5])} />
            {/* g (middle) */}
            <rect x="28" y="51" width="28" height="5" rx="2" fill={segColor(segs[6])} filter={segGlow(segs[6])} />

            {/* Bottom hex char readout */}
            <text
              x="42"
              y="104"
              textAnchor="middle"
              className="text-xs font-['JetBrains_Mono'] font-bold fill-[#22D3EE]"
            >
              HEX: {hexVal}
            </text>
          </g>
        );
      }

      // DIP IC Modules (Adders, Flip-Flops, MUX)
      default:
        return (
          <g>
            <rect
              x="8"
              y="4"
              width={width - 16}
              height={height - 8}
              rx="4"
              fill="#0F172A"
              stroke={isSelected ? '#F59E0B' : '#334155'}
              strokeWidth="2"
            />
            {/* Notch at top for IC styling */}
            <path
              d={`M ${width / 2 - 8} 4 A 8 8 0 0 0 ${width / 2 + 8} 4`}
              fill="#0A0E17"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Center label */}
            <text
              x={width / 2}
              y={height / 2 + 3}
              textAnchor="middle"
              className="text-[10px] font-['Space_Grotesk'] font-bold fill-[#DFE2EF] select-none pointer-events-none"
            >
              {type.replace('_', ' ')}
            </text>
          </g>
        );
    }
  };

  return (
    <g transform={`translate(${component.x}, ${component.y})`}>
      {/* Component Title label */}
      <text
        x={width / 2}
        y="-6"
        textAnchor="middle"
        className="text-[10px] font-['JetBrains_Mono'] fill-[#94A3B8] select-none pointer-events-none"
      >
        {label}
      </text>

      {/* Main Symbol Body */}
      {renderShape()}

      {/* Input Pin Terminals */}
      {inputs.map((pin) => {
        const isHigh = pin.state === 1;
        return (
          <g
            key={pin.id}
            transform={`translate(${pin.x}, ${pin.y})`}
            className="cursor-crosshair group"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPinMouseDown(e, component.id, pin);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPinMouseUp(e, component.id, pin);
            }}
          >
            {/* Terminal lead wire */}
            <line
              x1="0"
              y1="0"
              x2="10"
              y2="0"
              stroke={isHigh ? '#22D3EE' : '#475569'}
              strokeWidth="2"
            />
            {/* Terminal solder pad */}
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill={isHigh ? '#22D3EE' : '#1E293B'}
              stroke={isHigh ? '#06B6D4' : '#64748B'}
              strokeWidth="1.5"
              filter={isHigh ? 'drop-shadow(0 0 6px #06B6D4)' : undefined}
              className="transition-all group-hover:scale-125"
            />
            {/* Pin name tag */}
            <text
              x="12"
              y="3"
              className="text-[9px] font-['JetBrains_Mono'] fill-[#64748B] select-none pointer-events-none"
            >
              {pin.name}
            </text>
          </g>
        );
      })}

      {/* Output Pin Terminals */}
      {outputs.map((pin) => {
        const isHigh = pin.state === 1;
        return (
          <g
            key={pin.id}
            transform={`translate(${pin.x}, ${pin.y})`}
            className="cursor-crosshair group"
            onMouseDown={(e) => {
              e.stopPropagation();
              onPinMouseDown(e, component.id, pin);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onPinMouseUp(e, component.id, pin);
            }}
          >
            {/* Terminal lead wire */}
            <line
              x1="-10"
              y1="0"
              x2="0"
              y2="0"
              stroke={isHigh ? '#22D3EE' : '#475569'}
              strokeWidth="2"
            />
            {/* Solder Pad */}
            <circle
              cx="0"
              cy="0"
              r="4.5"
              fill={isHigh ? '#22D3EE' : '#1E293B'}
              stroke={isHigh ? '#06B6D4' : '#64748B'}
              strokeWidth="1.5"
              filter={isHigh ? 'drop-shadow(0 0 6px #06B6D4)' : undefined}
              className="transition-all group-hover:scale-125"
            />
            {/* Pin Name */}
            <text
              x="-14"
              y="3"
              textAnchor="end"
              className="text-[9px] font-['JetBrains_Mono'] fill-[#64748B] select-none pointer-events-none"
            >
              {pin.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};
