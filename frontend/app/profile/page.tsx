"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/components/views/UserProfile";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, isInitialized } = useAuthStore();
  const router = useRouter();

  // Защита маршрута: если не вошел, редирект на главную
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/");
    }
  }, [isInitialized, user, router]);

  // Обработчик выхода
  const handleLogout = () => {
    logout();
    router.push("/"); // После выхода идем на главную
  };

  // Пока идет проверка авторизации
  if (!isInitialized) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex justify-center">
        <div className="text-white/30 animate-pulse flex items-center gap-2">
          <Loader2 className="animate-spin" /> Загрузка профиля...
        </div>
      </div>
    );
  }

  // Если юзера нет (идет редирект), ничего не рендерим
  if (!user) return null;

  return <UserProfile user={user} onLogout={handleLogout} />;
}
