/**
 * Bookings Store using Zustand
 */
import { create } from 'zustand';
import apiClient from '../services/api';
import { Booking, BookingRequest, BookingStatus } from '../types';

interface BookingsState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  createBooking: (data: BookingRequest) => Promise<{ success: boolean; paymentUrl?: string; bookingId?: number; error?: string }>;
  confirmPayment: (bookingId: number) => Promise<{ success: boolean }>;
  fetchBookings: () => Promise<void>;
  getBooking: (id: number) => Promise<Booking | null>;
  updateBookingStatus: (id: number, status: BookingStatus) => Promise<void>;
  updateBooking: (id: number, data: BookingRequest) => Promise<void>;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  createBooking: async (data: BookingRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/bookings', {
        user_name: data.name,
        user_phone: data.phone,
        date: data.date,
        time: data.time,
        guest_count: data.guests,
        table_id: data.tableId,
        comment: data.comment,
      });

      const bookingData = response.data;
      set({ isLoading: false });

      return {
        success: true,
        paymentUrl: bookingData.payment_url,
        bookingId: bookingData.booking_id,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Ошибка создания бронирования';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  confirmPayment: async (bookingId: number) => {
    try {
      // Simulate webhook call
      await apiClient.post(`/bookings/${bookingId}/webhook`, {
        booking_id: bookingId,
        payment_status: 'success',
      });

      return { success: true };
    } catch (error: any) {
      return { success: false };
    }
  },

  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/bookings');
      const bookings: Booking[] = response.data.map((item: any) => ({
        id: item.id.toString(),
        date: item.date,
        time: item.time,
        guests: item.guest_count,
        name: item.user_name,
        phone: item.user_phone,
        tableId: item.table_id,
        status: item.status as BookingStatus,
        depositAmount: item.deposit_amount,
        createdAt: new Date(item.created_at),
        comment: item.comment || '',
      }));

      set({ bookings, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  getBooking: async (id: number) => {
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      const data = response.data;

      return {
        id: data.id.toString(),
        date: data.date,
        time: data.time,
        guests: data.guest_count,
        name: data.user_name,
        phone: data.user_phone,
        tableId: data.table_id,
        status: data.status as BookingStatus,
        depositAmount: data.deposit_amount,
        createdAt: new Date(data.created_at),
        comment: data.comment || '',
      };
    } catch (error) {
      return null;
    }
  },

  updateBookingStatus: async (id: number, status: BookingStatus) => {
    try {
      await apiClient.put(`/bookings/${id}/status`, { status });
      // Refresh bookings after update
      await get().fetchBookings();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка обновления статуса');
    }
  },

  updateBooking: async (id: number, data: BookingRequest) => {
    try {
      await apiClient.put(`/bookings/${id}`, {
        user_name: data.name,
        user_phone: data.phone,
        date: data.date,
        time: data.time,
        guest_count: data.guests,
        table_id: data.tableId,
        comment: data.comment,
      });
      // Refresh bookings after update
      await get().fetchBookings();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Ошибка обновления бронирования');
    }
  },
}));

