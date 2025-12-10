'use client'

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Review, User } from '../types';
import { useReviewsStore } from '../stores/reviewsStore';
import { Star, Image as ImageIcon, Send, Lock } from 'lucide-react';

interface ReviewsSectionProps {
    currentUser: User | null;
    onOpenAuth: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ currentUser, onOpenAuth }) => {
    const { reviews, fetchReviews, createReview, isLoading } = useReviewsStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form State
    const [newText, setNewText] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Fetch Reviews
    useEffect(() => {
        fetchReviews(true); // Get only approved reviews
    }, [fetchReviews]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setSelectedImage(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText || !currentUser) return;

        // Convert image to base64 if needed, or just use URL
        // For now, we'll pass the URL as image_url
        const result = await createReview({
            author: currentUser.name || "Гость",
            rating: newRating,
            text: newText,
            image_url: selectedImage || undefined,
        });

        if (result.success) {
            // Reset
            setNewText('');
            setNewRating(5);
            setSelectedImage(null);
            setIsFormOpen(false);
        }
    };

    return (
        <div className="pt-32 pb-20 max-w-5xl mx-auto px-6 animate-in fade-in duration-700">
            <div className="text-center mb-16">
                 <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-lg">Отзывы гостей</h2>
                 <p className="text-white/60 text-sm uppercase tracking-widest font-medium">Ваши впечатления — наша гордость</p>
            </div>

            {/* "Add Review" Toggle Area */}
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
                                <div className="flex gap-2 justify-center mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            type="button" 
                                            key={star} 
                                            onClick={() => setNewRating(star)}
                                            className="transition-transform hover:scale-110 focus:outline-none"
                                        >
                                            <Star 
                                                size={24} 
                                                className={`${star <= newRating ? 'fill-luxury-gold text-luxury-gold' : 'fill-transparent text-white/20'}`} 
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-white/40 text-xs uppercase tracking-widest">Автор: <span className="text-white">{currentUser.name}</span></p>
                                    </div>
                                    <div className="space-y-2">
                                        <textarea 
                                            rows={4}
                                            placeholder="Расскажите о ваших впечатлениях..."
                                            value={newText}
                                            onChange={(e) => setNewText(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none transition-colors resize-none"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white/60 hover:text-white text-xs uppercase tracking-wider">
                                            <ImageIcon size={16} />
                                            <span>{selectedImage ? 'Фото выбрано' : 'Добавить фото'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                        {selectedImage && (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                                                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-luxury-gold text-luxury-black font-semibold uppercase tracking-widest text-xs py-4 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
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
                        
                        <p className="text-white/70 text-sm leading-relaxed mb-4 flex-grow italic font-light">
                            "{review.text}"
                        </p>

                        {review.image && (
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <div className="h-40 w-full rounded-lg overflow-hidden relative group cursor-pointer">
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all"></div>
                                     <img src={review.image} alt="Review attachment" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};