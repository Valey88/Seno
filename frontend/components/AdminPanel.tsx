"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link"; // Для навигации
import { useRouter } from "next/navigation";
import { useBookingsStore } from "../stores/bookingsStore";
import { useMenuStore } from "../stores/menuStore";
import { useTablesStore } from "../stores/tablesStore";
import { useReviewsStore } from "../stores/reviewsStore";
import { useAdminStore } from "../stores/adminStore";
import { User } from "../types";
import { useAuthStore } from "../stores/authStore";

// Icons
import {
  LogOut,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";

// Components
import { AdminSidebar } from "./admin/AdminSidebar";
import { AnalyticsDashboard } from "./admin/AnalyticsDashboard";
import { BookingsKanban } from "./admin/BookingsKanban";
import { MenuManager } from "./admin/MenuManager";
import { TableEditor } from "./admin/TableEditor";
import { ReviewsKanban } from "./admin/ReviewsKanban";

interface AdminPanelProps {
  user: User;
}

type Tab = "dashboard" | "bookings" | "menu" | "tables" | "reviews";

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Состояние для выпадающего меню профиля
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { logout } = useAuthStore();
  const router = useRouter();

  const { fetchBookings } = useBookingsStore();
  const { fetchStats } = useAdminStore();
  const { fetchMenu } = useMenuStore();
  const { fetchTables } = useTablesStore();
  const { fetchReviews } = useReviewsStore();

  // Data Loading Logic
  useEffect(() => {
    const loadData = async () => {
      await fetchStats();
      if (activeTab === "bookings") await fetchBookings();
      if (activeTab === "menu") await fetchMenu();
      if (activeTab === "tables") await fetchTables();
      if (activeTab === "reviews") await fetchReviews(false);
    };
    loadData();
  }, [activeTab]);

  // Обработчик выхода
  const handleLogout = () => {
    logout();
    router.push("/"); // Перенаправляем на главную после выхода
  };

  return (
    <div className="min-h-screen bg-[#111] text-luxury-cream font-sans flex">
      {/* 1. Fixed Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden bg-[#111]">
        {/* Top Header */}
        <header className="h-16 bg-[#1a1a1a] border-b border-white/5 flex justify-between items-center px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium text-white capitalize">
              {activeTab === "dashboard" && "Бизнес-аналитика"}
              {activeTab === "bookings" && "Воронка продаж"}
              {activeTab === "menu" && "Управление меню"}
              {activeTab === "tables" && "Редактор зала"}
              {activeTab === "reviews" && "Обратная связь"}
            </h1>
          </div>

          {/* User Profile Dropdown Area */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors outline-none"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm text-white font-medium">{user.name}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  {user.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-luxury-gold flex items-center justify-center text-black font-bold shadow-lg relative">
                {user.name.charAt(0).toUpperCase()}
                {/* Индикатор онлайн (декор) */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
              </div>
              <ChevronDown
                size={16}
                className={`text-white/50 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                {/* Invisible backdrop to close menu on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                ></div>

                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-sm text-white font-medium truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {user.phone || "Admin User"}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full"
                    >
                      <ExternalLink size={16} />
                      Перейти на сайт
                    </Link>

                    <button
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <UserIcon size={16} />
                      Профиль (Скоро)
                    </button>
                  </div>

                  <div className="p-2 border-t border-white/5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left"
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-[1600px] mx-auto h-full pb-20">
            {activeTab === "dashboard" && <AnalyticsDashboard />}
            {activeTab === "bookings" && <BookingsKanban />}
            {activeTab === "menu" && <MenuManager />}
            {activeTab === "tables" && <TableEditor />}
            {activeTab === "reviews" && <ReviewsKanban />}
          </div>
        </main>
      </div>
    </div>
  );
};
