import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../GlassCard';
import { useTablesStore } from '@/stores/tablesStore';
import { Table, Zone } from '@/types';
import { RotateCw, Trash2, GripVertical } from 'lucide-react';

export const TableEditor: React.FC = () => {
    const { tables: tablesFromStore, fetchTables, createTable, updateTable, deleteTable } = useTablesStore();
    const [tables, setTables] = useState<Table[]>([]);
    const [activeZone, setActiveZone] = useState<Zone>(Zone.HALL_2);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [dragState, setDragState] = useState<{ tableId: number; startX: number; startY: number; initialTableX: number; initialTableY: number; } | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setTables(tablesFromStore); }, [tablesFromStore]);

    const handleAddTable = async (seats: number) => {
        try {
            await createTable({ zone: activeZone, seats: seats, x: 400, y: 300, rotation: 0, is_active: true });
            await fetchTables();
        } catch (e: any) { alert(e.message); }
    };

    const handleDeleteTable = async (id: number) => {
        if (confirm('Удалить этот стол?')) {
            try { await deleteTable(id); setSelectedTableId(null); } catch (e: any) { alert(e.message); }
        }
    };

    const handleRotateTable = async (id: number) => {
        const table = tables.find(t => t.id === id);
        if (table) {
            const newRotation = ((table.rotation || 0) + 45) % 360;
            try { await updateTable(id, { ...table, rotation: newRotation }); } catch (e: any) { alert(e.message); }
        }
    };

    const handleTableMouseDown = (e: React.MouseEvent, table: Table) => {
        e.preventDefault(); e.stopPropagation();
        setSelectedTableId(table.id);
        setDragState({ tableId: table.id, startX: e.clientX, startY: e.clientY, initialTableX: table.x, initialTableY: table.y });
    };

    const handleMapMouseMove = (e: React.MouseEvent) => {
        if (!dragState) return;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        let newX = dragState.initialTableX + dx;
        let newY = dragState.initialTableY + dy;
        const width = mapRef.current?.clientWidth || 800;
        const height = 600;
        newX = Math.max(20, Math.min(newX, width - 20));
        newY = Math.max(20, Math.min(newY, height - 20));
        setTables(prev => prev.map(t => t.id === dragState.tableId ? { ...t, x: newX, y: newY } : t));
    };

    const handleMapMouseUp = async () => {
        if (dragState) {
            const table = tables.find(t => t.id === dragState.tableId);
            if (table) {
                try { await updateTable(table.id, { ...table, x: table.x, y: table.y }); } catch (e: any) { console.error(e); }
            }
            setDragState(null);
        }
    };

    const getTableDims = (seats: number) => {
        if (seats <= 2) return { w: 80, h: 80 };
        if (seats <= 4) return { w: 120, h: 80 };
        if (seats <= 6) return { w: 160, h: 90 };
        return { w: 200, h: 100 };
    };

    const zoneTables = tables.filter(t => t.zone === activeZone);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                    {([Zone.HALL_1, Zone.HALL_2, Zone.HALL_3] as Zone[]).map(z => (
                        <button key={z} onClick={() => setActiveZone(z)} className={`px-4 py-2 text-xs uppercase rounded transition-colors ${activeZone === z ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
                            {z === Zone.HALL_1 ? 'Зал 1' : z === Zone.HALL_2 ? 'Зал 2' : 'Зал 3'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white/30 text-[10px] uppercase tracking-widest">Добавить стол:</span>
                    <div className="flex gap-2">
                         {[2,4,6,8].map(s => <button key={s} onClick={() => handleAddTable(s)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-luxury-gold hover:text-black rounded text-white transition-colors" title={`${s} мест`}>{s}</button>)}
                    </div>
                </div>
            </div>
            <div className="relative">
                {selectedTableId && (
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 pointer-events-none">
                        <GlassCard className="p-3 !bg-black/90 border-luxury-gold/50 shadow-2xl pointer-events-auto">
                            <div className="text-xs text-luxury-gold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Стол №{selectedTableId}</div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleRotateTable(selectedTableId)} className="flex items-center gap-2 text-white hover:text-luxury-gold text-xs p-1"><RotateCw size={14}/> Повернуть</button>
                                <button onClick={() => handleDeleteTable(selectedTableId)} className="flex items-center gap-2 text-white hover:text-red-400 text-xs p-1"><Trash2 size={14}/> Удалить</button>
                            </div>
                        </GlassCard>
                    </div>
                )}
                <div
                    ref={mapRef}
                    className="w-full h-[600px] bg-[#151515] rounded-xl border border-white/10 relative overflow-hidden shadow-inner cursor-crosshair select-none"
                    onMouseMove={handleMapMouseMove} onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseUp}
                >
                    <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                    {zoneTables.map(table => {
                        const dims = getTableDims(table.seats);
                        const isSelected = selectedTableId === table.id;
                        const rotation = table.rotation || 0;
                        return (
                            <div
                                key={table.id}
                                onMouseDown={(e) => handleTableMouseDown(e, table)}
                                className={`absolute flex items-center justify-center group cursor-grab active:cursor-grabbing transition-shadow duration-200 ${isSelected ? 'z-10' : 'z-0'}`}
                                style={{ width: dims.w, height: dims.h, left: table.x, top: table.y, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
                            >
                                <div className={`w-full h-full rounded-lg border-2 flex items-center justify-center shadow-lg backdrop-blur-sm relative ${isSelected ? 'bg-luxury-gold/20 border-luxury-gold' : 'bg-[#2a2a2a] border-white/10 hover:border-white/30'}`}>
                                    <div className="text-white font-bold font-serif select-none pointer-events-none" style={{ transform: `rotate(${-rotation}deg)`}}>{table.id}</div>
                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-50 pointer-events-none"><GripVertical size={12} className="text-white"/></div>
                                </div>
                                <div className="absolute -inset-2 pointer-events-none border border-dashed border-white/5 rounded-xl"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
