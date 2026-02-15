// components/layout/Footer.tsx
import React from 'react';
import { MapPin, Instagram, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-luxury-black/90 backdrop-blur-xl pt-12 pb-8 text-center relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
        <div className="flex gap-8 text-white/40">
          <a href="#" className="hover:text-luxury-gold transition-colors p-2 rounded-full hover:bg-white/5"><Instagram size={20} /></a>
          <a href="#" className="hover:text-luxury-gold transition-colors p-2 rounded-full hover:bg-white/5"><Phone size={20} /></a>
          <a href="#" className="hover:text-luxury-gold transition-colors p-2 rounded-full hover:bg-white/5"><MapPin size={20} /></a>
        </div>

        <div className="w-full border-t border-white/5 mt-4 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-white/30 text-left max-w-4xl mx-auto font-mono leading-relaxed">
            <div>
              <p className="font-bold text-white/40 mb-2 uppercase tracking-widest text-[18px]">Реквизиты организации</p>
              <p className="text-[15px]">Наименование: ООО "ФАНДОРИН"</p>
              <p className="text-[15px]">ИНН: 7840492551</p>
              <p className="text-[15px]">КПП: 783801001</p>
              <p className="text-[15px]">ОГРН: 1137847281824</p>
            </div>
            <div>
              <p className="font-bold text-white/40 mb-2 uppercase tracking-widest text-[18px]">Банковские реквизиты</p>
              <p className="text-[15px]">Банк: СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК</p>
              <p className="text-[15px]">Расчётный счёт: 40702810055040001016</p>
              <p className="text-[15px]">БИК банка: 044030653</p>
              <p className="text-[15px]">Корсчёт: 30101810500000000653</p>
              <p className="text-[15px]">ИНН банка: 7707083893 / КПП банка: 784243001</p>
            </div>
          </div>
        </div>

        <div className="text-white/30 text-xs tracking-[0.2em] font-light">
          <p className="mb-2 text-white transition-colors cursor-pointer">Набережная Мойки 82, SAINT-PETERSBURG</p>
        </div>
      </div>
    </footer>
  );
};
