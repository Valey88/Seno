"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { HallMap } from "./HallMap";
import apiClient from "@/services/api"; // Импортируем наш настроенный клиент
import { Table } from "../types";

type Step = "date-guests" | "time" | "table" | "details" | "payment";

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState<Step>("date-guests");

  // Данные формы
  const [date, setDate] = useState<Date>(new Date());
  const [guests, setGuests] = useState<number>(2);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", comment: "" });

  // Данные от API
  const [tables, setTables] = useState<Table[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);

  // --- 1. Загрузка столов ---
  useEffect(() => {
    const fetchTables = async () => {
      try {
        // Используем apiClient, путь относительный (BaseURL уже содержит /api)
        const { data } = await apiClient.get<Table[]>("/tables");
        setTables(data);
      } catch (e) {
        toast.error("Не удалось загрузить схему зала");
        console.error(e);
      }
    };
    fetchTables();
  }, []);

  // --- 2. Проверка доступности ---
  useEffect(() => {
    if (!date) return;

    const checkAvailability = async () => {
      setLoading(true);
      try {
        const dateStr = format(date, "yyyy-MM-dd");

        // Передаем параметры через объект params
        const { data } = await apiClient.get(
          `/bookings/availability/${dateStr}`,
          {
            params: { guest_count: guests },
          },
        );

        setAvailability(data);

        // Сброс времени если оно стало недоступным
        if (selectedTime) {
          const slot = data.time_slots.find((s: any) =>
            s.time.startsWith(selectedTime),
          );
          if (!slot || !slot.is_available) setSelectedTime(null);
        }
      } catch (e) {
        console.error("Availability check failed:", e);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [date, guests]);

  // --- Логика сабмита ---
  const handleSubmit = async () => {
    if (!selectedTime || !selectedTableId) return;

    setLoading(true);
    try {
      const payload = {
        user_name: contact.name,
        user_phone: contact.phone,
        date: format(date, "yyyy-MM-dd"),
        time: selectedTime,
        guest_count: guests,
        table_id: selectedTableId,
        comment: contact.comment,
      };

      const { data } = await apiClient.post("/bookings", payload);

      // Переход на оплату
      if (data.payment_url) {
        // window.location.href = data.payment_url;
        // FOR TESTING ONLY:
        window.location.href = `/payment/test?booking_id=${data.booking_id}&amount=500`;
      } else {
        toast.success("Бронирование создано!");
      }
    } catch (e) {
      console.error("Booking Error:", e);
      const error = e as AxiosError<any>; // Используем any, так как структура ошибки может меняться
      const detail = error.response?.data?.detail;

      let errorMessage = "Неизвестная ошибка бронирования";

      // Логика извлечения текста ошибки
      if (typeof detail === "string") {
        // 1. Если пришла просто строка
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // 2. Если пришел массив ошибок валидации (обычно FastAPI)
        // Берем поле 'msg' из первого элемента
        errorMessage = detail[0].msg || "Ошибка валидации данных";
      } else if (detail && typeof detail === "object" && detail.msg) {
        // 3. Если пришел одиночный объект ошибки
        errorMessage = detail.msg;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-[500px] flex flex-col gap-8 p-6 md:p-8 bg-[#151515] rounded-xl">
      {/* Прогресс бар */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/30 mb-4">
        <span className={step === "date-guests" ? "text-luxury-gold" : ""}>
          1. Детали
        </span>
        <span className="w-4 h-[1px] bg-white/10" />
        <span
          className={
            step === "time" || step === "table" ? "text-luxury-gold" : ""
          }
        >
          2. Время и Стол
        </span>
        <span className="w-4 h-[1px] bg-white/10" />
        <span className={step === "details" ? "text-luxury-gold" : ""}>
          3. Контакты
        </span>
      </div>

      <div className="flex-1">
        {step === "date-guests" && (
          <div className="grid md:grid-cols-2 gap-12 animate-in fade-in">
            <div className="space-y-4">
              <label className="text-sm text-white/50 uppercase tracking-wider">
                Дата визита
              </label>
              <input
                type="date"
                value={format(date, "yyyy-MM-dd")}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setDate(new Date(e.target.value))}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-lg text-white focus:border-luxury-gold outline-none transition-colors"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm text-white/50 uppercase tracking-wider">
                Количество гостей
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    onClick={() => setGuests(num)}
                    className={`p-3 rounded-lg border transition-all ${guests === num
                      ? "border-luxury-gold text-luxury-gold bg-luxury-gold/10"
                      : "border-white/10 text-white/50 hover:bg-white/5"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={() => setStep("time")}
                className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-luxury-gold transition-colors flex items-center gap-2"
              >
                Далее <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl text-white font-serif">Выберите время</h3>
              <button
                onClick={() => setStep("date-guests")}
                className="text-sm text-white/40 hover:text-white"
              >
                Назад
              </button>
            </div>

            {loading && (
              <div className="text-luxury-gold flex gap-2 items-center">
                <Loader2 className="animate-spin" /> Загрузка слотов...
              </div>
            )}

            {!loading && availability && (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {availability.time_slots
                  .filter((slot: any) => slot.is_available)
                  .map((slot: any) => (
                    <button
                      key={slot.time}
                      disabled={!slot.is_available}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        // Set occupied tables for this slot
                        setOccupiedTables(slot.occupied_table_ids || []);
                        setStep("table");
                      }}
                      className={`
                      py-3 px-2 rounded border text-sm transition-all
                      ${slot.time.startsWith(selectedTime || "")
                          ? "bg-luxury-gold text-black border-luxury-gold"
                          : slot.is_available
                            ? "bg-white/5 border-white/10 text-white hover:border-white/30"
                            : "opacity-30 cursor-not-allowed border-transparent text-white/20"
                        }
                    `}
                    >
                      {slot.time.slice(0, 5)}
                    </button>
                  ))}
              </div>
            )}

            {availability && availability.min_advance_hours && (
              <p className="text-xs text-white/30 mt-4 text-center">
                * Бронирование возможно минимум за{" "}
                {availability.min_advance_hours} часа до начала
              </p>
            )}
          </div>
        )}

        {step === "table" && (
          <div className="space-y-4 animate-in fade-in h-full flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="text-xl text-white font-serif">Выберите стол</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep("time")}
                  className="text-sm text-white/40 hover:text-white"
                >
                  Назад
                </button>
                {selectedTableId && (
                  <button
                    onClick={() => setStep("details")}
                    className="bg-luxury-gold text-black px-6 py-2 rounded text-sm font-bold animate-pulse"
                  >
                    Выбрать стол №{tables.find(t => t.id === selectedTableId)?.table_number || selectedTableId}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-[400px]">
              <HallMap
                tables={tables}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
                // Можно передать список занятых, если API их возвращает отдельно
                occupiedTableIds={occupiedTables}
              />
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="max-w-md mx-auto space-y-6 animate-in fade-in">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-serif text-white mb-2">
                Подтверждение
              </h3>
              <p className="text-white/50">
                {format(date, "d MMMM", { locale: ru })} в{" "}
                {selectedTime?.slice(0, 5)} <br />
                Стол №{tables.find(t => t.id === selectedTableId)?.table_number || selectedTableId}, {guests} персон
              </p>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Ваше имя"
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white"
                value={contact.name}
                onChange={(e) =>
                  setContact({ ...contact, name: e.target.value })
                }
              />
              <input
                placeholder="Телефон (+7...)"
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white"
                value={contact.phone}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
              />
              <textarea
                placeholder="Комментарий (необязательно)"
                className="w-full bg-white/5 border border-white/10 p-3 rounded text-white h-24"
                value={contact.comment}
                onChange={(e) =>
                  setContact({ ...contact, comment: e.target.value })
                }
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !contact.phone || !contact.name}
              className="w-full bg-luxury-gold text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                `Оплатить депозит`
              )}
            </button>
            <button
              onClick={() => setStep("table")}
              className="w-full text-center text-sm text-white/30 hover:text-white mt-2"
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
