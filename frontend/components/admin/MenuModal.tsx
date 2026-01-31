import React, { useState, useEffect } from 'react';
import { GlassCard } from '../GlassCard';
import { useMenuStore } from '@/stores/menuStore';
import { MenuItem } from '@/types';
import { X, Upload, Edit, Flame, Leaf } from 'lucide-react';

interface MenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingItem: MenuItem | null;
}

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose, editingItem }) => {
    const { categoriesList, createMenuItem, updateMenuItem } = useMenuStore();
    const [isDragOver, setIsDragOver] = useState(false);
    const [formData, setFormData] = useState<Partial<MenuItem>>({ category: 'main', ingredients: [] });

    useEffect(() => {
        if (editingItem) {
            setFormData({
                title: editingItem.title,
                price: editingItem.price,
                weight: editingItem.weight,
                description: editingItem.description,
                ingredients: editingItem.ingredients || [],
                category: editingItem.category,
                image: editingItem.image,
                isSpicy: editingItem.isSpicy,
                isVegan: editingItem.isVegan
            });
        } else {
            setFormData({ category: (categoriesList[0]?.id || 'main') as any, ingredients: [] });
        }
    }, [editingItem, categoriesList]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.price || !formData.category) return;

        // Find backend category ID logic
        const categoryFromList = categoriesList.find(c => c.id === formData.category);
        if (!categoryFromList) return alert('Категория не найдена в списке');

        const { categories } = useMenuStore.getState();
        const categoryWithId = categories.find(cat =>
            cat.title === categoryFromList.label ||
            cat.title.toLowerCase().replace(/\s/g, '_') === formData.category
        );

        if (!categoryWithId) return alert(`Категория "${categoryFromList.label}" не найдена в базе.`);

        const payload = {
            title: formData.title,
            description: formData.ingredients?.join(', ') || '',
            price: Number(formData.price),
            weight: Number(formData.weight) || 0,
            image_url: formData.image || '',
            category_id: categoryWithId.id,
            is_spicy: formData.isSpicy || false,
            is_vegan: formData.isVegan || false,
        };

        try {
            if (editingItem) {
                if (updateMenuItem) await updateMenuItem(editingItem.id, payload);
            } else {
                await createMenuItem(payload);
            }
            onClose();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleImageDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const base64 = await readFileAsDataURL(file);
            setFormData({ ...formData, image: base64 });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <GlassCard className="w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="font-serif text-2xl text-white">
                        {editingItem ? 'Редактировать позицию' : 'Добавить позицию'}
                    </h3>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform"><X className="text-white/50 hover:text-white" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Dropzone */}
                        <div className="space-y-4">
                            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Фотография блюда</label>
                            <div
                                className={`relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
                                ${isDragOver ? 'border-luxury-gold bg-luxury-gold/10 scale-[1.02]' : 'border-white/10 bg-white/5 hover:border-white/30'}
                                ${formData.image ? 'border-solid border-transparent' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleImageDrop}
                            >
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setFormData({ ...formData, image: await readFileAsDataURL(file) });
                                }} />

                                {formData.image ? (
                                    <div className="relative w-full h-full group">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-xs uppercase tracking-widest flex items-center gap-2"><Edit size={16} /> Изменить</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 text-white/50"><Upload size={24} /></div>
                                        <p className="text-sm text-white font-medium mb-1">Нажмите или перетащите фото</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.isSpicy ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                                    <input type="checkbox" className="hidden" checked={formData.isSpicy || false} onChange={e => setFormData({ ...formData, isSpicy: e.target.checked })} />
                                    <Flame size={16} /> <span className="text-xs uppercase tracking-wider">Острое</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.isVegan ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
                                    <input type="checkbox" className="hidden" checked={formData.isVegan || false} onChange={e => setFormData({ ...formData, isVegan: e.target.checked })} />
                                    <Leaf size={16} /> <span className="text-xs uppercase tracking-wider">Веган</span>
                                </label>
                            </div>
                        </div>
                        {/* Fields */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest">Категория</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="w-full bg-black border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none">
                                    {categoriesList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest">Название</label>
                                <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-white/40 uppercase tracking-widest">Цена (₽)</label>
                                    <input type="number" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-white/40 uppercase tracking-widest">Вес (гр)</label>
                                    <input type="number" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest">Состав</label>
                                <textarea rows={3} value={formData.ingredients?.join(', ') || ''} onChange={e => setFormData({ ...formData, ingredients: e.target.value.split(', ') })} className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white text-sm focus:border-luxury-gold outline-none resize-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={onClose} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-colors">Отмена</button>
                        <button type="submit" className="flex-1 bg-luxury-gold text-black py-4 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors shadow-lg shadow-luxury-gold/20">
                            {editingItem ? 'Сохранить изменения' : 'Добавить в меню'}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};
