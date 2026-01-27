import React, { useState } from 'react';
import { useBookingsStore } from '@/stores/bookingsStore';
import { Booking, BookingStatus } from '@/types';
import { Phone, Calendar, Clock, MoreHorizontal, User } from 'lucide-react';

export const BookingsKanban: React.FC = () => {
    const { bookings, updateBookingStatus } = useBookingsStore();

    // Columns configuration matching BookingStatus
    const columns = [
        { id: 'PENDING', title: 'Неразобранное', color: 'border-blue-500' },
        { id: 'CONFIRMED', title: 'Подтверждено', color: 'border-green-500' },
        { id: 'SEATED', title: 'Посажены', color: 'border-purple-500' }, // Нужно добавить этот статус в типы, если нет
        { id: 'COMPLETED', title: 'Закрыто', color: 'border-gray-500' },
        { id: 'CANCELLED', title: 'Отмена', color: 'border-red-500' },
    ];

    // Drag and drop simulation via select (easier to implement reliably without dnd libs)
    const handleStatusChange = async (bookingId: number, newStatus: string) => {
        try {
            // В реальном приложении здесь нужен optimistic UI update
            await updateBookingStatus(bookingId, newStatus as BookingStatus);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-[calc(100vh-180px)] overflow-x-auto">
            <div className="flex gap-4 h-full min-w-[1200px]">
                {columns.map(col => {
                    // Filter bookings for this column
                    // Note: If you don't have 'SEATED' status yet, logic needs adaptation
                    const colBookings = bookings.filter(b => b.status === col.id);
                    const totalValue = colBookings.length * 1500; // Fake average check calculation

                    return (
                        <div key={col.id} className="flex-1 min-w-[280px] flex flex-col bg-[#1e1e1e] rounded-xl border border-white/5 h-full">
                            {/* Column Header */}
                            <div className={`p-4 border-t-4 ${col.color} bg-[#252525] rounded-t-xl`}>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wide">{col.title}</h3>
                                    <span className="text-xs text-white/40">{colBookings.length}</span>
                                </div>
                                <div className="text-xs text-white/30">
                                    ~ {totalValue.toLocaleString()} ₽
                                </div>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                                {colBookings.map(booking => (
                                    <div key={booking.id} className="bg-[#2a2a2a] p-4 rounded-lg border border-white/5 hover:border-luxury-gold/50 transition-all shadow-lg group relative">

                                        {/* Status Switcher (Quick Move) */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <select
                                                className="bg-black text-[10px] text-white border border-white/20 rounded p-1 outline-none cursor-pointer"
                                                value={booking.status}
                                                onChange={(e) => handleStatusChange(Number(booking.id), e.target.value)}
                                             >
                                                {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                             </select>
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-luxury-gold to-yellow-600 flex items-center justify-center text-black font-bold text-xs">
                                                {booking.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white leading-tight">{booking.name}</div>
                                                <div className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                                                    <Phone size={10} /> {booking.phone}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-black/30 rounded p-2 mb-3 grid grid-cols-2 gap-2">
                                            <div className="text-xs text-white/70 flex items-center gap-1.5">
                                                <Calendar size={12} className="text-luxury-gold"/>
                                                {new Date(booking.date).toLocaleDateString(undefined, {day: '2-digit', month: 'short'})}
                                            </div>
                                            <div className="text-xs text-white/70 flex items-center gap-1.5">
                                                <Clock size={12} className="text-luxury-gold"/>
                                                {booking.time}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs">
                                            <span className="bg-white/5 px-2 py-1 rounded text-white/60">
                                                Стол: {booking.tableId || '?'}
                                            </span>
                                            <span className="flex items-center gap-1 text-white/60">
                                                <User size={12}/> {booking.guests}
                                            </span>
                                        </div>

                                        {booking.comment && (
                                            <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-yellow-200/70 italic truncate">
                                                "{booking.comment}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
