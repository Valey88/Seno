"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Review } from "@/types";
import { useReviewsStore } from "@/stores/reviewsStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Star,
  Image as ImageIcon,
  Send,
  Lock,
  Upload,
  X,
  Plus,
  Maximize2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

// Yandex Maps review URL for Senoval
const YANDEX_MAPS_REVIEW_URL = "https://yandex.ru/maps/org/senoval/1398951724/reviews/?add-review=true";

interface ReviewsViewProps {
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

// Yandex Login Button Component
const YandexLoginButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FC3F1D] hover:bg-[#e63917] text-white text-sm font-medium transition-colors"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.4 22V13.9H10.5V22H7V7.08C7 4.2 8.8 2 12.5 2C16 2 17.6 3.8 17.6 6.3C17.6 8.3 16.5 9.7 14.6 10.5L18.2 22H14.4L11.5 11.6H12.4V22ZM12.4 9.1C13.8 9.1 14.5 8.3 14.5 6.8C14.5 5.3 13.8 4.5 12.4 4.5C10.9 4.5 10.5 5.4 10.5 7V9.1H12.4Z" />
    </svg>
    Войти через Яндекс
  </button>
);

const ReviewsView: React.FC<ReviewsViewProps> = ({ onOpenAuth }) => {
  // 1. Достаем данные из Auth Store (пользователь и флаг инициализации)
  const { user, isInitialized } = useAuthStore();

  // 2. Достаем методы работы с отзывами
  const { reviews, fetchReviews, createReview, isLoading } = useReviewsStore();

  // Check if user can leave reviews (Yandex OAuth only)
  const canLeaveReview = user?.oauthProvider === 'yandex';

  // Локальные стейты формы
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Локальные стейты для Lightbox (просмотр фото)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка отзывов при монтировании (только одобренные для публичной части)
  useEffect(() => {
    fetchReviews(true);
  }, [fetchReviews]);

  // Вычисление статистики (средний рейтинг)
  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: "0.0", count: 0 };
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      avg: (total / reviews.length).toFixed(1),
      count: reviews.length,
    };
  }, [reviews]);

  // --- Handlers: Работа с изображениями ---

  const processFiles = async (files: File[]) => {
    if (selectedImages.length + files.length > 5) {
      alert("Максимум 5 фотографий");
      return;
    }

    const newImages: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      try {
        const base64 = await readFileAsDataURL(file);
        newImages.push(base64);
      } catch (error) {
        console.error("Ошибка чтения файла:", error);
      }
    }
    setSelectedImages((prev) => [...prev, ...newImages]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Handlers: Lightbox ---

  const openLightbox = (imgSrc: string) => {
    setLightboxImage(imgSrc);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
    document.body.style.overflow = "auto";
  };

  // --- Handlers: Отправка формы ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!user || !canLeaveReview) {
      onOpenAuth();
      return;
    }

    // ВАЛИДАЦИЯ: 1-3 звезды требуют текст и фото
    if (newRating <= 3) {
      if (!newText.trim()) {
        setSubmitError(
          "Для низкой оценки (1-3 звезды) описание проблемы обязательно.",
        );
        return;
      }
      if (selectedImages.length === 0) {
        setSubmitError(
          "Для низкой оценки (1-3 звезды) необходимо приложить хотя бы одно фото.",
        );
        return;
      }
    }

    setIsSubmitting(true);

    const result = await createReview({
      author: user.name || "Гость",
      rating: newRating,
      text: newText,
      images: selectedImages,
    });

    setIsSubmitting(false);

    if (result.success) {
      // Сброс формы
      setNewText("");
      setNewRating(5);
      setSelectedImages([]);
      setIsFormOpen(false);
      setShowSuccessModal(true); // Show success modal with Yandex button
    } else {
      setSubmitError(result.error || "Произошла ошибка при отправке.");
    }
  };

  // Если авторизация еще не проверена, показываем лоадер
  if (!isInitialized) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex justify-center">
        <div className="text-white/30 animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin" /> Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 relative">
      {/* --- LIGHTBOX MODAL --- */}
      {lightboxOpen && lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-50 bg-black/20 rounded-full"
          >
            <X size={32} />
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* --- SUCCESS MODAL with Yandex Maps Button --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
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

      <div className="max-w-6xl mx-auto px-6">
        {/* --- HEADER & STATS --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/10 pb-8 gap-8 animate-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="font-serif text-5xl md:text-7xl text-white mb-2 tracking-tight">
              Отзывы
            </h2>
            <p className="text-luxury-gold text-sm uppercase tracking-[0.2em] font-medium">
              Мнение наших гостей
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-4xl text-white font-bold">{stats.avg}</div>
              <div className="flex gap-1 text-luxury-gold text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(Number(stats.avg))
                        ? "fill-luxury-gold"
                        : "text-white/20 fill-transparent"
                    }
                  />
                ))}
              </div>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="text-left">
              <div className="text-2xl text-white font-bold">{stats.count}</div>
              <div className="text-white/40 text-xs uppercase tracking-wider">
                Всего отзывов
              </div>
            </div>
          </div>
        </div>

        {/* --- CREATE REVIEW SECTION --- */}
        <div className="mb-16">
          {!user ? (
            // Вариант для НЕ авторизованных - показать кнопку входа через Яндекс
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md animate-in fade-in">
              <p className="text-white/60 mb-6 font-light">
                Оставлять отзывы могут только пользователи, вошедшие через Яндекс
              </p>
              <YandexLoginButton onClick={onOpenAuth} />
            </div>
          ) : !canLeaveReview ? (
            // Пользователь авторизован, но НЕ через Яндекс
            <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-8 text-center backdrop-blur-md animate-in fade-in">
              <div className="flex items-center justify-center gap-3 mb-4 text-yellow-400">
                <AlertCircle size={24} />
                <span className="text-lg">Оставлять отзывы могут только пользователи Яндекс</span>
              </div>
              <p className="text-white/60 mb-6 font-light text-sm">
                Вы вошли через {user.oauthProvider || 'email'}. Для публикации отзывов необходимо войти через Яндекс.
              </p>
              <YandexLoginButton onClick={onOpenAuth} />
            </div>
          ) : !isFormOpen ? (
            // Кнопка "Оставить отзыв" (Авторизован через Яндекс, форма закрыта)
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full py-6 rounded-2xl border border-dashed border-white/20 text-white/40 hover:text-luxury-gold hover:border-luxury-gold/50 hover:bg-luxury-gold/5 transition-all uppercase tracking-widest text-sm font-medium flex flex-col items-center gap-2 group animate-in fade-in"
            >
              <Plus
                size={24}
                className="group-hover:scale-110 transition-transform"
              />
              Оставить отзыв
            </button>
          ) : (
            // ФОРМА ОТЗЫВА
            <GlassCard className="animate-in fade-in slide-in-from-top-4 duration-500 border-luxury-gold/20 shadow-2xl shadow-luxury-gold/5">
              <form onSubmit={handleSubmit} className="space-y-8 p-2">
                {/* Заголовок формы */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-2xl text-white mb-1">
                      Ваш отзыв
                    </h3>
                    <p className="text-white/40 text-xs">
                      Автор:{" "}
                      <span className="text-luxury-gold">{user.name}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Рейтинг */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">
                    Оценка
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="group focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={`${star <= newRating ? "fill-luxury-gold text-luxury-gold" : "fill-transparent text-white/20 group-hover:text-white/40"} transition-colors`}
                        />
                      </button>
                    ))}
                  </div>

                  {newRating <= 3 ? (
                    <div className="flex items-center gap-2 text-yellow-500/80 text-xs bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20 max-w-md">
                      <AlertCircle size={16} />
                      <span>
                        Для оценки 1-3 звезды описание и фото обязательны
                      </span>
                    </div>
                  ) : (
                    <div className="text-green-400/80 text-xs h-8 flex items-center">
                      Отлично! Описание и фото по желанию.
                    </div>
                  )}
                </div>

                {/* Текст */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">
                    Комментарий
                  </label>
                  <textarea
                    rows={4}
                    value={newText}
                    onChange={(e) => {
                      setNewText(e.target.value);
                      setSubmitError(null);
                    }}
                    placeholder={
                      newRating <= 3
                        ? "Пожалуйста, расскажите, что пошло не так..."
                        : "Расскажите о ваших впечатлениях..."
                    }
                    className={`w-full bg-black/40 border rounded-xl px-5 py-4 text-white text-sm focus:border-luxury-gold outline-none transition-all resize-none
                    ${newRating <= 3 && !newText && submitError ? "border-red-500/50 bg-red-900/10" : "border-white/10"}`}
                  />
                </div>

                {/* Фотографии */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">
                    Фотографии {newRating <= 3 && "(Обязательно)"}
                  </label>

                  <div
                    className={`grid grid-cols-3 md:grid-cols-5 gap-4 transition-all p-4 rounded-xl border-2 border-dashed
                    ${isDragOver ? "border-luxury-gold bg-luxury-gold/10" : "border-white/10 hover:border-white/20"}
                    ${newRating <= 3 && selectedImages.length === 0 && submitError ? "border-red-500/30 bg-red-900/5" : ""}
                    `}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {/* Список выбранных фото */}
                    {selectedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/20 group shadow-lg"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt="preview"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Кнопка добавления */}
                    {selectedImages.length < 5 && (
                      <label className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all rounded-lg">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageSelect}
                          ref={fileInputRef}
                        />
                        <Plus size={24} className="text-white/30 mb-2" />
                        <span className="text-[9px] uppercase text-white/30 text-center leading-tight">
                          Нажмите или
                          <br />
                          перетащите
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Ошибки отправки */}
                {submitError && (
                  <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/20 flex items-center gap-2">
                    <AlertCircle size={16} /> {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-luxury-gold text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-white hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      {" "}
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Отправка...{" "}
                    </>
                  ) : (
                    <>
                      {" "}
                      <Send size={16} /> Отправить отзыв{" "}
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          )}
        </div>

        {/* --- REVIEWS GRID --- */}
        {isLoading && !reviews.length ? (
          <div className="text-center py-20 text-white/30 animate-pulse">
            Загрузка отзывов...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            {reviews.map((review) => {
              const imagesList =
                review.images && review.images.length > 0
                  ? review.images
                  : review.image
                    ? [review.image]
                    : [];

              return (
                <div
                  key={review.id}
                  className="bg-[#1a1a1a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-500 group flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury-gold to-yellow-700 flex items-center justify-center text-black font-bold text-sm shadow-lg">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-white leading-none mb-1">
                          {review.author}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={
                                  i < review.rating
                                    ? "fill-luxury-gold text-luxury-gold"
                                    : "fill-white/10 text-white/10"
                                }
                              />
                            ))}
                          </div>
                          <span className="text-white/20 text-[10px]">
                            • {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="mb-6 flex-grow">
                    {review.text ? (
                      <p className="text-white/80 text-sm leading-relaxed font-light italic">
                        "{review.text}"
                      </p>
                    ) : (
                      <p className="text-white/20 text-xs italic">
                        Без комментария
                      </p>
                    )}
                  </div>

                  {/* Images Grid */}
                  {imagesList.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-auto">
                      {imagesList.map((img, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-zoom-in group/img border border-white/5"
                          onClick={() => openLightbox(img)}
                        >
                          <img
                            src={img}
                            alt="review"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize2
                              size={16}
                              className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsView;
