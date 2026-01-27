"use client";
import { HomeView } from "@/components/views/HomeView";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  // Передаем функцию навигации для кнопок внутри HomeView
  return (
    <HomeView
      onNavigate={(path) => router.push(`/${path === "home" ? "" : path}`)}
    />
  );
}
