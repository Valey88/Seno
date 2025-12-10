'use client'

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { HallMap } from './HallMap';
import { useBookingsStore } from '../stores/bookingsStore';
import { useTablesStore } from '../stores/tablesStore';
import { BookingRequest } from '../types';
import { Loader2, Check } from 'lucide-react';

export const BookingForm: React.FC = () => {
  const { createBooking, confirmPayment, isLoading: bookingLoading } = useBookingsStore();
  const { tables, fetchTables, isLoading: tablesLoading } = useTablesStore();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select, 2: Payment, 3: Success
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const [formData, setFormData] = useState<BookingRequest>({
    date: new Date().toISOString().split('T')[0],
    time: "19:00",
    guests: 2,
    name: "",
    phone: "",
    tableId: null,
    comment: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleTableSelect = (id: number) => {
    setFormData(prev => ({ ...prev, tableId: id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.tableId) throw new Error("Пожалуйста, выберите столик на схеме.");
      const result = await createBooking(formData);
      if (!result.success) throw new Error(result.error || "Ошибка бронирования");

      if (result.bookingId) {
        setBookingId(result.bookingId);
      }

      setStep(2);
      
      // Simulate payment processing
      setTimeout(async () => {
          if (result.bookingId) {
            const paymentResult = await confirmPayment(result.bookingId);
            if(paymentResult.success) setStep(3);
          }
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (step === 3) {
    return (
      <GlassCard className="max-w-md mx-auto p-12 text-center flex flex-col items-center animate-in fade-in duration-700">
        <div className="w-16 h-16 border border-luxury-gold/30 rounded-full flex items-center justify-center mb-8">
          <Check className="w-6 h-6 text-luxury-gold" />
        </div>
        <h2 className="font-serif text-3xl text-white mb-2 italic">Ждем вас</h2>
        <p className="text-white/50 text-sm tracking-widest uppercase mb-8">Бронь подтверждена</p>
        
        <div className="w-full border-t border-b border-white/5 py-6 mb-8 grid grid-cols-2 gap-y-4 text-left">
            <span className="text-white/30 text-xs uppercase tracking-widest">Дата</span>
            <span className="text-white text-right font-serif">{formData.date}</span>
            
            <span className="text-white/30 text-xs uppercase tracking-widest">Время</span>
            <span className="text-white text-right font-serif">{formData.time}</span>
            
            <span className="text-white/30 text-xs uppercase tracking-widest">Стол</span>
            <span className="text-luxury-gold text-right font-serif">№{formData.tableId}</span>
        </div>
        
        <button onClick={() => window.location.reload()} className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors">
          Вернуться на главную
        </button>
      </GlassCard>
    );
  }

  if (step === 2) {
    return (
      <GlassCard className="max-w-md mx-auto p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-luxury-gold animate-spin mb-6" />
        <h3 className="font-serif text-xl italic text-white">Обработка платежа</h3>
        <p className="text-white/30 mt-4 text-xs tracking-widest uppercase">Безопасная транзакция</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Map */}
        <div className="lg:col-span-7 space-y-6">
             <div className="flex items-baseline justify-between mb-4 border-b border-white/5 pb-4">
                <h3 className="font-serif text-2xl text-white italic">Выберите столик</h3>
                {formData.tableId && <span className="text-xs text-luxury-gold uppercase tracking-widest border border-luxury-gold/20 px-3 py-1 rounded-lg">Стол №{formData.tableId}</span>}
             </div>
             {/* Pass dynamic tables to HallMap */}
             <HallMap tables={tables} selectedTableId={formData.tableId} onSelectTable={handleTableSelect} />
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-5">
            <GlassCard className="h-full">
                <h3 className="font-serif text-2xl text-white italic mb-8">Данные гостя</h3>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-luxury-gold transition-colors">Дата</label>
                            <input 
                                type="date" 
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:border-luxury-gold outline-none transition-colors font-sans"
                                required
                            />
                        </div>
                        <div className="space-y-2 group">
                             <label className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-luxury-gold transition-colors">Время</label>
                             <select 
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:border-luxury-gold outline-none transition-colors appearance-none"
                            >
                                {['13:00', '15:00', '17:00', '19:00', '21:00', '23:00'].map(t => (
                                    <option key={t} value={t} className="bg-luxury-black">{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-luxury-gold transition-colors">Количество гостей</label>
                        <div className="flex gap-4">
                           {[1, 2, 3, 4, 5, 6].map(num => (
                               <button 
                                type="button"
                                key={num}
                                onClick={() => setFormData({...formData, guests: num})}
                                className={`w-8 h-8 flex items-center justify-center text-xs border rounded-lg transition-all ${formData.guests === num ? 'border-luxury-gold text-luxury-gold' : 'border-white/10 text-white/40 hover:border-white/40'}`}
                               >
                                   {num}
                               </button>
                           ))}
                        </div>
                    </div>

                    <div className="space-y-2 group">
                         <label className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-luxury-gold transition-colors">Ваше Имя</label>
                         <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:border-luxury-gold outline-none transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2 group">
                         <label className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-luxury-gold transition-colors">Телефон</label>
                         <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:border-luxury-gold outline-none transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-2 group">
                         <label className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-luxury-gold transition-colors">Комментарий к брони (необязательно)</label>
                         <textarea 
                            name="comment"
                            value={formData.comment}
                            onChange={handleInputChange}
                            rows={2}
                            placeholder="Пожелания по столику, аллергии..."
                            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:border-luxury-gold outline-none transition-colors resize-none"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                         <div>
                            <p className="text-luxury-gold text-sm font-serif italic">Необходим депозит</p>
                            <p className="text-white/30 text-[10px] uppercase tracking-widest">К оплате: 500₽</p>
                         </div>
                         <button 
                            type="submit" 
                            disabled={bookingLoading || tablesLoading}
                            className="px-8 py-3 bg-white text-black text-xs uppercase tracking-widest hover:bg-luxury-gold transition-colors disabled:opacity-50 rounded-lg"
                        >
                            {(bookingLoading || tablesLoading) ? 'Обработка...' : 'Оплатить и забронировать'}
                        </button>
                    </div>
                     {error && <p className="text-red-400 text-xs">{error}</p>}
                </form>
            </GlassCard>
        </div>
    </div>
  );
};