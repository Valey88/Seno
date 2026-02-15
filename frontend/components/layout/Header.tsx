"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Хук для текущего пути
import { Menu as MenuIcon, UserCircle, LogIn } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface NavigationProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<NavigationProps> = ({ onOpenAuth }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const pathname = usePathname(); // Получаем текущий URL

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Функция для проверки активной ссылки
  const isActive = (path: string) => pathname === path;

  const navLinkClass = (path: string) => `
    relative text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 hover:text-luxury-gold
    ${isActive(path) ? "text-luxury-gold" : "text-white/80"}
    after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-px after:bg-luxury-gold after:transition-all after:duration-300
    hover:after:w-full
    ${isActive(path) ? "after:w-full" : ""}
  `;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b
        ${scrolled ? "bg-luxury-black/95 backdrop-blur-md border-white/10 py-4 shadow-xl" : "bg-transparent border-transparent py-8"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex flex-col cursor-pointer group z-50">
            <span
              className={`font-serif text-2xl tracking-widest transition-colors duration-300 text-white group-hover:text-luxury-gold`}
            >
              Сеновал
            </span>
            <span className="text-[10px] text-luxury-gold uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-500 -mt-1 transform -translate-x-2 group-hover:translate-x-0">
              Набережная Мойки 82
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12">
            <Link href="/" className={navLinkClass("/")}>
              Главная
            </Link>
            <Link href="/menu" className={navLinkClass("/menu")}>
              Меню
            </Link>
            <Link href="/reviews" className={navLinkClass("/reviews")}>
              Отзывы
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`${navLinkClass("/admin")} text-red-400`}
              >
                CMS
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6 z-50">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <UserCircle size={20} />
                <span className="hidden md:block text-xs uppercase tracking-wider">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex text-white/70 hover:text-luxury-gold transition-colors"
                title="Войти"
              >
                <LogIn size={20} />
              </button>
            )}

            <Link
              href="/booking"
              className={`hidden md:block px-6 py-2 border text-xs uppercase tracking-widest transition-all duration-300 hover:bg-luxury-gold hover:text-black hover:border-luxury-gold rounded-lg
              ${isActive("/booking") ? "bg-luxury-gold text-black border-luxury-gold" : "border-white/30 text-white"}`}
            >
              Забронировать
            </Link>

            <button
              className="md:hidden text-white hover:text-luxury-gold transition-colors p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-black transform transition-transform duration-700 cubic-bezier(0.7, 0, 0.3, 1) ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"} flex flex-col items-center justify-center`}
      >
        <div className="absolute inset-0 bg-hero-pattern bg-cover opacity-10 pointer-events-none"></div>
        <div className="flex flex-col gap-8 text-center relative z-10">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-serif text-4xl text-white hover:text-luxury-gold transition-colors italic"
          >
            Главная
          </Link>
          <Link
            href="/menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-serif text-4xl text-white hover:text-luxury-gold transition-colors italic"
          >
            Меню
          </Link>
          <Link
            href="/reviews"
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-serif text-4xl text-white hover:text-luxury-gold transition-colors italic"
          >
            Отзывы
          </Link>

          <div className="w-12 h-px bg-white/20 mx-auto my-4"></div>

          <Link
            href="/booking"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm uppercase tracking-[0.2em] text-luxury-gold border border-luxury-gold px-8 py-3 hover:bg-luxury-gold hover:text-black transition-all"
          >
            Забронировать стол
          </Link>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute bottom-12 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          Закрыть
        </button>
      </div>
    </>
  );
};
