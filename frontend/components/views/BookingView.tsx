"use client";

import React from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Toaster } from "sonner"; // Рекомендуемая библиотека для уведомлений
import { BookingForm } from "../BookingForm";

export const BookingView: React.FC = () => {
  return (
    <div className="pt-32 pb-20 min-h-screen bg-stone-950 text-stone-200">
      {/* Уведомления */}
      <Toaster position="top-center" theme="dark" richColors />

      <div className="max-w-7xl mx-auto px-6">
        {/* Шапка страницы */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-8 gap-8 animate-in slide-in-from-top-4 duration-700">
          <div>
            <h2 className="font-serif text-5xl md:text-7xl text-white mb-3 tracking-tight">
              Бронирование
            </h2>
            <p className="text-luxury-gold text-sm uppercase tracking-[0.2em] font-medium">
              Выберите свой идеальный вечер
            </p>
          </div>

          {/* Инфо-блок */}
          <div className="flex flex-wrap gap-6 text-white/40 text-xs uppercase tracking-widest md:justify-end">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-luxury-gold" />
              <span>Ежедневно</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-luxury-gold" />
              <span>12:00 - 00:00</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-luxury-gold" />
              <span>Мойка 82</span>
            </div>
          </div>
        </div>

        {/* Форма бронирования с логикой */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 bg-stone-900/30 p-1 rounded-2xl border border-white/5">
          <BookingForm />
        </div>
      </div>
    </div>
  );
};
