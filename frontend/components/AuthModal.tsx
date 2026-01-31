'use client'

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';
import { X, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const { login, requestEmailVerification, register, loginWithYandex, isLoading } = useAuthStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    // Registration Step: 1 = Details, 2 = Verification Code
    const [regStep, setRegStep] = useState<1 | 2>(1);

    const [formData, setFormData] = useState({ name: '', phone: '', email: '', password: '', code: '' });
    const [error, setError] = useState<string | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);

    // Reset state on close/open
    useEffect(() => {
        if (isOpen) {
            setMode('login');
            setRegStep(1);
            setError(null);
            setVerificationSent(false);
            setFormData({ name: '', phone: '', email: '', password: '', code: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (mode === 'login') {
                const res = await login(formData.phone, formData.password);
                if (res.success) {
                    const { user } = useAuthStore.getState();
                    if (user) {
                        onLoginSuccess(user);
                        onClose();
                    }
                } else {
                    setError(res.error || "Ошибка авторизации");
                }
            } else {
                // Registration flow
                if (regStep === 1) {
                    // Step 1: Request verification code
                    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
                        setError("Заполните все поля");
                        return;
                    }

                    const res = await requestEmailVerification(formData.email);
                    if (res.success) {
                        setVerificationSent(true);
                        setRegStep(2);
                    } else {
                        setError(res.error || "Ошибка отправки кода");
                    }
                } else {
                    // Step 2: Register with code
                    if (!formData.code) {
                        setError("Введите код подтверждения");
                        return;
                    }

                    const res = await register({
                        username: formData.phone,
                        password: formData.password,
                        email: formData.email,
                        name: formData.name,
                        code: formData.code,
                    });

                    if (res.success) {
                        const { user } = useAuthStore.getState();
                        if (user) {
                            onLoginSuccess(user);
                            onClose();
                        }
                    } else {
                        setError(res.error || "Ошибка регистрации");
                    }
                }
            }
        } catch (err) {
            setError("Произошла ошибка сервера");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300">
                <GlassCard className="relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-20">
                        <X size={20} />
                    </button>

                    {mode === 'register' && regStep === 2 && (
                        <button onClick={() => { setRegStep(1); setError(null); }} className="absolute top-4 left-4 text-white/30 hover:text-white transition-colors z-20 flex items-center gap-1 text-xs uppercase tracking-wider">
                            <ArrowLeft size={16} /> Назад
                        </button>
                    )}

                    <h2 className="font-serif text-2xl text-white mb-2 text-center relative z-10">
                        {mode === 'login' ? 'Вход в систему' : (regStep === 1 ? 'Регистрация' : 'Подтверждение')}
                    </h2>

                    {mode === 'register' && regStep === 2 && (
                        <p className="text-center text-white/50 text-xs mb-6 px-4">
                            {verificationSent ? (
                                <>
                                    Мы отправили код подтверждения на <span className="text-luxury-gold">{formData.email}</span>.
                                    <br />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const res = await requestEmailVerification(formData.email);
                                            if (res.success) {
                                                setError(null);
                                            } else {
                                                setError(res.error || "Ошибка отправки кода");
                                            }
                                        }}
                                        className="text-luxury-gold hover:text-white underline mt-2 text-xs"
                                    >
                                        Отправить код повторно
                                    </button>
                                </>
                            ) : (
                                "Загрузка..."
                            )}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">

                        {/* LOGIN FIELDS */}
                        {mode === 'login' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Телефон / Логин"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Пароль"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </>
                        )}

                        {/* REGISTRATION STEP 1 */}
                        {mode === 'register' && regStep === 1 && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Ваше Имя"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Телефон"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email (для кода)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Придумайте пароль"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-luxury-gold outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </>
                        )}

                        {/* REGISTRATION STEP 2 */}
                        {mode === 'register' && regStep === 2 && (
                            <div className="py-4">
                                <input
                                    type="text"
                                    placeholder="Код из письма (1234)"
                                    className="w-full bg-white/10 border border-luxury-gold text-center text-2xl tracking-[0.5em] rounded-lg px-4 py-4 text-white focus:outline-none placeholder:text-white/20 font-mono"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    maxLength={4}
                                    autoFocus
                                    required
                                />
                            </div>
                        )}

                        {error && <p className="text-red-400 text-xs text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-luxury-gold text-black uppercase tracking-widest text-xs py-4 rounded-lg font-bold hover:bg-white transition-colors flex justify-center items-center gap-2"
                        >
                            {isLoading && <Loader2 className="animate-spin" size={16} />}
                            {!isLoading && mode === 'login' && 'Войти'}
                            {!isLoading && mode === 'register' && regStep === 1 && 'Продолжить'}
                            {!isLoading && mode === 'register' && regStep === 2 && 'Подтвердить и войти'}
                        </button>

                        {/* Yandex OAuth Button - only on login screen */}
                        {mode === 'login' && (
                            <>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[#1a1a1a] px-3 text-white/30">или</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={loginWithYandex}
                                    className="w-full bg-[#FC3F1D] text-white uppercase tracking-widest text-xs py-4 rounded-lg font-bold hover:bg-[#ff5533] transition-colors flex justify-center items-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.04 12c0-5.523 4.476-10 10-10 5.522 0 10 4.477 10 10s-4.478 10-10 10c-5.524 0-10-4.477-10-10zm6.608-.478h1.558v-5.78h1.87l2.09 5.78h1.474l-2.27-5.946c1.12-.394 1.87-1.404 1.87-2.696 0-1.81-1.254-2.908-3.27-2.908h-3.32v11.55zm1.558-6.728h1.448c1.034 0 1.63.548 1.63 1.428 0 .88-.596 1.428-1.63 1.428h-1.448V4.794z" />
                                    </svg>
                                    Войти через Яндекс
                                </button>
                            </>
                        )}
                    </form>

                    <div className="mt-6 text-center">
                        {mode === 'login' ? (
                            <button
                                onClick={() => setMode('register')}
                                className="text-white/40 text-xs hover:text-luxury-gold transition-colors underline decoration-dotted"
                            >
                                Нет аккаунта? Зарегистрироваться
                            </button>
                        ) : (
                            regStep === 1 && (
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-white/40 text-xs hover:text-luxury-gold transition-colors underline decoration-dotted"
                                >
                                    Уже есть аккаунт? Войти
                                </button>
                            )
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};