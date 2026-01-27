"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AdminPanel } from "@/components/AdminPanel";
import { Loader2, Lock } from "lucide-react";

export default function AdminPage() {
  const { user, isInitialized, isLoading } = useAuthStore();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // 1. Если еще идет инициализация или загрузка — ничего не делаем
    if (!isInitialized || isLoading) return;

    // 2. Если инициализация прошла, но юзера нет или он не админ
    if (!user || user.role !== "ADMIN") {
      setIsRedirecting(true);
      // Используем replace вместо push, чтобы нельзя было вернуться назад
      router.replace("/");
    }
  }, [user, isInitialized, isLoading, router]);

  // 3. Показываем лоадер, пока идет проверка ИЛИ пока идет редирект
  if (!isInitialized || isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center text-luxury-gold gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <p className="text-sm uppercase tracking-widest opacity-50">
          Проверка доступа...
        </p>
      </div>
    );
  }

  // 4. Если мы здесь, но юзера нет (на всякий случай) — показываем заглушку
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  // 5. Рендерим админку
  return (
    <div className="min-h-screen bg-[#111]">
      <AdminPanel user={user} />
    </div>
  );
}
