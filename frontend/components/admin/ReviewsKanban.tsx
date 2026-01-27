'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useReviewsStore } from '@/stores/reviewsStore';
import { Review } from '@/types';
import { Search, Star, Check, Trash2, Clock, Image as ImageIcon, Inbox, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export const ReviewsKanban: React.FC = () => {
    const { reviews, approveReview, deleteReview, fetchReviews, isLoading } = useReviewsStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Грузим ВСЕ отзывы для админки (false)
        fetchReviews(false);
    }, []);

    const filteredReviews = useMemo(() => {
        if (!searchQuery) return reviews;
        const lowerQ = searchQuery.toLowerCase();
        return reviews.filter(r =>
            r.author.toLowerCase().includes(lowerQ) ||
            (r.text && r.text.toLowerCase().includes(lowerQ))
        );
    }, [reviews, searchQuery]);

    // Разделяем по статусу isApproved
    const pendingReviews = filteredReviews.filter(r => !r.isApproved);
    const publishedReviews = filteredReviews.filter(r => r.isApproved);

    // --- КОМПОНЕНТ КАРТОЧКИ ---
    const ReviewCard = ({ review, isPending }: { review: Review, isPending: boolean }) => {
        const hasImages = review.images && review.images.length > 0;

        return (
            <div className="bg-[#2a2a2a] rounded-xl border border-white/5 p-4 shadow-lg hover:shadow-xl hover:border-luxury-gold/30 transition-all group flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">

                {/* 1. Верхняя часть: Автор, Дата, Рейтинг */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {/* Аватар с первой буквой */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black shadow-inner
                            ${isPending ? 'bg-yellow-500' : 'bg-green-500'}`}>
                            {review.author.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <h4 className="font-bold text-white text-sm leading-tight tracking-wide">{review.author}</h4>
                            {/* Звезды */}
                            <div className="flex items-center gap-0.5 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        className={i < review.rating ? 'fill-luxury-gold text-luxury-gold' : 'fill-white/10 text-white/10'}
                                    />
                                ))}
                                <span className="ml-2 text-[10px] font-bold text-luxury-gold">{review.rating}.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Дата */}
                    <div className="text-[10px] text-white/30 flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                        <Clock size={10} />
                        {review.date}
                    </div>
                </div>

                {/* 2. Текст отзыва */}
                {review.text ? (
                    <div className="bg-[#1e1e1e] p-3 rounded-lg border border-white/5 relative">
                        <MessageSquare size={12} className="absolute top-2 left-2 text-white/10" />
                        <p className="text-xs text-white/80 leading-relaxed italic pl-4">
                            "{review.text}"
                        </p>
                    </div>
                ) : (
                    <div className="text-[10px] text-white/20 italic pl-1">Без текста</div>
                )}

                {/* 3. Фотографии (Сетка) */}
                {hasImages && (
                    <div className="mt-1">
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon size={12} className="text-white/40" />
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Фото ({review.images!.length})</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {review.images!.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="relative aspect-square w-full rounded-md overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors cursor-pointer bg-black">
                                    <img
                                        src={img}
                                        alt="Фото"
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    />
                                    {/* Если фоток больше 4, показываем счетчик на последней */}
                                    {idx === 3 && review.images!.length > 4 && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs font-bold text-white">
                                            +{review.images!.length - 4}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Кнопки действий */}
                <div className="pt-3 mt-auto flex gap-3 border-t border-white/5">
                    {isPending && (
                        <button
                            onClick={() => approveReview(review.id)}
                            className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Check size={14} strokeWidth={3} /> Одобрить
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (confirm('Удалить отзыв безвозвратно?')) deleteReview(review.id);
                        }}
                        className={`bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg py-2 flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95
                        ${isPending ? 'px-4' : 'flex-1 gap-2 text-xs font-bold uppercase tracking-wider'}`}
                        title="Удалить"
                    >
                        <Trash2 size={14} /> {isPending ? '' : 'Удалить'}
                    </button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full text-white/30 animate-pulse text-sm uppercase tracking-widest">Загрузка CRM...</div>;
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
            {/* Панель поиска */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                    type="text"
                    placeholder="Поиск по имени гостя или тексту отзыва..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-sm focus:border-luxury-gold focus:bg-[#252525] outline-none placeholder:text-white/20 transition-all shadow-lg"
                />
            </div>

            {/* Канбан Доска */}
            <div className="flex gap-6 flex-1 overflow-hidden">

                {/* КОЛОНКА 1: ТРЕБУЮТ ВНИМАНИЯ (1-3 звезды) */}
                <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-900/20 to-transparent flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-yellow-500">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-widest text-white">На модерации</h3>
                                <p className="text-[10px] text-white/40">Оценка 1-3 звезды</p>
                            </div>
                        </div>
                        <span className="text-xs bg-yellow-500 text-black font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                            {pendingReviews.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-[#111]/50">
                        {pendingReviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-white/20 gap-4">
                                <div className="p-4 rounded-full bg-white/5 border border-white/5">
                                    <CheckCircle2 size={40} className="opacity-50" />
                                </div>
                                <span className="text-xs uppercase tracking-widest">Все чисто</span>
                            </div>
                        ) : (
                            pendingReviews.map(r => <ReviewCard key={r.id} review={r} isPending={true} />)
                        )}
                    </div>
                </div>

                {/* КОЛОНКА 2: ОПУБЛИКОВАНО (4-5 звезд или одобренные) */}
                <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-green-500/20 bg-gradient-to-r from-green-900/20 to-transparent flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-green-500">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-widest text-white">Опубликовано</h3>
                                <p className="text-[10px] text-white/40">Доступно на сайте</p>
                            </div>
                        </div>
                        <span className="text-xs bg-white/10 text-white font-bold px-3 py-1 rounded-full border border-white/10">
                            {publishedReviews.length}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-[#111]/50">
                        {publishedReviews.length === 0 ? (
                            <div className="text-center py-20 text-white/20 text-xs uppercase tracking-widest">
                                Нет отзывов
                            </div>
                        ) : (
                            publishedReviews.map(r => <ReviewCard key={r.id} review={r} isPending={false} />)
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
