'use client'

import React, { useState } from 'react';
import { Table, Zone } from '../types';
import { LayoutGrid, List, Users } from 'lucide-react';

interface HallMapProps {
  tables: Table[]; // Tables passed from parent
  selectedTableId: number | null;
  onSelectTable: (id: number) => void;
}

const ZONES = [
  { id: Zone.HALL_1, label: '1 зал' },
  { id: Zone.HALL_2, label: '2 зал' },
  { id: Zone.HALL_3, label: '3 зал' },
];

export const HallMap: React.FC<HallMapProps> = ({ tables, selectedTableId, onSelectTable }) => {
  const [activeZone, setActiveZone] = useState<Zone>(Zone.HALL_1);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Filter tables by active zone
  const currentTables = tables.filter(table => table.zone === activeZone);

  // --- SVG RENDERING HELPERS ---
  const getTableDims = (seats: number) => {
    if (seats <= 2) return { w: 80, h: 80 };
    if (seats <= 4) return { w: 120, h: 80 };
    if (seats <= 6) return { w: 160, h: 90 };
    return { w: 200, h: 100 };
  };

  const renderChairs = (table: Table, width: number, height: number, isSelected: boolean) => {
    const chairSize = 28;
    const chairGap = 6;
    
    const chairs = [];
    let topCount = 0, bottomCount = 0, leftCount = 0, rightCount = 0;

    if (table.seats <= 2) { topCount = 1; bottomCount = 1; }
    else if (table.seats <= 4) { topCount = 2; bottomCount = 2; }
    else { topCount = Math.floor((table.seats - 2) / 2); bottomCount = Math.ceil((table.seats - 2) / 2); leftCount = 1; rightCount = 1; }

    const renderSide = (count: number, side: 'top' | 'bottom' | 'left' | 'right') => {
      const items = [];
      const isVertical = side === 'left' || side === 'right';
      const totalLen = isVertical ? height : width;
      const step = totalLen / (count + 1);

      for (let i = 1; i <= count; i++) {
        let cx = 0, cy = 0, rotation = 0;
        if (side === 'top') { cx = -width/2 + i * step; cy = -height/2 - chairSize/2 - chairGap; }
        else if (side === 'bottom') { cx = -width/2 + i * step; cy = height/2 + chairSize/2 + chairGap; rotation = 180; }
        else if (side === 'left') { cx = -width/2 - chairSize/2 - chairGap; cy = -height/2 + i * step; rotation = -90; }
        else if (side === 'right') { cx = width/2 + chairSize/2 + chairGap; cy = -height/2 + i * step; rotation = 90; }

        items.push(
          <rect key={`${side}-${i}`} x={-12} y={-12} width={24} height={24} rx={6} transform={`translate(${cx}, ${cy}) rotate(${rotation})`}
            className={`transition-all duration-300 ${isSelected ? 'fill-luxury-gold' : 'fill-[#2a2a2a] stroke-white/10'}`} />
        );
      }
      return items;
    };
    chairs.push(...renderSide(topCount, 'top'), ...renderSide(bottomCount, 'bottom'), ...renderSide(leftCount, 'left'), ...renderSide(rightCount, 'right'));
    return chairs;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Controls: Zone + View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-stone-900/40 p-2 rounded-xl border border-white/5">
        <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar gap-1">
            {ZONES.map((zone) => (
            <button
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`
                whitespace-nowrap px-4 py-2 text-xs uppercase tracking-widest font-medium rounded-lg transition-all duration-300
                ${activeZone === zone.id 
                    ? 'bg-luxury-gold text-luxury-black shadow-lg shadow-black/20' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'}
                `}
            >
                {zone.label}
            </button>
            ))}
        </div>
        
        {/* Mobile View Toggles */}
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 self-end md:self-auto">
             <button onClick={() => setViewMode('map')} className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white/10 text-white' : 'text-white/30'}`}>
                <LayoutGrid size={18} />
             </button>
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30'}`}>
                <List size={18} />
             </button>
        </div>
      </div>

      {/* --- LIST VIEW (Mobile Friendly) --- */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
             {currentTables.map(table => (
                 <button 
                    key={table.id}
                    onClick={() => onSelectTable(table.id)}
                    className={`
                        flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-300
                        ${selectedTableId === table.id 
                            ? 'bg-luxury-gold/10 border-luxury-gold ring-1 ring-luxury-gold' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'}
                    `}
                 >
                     <span className={`text-xl font-serif font-bold mb-2 ${selectedTableId === table.id ? 'text-luxury-gold' : 'text-white'}`}>
                        № {table.id}
                     </span>
                     <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
                         <Users size={14} />
                         <span>{table.seats} перс.</span>
                     </div>
                 </button>
             ))}
        </div>
      ) : (
        /* --- MAP VIEW (SVG) --- */
        <div className="relative w-full h-[400px] md:h-[600px] bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden shadow-2xl group select-none">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            <div className="absolute top-0 left-0 p-6 opacity-30 pointer-events-none">
                <div className="text-xs uppercase tracking-[0.3em] text-white border-l border-t border-white pl-3 pt-2 w-24">Вход</div>
            </div>

            <svg width="100%" height="100%" viewBox="0 0 800 600" className="w-full h-full animate-in fade-in duration-700 relative z-10">
            {currentTables.map((table) => {
                const isSelected = selectedTableId === table.id;
                const dims = getTableDims(table.seats);
                const rotation = table.rotation || 0;
                
                return (
                <g key={table.id} onClick={(e) => { e.stopPropagation(); onSelectTable(table.id); }}
                    className="cursor-pointer transition-all duration-300 group/table"
                    transform={`translate(${table.x}, ${table.y}) rotate(${rotation})`}>
                    
                    {/* Hitbox invisible */}
                    <rect x={-dims.w/2 - 30} y={-dims.h/2 - 30} width={dims.w + 60} height={dims.h + 60} fill="transparent" />
                    
                    {renderChairs(table, dims.w, dims.h, isSelected)}
                    <rect x={-dims.w / 2} y={-dims.h / 2} width={dims.w} height={dims.h} rx="12"
                    className={`transition-all duration-300 stroke-[2px] ${isSelected ? 'fill-luxury-gold stroke-white/50 drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]' : 'fill-[#202020] stroke-white/10 group-hover/table:fill-[#303030]'}`} />
                    <text x="0" y="-8" transform={`rotate(${-rotation})`} textAnchor="middle" className={`text-[16px] font-bold pointer-events-none font-sans ${isSelected ? 'fill-luxury-black' : 'fill-white/30'}`}>{table.id}</text>
                    <text x="0" y="15" transform={`rotate(${-rotation})`} textAnchor="middle" className={`text-[11px] pointer-events-none uppercase font-medium ${isSelected ? 'fill-luxury-black/70' : 'fill-white/10'}`}>{table.seats} мест</text>
                </g>
                );
            })}
            </svg>
        </div>
      )}
    </div>
  );
};