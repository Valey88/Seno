// src/components/views/UserProfile.tsx
"use client";

import React, { useEffect } from "react";
import { GlassCard } from "@/components/GlassCard"; // Абсолютный импорт
import { useBookingsStore } from "@/stores/bookingsStore";
import { User } from "@/types";
import { Calendar, Clock } from "lucide-react";

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const { bookings, fetchBookings, isLoading } = useBookingsStore();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <h2 className="font-serif text-4xl text-white mb-2">
            Личный кабинет
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-luxury-gold flex items-center justify-center text-black font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-lg leading-none">{user.name}</p>
              <p className="text-white/40 text-sm">{user.phone}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-900/50 hover:bg-red-900/10 px-6 py-3 rounded-lg transition-all"
        >
          Выйти
        </button>
      </div>

      <h3 className="font-serif text-2xl text-white italic mb-6">
        История бронирований
      </h3>

      {isLoading ? (
        <div className="text-white/30 text-center py-10">
          Загрузка истории...
        </div>
      ) : bookings.length === 0 ? (
        <GlassCard className="text-center py-12 border-dashed border-white/10">
          <p className="text-white/40 mb-4">
            У вас пока нет активных бронирований
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {bookings.map((item) => (
            <GlassCard
              key={item.id}
              className="flex flex-col md:flex-row justify-between items-center gap-6 hover:border-luxury-gold/30 transition-colors"
            >
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <span className="font-serif text-xl text-white">
                    {new Date(item.date).toLocaleDateString("ru-RU")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider
                                        ${item.status === "CONFIRMED"
                        ? "border-green-500/30 text-green-400 bg-green-500/5"
                        : item.status === "CANCELLED"
                          ? "border-red-500/30 text-red-400 bg-red-500/5"
                          : "border-yellow-500/30 text-yellow-400 bg-yellow-500/5"
                      }`}
                  >
                    {item.status === "CONFIRMED"
                      ? "Подтверждено"
                      : item.status === "CANCELLED"
                        ? "Отменено"
                        : "Ожидает"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-white/50 text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {item.time}
                  </span>
                  <span>Стол №{item.tableNumber || item.tableId}</span>
                  <span>{item.guests} чел.</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-luxury-gold font-mono text-lg">
                  {item.depositAmount}₽
                </div>
                <div className="text-[9px] text-white/20 uppercase tracking-widest">
                  Депозит
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
