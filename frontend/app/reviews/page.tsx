"use client";

import React, { useState } from "react";
// Исправлена опечатка в пути: RewievsView -> ReviewsView
import { AuthModal } from "@/components/AuthModal";
import ReviewsView from "@/components/views/RewievsView";

export default function ReviewsPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      {/* Модальное окно авторизации для этой страницы */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={() => {}}
      />

      {/* Передаем функцию открытия модалки в компонент */}
      <ReviewsView onOpenAuth={() => setIsAuthOpen(true)} />
    </>
  );
}
