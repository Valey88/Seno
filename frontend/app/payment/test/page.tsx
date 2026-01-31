"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import apiClient from "@/services/api";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

// Wrap the content in Suspense for useSearchParams
function PaymentTestContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get("booking_id");
    const amount = searchParams.get("amount");

    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

    const handlePayment = async (success: boolean) => {
        if (!bookingId) return;
        setStatus("processing");

        try {
            // Direct call to the backend webhook for testing
            await apiClient.post(`/bookings/${bookingId}/webhook`, {
                booking_id: parseInt(bookingId),
                payment_status: success ? "success" : "failed",
            });

            if (success) {
                setStatus("success");
                toast.success("Оплата прошла успешно!");
                setTimeout(() => {
                    router.push("/profile");
                }, 1500);
            } else {
                setStatus("error");
                toast.error("Оплата не прошла");
            }
        } catch (e) {
            console.error(e);
            setStatus("error");
            toast.error("Ошибка соединения с сервером");
        }
    };

    if (!bookingId || !amount) {
        return (
            <div className="text-center text-white/50">
                Неверные параметры оплаты
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-stone-900 border border-white/10 rounded-2xl p-8 text-center space-y-6">
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
                    <CreditCard size={32} />
                </div>
            </div>

            <div>
                <h1 className="text-2xl font-serif text-white mb-2">Тестовая Оплата</h1>
                <p className="text-white/50 text-sm">Симуляция платежного шлюза</p>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">К оплате</p>
                <p className="text-3xl font-mono text-luxury-gold">{amount} ₽</p>
            </div>

            {status === "idle" && (
                <div className="space-y-3">
                    <button
                        onClick={() => handlePayment(true)}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Оплатить Успешно
                    </button>

                    <button
                        onClick={() => handlePayment(false)}
                        className="w-full bg-red-900/50 hover:bg-red-900/70 text-red-200 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle size={18} />
                        Отклонить Платеж
                    </button>
                </div>
            )}

            {status === "processing" && (
                <div className="py-4 text-luxury-gold flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="text-sm uppercase tracking-widest">Обработка...</span>
                </div>
            )}

            {status === "success" && (
                <div className="py-4 text-green-400 flex flex-col items-center gap-2 animate-in zoom-in">
                    <CheckCircle size={48} />
                    <span className="text-lg font-bold">Оплачено!</span>
                    <p className="text-white/30 text-xs">Переадресация...</p>
                </div>
            )}

            {status === "error" && (
                <div className="py-4 text-red-400 flex flex-col items-center gap-2 animate-in zoom-in">
                    <XCircle size={48} />
                    <span className="text-lg font-bold">Ошибка</span>
                    <button
                        onClick={() => setStatus("idle")}
                        className="text-xs underline text-white/30 hover:text-white mt-2"
                    >
                        Попробовать снова
                    </button>
                </div>
            )}
        </div>
    );
}

export default function PaymentTestPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-stone-950">
            <Suspense fallback={<div className="text-white">Загрузка...</div>}>
                <PaymentTestContent />
            </Suspense>
        </div>
    );
}
