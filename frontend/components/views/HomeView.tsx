// components/views/HomeView.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ArrowRight,
  Utensils,
  Wine,
  Music2 as Music,
  Instagram,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useMenuStore } from "@/stores/menuStore";

interface HomeViewProps {
  onNavigate: (section: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { menuItems } = useMenuStore();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="animate-in fade-in duration-1000">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent to-luxury-gold/50"></div>
        <span className="text-luxury-gold text-xs uppercase tracking-[0.3em] mb-6 animate-in slide-in-from-bottom-4 duration-1000 delay-300 drop-shadow-md">
          Est. 2016 &bull; Saint-Petersburg
        </span>
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white mb-8 leading-[0.9] tracking-tight drop-shadow-2xl">
          Traktir <br /> <span className="italic text-white/90">Senoval</span>
        </h1>
        <p className="max-w-lg text-white text-sm md:text-base leading-loose font-medium mb-12 animate-in slide-in-from-bottom-8 duration-1000 delay-500 drop-shadow-lg">
          Новое прочтение северных традиций в историческом центре. <br />
          Тёплый минимализм, высокая кухня, набережная Мойки.
        </p>
        <div className="flex flex-col md:flex-row gap-6 items-center animate-in slide-in-from-bottom-8 duration-1000 delay-700">
          <button
            onClick={() => onNavigate("booking")}
            className="group relative px-8 py-3 rounded-lg overflow-hidden bg-luxury-gold text-luxury-black font-semibold text-xs uppercase tracking-widest transition-all hover:bg-white hover:scale-105 shadow-lg shadow-luxury-gold/20"
          >
            <span className="relative z-10">Забронировать стол</span>
          </button>
          <button
            onClick={() => onNavigate("menu")}
            className="text-xs uppercase tracking-widest text-white border-b border-transparent hover:border-luxury-gold pb-1 transition-all hover:text-luxury-gold drop-shadow-md"
          >
            Открыть меню
          </button>
        </div>
        <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce duration-[3000ms]">
          <ChevronDown className="text-white w-6 h-6 drop-shadow-md" />
        </div>
      </section>

      {/* ATMOSPHERE BLOCK */}
      <section className="py-24 md:py-32 relative bg-luxury-charcoal/40 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-luxury-gold/20 blur-2xl rounded-full opacity-20"></div>
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="/i.webp"
                alt="Atmosphere"
                className="rounded-xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 border border-white/10"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, atmosphere: true }))
                }
              />
            </div>
          </div>
          <div className="space-y-8 text-left">
            <h2 className="font-serif text-4xl md:text-5xl text-white italic drop-shadow-md">
              Душа <span className="text-luxury-gold not-italic">Севера</span>
            </h2>
            <div className="w-12 h-px bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
            <p className="text-white/80 leading-relaxed font-light text-lg">
              Мы создали пространство, где время замедляется. Название «Сеновал»
              — это отсылка к теплу, натуральным материалам и простой, но
              честной еде.
            </p>
          </div>
        </div>
      </section>

      {/* POPULAR ITEMS (HITS) */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-white mb-4">
              Хиты Сеновала
            </h2>
            <div className="w-12 h-px bg-luxury-gold mx-auto mb-4"></div>
            <p className="text-white/40 text-sm uppercase tracking-widest">
              Выбор наших гостей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {menuItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-luxury-gold/50 transition-all duration-500 bg-white/5"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={
                      imageErrors[`menu-${item.id}`] || !item.image
                        ? `https://picsum.photos/800/600?random=${item.id}`
                        : item.image
                    }
                    alt={item.title}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [`menu-${item.id}`]: true,
                      }))
                    }
                  />
                </div>
                <div className="p-6 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-xl text-white group-hover:text-luxury-gold transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-luxury-gold font-medium">
                      {item.price}₽
                    </span>
                  </div>
                  <p className="text-white/40 text-xs line-clamp-2">
                    {item.ingredients.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate("menu")}
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/20 hover:border-luxury-gold text-white hover:text-luxury-gold uppercase tracking-widest text-xs rounded-lg transition-all group"
            >
              Смотреть всё меню{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="text-center py-12 px-6 group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-luxury-gold group-hover:scale-110 transition-transform">
              <Utensils size={24} />
            </div>
            <h3 className="font-serif text-xl text-white mb-4">
              Авторская кухня
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Локальные фермерские продукты и дичь в современном прочтении. Мы
              уважаем традиции, но не боимся экспериментов.
            </p>
          </GlassCard>

          <GlassCard className="text-center py-12 px-6 group hover:bg-white/5 transition-colors border-luxury-gold/20 bg-luxury-gold/5">
            <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-luxury-gold group-hover:scale-110 transition-transform">
              <Wine size={24} />
            </div>
            <h3 className="font-serif text-xl text-white mb-4">
              Настойки и Бар
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Коллекция домашних настоек на северных ягодах и травах. Крафтовое
              пиво и тщательно подобранная винная карта.
            </p>
          </GlassCard>

          <GlassCard className="text-center py-12 px-6 group hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-luxury-gold group-hover:scale-110 transition-transform">
              <Music size={24} />
            </div>
            <h3 className="font-serif text-xl text-white mb-4">Атмосфера</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Приглушенный свет, натуральное дерево и легкий джаз. Идеальное
              место для теплых встреч в центре Петербурга.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="py-0">
        <div className="grid grid-cols-2 md:grid-cols-4 h-64 md:h-80">
          <div className="relative group overflow-hidden">
            <Image
              src="/XXXL.webp"
              className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              alt="Detail 1"
              fill
            />
          </div>
          <div className="relative group overflow-hidden">
            <Image
              src="x.webp"
              className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              alt="Detail 2"
              fill
            />
            {/*<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Instagram className="text-white w-8 h-8 drop-shadow-lg" />
            </div>*/}
          </div>
          <div className="relative group overflow-hidden">
            <Image
              src="/xe.webp"
              className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
              alt="Detail 3"
              fill
            />
          </div>
          <div className="relative group overflow-hidden bg-luxury-charcoal flex items-center justify-center p-8 text-center border-l border-white/5">
            <div>
              <h4 className="font-serif text-2xl text-white mb-2">
                Следите за нами
              </h4>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                @traktirsenoval
              </p>
              <a
                href="https://vk.com/traktirsenoval"
                className="text-luxury-gold border-b border-luxury-gold pb-1 hover:text-white hover:border-white transition-colors text-xs uppercase tracking-widest"
              >
                VK
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
