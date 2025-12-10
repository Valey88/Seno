/**
 * Tables Store using Zustand
 */
import { create } from 'zustand';
import apiClient from '../services/api';
import { Table, Zone } from '../types';

interface TablesState {
  tables: Table[];
  isLoading: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  checkAvailability: (date: string, time: string) => Promise<{ occupied: number[]; available: number[] }>;
  createTable: (data: {
    zone: Zone;
    seats: number;
    x: number;
    y: number;
    rotation?: number;
    is_active?: boolean;
  }) => Promise<void>;
  updateTable: (id: number, data: {
    zone: Zone;
    seats: number;
    x: number;
    y: number;
    rotation?: number;
    is_active?: boolean;
  }) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
}

export const useTablesStore = create<TablesState>((set, get) => ({
  tables: [],
  isLoading: false,
  error: null,

  fetchTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/tables');
      const tables: Table[] = response.data.map((table: any) => ({
        id: table.id,
        zone: table.zone as Zone,
        seats: table.seats,
        x: table.x,
        y: table.y,
        rotation: table.rotation || 0,
        isReserved: false, // Will be updated by availability check
      }));

      set({ tables, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  checkAvailability: async (date: string, time: string) => {
    try {
      const response = await apiClient.get('/bookings/availability', {
        params: { date, time },
      });

      return {
        occupied: response.data.occupied_table_ids || [],
        available: response.data.available_table_ids || [],
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка проверки доступности');
    }
  },

  createTable: async (data) => {
    try {
      await apiClient.post('/tables', {
        zone: data.zone,
        seats: data.seats,
        x: data.x,
        y: data.y,
        rotation: data.rotation || 0,
        is_active: data.is_active !== false,
      });
      // Refresh tables after creation
      await get().fetchTables();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка создания стола');
    }
  },

  updateTable: async (id, data) => {
    try {
      await apiClient.put(`/tables/${id}`, {
        zone: data.zone,
        seats: data.seats,
        x: data.x,
        y: data.y,
        rotation: data.rotation || 0,
        is_active: data.is_active !== false,
      });
      // Refresh tables after update
      await get().fetchTables();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка обновления стола');
    }
  },

  deleteTable: async (id: number) => {
    try {
      await apiClient.delete(`/tables/${id}`);
      // Refresh tables after deletion
      await get().fetchTables();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка удаления стола');
    }
  },
}));

