/**
 * Reviews Store using Zustand
 * Implements Optimistic UI for instant updates (Kanban style)
 */
import { create } from 'zustand';
import apiClient from '../services/api';
import { Review } from '../types';

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReviews: (approvedOnly?: boolean) => Promise<void>;
  createReview: (data: {
    author: string;
    rating: number;
    text: string;
    image_url?: string;
    images?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  deleteReview: (id: number) => Promise<void>;
  approveReview: (id: number) => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async (approvedOnly = true) => {
    set({ isLoading: true, error: null });
    try {
      // Для админки approvedOnly передается как false, чтобы получить ВСЕ отзывы
      const response = await apiClient.get('/reviews', {
        params: { approved_only: approvedOnly },
      });

      const reviews: Review[] = response.data.map((item: any) => ({
        id: item.id,
        author: item.author,
        rating: item.rating,
        text: item.text,
        // Форматируем дату для отображения
        date: new Date(item.created_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        // Сохраняем оригинал даты для сортировки если нужно
        created_at: item.created_at,
        images: item.images || [],
        // Старое поле для совместимости (берем первую картинку, если есть)
        image: item.images && item.images.length > 0 ? item.images[0] : undefined,
        // ВАЖНО: Маппим статус для Канбан-доски
        isApproved: item.is_approved
      }));

      set({ reviews, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createReview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/reviews', data);
      set({ isLoading: false });
      // После создания перечитываем список (для публичной части)
      await get().fetchReviews(true);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Ошибка создания отзыва';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteReview: async (id: number) => {
    // 1. ОПТИМИСТИЧНОЕ УДАЛЕНИЕ (Мгновенно убираем из UI)
    const previousReviews = get().reviews;
    set({
      reviews: previousReviews.filter((r) => r.id !== id)
    });

    try {
      // 2. Отправляем запрос на сервер
      await apiClient.delete(`/reviews/${id}`);
    } catch (error: any) {
      // 3. Если ошибка — возвращаем как было и показываем алерт
      console.error("Ошибка удаления:", error);
      set({ reviews: previousReviews });
      throw new Error(error.response?.data?.detail || 'Ошибка удаления отзыва');
    }
  },

  approveReview: async (id: number) => {
    // 1. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ (Мгновенно переносим в колонку "Опубликовано")
    const previousReviews = get().reviews;

    set({
      reviews: previousReviews.map((r) =>
        r.id === id ? { ...r, isApproved: true } : r
      )
    });

    try {
      // 2. Отправляем запрос на сервер
      await apiClient.put(`/reviews/${id}/approve`);
    } catch (error: any) {
      // 3. Если ошибка — откатываем статус назад
      console.error("Ошибка одобрения:", error);
      set({ reviews: previousReviews });
      throw new Error(error.response?.data?.detail || 'Ошибка одобрения отзыва');
    }
  },
}));
