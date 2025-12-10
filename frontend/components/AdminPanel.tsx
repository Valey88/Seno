'use client'

import React, { useEffect, useState, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { useBookingsStore } from '../stores/bookingsStore';
import { useMenuStore } from '../stores/menuStore';
import { useTablesStore } from '../stores/tablesStore';
import { useReviewsStore } from '../stores/reviewsStore';
import { useAdminStore } from '../stores/adminStore';
import { Booking, BookingStatus, User, MenuItem, Table, Review, Zone, MenuCategory } from '../types';
import { Check, X, Clock, Calendar, Edit, Trash2, DollarSign, Users, LayoutGrid, MessageSquare, UtensilsCrossed, RotateCw, GripVertical, Upload, Image as ImageIcon, Flame, Leaf } from 'lucide-react';

interface AdminPanelProps {
    user: User;
}

type Tab = 'dashboard' | 'bookings' | 'menu' | 'tables' | 'reviews';

// Helper for image upload simulation
const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    // Stores
    const { bookings, fetchBookings, updateBookingStatus, updateBooking } = useBookingsStore();
    const { stats, fetchStats } = useAdminStore();
    const { menuItems, categoriesList, fetchMenu, createMenuItem, deleteMenuItem, createCategory, deleteCategory } = useMenuStore();
    const { tables: tablesFromStore, fetchTables, createTable, updateTable, deleteTable } = useTablesStore();
    const { reviews, fetchReviews, deleteReview } = useReviewsStore();
    
    // Local state for tables (for optimistic UI updates during drag)
    const [tables, setTables] = useState<Table[]>([]);

    // Edit Modal States
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    
    // New Item States
    const [newDish, setNewDish] = useState<Partial<MenuItem>>({ category: 'main', ingredients: [] });
    const [newCatName, setNewCatName] = useState('');
    const [isDragOver, setIsDragOver] = useState(false); // For image dropzone
    
    // --- TABLE EDITOR STATES ---
    const [activeZone, setActiveZone] = useState<Zone>(Zone.HALL_2);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    
    // Improved Drag Logic State
    const [dragState, setDragState] = useState<{
        tableId: number;
        startX: number;
        startY: number;
        initialTableX: number;
        initialTableY: number;
    } | null>(null);
    
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // Sync tables from store to local state
    useEffect(() => {
        setTables(tablesFromStore);
    }, [tablesFromStore]);

    const loadData = async () => {
        if (activeTab === 'dashboard') {
            await fetchStats();
            await fetchBookings();
        }
        if (activeTab === 'bookings') {
            await fetchBookings();
        }
        if (activeTab === 'menu') {
            await fetchMenu();
        }
        if (activeTab === 'tables') {
            await fetchTables();
        }
        if (activeTab === 'reviews') {
            await fetchReviews(false); // Get all reviews including unapproved
        }
    };

    // --- HANDLERS: MENU ---

    const handleAddDish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newDish.title && newDish.price && newDish.category) {
            // Find category by matching string ID with category title
            const categoryFromList = categoriesList.find(c => c.id === newDish.category);
            if (!categoryFromList) {
                alert('Категория не найдена в списке');
                return;
            }
            
            // Get categories from backend to find numeric ID
            // First, make sure we have fresh data
            const { categories } = useMenuStore.getState();
            
            // Find category by matching title (label) with category title from backend
            const categoryWithId = categories.find(cat => 
                cat.title === categoryFromList.label ||
                cat.title.toLowerCase().replace(/\s/g, '_') === newDish.category
            );
            
            if (!categoryWithId) {
                // Try refreshing menu and try again
                await fetchMenu();
                const { categories: refreshedCategories } = useMenuStore.getState();
                const refreshedCategory = refreshedCategories.find(cat => 
                    cat.title === categoryFromList.label ||
                    cat.title.toLowerCase().replace(/\s/g, '_') === newDish.category
                );
                
                if (!refreshedCategory) {
                    alert(`Категория "${categoryFromList.label}" не найдена в базе данных. Пожалуйста, убедитесь, что категория создана.`);
                    return;
                }
                
                try {
                    await createMenuItem({
                        title: newDish.title!,
                        description: newDish.ingredients?.join(', ') || '',
                        price: Number(newDish.price),
                        weight: Number(newDish.weight) || 0,
                        image_url: newDish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                        category_id: refreshedCategory.id,
                        is_spicy: newDish.isSpicy || false,
                        is_vegan: newDish.isVegan || false,
                    });
                    setIsMenuModalOpen(false);
                    setNewDish({ category: 'main', ingredients: [] });
                } catch (error: any) {
                    alert(error.message);
                }
                return;
            }
            
            try {
                await createMenuItem({
                    title: newDish.title!,
                    description: newDish.ingredients?.join(', ') || '',
                    price: Number(newDish.price),
                    weight: Number(newDish.weight) || 0,
                    image_url: newDish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                    category_id: categoryWithId.id,
                    is_spicy: newDish.isSpicy || false,
                    is_vegan: newDish.isVegan || false,
                });
                setIsMenuModalOpen(false);
                setNewDish({ category: 'main', ingredients: [] });
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    const handleImageDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const base64 = await readFileAsDataURL(file);
            setNewDish({ ...newDish, image: base64 });
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await readFileAsDataURL(file);
            setNewDish({ ...newDish, image: base64 });
        }
    };

    const handleAddCategory = async () => {
        if(newCatName) {
            try {
                await createCategory(newCatName);
                setNewCatName('');
                // Ensure menu is refreshed so new category is available
                await fetchMenu();
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    // --- HANDLERS: BOOKINGS ---

    const handleBookingUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBooking) {
            try {
                await updateBooking(Number(editingBooking.id), {
                    name: editingBooking.name,
                    phone: editingBooking.phone,
                    date: editingBooking.date,
                    time: editingBooking.time,
                    guests: editingBooking.guests,
                    tableId: editingBooking.tableId,
                    comment: editingBooking.comment,
                });
                setEditingBooking(null);
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    // --- HANDLERS: TABLE EDITOR (IMPROVED) ---

    const handleAddTable = async (seats: number) => {
        try {
            await createTable({
                zone: activeZone,
                seats: seats,
                x: 400,
                y: 300,
                rotation: 0,
                is_active: true,
            });
            // Table will be added and tables will refresh automatically
            // We need to get the new table ID somehow, but for now just refresh
            await fetchTables();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDeleteTable = async (id: number) => {
        if (confirm('Удалить этот стол?')) {
            try {
                await deleteTable(id);
                setSelectedTableId(null);
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    const handleRotateTable = async (id: number) => {
        const table = tables.find(t => t.id === id);
        if (table) {
            const newRotation = ((table.rotation || 0) + 45) % 360;
            try {
                await updateTable(id, {
                    zone: table.zone,
                    seats: table.seats,
                    x: table.x,
                    y: table.y,
                    rotation: newRotation,
                    is_active: true,
                });
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    // DRAG LOGIC START
    const handleTableMouseDown = (e: React.MouseEvent, table: Table) => {
        e.preventDefault(); // Prevent text selection
        e.stopPropagation();
        
        setSelectedTableId(table.id);
        
        setDragState({
            tableId: table.id,
            startX: e.clientX,
            startY: e.clientY,
            initialTableX: table.x,
            initialTableY: table.y
        });
    };

    const handleMapMouseMove = (e: React.MouseEvent) => {
        if (!dragState) return;

        // Calculate Delta
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        // Calculate New Position
        let newX = dragState.initialTableX + dx;
        let newY = dragState.initialTableY + dy;

        // Clamp to map bounds (0 to 800 width, 0 to 600 height)
        // Assuming map is roughly 800x600 in logical pixels, though it is responsive. 
        // For the visual editor we fixed height at 600px.
        const width = mapRef.current?.clientWidth || 800;
        const height = 600;

        newX = Math.max(20, Math.min(newX, width - 20));
        newY = Math.max(20, Math.min(newY, height - 20));

        // Optimistically update UI
        setTables(prev => prev.map(t => 
            t.id === dragState.tableId ? { ...t, x: newX, y: newY } : t
        ));
    };

    const handleMapMouseUp = async () => {
        if (dragState) {
            // Save to DB
            const table = tables.find(t => t.id === dragState.tableId);
            if (table) {
                try {
                    await updateTable(table.id, {
                        zone: table.zone,
                        seats: table.seats,
                        x: table.x,
                        y: table.y,
                        rotation: table.rotation || 0,
                        is_active: true,
                    });
                } catch (e: any) {
                    console.error('Error updating table:', e);
                }
            }
            setDragState(null);
        }
    };
    // DRAG LOGIC END

    const getTableDims = (seats: number) => {
        if (seats <= 2) return { w: 80, h: 80 };
        if (seats <= 4) return { w: 120, h: 80 };
        if (seats <= 6) return { w: 160, h: 90 };
        return { w: 200, h: 100 };
    };

    // --- RENDERERS ---

    const renderSidebar = () => (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors ${activeTab === 'dashboard' ? 'bg-luxury-gold text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <LayoutGrid size={18} /> Статистика
            </button>
            <button onClick={() => setActiveTab('bookings')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors ${activeTab === 'bookings' ? 'bg-luxury-gold text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <Clock size={18} /> Брони
            </button>
            <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors ${activeTab === 'menu' ? 'bg-luxury-gold text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <UtensilsCrossed size={18} /> Меню
            </button>
            <button onClick={() => setActiveTab('tables')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors ${activeTab === 'tables' ? 'bg-luxury-gold text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <Users size={18} /> Столы
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors ${activeTab === 'reviews' ? 'bg-luxury-gold text-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <MessageSquare size={18} /> Отзывы
            </button>
        </div>
    );

    const renderDashboard = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
            <GlassCard className="text-center">
                <div className="text-luxury-gold mb-2 flex justify-center"><LayoutGrid /></div>
                <div className="text-3xl font-serif text-white">{stats?.total_bookings || 0}</div>
                <div className="text-xs uppercase text-white/40 tracking-widest">Всего броней</div>
            </GlassCard>
            <GlassCard className="text-center">
                <div className="text-green-400 mb-2 flex justify-center"><Check /></div>
                <div className="text-3xl font-serif text-white">{stats?.confirmed_bookings || 0}</div>
                <div className="text-xs uppercase text-white/40 tracking-widest">Подтверждено</div>
            </GlassCard>
            <GlassCard className="text-center">
                <div className="text-luxury-gold mb-2 flex justify-center"><DollarSign /></div>
                <div className="text-3xl font-serif text-white">{stats?.total_deposits || 0}₽</div>
                <div className="text-xs uppercase text-white/40 tracking-widest">Выручка (Депозиты)</div>
            </GlassCard>
            <GlassCard className="text-center">
                <div className="text-blue-400 mb-2 flex justify-center"><Users /></div>
                <div className="text-3xl font-serif text-white">{stats?.total_guests || 0}</div>
                <div className="text-xs uppercase text-white/40 tracking-widest">Гостей принято</div>
            </GlassCard>
        </div>
    );

    const renderBookings = () => (
        <div className="space-y-6 animate-in fade-in">
            {/* Modal for Editing Bookings */}
            {editingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-serif text-xl text-white">Редактирование брони</h3>
                            <button onClick={() => setEditingBooking(null)}><X className="text-white/50 hover:text-white"/></button>
                        </div>
                        <form onSubmit={handleBookingUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" value={editingBooking.date} onChange={e => setEditingBooking({...editingBooking, date: e.target.value})} className="bg-white/5 p-3 rounded text-white text-sm" />
                                <input type="time" value={editingBooking.time} onChange={e => setEditingBooking({...editingBooking, time: e.target.value})} className="bg-white/5 p-3 rounded text-white text-sm" />
                            </div>
                            <input type="text" placeholder="Имя" value={editingBooking.name} onChange={e => setEditingBooking({...editingBooking, name: e.target.value})} className="w-full bg-white/5 p-3 rounded text-white text-sm" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Гостей" value={editingBooking.guests} onChange={e => setEditingBooking({...editingBooking, guests: Number(e.target.value)})} className="bg-white/5 p-3 rounded text-white text-sm" />
                                <input type="number" placeholder="Стол ID" value={editingBooking.tableId || ''} onChange={e => setEditingBooking({...editingBooking, tableId: Number(e.target.value)})} className="bg-white/5 p-3 rounded text-white text-sm" />
                            </div>
                            <textarea placeholder="Комментарий" value={editingBooking.comment || ''} onChange={e => setEditingBooking({...editingBooking, comment: e.target.value})} className="w-full bg-white/5 p-3 rounded text-white text-sm" />
                            <button type="submit" className="w-full bg-luxury-gold text-black py-3 rounded font-bold uppercase text-xs tracking-wider hover:bg-white transition-colors">Сохранить</button>
                        </form>
                    </GlassCard>
                </div>
            )}

            <GlassCard className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-white/40 text-[10px] uppercase tracking-widest">
                            <th className="p-4">Инфо</th>
                            <th className="p-4">Гость</th>
                            <th className="p-4">Детали</th>
                            <th className="p-4">Статус</th>
                            <th className="p-4 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-white/80">
                        {bookings.map(booking => (
                            <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4">
                                    <div className="font-mono text-xs opacity-50">{booking.id}</div>
                                    <div className="text-[10px] opacity-30">{new Date(booking.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{booking.name}</div>
                                    <div className="text-xs text-white/40">{booking.phone}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2"><Calendar size={14} className="text-luxury-gold"/> {new Date(booking.date).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-2 mt-1 text-white/50"><Clock size={14} /> {booking.time}</div>
                                    <div className="mt-1 text-xs">Стол: {booking.tableId} ({booking.guests} чел)</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${booking.status === 'CONFIRMED' ? 'text-green-400 border-green-900 bg-green-900/20' : booking.status === 'CANCELLED' ? 'text-red-400 border-red-900 bg-red-900/20' : 'text-yellow-400 border-yellow-900 bg-yellow-900/20'}`}>{booking.status}</span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => setEditingBooking(booking)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded"><Edit size={16}/></button>
                                    <button onClick={() => updateBookingStatus(Number(booking.id), BookingStatus.CONFIRMED)} className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded"><Check size={16}/></button>
                                    <button onClick={() => updateBookingStatus(Number(booking.id), BookingStatus.CANCELLED)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded"><X size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </div>
    );

    const renderMenu = () => (
        <div className="space-y-8 animate-in fade-in">
             {/* New Dish Modal with Drag-n-Drop */}
             {isMenuModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h3 className="font-serif text-2xl text-white">Добавить позицию</h3>
                            <button onClick={() => setIsMenuModalOpen(false)} className="hover:rotate-90 transition-transform"><X className="text-white/50 hover:text-white"/></button>
                        </div>
                        
                        <form onSubmit={handleAddDish} className="flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* LEFT: Image Dropzone */}
                                <div className="space-y-4">
                                    <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Фотография блюда</label>
                                    <div 
                                        className={`relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
                                        ${isDragOver ? 'border-luxury-gold bg-luxury-gold/10 scale-[1.02]' : 'border-white/10 bg-white/5 hover:border-white/30'}
                                        ${newDish.image ? 'border-solid border-transparent' : ''}
                                        `}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                        onDragLeave={() => setIsDragOver(false)}
                                        onDrop={handleImageDrop}
                                    >
                                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageSelect} />
                                        
                                        {newDish.image ? (
                                            <div className="relative w-full h-full group">
                                                <img src={newDish.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-white text-xs uppercase tracking-widest flex items-center gap-2"><Edit size={16}/> Изменить</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-6">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 text-white/50">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm text-white font-medium mb-1">Нажмите или перетащите фото</p>
                                                <p className="text-xs text-white/40">JPG, PNG до 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${newDish.isSpicy ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                                            <input type="checkbox" className="hidden" checked={newDish.isSpicy || false} onChange={e => setNewDish({...newDish, isSpicy: e.target.checked})} />
                                            <Flame size={16} /> <span className="text-xs uppercase tracking-wider">Острое</span>
                                        </label>
                                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${newDish.isVegan ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                                            <input type="checkbox" className="hidden" checked={newDish.isVegan || false} onChange={e => setNewDish({...newDish, isVegan: e.target.checked})} />
                                            <Leaf size={16} /> <span className="text-xs uppercase tracking-wider">Веган</span>
                                        </label>
                                    </div>
                                </div>

                                {/* RIGHT: Details Form */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest">Категория</label>
                                        <select 
                                            value={newDish.category} 
                                            onChange={e => setNewDish({...newDish, category: e.target.value as MenuCategory})} 
                                            className="w-full bg-black border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none"
                                        >
                                            {categoriesList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest">Название</label>
                                        <input 
                                            type="text" 
                                            value={newDish.title || ''} 
                                            onChange={e => setNewDish({...newDish, title: e.target.value})} 
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none"
                                            placeholder="Стейк Рибай"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest">Цена (₽)</label>
                                            <input 
                                                type="number" 
                                                value={newDish.price || ''} 
                                                onChange={e => setNewDish({...newDish, price: Number(e.target.value)})} 
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest">Вес (гр)</label>
                                            <input 
                                                type="number" 
                                                value={newDish.weight || ''} 
                                                onChange={e => setNewDish({...newDish, weight: Number(e.target.value)})} 
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] text-white/40 uppercase tracking-widest">Состав</label>
                                        <textarea 
                                            rows={3}
                                            value={newDish.ingredients?.join(', ') || ''} 
                                            onChange={e => setNewDish({...newDish, ingredients: e.target.value.split(', ')})} 
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none resize-none"
                                            placeholder="Говядина, соль, перец, розмарин..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-luxury-gold text-black mt-8 py-4 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors shadow-lg shadow-luxury-gold/20">
                                Добавить в меню
                            </button>
                        </form>
                    </GlassCard>
                </div>
            )}

            <div className="flex gap-4 items-end">
                 <div className="flex-1">
                     <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2">Новая категория</label>
                     <div className="flex gap-2">
                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="bg-white/5 border border-white/10 p-2 rounded-lg text-white text-sm flex-1 focus:border-luxury-gold outline-none" placeholder="Например: Десерты"/>
                        <button onClick={handleAddCategory} className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg transition-colors text-xs uppercase tracking-widest">Добавить</button>
                     </div>
                 </div>
                 <button onClick={() => setIsMenuModalOpen(true)} className="px-6 py-2 bg-luxury-gold text-black rounded-lg hover:bg-white transition-colors text-xs uppercase tracking-widest font-bold h-[42px] shadow-lg shadow-luxury-gold/20">+ Блюдо / Напиток</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                 {categoriesList.map(c => (
                     <span key={c.id} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                        {c.label}
                        <button onClick={async () => {
                            // Find category ID by label
                            const category = categoriesList.find(cat => cat.id === c.id);
                            if (category) {
                                // We need numeric ID, but we only have string ID
                                // Let's find it from categories store
                                const { categories } = useMenuStore.getState();
                                const catWithId = categories.find(cat => 
                                    cat.title.toLowerCase().replace(/\s/g, '_') === c.id ||
                                    cat.title === c.label
                                );
                                if (catWithId) {
                                    try {
                                        await deleteCategory(catWithId.id);
                                    } catch (e: any) {
                                        alert(e.message);
                                    }
                                }
                            }
                        }} className="text-white/30 hover:text-red-400"><X size={12}/></button>
                     </span>
                 ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(item => (
                    <GlassCard key={item.id} className="relative group hover:border-luxury-gold/50 transition-colors">
                        <button onClick={async () => {
                            try {
                                await deleteMenuItem(item.id);
                            } catch (e: any) {
                                alert(e.message);
                            }
                        }} className="absolute top-2 right-2 p-2 bg-black/60 text-white hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-md"><Trash2 size={16}/></button>
                        <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} className="w-full h-full object-cover" alt={item.title}/>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className="text-white font-medium text-lg leading-tight mb-1">{item.title}</h4>
                                <div className="text-xs text-white/40 mb-2">{item.weight}г • {categoriesList.find(c => c.id === item.category)?.label}</div>
                                <div className="text-luxury-gold font-bold">{item.price}₽</div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );

    const renderTableEditor = () => {
        const zoneTables = tables.filter(t => t.zone === activeZone);

        return (
            <div className="space-y-6 animate-in fade-in">
                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                        <button onClick={() => setActiveZone(Zone.HALL_1)} className={`px-4 py-2 text-xs uppercase rounded transition-colors ${activeZone === Zone.HALL_1 ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>Зал 1</button>
                        <button onClick={() => setActiveZone(Zone.HALL_2)} className={`px-4 py-2 text-xs uppercase rounded transition-colors ${activeZone === Zone.HALL_2 ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>Зал 2</button>
                        <button onClick={() => setActiveZone(Zone.HALL_3)} className={`px-4 py-2 text-xs uppercase rounded transition-colors ${activeZone === Zone.HALL_3 ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>Зал 3</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-white/30 text-[10px] uppercase tracking-widest">Добавить стол:</span>
                        <div className="flex gap-2">
                             <button onClick={() => handleAddTable(2)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-luxury-gold hover:text-black rounded text-white transition-colors" title="2 места">2</button>
                             <button onClick={() => handleAddTable(4)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-luxury-gold hover:text-black rounded text-white transition-colors" title="4 места">4</button>
                             <button onClick={() => handleAddTable(6)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-luxury-gold hover:text-black rounded text-white transition-colors" title="6 мест">6</button>
                             <button onClick={() => handleAddTable(8)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-luxury-gold hover:text-black rounded text-white transition-colors" title="8 мест">8</button>
                        </div>
                    </div>
                </div>

                {/* EDITOR CANVAS */}
                <div className="relative">
                    {/* Controls Overlay for Selected Table */}
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
                    
                    {/* The Map Area */}
                    <div 
                        ref={mapRef}
                        className="w-full h-[600px] bg-[#151515] rounded-xl border border-white/10 relative overflow-hidden shadow-inner cursor-crosshair select-none"
                        onMouseMove={handleMapMouseMove}
                        onMouseUp={handleMapMouseUp}
                        onMouseLeave={handleMapMouseUp}
                    >
                        {/* Grid Background */}
                        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 0.5px, transparent 0.5px), linear-gradient(90deg, #fff 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>

                        {/* Tables */}
                        {zoneTables.map(table => {
                            const dims = getTableDims(table.seats);
                            const isSelected = selectedTableId === table.id;
                            const rotation = table.rotation || 0;

                            return (
                                <div
                                    key={table.id}
                                    onMouseDown={(e) => handleTableMouseDown(e, table)}
                                    className={`absolute flex items-center justify-center group cursor-grab active:cursor-grabbing transition-shadow duration-200
                                        ${isSelected ? 'z-10' : 'z-0'}
                                    `}
                                    style={{
                                        width: dims.w,
                                        height: dims.h,
                                        // Using absolute positioning from top-left, adjusted by centering manually in calculation
                                        // But here we rely on the X/Y being the center point of the table.
                                        left: table.x,
                                        top: table.y,
                                        // We translate -50% to ensure x,y is the center
                                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                                    }}
                                >
                                    {/* Visual Representation of Table */}
                                    <div className={`w-full h-full rounded-lg border-2 flex items-center justify-center shadow-lg backdrop-blur-sm relative
                                        ${isSelected ? 'bg-luxury-gold/20 border-luxury-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-[#2a2a2a] border-white/10 hover:border-white/30'}
                                    `}>
                                        <div className="text-white font-bold font-serif select-none pointer-events-none" style={{ transform: `rotate(${-rotation}deg)`}}>
                                            {table.id}
                                        </div>
                                        {/* Drag Handle Indicator */}
                                        <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-50 pointer-events-none">
                                            <GripVertical size={12} className="text-white"/>
                                        </div>
                                    </div>

                                    {/* Chairs visual (simplified) */}
                                    <div className="absolute -inset-2 pointer-events-none border border-dashed border-white/5 rounded-xl"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="text-center text-white/30 text-xs mt-4">
                    Перетаскивайте столы мышкой. Кликните для выбора и поворота.
                </div>
            </div>
        );
    };

    const renderReviews = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
             {reviews.map(r => (
                 <GlassCard key={r.id}>
                     <div className="flex justify-between items-start mb-2">
                         <h4 className="text-white font-serif">{r.author}</h4>
                         <button onClick={async () => {
                             try {
                                 await deleteReview(r.id);
                             } catch (e: any) {
                                 alert(e.message);
                             }
                         }} className="text-white/30 hover:text-red-400"><Trash2 size={16}/></button>
                     </div>
                     <div className="text-[10px] text-white/40 uppercase mb-2">{r.date} • Rating: {r.rating}</div>
                     <p className="text-sm text-white/70 italic">"{r.text}"</p>
                 </GlassCard>
             ))}
        </div>
    );

    return (
        <div className="pt-32 pb-20 max-w-7xl mx-auto px-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-6 gap-6">
                <div>
                    <h2 className="font-serif text-4xl text-white mb-2">CMS / Админ-панель</h2>
                    <p className="text-white/40 text-xs uppercase tracking-widest">Управление рестораном</p>
                </div>
                <div className="text-right">
                    <p className="text-luxury-gold text-sm font-medium">Администратор: {user.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-2">
                    {renderSidebar()}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-10">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'bookings' && renderBookings()}
                    {activeTab === 'menu' && renderMenu()}
                    {activeTab === 'tables' && renderTableEditor()}
                    {activeTab === 'reviews' && renderReviews()}
                </div>
            </div>
        </div>
    );
};