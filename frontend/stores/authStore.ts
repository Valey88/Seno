import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "../services/api";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean; // Флаг, что проверка авторизации прошла
  error: string | null;

  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  requestEmailVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithYandex: () => void;
  handleOAuthCallback: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>; // Глобальная проверка
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new URLSearchParams();
          formData.append("username", username);
          formData.append("password", password);

          const response = await apiClient.post("/auth/token", formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          const { access_token } = response.data;

          // Получаем профиль
          // Важно: apiClient должен автоматически подхватывать токен из стора или мы передаем его в headers,
          // но лучше сохранить его в стор сразу, чтобы перехватчик (interceptor) его увидел.
          set({ token: access_token });

          // Теперь делаем запрос за профилем
          const userResponse = await apiClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          const userData = userResponse.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === "ADMIN" ? "ADMIN" : "USER",
            oauthProvider: userData.oauth_provider,
          };

          set({ user, isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Ошибка входа",
            isLoading: false,
            token: null,
            user: null,
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post("/auth/register", {
            username: data.username,
            password: data.password,
            email: data.email,
            name: data.name,
            code: data.code,
          });

          const { access_token } = response.data;
          set({ token: access_token });

          const userResponse = await apiClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          const userData = userResponse.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === "ADMIN" ? "ADMIN" : "USER",
            oauthProvider: userData.oauth_provider,
          };

          set({ user, isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Ошибка регистрации",
            isLoading: false,
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      requestEmailVerification: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post("/auth/request-verification", { email });
          set({ isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || "Ошибка отправки кода",
            isLoading: false,
          });
          return { success: false, error: error.response?.data?.detail };
        }
      },

      loginWithYandex: () => {
        // Redirect to Yandex OAuth endpoint
        window.location.href = "http://localhost:8000/api/auth/yandex";
      },

      handleOAuthCallback: async (token: string) => {
        set({ isLoading: true, token });
        try {
          const userResponse = await apiClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = userResponse.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === "ADMIN" ? "ADMIN" : "USER",
            oauthProvider: userData.oauth_provider,
          };

          set({ user, isLoading: false, isInitialized: true });
        } catch (error) {
          console.error("OAuth callback error:", error);
          set({ user: null, token: null, isLoading: false, isInitialized: true });
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem("auth-storage"); // Очистка persist
      },

      // Глобальная проверка при загрузке страницы
      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isInitialized: true, user: null });
          return;
        }

        try {
          // Пытаемся получить данные пользователя с текущим токеном
          const response = await apiClient.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = response.data;

          const user: User = {
            id: userData.id.toString(),
            name: userData.name || userData.username,
            phone: userData.username,
            email: userData.email,
            role: userData.role === "ADMIN" ? "ADMIN" : "USER",
            oauthProvider: userData.oauth_provider,
          };

          set({ user, isInitialized: true });
        } catch (error) {
          // Если токен невалиден (401), сбрасываем авторизацию
          console.error("Token invalid, logging out");
          set({ user: null, token: null, isInitialized: true });
        }
      },
    }),
    {
      name: "auth-storage", // Имя ключа в localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }), // Сохраняем ТОЛЬКО токен, юзера грузим свежего
    },
  ),
);
