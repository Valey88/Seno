/**
 * Auth Store using Zustand
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestEmailVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    password: string;
    email: string;
    name: string;
    code: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new URLSearchParams();
          formData.append('username', username);
          formData.append('password', password);

          const response = await apiClient.post('/auth/token', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          const { access_token } = response.data;
          localStorage.setItem('auth_token', access_token);

          // Get user info
          const userResponse = await apiClient.get('/auth/me');
          const userData = userResponse.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === 'ADMIN' ? 'ADMIN' : 'USER',
          };

          set({ user, token: access_token, isLoading: false });
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Ошибка входа';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      requestEmailVerification: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/request-verification', { email });
          set({ isLoading: false });
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Ошибка отправки кода';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', {
            username: data.username,
            password: data.password,
            email: data.email,
            name: data.name,
            code: data.code,
          });

          const { access_token } = response.data;
          localStorage.setItem('auth_token', access_token);

          // Get user info
          const userResponse = await apiClient.get('/auth/me');
          const userData = userResponse.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === 'ADMIN' ? 'ADMIN' : 'USER',
          };

          set({ user, token: access_token, isLoading: false });
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Ошибка регистрации';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },

      getCurrentUser: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ user: null });
          return;
        }

        try {
          const response = await apiClient.get('/auth/me');
          const userData = response.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === 'ADMIN' ? 'ADMIN' : 'USER',
          };

          set({ user, token });
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

