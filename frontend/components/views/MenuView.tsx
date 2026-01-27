// components/MenuView.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Flame, Leaf, Utensils } from "lucide-react";
import { useMenuStore } from "@/stores/menuStore";

export const MenuView: React.FC = () => {
  const { menuItems, categoriesList } = useMenuStore();

  // Оптимизация: Инициализируем категорию сразу, если есть данные, чтобы избежать CLS
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (categoriesList && categoriesList.length > 0)
      return categoriesList[0].id;
    return "salads";
  });

  // Синхронизация, если данные пришли позже
  useEffect(() => {
    if (
      categoriesList.length > 0 &&
      !categoriesList.find((cat) => cat.id === activeCategory)
    ) {
      setActiveCategory(categoriesList[0].id);
    }
  }, [categoriesList, activeCategory]);

  // Оптимизация: Мемоизация фильтрации, чтобы не пересчитывать при каждом рендере
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  // Состояние ошибок загрузки картинок
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 md:px-6 animate-in fade-in duration-700">
      <div className="text-center mb-12 relative">
        <h2 className="font-serif text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
          Меню
        </h2>
        {/* Добавил content-visibility для текста ниже сгиба, если он не критичен, но тут он маленький */}
        <p className="text-white/60 mt-2 text-sm uppercase tracking-widest font-medium">
          Сезонные продукты &bull; Авторское видение
        </p>
      </div>

      {/* Блок категорий. Добавим min-height, чтобы избежать CLS при загрузке */}
      <div className="min-h-[60px] mb-12 px-2 flex flex-wrap justify-center gap-3 md:gap-4">
        {categoriesList.length > 0 ? (
          categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              // Оптимизация: will-change-transform для плавности
              className={`
                px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 border backdrop-blur-sm will-change-transform
                ${
                  activeCategory === cat.id
                    ? "bg-luxury-gold text-luxury-black border-luxury-gold shadow-lg shadow-luxury-gold/20 scale-105"
                    : "bg-black/40 text-white/80 border-white/10 hover:border-white/30 hover:text-white hover:bg-black/60"
                }
              `}
            >
              {cat.label}
            </button>
          ))
        ) : (
          // Скелетон для категорий, чтобы не прыгало
          <div className="animate-pulse flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-stone-800 rounded-lg"></div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMenuItems.map((item, index) => {
          const hasImage =
            item.image &&
            item.image.trim() !== "" &&
            !imageErrors[`menu-item-${item.id}`];

          // Оптимизация LCP: Первые 6 картинок (видимые на первом экране) загружаем с priority
          const isPriority = index < 6;

          return (
            <div
              key={item.id}
              className="bg-stone-900/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-luxury-gold/50 transition-all duration-300 group flex flex-col h-full shadow-lg"
            >
              <div className="relative h-56 w-full overflow-hidden bg-stone-800">
                {hasImage ? (
                  <Image
                    src={item.image!}
                    alt={item.title}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    fill
                    // Оптимизация: sizes помогает браузеру выбрать правильный размер
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    // Оптимизация: priority для первых элементов, lazy для остальных
                    priority={isPriority}
                    loading={isPriority ? undefined : "lazy"}
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [`menu-item-${item.id}`]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-800/50">
                    <Utensils className="text-white/10 w-12 h-12" />
                  </div>
                )}

                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                  {item.isSpicy && (
                    <div className="bg-red-900/90 backdrop-blur-md text-red-100 p-2 rounded-lg shadow-sm">
                      <Flame size={16} />
                    </div>
                  )}
                  {item.isVegan && (
                    <div className="bg-green-900/90 backdrop-blur-md text-green-100 p-2 rounded-lg shadow-sm">
                      <Leaf size={16} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-serif text-xl text-white group-hover:text-luxury-gold transition-colors font-medium mb-2">
                  {item.title}
                </h3>
                <div className="mb-4">
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
                    {item.ingredients.join(", ")}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs font-mono">
                      {item.weight}г
                    </span>
                    <span className="text-luxury-gold text-lg font-medium drop-shadow-sm">
                      {item.price}₽
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
