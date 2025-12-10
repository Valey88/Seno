'use client'

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { BookingForm } from './BookingForm';
import { ReviewsSection } from './ReviewsSection';
import { AuthModal } from './AuthModal';
import { UserProfile } from './UserProfile';
import { AdminPanel } from './AdminPanel';
import { MapPin, Instagram, Menu as MenuIcon, Phone, ChevronDown, Flame, Leaf, UserCircle, LogIn, Utensils, Music2 as Music, ArrowRight, Wine } from 'lucide-react';
import { useMenuStore } from '@/stores/menuStore';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'booking' | 'reviews' | 'profile' | 'admin'>('home');
  const [activeCategory, setActiveCategory] = useState<string>('salads');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Zustand stores
  const { menuItems, categoriesList, fetchMenu } = useMenuStore();
  const { user, getCurrentUser, logout } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize auth and menu
  useEffect(() => {
    getCurrentUser();
    fetchMenu();
  }, []);

  // Update active category when categories are loaded
  useEffect(() => {
    if(categoriesList.length > 0 && !categoriesList.find(cat => cat.id === activeCategory)) {
      setActiveCategory(categoriesList[0].id);
    }
  }, [categoriesList, activeCategory]);

  const scrollToSection = (id: string) => {
    setActiveTab(id as any);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    setActiveTab('home');
  };

  const filteredMenuItems = menuItems.filter(item => item.category === activeCategory);

  const navLinkClass = (tab: string) => `
    relative text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 hover:text-luxury-gold
    ${activeTab === tab ? 'text-luxury-gold' : 'text-white/80'}
    after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-px after:bg-luxury-gold after:transition-all after:duration-300
    hover:after:w-full
    ${activeTab === tab ? 'after:w-full' : ''}
  `;

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-cream font-sans selection:bg-luxury-gold/30">
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={(u) => {
            if (u.role === 'ADMIN') setActiveTab('admin');
        }}
      />

      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-hero-pattern bg-cover bg-center opacity-40 pointer-events-none contrast-110"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black pointer-events-none"></div>

      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b
        ${scrolled 
            ? 'bg-luxury-black/95 backdrop-blur-md border-white/10 py-4 shadow-xl' 
            : 'bg-transparent border-transparent py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* 1. Logo Left */}
          <div 
            className="flex flex-col cursor-pointer group z-50" 
            onClick={() => scrollToSection('home')}
          >
             <span className={`font-serif text-2xl tracking-widest transition-colors duration-300 ${scrolled ? 'text-white' : 'text-white'} group-hover:text-luxury-gold`}>
                SENOVAL
             </span>
             <span className="text-[10px] text-luxury-gold uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-500 -mt-1 transform -translate-x-2 group-hover:translate-x-0">
                Moyka 82
             </span>
          </div>

          {/* 2. Desktop Navigation Center */}
          <div className="hidden md:flex items-center gap-12">
             <button onClick={() => scrollToSection('home')} className={navLinkClass('home')}>Главная</button>
             <button onClick={() => scrollToSection('menu')} className={navLinkClass('menu')}>Меню</button>
             <button onClick={() => scrollToSection('reviews')} className={navLinkClass('reviews')}>Отзывы</button>
             {user?.role === 'ADMIN' && (
                 <button onClick={() => scrollToSection('admin')} className={`${navLinkClass('admin')} text-red-400`}>CMS</button>
             )}
          </div>

          {/* 3. Actions Right */}
          <div className="flex items-center gap-6 z-50">
             
             {/* Auth Button */}
             {user ? (
                 <button onClick={() => scrollToSection('profile')} className="hidden md:flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                     <UserCircle size={20} />
                     <span className="text-xs uppercase tracking-wider">{user.name.split(' ')[0]}</span>
                 </button>
             ) : (
                 <button onClick={() => setIsAuthModalOpen(true)} className="hidden md:flex text-white/70 hover:text-luxury-gold transition-colors" title="Войти">
                     <LogIn size={20} />
                 </button>
             )}

             <button 
                onClick={() => scrollToSection('booking')} 
                className={`hidden md:block px-6 py-2 border text-xs uppercase tracking-widest transition-all duration-300 hover:bg-luxury-gold hover:text-black hover:border-luxury-gold rounded-lg
                ${activeTab === 'booking' ? 'bg-luxury-gold text-black border-luxury-gold' : 'border-white/30 text-white'}`}
             >
                Забронировать
             </button>

             {/* Mobile Toggle */}
             <button 
                className="md:hidden text-white hover:text-luxury-gold transition-colors p-2" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             >
                <MenuIcon className="w-6 h-6" />
             </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-black transform transition-transform duration-700 cubic-bezier(0.7, 0, 0.3, 1) ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'} flex flex-col items-center justify-center`}>
         <div className="absolute inset-0 bg-hero-pattern bg-cover opacity-10 pointer-events-none"></div>
         
         <div className="flex flex-col gap-8 text-center relative z-10">
             <button onClick={() => scrollToSection('home')} className="font-serif text-4xl text-white hover:text-luxury-gold transition-colors italic">Главная</button>
             <button onClick={() => scrollToSection('menu')} className="font-serif text-4xl text-white hover:text-luxury-gold transition-colors italic">Меню</button>
             <button onClick={() => scrollToSection('reviews')} className="font-serif text-4xl text-white hover:text-luxury-gold transition-colors italic">Отзывы</button>
             {user ? (
                 <button onClick={() => scrollToSection('profile')} className="font-serif text-2xl text-luxury-gold italic">Кабинет ({user.name})</button>
             ) : (
                 <button onClick={() => { setIsMobileMenuOpen(false); setIsAuthModalOpen(true); }} className="font-serif text-2xl text-white/50 hover:text-white italic">Войти</button>
             )}
             <div className="w-12 h-px bg-white/20 mx-auto my-4"></div>
             <button onClick={() => scrollToSection('booking')} className="text-sm uppercase tracking-[0.2em] text-luxury-gold border border-luxury-gold px-8 py-3 hover:bg-luxury-gold hover:text-black transition-all">
                Забронировать стол
             </button>
         </div>
         
         <button onClick={() => setIsMobileMenuOpen(false)} className="absolute bottom-12 text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            Закрыть
         </button>
      </div>

      {/* Main Content */}
      <main className="relative min-h-screen">
        
        {/* HOME VIEW */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-1000">
            {/* HERO */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
                <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent to-luxury-gold/50"></div>
                <span className="text-luxury-gold text-xs uppercase tracking-[0.3em] mb-6 animate-in slide-in-from-bottom-4 duration-1000 delay-300 drop-shadow-md">
                  Est. 2024 &bull; Saint-Petersburg
                </span>
                <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-white mb-8 leading-[0.9] tracking-tight drop-shadow-2xl">
                  Traktir <br/> <span className="italic text-white/90">Senoval</span>
                </h1>
                <p className="max-w-lg text-white text-sm md:text-base leading-loose font-medium mb-12 animate-in slide-in-from-bottom-8 duration-1000 delay-500 drop-shadow-lg">
                  Новое прочтение северных традиций в историческом центре. <br/>
                  Тёплый минимализм, высокая кухня, набережная Мойки.
                </p>
                <div className="flex flex-col md:flex-row gap-6 items-center animate-in slide-in-from-bottom-8 duration-1000 delay-700">
                  <button onClick={() => scrollToSection('booking')} className="group relative px-8 py-3 rounded-lg overflow-hidden bg-luxury-gold text-luxury-black font-semibold text-xs uppercase tracking-widest transition-all hover:bg-white hover:scale-105 shadow-lg shadow-luxury-gold/20">
                    <span className="relative z-10">Забронировать стол</span>
                  </button>
                  <button onClick={() => scrollToSection('menu')} className="text-xs uppercase tracking-widest text-white border-b border-transparent hover:border-luxury-gold pb-1 transition-all hover:text-luxury-gold drop-shadow-md">
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
                                loading="lazy"
                                onError={() => {
                                    setImageErrors(prev => ({ ...prev, atmosphere: true }));
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-8 text-left">
                        <h2 className="font-serif text-4xl md:text-5xl text-white italic drop-shadow-md">
                            Душа <span className="text-luxury-gold not-italic">Севера</span>
                        </h2>
                        <div className="w-12 h-px bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
                        <p className="text-white/80 leading-relaxed font-light text-lg">
                            Мы создали пространство, где время замедляется. Название «Сеновал» — это отсылка к теплу, натуральным материалам и простой, но честной еде. 
                        </p>
                    </div>
                </div>
            </section>

             {/* POPULAR ITEMS (HITS) */}
             <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="font-serif text-4xl text-white mb-4">Хиты Сеновала</h2>
                        <div className="w-12 h-px bg-luxury-gold mx-auto mb-4"></div>
                        <p className="text-white/40 text-sm uppercase tracking-widest">Выбор наших гостей</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {menuItems.slice(0, 3).map((item) => (
                            <div key={item.id} className="group relative rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-luxury-gold/50 transition-all duration-500 bg-white/5">
                                <div className="relative h-64 overflow-hidden">
                                    <Image 
                                        src={imageErrors[`menu-${item.id}`] || !item.image || item.image.trim() === ''
                                            ? `https://picsum.photos/800/600?random=${item.id}`
                                            : item.image
                                        } 
                                        alt={item.title} 
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        loading="lazy"
                                        onError={() => {
                                            setImageErrors(prev => ({ ...prev, [`menu-${item.id}`]: true }));
                                        }}
                                    />
                                </div>
                                <div className="p-6 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-serif text-xl text-white group-hover:text-luxury-gold transition-colors">{item.title}</h3>
                                        <span className="text-luxury-gold font-medium">{item.price}₽</span>
                                    </div>
                                    <p className="text-white/40 text-xs line-clamp-2">{item.ingredients.join(', ')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="text-center">
                        <button onClick={() => scrollToSection('menu')} className="inline-flex items-center gap-2 px-8 py-3 border border-white/20 hover:border-luxury-gold text-white hover:text-luxury-gold uppercase tracking-widest text-xs rounded-lg transition-all group">
                            Смотреть всё меню <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
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
                         <h3 className="font-serif text-xl text-white mb-4">Авторская кухня</h3>
                         <p className="text-white/60 text-sm leading-relaxed">
                             Локальные фермерские продукты и дичь в современном прочтении. Мы уважаем традиции, но не боимся экспериментов.
                         </p>
                     </GlassCard>

                     <GlassCard className="text-center py-12 px-6 group hover:bg-white/5 transition-colors border-luxury-gold/20 bg-luxury-gold/5">
                         <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-luxury-gold group-hover:scale-110 transition-transform">
                             <Wine size={24} />
                         </div>
                         <h3 className="font-serif text-xl text-white mb-4">Настойки и Бар</h3>
                         <p className="text-white/60 text-sm leading-relaxed">
                             Коллекция домашних настоек на северных ягодах и травах. Крафтовое пиво и тщательно подобранная винная карта.
                         </p>
                     </GlassCard>

                     <GlassCard className="text-center py-12 px-6 group hover:bg-white/5 transition-colors">
                         <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-luxury-gold group-hover:scale-110 transition-transform">
                             <Music size={24} />
                         </div>
                         <h3 className="font-serif text-xl text-white mb-4">Атмосфера</h3>
                         <p className="text-white/60 text-sm leading-relaxed">
                             Приглушенный свет, натуральное дерево и легкий джаз. Идеальное место для теплых встреч в центре Петербурга.
                         </p>
                     </GlassCard>
                 </div>
            </section>

             {/* GALLERY STRIP */}
            <section className="py-0">
               <div className="grid grid-cols-2 md:grid-cols-4 h-64 md:h-80">
                  <div className="relative group overflow-hidden">
                     <Image 
                        src={imageErrors['gallery1'] 
                            ? 'https://picsum.photos/800/600?random=2'
                            : 'https://picsum.photos/800/600?random=20'
                        } 
                        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        alt="Detail 1"
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        loading="lazy"
                        onError={() => setImageErrors(prev => ({ ...prev, gallery1: true }))}
                     />
                  </div>
                  <div className="relative group overflow-hidden">
                     <Image 
                        src={imageErrors['gallery2'] 
                            ? 'https://picsum.photos/800/600?random=3'
                            : 'https://picsum.photos/800/600?random=30'
                        } 
                        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        alt="Detail 2"
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        loading="lazy"
                        onError={() => setImageErrors(prev => ({ ...prev, gallery2: true }))}
                     />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Instagram className="text-white w-8 h-8 drop-shadow-lg" />
                      </div>
                  </div>
                  <div className="relative group overflow-hidden">
                     <Image 
                        src={imageErrors['gallery3'] 
                            ? 'https://picsum.photos/800/600?random=4'
                            : 'https://picsum.photos/800/600?random=40'
                        } 
                        className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        alt="Detail 3"
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        loading="lazy"
                        onError={() => setImageErrors(prev => ({ ...prev, gallery3: true }))}
                     />
                  </div>
                  <div className="relative group overflow-hidden bg-luxury-charcoal flex items-center justify-center p-8 text-center border-l border-white/5">
                      <div>
                        <h4 className="font-serif text-2xl text-white mb-2">Следите за нами</h4>
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-6">@traktir_senoval</p>
                        <a href="#" className="text-luxury-gold border-b border-luxury-gold pb-1 hover:text-white hover:border-white transition-colors text-xs uppercase tracking-widest">Instagram</a>
                      </div>
                  </div>
               </div>
            </section>
          </div>
        )}

        {/* MENU VIEW */}
        {activeTab === 'menu' && (
           <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 md:px-6 animate-in fade-in duration-700">
              <div className="text-center mb-12 relative">
                 <h2 className="font-serif text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">Меню</h2>
                 <p className="text-white/60 mt-2 text-sm uppercase tracking-widest font-medium">Сезонные продукты &bull; Авторское видение</p>
              </div>

              {categoriesList.length > 0 && (
                  <div className="flex overflow-x-auto pb-4 mb-8 gap-2 md:gap-4 no-scrollbar justify-start md:justify-center px-2">
                    {categoriesList.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                whitespace-nowrap px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 border backdrop-blur-sm
                                ${activeCategory === cat.id ? 'bg-luxury-gold text-luxury-black border-luxury-gold shadow-lg shadow-luxury-gold/20' : 'bg-black/40 text-white/80 border-white/10 hover:border-white/30 hover:text-white hover:bg-black/60'}
                            `}
                        >
                            {cat.label}
                        </button>
                    ))}
                  </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredMenuItems.map((item) => (
                    <div key={item.id} className="bg-stone-900/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-luxury-gold/50 transition-all duration-300 group flex flex-col h-full shadow-lg">
                        <div className="relative h-56 w-full overflow-hidden">
                            <Image 
                                src={imageErrors[`menu-item-${item.id}`] || !item.image || item.image.trim() === ''
                                    ? `https://picsum.photos/800/600?random=${item.id + 100}`
                                    : item.image
                                } 
                                alt={item.title} 
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                loading="lazy"
                                onError={() => {
                                    setImageErrors(prev => ({ ...prev, [`menu-item-${item.id}`]: true }));
                                }}
                            />
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                {item.isSpicy && <div className="bg-red-900/90 backdrop-blur-md text-red-100 p-2 rounded-lg shadow-sm"><Flame size={16} /></div>}
                                {item.isVegan && <div className="bg-green-900/90 backdrop-blur-md text-green-100 p-2 rounded-lg shadow-sm"><Leaf size={16} /></div>}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <h3 className="font-serif text-xl text-white group-hover:text-luxury-gold transition-colors font-medium mb-2">{item.title}</h3>
                            <div className="mb-4">
                                <p className="text-white/60 text-xs leading-relaxed line-clamp-3">{item.ingredients.join(', ')}</p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/40 text-xs font-mono">{item.weight}г</span>
                                    <span className="text-luxury-gold text-lg font-medium drop-shadow-sm">{item.price}₽</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* BOOKING VIEW */}
        {activeTab === 'booking' && (
           <div className="pt-32 pb-20 max-w-7xl mx-auto px-6 animate-in fade-in duration-700">
              <div className="text-center mb-16">
                 <h2 className="font-serif text-5xl text-white mb-4 drop-shadow-lg">Бронирование</h2>
                 <p className="text-white/60 text-sm uppercase tracking-widest font-medium">Выберите ваш вечер</p>
              </div>
              <BookingForm />
           </div>
        )}

        {/* REVIEWS VIEW */}
        {activeTab === 'reviews' && (
            <ReviewsSection currentUser={user} onOpenAuth={() => setIsAuthModalOpen(true)} />
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && user && (
            <UserProfile user={user} onLogout={handleLogout} />
        )}

        {/* ADMIN VIEW */}
        {activeTab === 'admin' && user?.role === 'ADMIN' && (
            <AdminPanel user={user} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-luxury-black/90 backdrop-blur-xl pt-12 pb-8 text-center relative z-10">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
             <div className="flex gap-8 text-white/40">
                 <a href="#" className="hover:text-luxury-gold transition-colors p-2 rounded-full hover:bg-white/5"><Instagram size={20} /></a>
                 <a href="#" className="hover:text-luxury-gold transition-colors p-2 rounded-full hover:bg-white/5"><Phone size={20} /></a>
                 <a href="#" className="hover:text-luxury-gold transition-colors p-2 rounded-full hover:bg-white/5"><MapPin size={20} /></a>
             </div>
             
             {/* LEGAL INFORMATION RESTORED */}
             <div className="w-full border-t border-white/5 mt-4 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] text-white/30 text-left max-w-4xl mx-auto font-mono leading-relaxed">
                   <div>
                       <p className="font-bold text-white/40 mb-2 uppercase tracking-widest">Реквизиты организации</p>
                       <p>Наименование: ООО "ФАНДОРИН"</p>
                       <p>ИНН: 7840492551</p>
                       <p>КПП: 783801001</p>
                       <p>ОГРН: 1137847281824</p>
                   </div>
                   <div>
                       <p className="font-bold text-white/40 mb-2 uppercase tracking-widest">Банковские реквизиты</p>
                       <p>Банк: СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК</p>
                       <p>Расчётный счёт: 40702810055040001016</p>
                       <p>БИК банка: 044030653</p>
                       <p>Корсчёт: 30101810500000000653</p>
                       <p>ИНН банка: 7707083893 / КПП банка: 784243001</p>
                   </div>
                </div>
             </div>

             <div className="text-white/30 text-xs tracking-[0.2em] font-light">
                 <p className="mb-2 hover:text-white transition-colors cursor-pointer">MOYKA EMBANKMENT 82, SAINT-PETERSBURG</p>
                 <p>&copy; 2024 SENOVAL RESTAURANT GROUP</p>
             </div>
         </div>
      </footer>
    </div>
  );
};

