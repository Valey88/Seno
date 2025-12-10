'use client'

import React, { useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { useBookingsStore } from '../stores/bookingsStore';
import { User } from '../types';
import { Calendar, Clock } from 'lucide-react';

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
             <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="font-serif text-4xl text-white mb-2">Личный кабинет</h2>
                    <p className="text-white/40 text-sm">{user.name} ({user.phone})</p>
                </div>
                <button 
                    onClick={onLogout}
                    className="text-xs uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-900/50 px-4 py-2 rounded-lg transition-colors"
                >
                    Выйти
                </button>
             </div>

             <h3 className="font-serif text-2xl text-white italic mb-6">История бронирований</h3>
             
             {isLoading ? (
                 <div className="text-white/30 text-center">Загрузка...</div>
             ) : bookings.length === 0 ? (
                 <GlassCard className="text-center py-12">
                     <p className="text-white/40 mb-4">У вас пока нет активных бронирований</p>
                 </GlassCard>
             ) : (
                 <div className="grid gap-4">
                     {bookings.map(item => (
                         <GlassCard key={item.id} className="flex flex-col md:flex-row justify-between items-center gap-6">
                             <div className="text-center md:text-left">
                                 <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="font-serif text-xl text-white">{new Date(item.date).toLocaleDateString()}</span>
                                    <span className="px-2 py-0.5 rounded border border-white/10 text-[10px] text-white/50 uppercase">{item.status}</span>
                                 </div>
                                 <div className="flex items-center gap-4 text-white/50 text-xs">
                                     <span className="flex items-center gap-1"><Clock size={12}/> {item.time}</span>
                                     <span>Стол №{item.tableId}</span>
                                     <span>{item.guests} чел.</span>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <div className="text-luxury-gold font-mono">{item.depositAmount}₽</div>
                                 <div className="text-[10px] text-white/20 uppercase tracking-widest">Депозит</div>
                             </div>
                         </GlassCard>
                     ))}
                 </div>
             )}
        </div>
    );
};