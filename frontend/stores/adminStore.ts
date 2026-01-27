// src/stores/adminStore.ts
import { create } from "zustand";
import apiClient from "../services/api";

interface AdminState {
  stats: any;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  isLoading: false,
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      // Просто делаем запрос. Токен подставится сам через interceptor в api.ts
      const response = await apiClient.get("/admin/stats");
      set({ stats: response.data });
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
