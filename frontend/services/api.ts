/**
 * API Client for FastAPI backend
 */
import axios, { AxiosInstance, AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const storageData = localStorage.getItem("auth-storage");
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
apiClient.interceptors.request.use(
  (config) => {
    // 1. Пытаемся найти данные Zustand в localStorage
    // Имя 'auth-storage' должно совпадать с тем, что вы указали в useAuthStore (persist name)
    const storageData = localStorage.getItem("auth-storage");

    if (storageData) {
      try {
        // Zustand хранит данные в формате JSON: { state: { token: "...", ... }, version: 0 }
        const parsed = JSON.parse(storageData);
        const token = parsed.state?.token;

        // Если токен есть, добавляем его в заголовки
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error parsing auth token", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("auth_token");
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
