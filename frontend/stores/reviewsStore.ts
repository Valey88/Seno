/**
 * Reviews Store using Zustand
 */
import { create } from 'zustand';
import apiClient from '../services/api';
import { Review } from '../types';

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: (approvedOnly?: boolean) => Promise<void>;
  createReview: (data: {
    author: string;
    rating: number;
    text: string;
    image_url?: string;
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
      const response = await apiClient.get('/reviews', {
        params: { approved_only: approvedOnly },
      });

      const reviews: Review[] = response.data.map((item: any) => ({
        id: item.id,
        author: item.author,
        rating: item.rating,
        text: item.text,
        date: new Date(item.created_at).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        image: item.image_url || undefined,
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
      // Refresh reviews after creation
      await get().fetchReviews(true);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Ошибка создания отзыва';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteReview: async (id: number) => {
    try {
      await apiClient.delete(`/reviews/${id}`);
      // Refresh reviews after deletion
      await get().fetchReviews(false); // Get all reviews including unapproved
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка удаления отзыва');
    }
  },

  approveReview: async (id: number) => {
    try {
      await apiClient.put(`/reviews/${id}/approve`);
      // Refresh reviews after approval
      await get().fetchReviews(false); // Get all reviews including unapproved
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка одобрения отзыва');
    }
  },
}));

