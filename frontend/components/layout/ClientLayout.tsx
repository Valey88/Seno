"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; // 1. Импортируем хук для проверки пути
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AuthModal } from "../AuthModal";
import { useAuthStore } from "@/stores/authStore";
import { useMenuStore } from "@/stores/menuStore";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // 2. Получаем текущий путь
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { checkAuth } = useAuthStore();
  const { fetchMenu } = useMenuStore();

  useEffect(() => {
    checkAuth();
    fetchMenu();
  }, []);

  // 3. Определяем, находимся ли мы в админке
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-cream font-sans selection:bg-luxury-gold/30 flex flex-col relative">
      {/* Модалка авторизации нужна везде */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={() => {}}
      />

      {/* Фон и Хедер показываем ТОЛЬКО если это НЕ админка */}
      {!isAdminPage && (
        <>
          <div className="fixed inset-0 bg-hero-pattern bg-cover bg-center opacity-40 pointer-events-none contrast-110 z-0"></div>
          <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black pointer-events-none z-0"></div>

          <Header onOpenAuth={() => setIsAuthModalOpen(true)} />
        </>
      )}

      {/* Основной контент */}
      {/* Если админка, убираем z-index и flex-grow, чтобы она занимала весь экран сама */}
      <main
        className={isAdminPage ? "w-full h-full" : "relative z-10 flex-grow"}
      >
        {children}
      </main>

      {/* Футер показываем ТОЛЬКО если это НЕ админка */}
      {!isAdminPage && <Footer />}
    </div>
  );
}
