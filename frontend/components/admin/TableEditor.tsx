import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../GlassCard';
import { useTablesStore } from '@/stores/tablesStore';
import { Table, Zone } from '@/types';
import { RotateCw, Trash2, GripVertical, Plus, Search, Edit2, ZoomIn, ZoomOut } from 'lucide-react';

export const TableEditor: React.FC = () => {
    const { tables: tablesFromStore, fetchTables, createTable, updateTable, deleteTable } = useTablesStore();
    const [tables, setTables] = useState<Table[]>([]);
    const [activeZone, setActiveZone] = useState<Zone>(Zone.HALL_2);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [dragState, setDragState] = useState<{ tableId: number; startX: number; startY: number; initialTableX: number; initialTableY: number; } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newTableSeats, setNewTableSeats] = useState<number>(2);
    const [editingTableNumber, setEditingTableNumber] = useState<number | null>(null);
    const [editTableNumberValue, setEditTableNumberValue] = useState('');
    const [scale, setScale] = useState(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setTables(tablesFromStore); }, [tablesFromStore]);

    const handleAddTable = async () => {
        if (!newTableNumber.trim()) {
            alert('Введите номер стола');
            return;
        }

        // Check for duplicate in same zone
        const duplicate = tables.find(t => t.zone === activeZone && t.table_number === newTableNumber.trim());
        if (duplicate) {
            alert('Стол с таким номером уже существует в этом зале');
            return;
        }

        try {
            await createTable({
                table_number: newTableNumber.trim(),
                zone: activeZone,
                seats: newTableSeats,
                x: 400,
                y: 300,
                rotation: 0,
                is_active: true
            });
            await fetchTables();
            setShowAddDialog(false);
            setNewTableNumber('');
            setNewTableSeats(2);
        } catch (e: any) { alert(e.message); }
    };

    const handleUpdateTableNumber = async (tableId: number) => {
        const table = tables.find(t => t.id === tableId);
        if (!table || !editTableNumberValue.trim()) return;

        // Check for duplicate in same zone
        const duplicate = tables.find(t =>
            t.id !== tableId &&
            t.zone === table.zone &&
            t.table_number === editTableNumberValue.trim()
        );
        if (duplicate) {
            alert('Стол с таким номером уже существует в этом зале');
            return;
        }

        try {
            await updateTable(tableId, { ...table, table_number: editTableNumberValue.trim() });
            setEditingTableNumber(null);
            setEditTableNumberValue('');
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

    // Zoom and Pan handlers
    const handleZoom = (delta: number) => {
        setScale((prev) => Math.min(Math.max(0.5, prev + delta), 2.5));
    };

    const handlePanMouseDown = (e: React.MouseEvent) => {
        // Only pan if not clicking on a table
        if ((e.target as HTMLElement).closest('[data-table]')) return;
        setIsPanning(true);
        panStart.current = {
            x: e.clientX - panPosition.x,
            y: e.clientY - panPosition.y,
        };
    };

    const handlePanMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPanPosition({
                x: e.clientX - panStart.current.x,
                y: e.clientY - panStart.current.y,
            });
        }
    };

    const handlePanMouseUp = () => {
        setIsPanning(false);
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
        const height = 800; // Increased for 3 rows

        // Snap to 50px grid for alignment
        const gridSize = 50;
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;

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

    const zoneTables = tables
        .filter(t => t.zone === activeZone)
        .filter(t =>
            searchQuery === '' ||
            t.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.seats.toString().includes(searchQuery)
        );

    const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) : null;

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
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-luxury-gold/50"
                        />
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => handleZoom(0.1)}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                            title="Увеличить"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <div className="w-[1px] bg-white/10 mx-1"></div>
                        <button
                            onClick={() => handleZoom(-0.1)}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                            title="Уменьшить"
                        >
                            <ZoomOut size={18} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-luxury-gold hover:bg-luxury-gold/80 text-black font-medium rounded transition-colors"
                    >
                        <Plus size={16} />
                        Добавить стол
                    </button>
                </div>
            </div>

            {showAddDialog && (
                <GlassCard className="p-6 border-luxury-gold/30">
                    <h3 className="text-lg text-luxury-gold mb-4">Новый стол</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-white/50 mb-2">Номер стола</label>
                            <input
                                type="text"
                                value={newTableNumber}
                                onChange={(e) => setNewTableNumber(e.target.value)}
                                placeholder="A1, 101, ..."
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-white focus:outline-none focus:border-luxury-gold/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-2">Количество мест</label>
                            <select
                                value={newTableSeats}
                                onChange={(e) => setNewTableSeats(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-white focus:outline-none focus:border-luxury-gold/50"
                            >
                                {[2, 4, 6, 8, 10].map(s => <option key={s} value={s}>{s} мест</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAddTable} className="px-4 py-2 bg-luxury-gold hover:bg-luxury-gold/80 text-black font-medium rounded transition-colors">Создать</button>
                        <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors">Отмена</button>
                    </div>
                </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Table List */}
                <div className="lg:col-span-1 space-y-2 max-h-[900px] overflow-y-auto">
                    <div className="sticky top-0 bg-[#111] pb-2 border-b border-white/10 mb-2">
                        <p className="text-xs uppercase tracking-widest text-white/30">Столы ({zoneTables.length})</p>
                    </div>
                    {zoneTables.map(table => (
                        <div
                            key={table.id}
                            onClick={() => setSelectedTableId(table.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedTableId === table.id ? 'bg-luxury-gold/10 border-luxury-gold' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">{table.table_number}</p>
                                    <p className="text-xs text-white/40">{table.seats} мест</p>
                                </div>
                                {selectedTableId === table.id && (
                                    <div className="text-luxury-gold">→</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Map Area */}
                <div className="lg:col-span-3 relative">
                    {selectedTable && (
                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 pointer-events-none">
                            <GlassCard className="p-3 !bg-black/90 border-luxury-gold/50 shadow-2xl pointer-events-auto">
                                <div className="text-xs text-luxury-gold uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                                    {editingTableNumber === selectedTable.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editTableNumberValue}
                                                onChange={(e) => setEditTableNumberValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTableNumber(selectedTable.id)}
                                                className="px-2 py-1 bg-black/50 border border-luxury-gold/50 rounded text-white text-xs w-24"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateTableNumber(selectedTable.id)} className="text-green-400 text-xs">✓</button>
                                            <button onClick={() => setEditingTableNumber(null)} className="text-red-400 text-xs">✗</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            Стол {selectedTable.table_number}
                                            <button
                                                onClick={() => {
                                                    setEditingTableNumber(selectedTable.id);
                                                    setEditTableNumberValue(selectedTable.table_number);
                                                }}
                                                className="text-white/50 hover:text-luxury-gold"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-white/50 mb-2">{selectedTable.seats} мест</div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => handleRotateTable(selectedTable.id)} className="flex items-center gap-2 text-white hover:text-luxury-gold text-xs p-1"><RotateCw size={14} /> Повернуть</button>
                                    <button onClick={() => handleDeleteTable(selectedTable.id)} className="flex items-center gap-2 text-white hover:text-red-400 text-xs p-1"><Trash2 size={14} /> Удалить</button>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                    <div
                        ref={mapRef}
                        className="w-full h-[800px] bg-[#151515] rounded-xl border border-white/10 relative overflow-hidden shadow-inner select-none"
                        onMouseDown={handlePanMouseDown}
                        onMouseMove={(e) => {
                            handlePanMouseMove(e);
                            handleMapMouseMove(e);
                        }}
                        onMouseUp={() => {
                            handlePanMouseUp();
                            handleMapMouseUp();
                        }}
                        onMouseLeave={() => {
                            handlePanMouseUp();
                            handleMapMouseUp();
                        }}
                        style={{ cursor: isPanning ? 'grabbing' : dragState ? 'grabbing' : 'grab' }}
                    >
                        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                        <div
                            style={{
                                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${scale})`,
                                transformOrigin: 'center',
                                transition: isPanning || dragState ? 'none' : 'transform 0.2s ease-out',
                            }}
                            className="w-full h-full relative"
                        >
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
                                            <div className="text-white font-bold font-serif select-none pointer-events-none" style={{ transform: `rotate(${-rotation}deg)` }}>{table.table_number}</div>
                                            <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-50 pointer-events-none"><GripVertical size={12} className="text-white" /></div>
                                        </div>
                                        <div className="absolute -inset-2 pointer-events-none border border-dashed border-white/5 rounded-xl"></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
