/**
 * Menu Store using Zustand
 */
import { create } from 'zustand';
import apiClient from '../services/api';
import { MenuItem, MenuCategory } from '../types';

interface MenuCategoryWithItems {
  id: number;
  title: string;
  sort_order: number;
  items: MenuItem[];
}

interface MenuState {
  categories: MenuCategoryWithItems[];
  menuItems: MenuItem[];
  categoriesList: { id: string; label: string }[];
  isLoading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  fetchCategories: () => Promise<{ id: string; label: string }[]>;
  createCategory: (title: string, sortOrder?: number) => Promise<void>;
  deleteCategory: (categoryId: number) => Promise<void>;
  createMenuItem: (data: {
    title: string;
    description?: string;
    price: number;
    weight: number;
    image_url?: string;
    category_id: number;
    is_spicy?: boolean;
    is_vegan?: boolean;
  }) => Promise<void>;
  updateMenuItem: (id: number, data: {
    title: string;
    description?: string;
    price: number;
    weight: number;
    image_url?: string;
    category_id: number;
    is_spicy?: boolean;
    is_vegan?: boolean;
  }) => Promise<void>;
  deleteMenuItem: (id: number) => Promise<void>;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  menuItems: [],
  categoriesList: [],
  isLoading: false,
  error: null,

  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/menu');
      const categories: MenuCategoryWithItems[] = response.data;

      // Flatten menu items from all categories
      const allItems: MenuItem[] = [];
      categories.forEach((cat) => {
        cat.items.forEach((item) => {
          allItems.push({
            id: item.id,
            title: item.title,
            description: item.description || '',
            ingredients: item.description ? item.description.split(', ') : [],
            weight: item.weight,
            price: item.price,
            image: item.image_url || '',
            category: cat.title.toLowerCase().replace(/\s/g, '_') as MenuCategory,
            isSpicy: item.is_spicy,
            isVegan: item.is_vegan,
          });
        });
      });

      // Create categories list for UI
      const categoriesList = categories.map((cat) => ({
        id: cat.title.toLowerCase().replace(/\s/g, '_'),
        label: cat.title,
      }));

      set({ categories, menuItems: allItems, categoriesList, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchCategories: async () => {
    const { categoriesList } = get();
    if (categoriesList.length === 0) {
      await get().fetchMenu();
    }
    return get().categoriesList;
  },

  createCategory: async (title: string, sortOrder = 0) => {
    try {
      await apiClient.post('/menu/categories', {
        title,
        sort_order: sortOrder,
      });
      // Refresh menu after creation
      await get().fetchMenu();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка создания категории');
    }
  },

  deleteCategory: async (categoryId: number) => {
    try {
      await apiClient.delete(`/menu/categories/${categoryId}`);
      // Refresh menu after deletion
      await get().fetchMenu();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка удаления категории');
    }
  },

  createMenuItem: async (data) => {
    try {
      await apiClient.post('/menu/items', data);
      // Refresh menu after creation
      await get().fetchMenu();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка создания блюда');
    }
  },

  updateMenuItem: async (id, data) => {
    try {
      await apiClient.put(`/menu/items/${id}`, data);
      // Refresh menu after update
      await get().fetchMenu();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка обновления блюда');
    }
  },

  deleteMenuItem: async (id: number) => {
    try {
      await apiClient.delete(`/menu/items/${id}`);
      // Refresh menu after deletion
      await get().fetchMenu();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка удаления блюда');
    }
  },
}));

