/**
 * Admin Store using Zustand
 */
import { create } from 'zustand';
import apiClient from '../services/api';

interface Stats {
  total_deposits: number;
  total_guests: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
}

interface AdminState {
  stats: Stats | null;
  isLoading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/admin/stats');
      const stats: Stats = response.data;
      set({ stats, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));

