import React from 'react';
import { TrendingUp, Users, CreditCard, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { useAdminStore } from '@/stores/adminStore';

export const AnalyticsDashboard: React.FC = () => {
    const { stats } = useAdminStore();

    // Mock data for graphs simulation (in real app use Recharts)
    const revenueGrowth = true;

    // Вычисляем средний чек (примерно)
    const avgCheck = stats?.total_bookings ? Math.round(stats.total_deposits / stats.total_bookings) : 0;

    const StatCard = ({ title, value, subValue, icon, trend }: any) => (
        <div className="bg-[#252525] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-luxury-gold/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-lg text-luxury-gold group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend === 'up' ? '+12%' : '-4%'}
                    </div>
                )}
            </div>
            <div className="text-3xl font-medium text-white mb-1">{value}</div>
            <div className="text-white/40 text-xs uppercase tracking-wide">{title}</div>
            {subValue && <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/60">{subValue}</div>}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl text-white font-serif">Обзор показателей</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <select className="bg-[#252525] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-luxury-gold w-full md:w-auto">
                        <option>Сегодня</option>
                        <option>Эта неделя</option>
                        <option>Этот месяц</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Выручка (Депозиты)"
                    value={`${stats?.total_deposits.toLocaleString()} ₽`}
                    icon={<CreditCard />}
                    trend="up"
                    subValue="План выполнен на 85%"
                />
                <StatCard
                    title="Количество гостей"
                    value={stats?.total_guests}
                    icon={<Users />}
                    trend="up"
                    subValue={`~ ${(stats?.total_guests || 0) / 30} в день`}
                />
                <StatCard
                    title="Средний чек (Pre-order)"
                    value={`${avgCheck} ₽`}
                    icon={<TrendingUp />}
                    trend="down"
                    subValue="Цель: 2 500 ₽"
                />
                <StatCard
                    title="Конверсия броней"
                    value={`${Math.round(((stats?.confirmed_bookings || 0) / (stats?.total_bookings || 1)) * 100)}%`}
                    icon={<Activity />}
                    subValue="Из заявки в посадку"
                />
            </div>

            {/* Simple Visual Graph Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="!bg-[#252525] p-6">
                    <h3 className="text-white mb-6 font-medium">Динамика бронирований (Неделя)</h3>
                    <div className="flex items-end justify-between h-48 gap-2">
                        {[45, 60, 35, 70, 85, 90, 65].map((h, i) => (
                            <div key={i} className="w-full bg-white/5 rounded-t-sm hover:bg-luxury-gold transition-colors relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-white/30 uppercase">
                        <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                    </div>
                </GlassCard>

                <GlassCard className="!bg-[#252525] p-6">
                    <h3 className="text-white mb-4 font-medium">Топ блюд (Популярность)</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Стейк Рибай', count: 145, pct: 80 },
                            { name: 'Цезарь с креветкой', count: 120, pct: 65 },
                            { name: 'Настойка "Борщевая"', count: 98, pct: 50 },
                            { name: 'Том Ям', count: 85, pct: 45 },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm text-white mb-1">
                                    <span>{item.name}</span>
                                    <span className="text-white/50">{item.count} заказов</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-luxury-gold" style={{ width: `${item.pct}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
