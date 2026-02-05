import React from 'react';
import { LayoutDashboard, Trello, UtensilsCrossed, Map, MessageSquare, LogOut, Settings } from 'lucide-react';

type Tab = 'dashboard' | 'bookings' | 'menu' | 'tables' | 'reviews';

interface AdminSidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, onLogout, isOpen = false, onClose }) => {
    const navItem = (tab: Tab, icon: React.ReactNode, label: string) => (
        <button
            onClick={() => {
                setActiveTab(tab);
                onClose?.(); // Close sidebar on mobile when item clicked
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-2
            ${activeTab === tab
                    ? 'border-luxury-gold bg-white/5 text-white'
                    : 'border-transparent text-white/50 hover:text-white hover:bg-white/5'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed left-0 top-0 h-full w-64 bg-[#1a1a1a] border-r border-white/5 flex flex-col pt-20 z-50
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="px-6 mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-white font-serif text-xl tracking-wider">SENOVAL <span className="text-luxury-gold text-xs block font-sans tracking-normal mt-1 opacity-70">Business</span></h2>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItem('dashboard', <LayoutDashboard size={20} />, 'Аналитика')}
                    {navItem('bookings', <Trello size={20} />, 'Сделки (Брони)')}
                    {navItem('menu', <UtensilsCrossed size={20} />, 'Меню и Склад')}
                    {navItem('tables', <Map size={20} />, 'Карта зала')}
                    {navItem('reviews', <MessageSquare size={20} />, 'Отзывы и NPS')}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/40 hover:text-white transition-colors">
                        <Settings size={18} /> Настройки
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400/70 hover:text-red-400 transition-colors">
                        <LogOut size={18} /> Выйти
                    </button>
                </div>
            </div>
        </>
    );
};
