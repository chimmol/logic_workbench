import React, { useState } from 'react';
import { ComponentType } from '../types';
import {
  ToggleLeft,
  CircleDot,
  Clock,
  BatteryCharging,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  Hash,
  Box,
  Binary,
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

interface PaletteItem {
  type: ComponentType;
  name: string;
  badge?: string;
  description: string;
  icon: React.ReactNode;
}

interface CategoryGroup {
  id: string;
  name: string;
  items: PaletteItem[];
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const categories: CategoryGroup[] = [
    {
      id: 'sources',
      name: 'SOURCES & INPUTS',
      items: [
        {
          type: 'SWITCH',
          name: 'Toggle Switch',
          badge: 'SW',
          description: 'Latching 0/1 signal toggle',
          icon: <ToggleLeft className="w-4 h-4 text-[#06B6D4]" />,
        },
        {
          type: 'PUSH_BUTTON',
          name: 'Push Button',
          badge: 'BTN',
          description: 'Momentary pulse HIGH',
          icon: <CircleDot className="w-4 h-4 text-[#06B6D4]" />,
        },
        {
          type: 'CLOCK',
          name: 'Clock Gen',
          badge: 'CLK',
          description: 'Oscillating square wave',
          icon: <Clock className="w-4 h-4 text-[#10B981]" />,
        },
        {
          type: 'VCC',
          name: 'VCC (+5V)',
          badge: '1',
          description: 'Constant logical HIGH',
          icon: <BatteryCharging className="w-4 h-4 text-[#22D3EE]" />,
        },
        {
          type: 'GND',
          name: 'GND (0V)',
          badge: '0',
          description: 'Constant logical LOW',
          icon: <Zap className="w-4 h-4 text-[#94A3B8]" />,
        },
      ],
    },
    {
      id: 'gates',
      name: 'LOGIC GATES',
      items: [
        {
          type: 'AND',
          name: 'AND Gate',
          badge: 'Y = A·B',
          description: 'High if all inputs are 1',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">&</span>,
        },
        {
          type: 'OR',
          name: 'OR Gate',
          badge: 'Y = A+B',
          description: 'High if any input is 1',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">≥1</span>,
        },
        {
          type: 'NOT',
          name: 'NOT Inverter',
          badge: "Y = A'",
          description: 'Inverts logical signal',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">1</span>,
        },
        {
          type: 'NAND',
          name: 'NAND Gate',
          badge: "(A·B)'",
          description: 'Universal negated AND',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">&</span>,
        },
        {
          type: 'NOR',
          name: 'NOR Gate',
          badge: "(A+B)'",
          description: 'Universal negated OR',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">≥1</span>,
        },
        {
          type: 'XOR',
          name: 'XOR Gate',
          badge: 'Y = A⊕B',
          description: 'High if inputs differ',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">=1</span>,
        },
        {
          type: 'XNOR',
          name: 'XNOR Gate',
          badge: '(A⊕B)\'',
          description: 'High if inputs match',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">=1</span>,
        },
        {
          type: 'BUFFER',
          name: 'Buffer',
          badge: 'Y = A',
          description: 'Signal propagation buffer',
          icon: <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#22D3EE]">▷</span>,
        },
      ],
    },
    {
      id: 'arithmetic',
      name: 'ARITHMETIC & MUX',
      items: [
        {
          type: 'HALF_ADDER',
          name: 'Half Adder',
          badge: 'HA',
          description: '2-bit sum and carry',
          icon: <Binary className="w-4 h-4 text-[#F59E0B]" />,
        },
        {
          type: 'FULL_ADDER',
          name: 'Full Adder',
          badge: 'FA',
          description: '3-bit sum and carry in/out',
          icon: <Binary className="w-4 h-4 text-[#F59E0B]" />,
        },
        {
          type: 'MUX_2TO1',
          name: '2:1 Multiplexer',
          badge: 'MUX',
          description: 'Select between 2 data inputs',
          icon: <Box className="w-4 h-4 text-[#F59E0B]" />,
        },
      ],
    },
    {
      id: 'sequential',
      name: 'FLIP-FLOPS & STORAGE',
      items: [
        {
          type: 'D_FLIP_FLOP',
          name: 'D Flip-Flop',
          badge: '74HC74',
          description: 'Clock edge data register',
          icon: <Box className="w-4 h-4 text-[#10B981]" />,
        },
        {
          type: 'JK_FLIP_FLOP',
          name: 'JK Flip-Flop',
          badge: '74HC73',
          description: 'Universal clocked register',
          icon: <Box className="w-4 h-4 text-[#10B981]" />,
        },
        {
          type: 'SR_LATCH',
          name: 'SR Latch',
          badge: 'SR',
          description: 'Set/Reset bistable multivibrator',
          icon: <Box className="w-4 h-4 text-[#10B981]" />,
        },
      ],
    },
    {
      id: 'indicators',
      name: 'PROBES & DISPLAYS',
      items: [
        {
          type: 'PROBE',
          name: 'Logic Probe LED',
          badge: 'LED',
          description: 'Luminous cyan indicator',
          icon: <Eye className="w-4 h-4 text-[#22D3EE]" />,
        },
        {
          type: 'HEX_DISPLAY',
          name: '7-Segment Hex Display',
          badge: 'HEX',
          description: '4-bit decoded hex readout',
          icon: <Hash className="w-4 h-4 text-[#22D3EE]" />,
        },
      ],
    },
  ];

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/component-type', type);
  };

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col select-none shrink-0 z-20 overflow-hidden">
      {/* Sidebar Header */}
      <div className="h-10 px-3 border-b border-[#1E293B] flex items-center justify-between text-xs font-['Space_Grotesk'] font-bold text-[#94A3B8] tracking-wider">
        <span>COMPONENT PALETTE</span>
        <span className="text-[10px] font-['JetBrains_Mono'] text-[#64748B]">CLICK / DRAG</span>
      </div>

      {/* Component Groups List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {categories.map((cat) => {
          const isCollapsed = collapsedCategories[cat.id];
          return (
            <div key={cat.id} className="space-y-1">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-['JetBrains_Mono'] font-bold tracking-wider text-[#64748B] hover:text-[#94A3B8] transition-colors"
              >
                <span>{cat.name}</span>
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 gap-1">
                  {cat.items.map((item) => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => onAddComponent(item.type)}
                      className="group flex items-center justify-between px-2.5 py-1.5 rounded bg-[#181B25] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#06B6D4]/50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                      title={`${item.description} (Click to add or drag onto canvas)`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-[#0A0E17] border border-[#334155]/40 flex items-center justify-center shrink-0 group-hover:border-[#06B6D4]/40 transition-colors">
                          {item.icon}
                        </div>
                        <div className="truncate text-left">
                          <div className="text-xs font-['Geist'] text-[#DFE2EF] group-hover:text-[#F8FAFC] truncate">
                            {item.name}
                          </div>
                          <div className="text-[9px] font-['JetBrains_Mono'] text-[#64748B] truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      {item.badge && (
                        <span className="text-[9px] font-['JetBrains_Mono'] text-[#94A3B8] bg-[#0A0E17] px-1.5 py-0.5 rounded border border-[#334155]/30 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#1E293B] bg-[#0A0E17]/60 text-[10px] font-['JetBrains_Mono'] text-[#64748B] flex items-center justify-between">
        <span>Cartesian 24px Grid</span>
        <span className="text-[#06B6D4]">Snap: ON</span>
      </div>
    </aside>
  );
};
