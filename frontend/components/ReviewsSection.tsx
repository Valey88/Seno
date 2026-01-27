'use client'

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Review, User } from '../types';
import { useReviewsStore } from '../stores/reviewsStore';
import { Star, Image as ImageIcon, Send, Lock, Upload, X, Plus } from 'lucide-react';

interface ReviewsSectionProps {
    currentUser: User | null;
    onOpenAuth: () => void;
}

// Хелпер для конвертации файла в Base64
const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ currentUser, onOpenAuth }) => {
    const { reviews, fetchReviews, createReview } = useReviewsStore();
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [newText, setNewText] = useState('');
    const [newRating, setNewRating] = useState(5);

    // ИЗМЕНЕНИЕ: Теперь храним массив строк (картинок)
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchReviews(true);
    }, [fetchReviews]);

    // Обработка выбора файлов (поддержка нескольких)
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newImages: string[] = [];

            // Ограничим макс. кол-во фото, например 5
            if (selectedImages.length + files.length > 5) {
                alert("Максимум 5 фотографий");
                return;
            }

            for (const file of files) {
                try {
                    const base64 = await readFileAsDataURL(file);
                    newImages.push(base64);
                } catch (error) {
                    console.error("Error reading file:", error);
                }
            }
            setSelectedImages([...selectedImages, ...newImages]);
        }
    };

    // Обработка Drag & Drop
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const newImages: string[] = [];

            if (selectedImages.length + files.length > 5) {
                alert("Максимум 5 фотографий");
                return;
            }

            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const base64 = await readFileAsDataURL(file);
                    newImages.push(base64);
                }
            }
            setSelectedImages([...selectedImages, ...newImages]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    // Удаление конкретного фото
    const removeImage = (indexToRemove: number) => {
        setSelectedImages(selectedImages.filter((_, index) => index !== indexToRemove));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        // --- ЛОГИКА ВАЛИДАЦИИ ---
        // 1, 2, 3 звезды -> Обязательно текст И фото
        if (newRating <= 3) {
            if (!newText.trim()) {
                alert("Для оценки 3 звезды и ниже описание проблемы обязательно.");
                return;
            }
            if (selectedImages.length === 0) {
                alert("Для низкой оценки необходимо приложить хотя бы одно фото.");
                return;
            }
        }

        // 4, 5 звезд -> Можно без текста и без фото, или с чем-то одним
        // Никаких дополнительных проверок не требуется, кроме того, что отзыв не может быть полностью пустым (хотя рейтинг есть всегда).

        const result = await createReview({
            author: currentUser.name || "Гость",
            rating: newRating,
            text: newText,
            // Бэкенд должен ожидать массив 'images' или мы передаем первую картинку в старое поле image_url
            // Для поддержки старого бэкенда пока передадим первую,
            // НО я добавил поле 'images' в объект, чтобы вы обновили бэкенд (см. инструкцию ниже)
            images: selectedImages,
        });

        if (result.success) {
            setNewText('');
            setNewRating(5);
            setSelectedImages([]);
            setIsFormOpen(false);
        } else {
            alert("Ошибка при отправке отзыва. " + (result.error || ""));
        }
    };

    return (
        <div className="pt-32 pb-20 max-w-5xl mx-auto px-6 animate-in fade-in duration-700">
            <div className="text-center mb-16">
                 <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-lg">Отзывы гостей</h2>
                 <p className="text-white/60 text-sm uppercase tracking-widest font-medium">Ваши впечатления — наша гордость</p>
            </div>

            <div className="mb-12 flex justify-center">
                {!currentUser ? (
                     <button
                        onClick={onOpenAuth}
                        className="flex items-center gap-3 px-8 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-luxury-gold/50 text-white/50 hover:text-white transition-all"
                    >
                        <Lock size={16} />
                        <span className="text-xs uppercase tracking-widest">Войдите, чтобы оставить отзыв</span>
                    </button>
                ) : (
                    !isFormOpen ? (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="group relative px-8 py-3 rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-luxury-gold hover:bg-luxury-gold/10 transition-all duration-300"
                        >
                            <span className="text-xs uppercase tracking-widest text-white group-hover:text-luxury-gold font-medium">Оставить отзыв</span>
                        </button>
                    ) : (
                        <GlassCard className="w-full max-w-2xl animate-in slide-in-from-top-4 duration-500">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                                    <h3 className="font-serif text-xl text-white">Новый отзыв</h3>
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="text-xs text-white/30 hover:text-white uppercase tracking-wider">Отмена</button>
                                </div>

                                {/* Rating */}
                                <div className="flex flex-col items-center gap-2 mb-6">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setNewRating(star)}
                                                className="transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star
                                                    size={28}
                                                    className={`${star <= newRating ? 'fill-luxury-gold text-luxury-gold' : 'fill-transparent text-white/20'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest h-4">
                                        {newRating <= 3 ? "Требуется описание и фото" : "Отлично!"}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-white/40 text-xs uppercase tracking-widest">Автор: <span className="text-white">{currentUser.name}</span></p>
                                    </div>
                                    <div className="space-y-2">
                                        <textarea
                                            rows={4}
                                            placeholder={newRating <= 3 ? "Пожалуйста, опишите, что пошло не так (обязательно)..." : "Расскажите о ваших впечатлениях (необязательно)..."}
                                            value={newText}
                                            onChange={(e) => setNewText(e.target.value)}
                                            className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none transition-colors resize-none ${newRating <= 3 && !newText ? 'border-red-500/50' : 'border-white/10'}`}
                                        />
                                    </div>

                                    {/* Image Dropzone Area */}
                                    <div className="space-y-2">
                                        <label className={`text-[10px] uppercase tracking-widest ${newRating <= 3 && selectedImages.length === 0 ? 'text-red-400' : 'text-white/40'}`}>
                                            {newRating <= 3 ? 'Фотографии (обязательно)' : 'Фотографии (опционально)'}
                                        </label>

                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                            {selectedImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/20 group">
                                                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white hover:text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {selectedImages.length < 5 && (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    className={`
                                                        aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                                                        ${isDragOver
                                                            ? 'border-luxury-gold bg-luxury-gold/10'
                                                            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}
                                                        ${newRating <= 3 && selectedImages.length === 0 ? 'border-red-500/30 bg-red-900/10' : ''}
                                                    `}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        ref={fileInputRef}
                                                        onChange={handleImageSelect}
                                                    />
                                                    <Plus size={24} className="text-white/40 mb-1" />
                                                    <span className="text-[10px] text-white/30 uppercase">Добавить</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={`w-full font-semibold uppercase tracking-widest text-xs py-4 rounded-lg transition-colors flex items-center justify-center gap-2
                                        ${(newRating <= 3 && (!newText || selectedImages.length === 0))
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-luxury-gold text-luxury-black hover:bg-white'}`}
                                >
                                    <Send size={16} />
                                    <span>Опубликовать</span>
                                </button>
                            </form>
                        </GlassCard>
                    )
                )}
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                    <GlassCard key={review.id} className="flex flex-col h-full hover:border-luxury-gold/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                 <h4 className="font-serif text-lg text-white mb-1">{review.author}</h4>
                                 <span className="text-white/30 text-[10px] uppercase tracking-widest">{review.date}</span>
                             </div>
                             <div className="flex gap-1">
                                 {Array.from({ length: 5 }).map((_, i) => (
                                     <Star key={i} size={12} className={i < review.rating ? 'fill-luxury-gold text-luxury-gold' : 'fill-transparent text-white/10'} />
                                 ))}
                             </div>
                        </div>

                        {review.text && (
                            <p className="text-white/70 text-sm leading-relaxed mb-4 flex-grow italic font-light">
                                "{review.text}"
                            </p>
                        )}

                        {/* Отображение картинок (поддержка массива или одной строки для совместимости) */}
                        {(review.images && review.images.length > 0) ? (
                            <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                                {review.images.slice(0, 3).map((img, idx) => (
                                    <div key={idx} className="h-20 w-full rounded overflow-hidden relative cursor-pointer border border-white/10">
                                        <img src={img} alt="Review" className="w-full h-full object-cover" />
                                        {idx === 2 && review.images && review.images.length > 3 && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white">
                                                +{review.images.length - 3}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : review.image ? (
                             <div className="mt-auto pt-4 border-t border-white/5">
                                <div className="h-40 w-full rounded-lg overflow-hidden relative border border-white/10">
                                     <img src={review.image} alt="Review" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        ) : null}
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};
