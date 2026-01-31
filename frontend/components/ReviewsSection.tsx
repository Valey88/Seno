'use client'

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Review, User } from '../types';
import { useReviewsStore } from '../stores/reviewsStore';
import { Star, Image as ImageIcon, Send, Lock, Upload, X, Plus, ExternalLink, CheckCircle } from 'lucide-react';

// Yandex Maps review URL for Senoval
const YANDEX_MAPS_REVIEW_URL = "https://yandex.ru/maps/org/senoval/1398951724/reviews/?add-review=true";

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form State
    const [newText, setNewText] = useState('');
    const [newRating, setNewRating] = useState(5);

    // ИЗМЕНЕНИЕ: Теперь храним массив строк (картинок)
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if user can leave reviews (Yandex OAuth only)
    const canLeaveReview = currentUser?.oauthProvider === 'yandex';

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
        if (!currentUser || !canLeaveReview) return;

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

        const result = await createReview({
            author: currentUser.name || "Гость",
            rating: newRating,
            text: newText,
            images: selectedImages,
        });

        if (result.success) {
            setNewText('');
            setNewRating(5);
            setSelectedImages([]);
            setIsFormOpen(false);
            setShowSuccessModal(true); // Show success modal with Yandex button
        } else {
            alert("Ошибка при отправке отзыва. " + (result.error || ""));
        }
    };

    // Yandex icon SVG
    const YandexIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.5 15h-2V8.5h2V17zm-1-9.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
    );

    return (
        <div className="pt-32 pb-20 max-w-5xl mx-auto px-6 animate-in fade-in duration-700">
            <div className="text-center mb-16">
                <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-lg">Отзывы гостей</h2>
                <p className="text-white/60 text-sm uppercase tracking-widest font-medium">Ваши впечатления — наша гордость</p>
            </div>

            <div className="mb-12 flex justify-center">
                {!currentUser ? (
                    // Not logged in - show Yandex login button
                    <button
                        onClick={onOpenAuth}
                        className="flex items-center gap-3 px-8 py-3 rounded-lg bg-white/5 border border-white/10 hover:border-luxury-gold/50 text-white/50 hover:text-white transition-all"
                    >
                        <Lock size={16} />
                        <span className="text-xs uppercase tracking-widest">Войдите через Яндекс, чтобы оставить отзыв</span>
                    </button>
                ) : !canLeaveReview ? (
                    // Logged in but not via Yandex
                    <div className="text-center">
                        <div className="flex items-center gap-3 px-8 py-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="text-sm">Оставлять отзывы могут только пользователи, вошедшие через Яндекс</span>
                        </div>
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 px-6 py-3 mx-auto rounded-lg bg-[#FC3F1D]/90 hover:bg-[#FC3F1D] text-white text-sm font-medium transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.4 22V13.9H10.5V22H7V7.08C7 4.2 8.8 2 12.5 2C16 2 17.6 3.8 17.6 6.3C17.6 8.3 16.5 9.7 14.6 10.5L18.2 22H14.4L11.5 11.6H12.4V22ZM12.4 9.1C13.8 9.1 14.5 8.3 14.5 6.8C14.5 5.3 13.8 4.5 12.4 4.5C10.9 4.5 10.5 5.4 10.5 7V9.1H12.4Z" />
                            </svg>
                            Войти через Яндекс
                        </button>
                    </div>
                ) : (
                    // Logged in via Yandex - show review form
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

            {/* Success Modal with Yandex Maps Button */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
                    <GlassCard className="max-w-md mx-4 text-center animate-in zoom-in-95 duration-300">
                        <div className="mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle size={32} className="text-green-400" />
                            </div>
                            <h3 className="font-serif text-2xl text-white mb-2">Спасибо за отзыв!</h3>
                            <p className="text-white/60 text-sm">
                                Ваш отзыв успешно опубликован на нашем сайте.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-[#FC3F1D]/10 border border-[#FC3F1D]/30">
                                <p className="text-white/80 text-sm mb-3">
                                    Помогите нам стать лучше — оставьте отзыв на Яндекс.Картах!
                                </p>
                                <a
                                    href={YANDEX_MAPS_REVIEW_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FC3F1D] hover:bg-[#e63917] text-white text-sm font-medium transition-colors"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.4 22V13.9H10.5V22H7V7.08C7 4.2 8.8 2 12.5 2C16 2 17.6 3.8 17.6 6.3C17.6 8.3 16.5 9.7 14.6 10.5L18.2 22H14.4L11.5 11.6H12.4V22ZM12.4 9.1C13.8 9.1 14.5 8.3 14.5 6.8C14.5 5.3 13.8 4.5 12.4 4.5C10.9 4.5 10.5 5.4 10.5 7V9.1H12.4Z" />
                                    </svg>
                                    Оставить отзыв на Яндекс
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="text-sm text-white/40 hover:text-white transition-colors"
                            >
                                Закрыть
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

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
