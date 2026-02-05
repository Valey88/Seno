import React, { useState } from 'react';
import { GlassCard } from '../GlassCard';
import { useMenuStore } from '@/stores/menuStore';
import { MenuItem } from '@/types';
import { Edit, Trash2, X, Filter, UtensilsCrossed } from 'lucide-react';
import { MenuModal } from './MenuModal';

export const MenuManager: React.FC = () => {
    const {
        menuItems,
        categoriesList,
        fetchMenu,
        deleteMenuItem,
        createCategory,
        deleteCategory
    } = useMenuStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
    const [newCatName, setNewCatName] = useState('');

    const handleEditClick = (item: MenuItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleAddCategory = async () => {
        if (newCatName) {
            try {
                await createCategory(newCatName);
                setNewCatName('');
                await fetchMenu();
            } catch (error: any) {
                alert(error.message);
            }
        }
    };

    const filteredItems = activeCategoryFilter === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === activeCategoryFilter);

    return (
        <div className="space-y-8 animate-in fade-in">
            {isModalOpen && (
                <MenuModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                    editingItem={editingItem}
                />
            )}

            {/* Top Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between border-b border-white/5 pb-6">
                <div className="w-full md:w-auto flex-1">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest block mb-2">Новая категория</label>
                    <div className="flex gap-2">
                        <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="bg-white/5 border border-white/10 p-2 rounded-lg text-white text-sm w-full md:w-64 focus:border-luxury-gold outline-none" placeholder="Например: Десерты" />
                        <button onClick={handleAddCategory} className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg transition-colors text-xs uppercase tracking-widest">Добавить</button>
                    </div>
                </div>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-2 bg-luxury-gold text-black rounded-lg hover:bg-white transition-colors text-xs uppercase tracking-widest font-bold h-[42px] shadow-lg shadow-luxury-gold/20">+ Блюдо / Напиток</button>
            </div>

            {/* Filter Bar */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Filter size={16} className="text-luxury-gold" />
                    <span className="text-white text-sm font-medium">Фильтр по категориям:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveCategoryFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${activeCategoryFilter === 'all' ? 'bg-luxury-gold text-black border-luxury-gold' : 'bg-white/5 border-white/10 text-white hover:border-white'}`}
                    >
                        Все
                    </button>

                    {categoriesList.map(c => (
                        <div key={c.id} className="relative group">
                            <button
                                onClick={() => setActiveCategoryFilter(c.id)}
                                className={`px-3 py-1 rounded-full text-xs border transition-colors flex items-center gap-2
                                ${activeCategoryFilter === c.id ? 'bg-luxury-gold text-black border-luxury-gold' : 'bg-white/5 border-white/10 text-white hover:border-white'}`}
                            >
                                {c.label}
                            </button>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm(`Удалить категорию "${c.label}"?`)) return;
                                    const { categories } = useMenuStore.getState();
                                    const catWithId = categories.find(cat => cat.title === c.label || cat.title.toLowerCase().replace(/\s/g, '_') === c.id);
                                    if (catWithId) {
                                        try { await deleteCategory(catWithId.id); } catch (e: any) { alert(e.message); }
                                    }
                                }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-white/30">В этой категории пока нет блюд.</div>
                )}

                {filteredItems.map(item => (
                    <GlassCard key={item.id} className="relative group hover:border-luxury-gold/50 transition-colors">
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => handleEditClick(item)} className="p-2 bg-black/60 text-white hover:text-luxury-gold rounded-lg backdrop-blur-md">
                                <Edit size={16} />
                            </button>
                            <button onClick={async () => { if (confirm('Удалить это блюдо?')) { try { await deleteMenuItem(item.id); } catch (e: any) { alert(e.message); } } }} className="p-2 bg-black/60 text-white hover:text-red-400 rounded-lg backdrop-blur-md">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                {item.image ? (
                                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20"><UtensilsCrossed size={20} /></div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <h4 className="text-white font-medium text-lg leading-tight mb-1 truncate pr-8">{item.title}</h4>
                                <div className="text-xs text-white/40 mb-2 truncate">
                                    {item.weight}г • {categoriesList.find(c => c.id === item.category)?.label}
                                </div>
                                <div className="text-luxury-gold font-bold">{item.price}₽</div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};
