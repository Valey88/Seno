"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useForm, Controller } from "react-hook-form";
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
import apiClient from "@/services/api";
import { Table } from "../types";

type Step = "date-guests" | "time" | "table" | "details" | "payment";

// Типы для формы контактов
interface ContactFormData {
  name: string;
  phone: string;
  comment: string;
}

// Функция форматирования телефона в +7 (999) 888-77-44
const formatPhoneNumber = (value: string): string => {
  // Удаляем всё кроме цифр
  let digits = value.replace(/\D/g, "");

  if (!digits) return "";

  // Если первая цифра 8 или не 7, заменяем на 7
  if (digits[0] === "8") {
    digits = "7" + digits.slice(1);
  } else if (digits[0] !== "7") {
    digits = "7" + digits;
  }

  // Ограничиваем до 11 цифр
  if (digits.length > 11) digits = digits.slice(0, 11);

  // Формируем маску +7 (999) 888-77-44
  let formatted = "+7";

  if (digits.length > 1) {
    formatted += " (" + digits.slice(1, 4);
  }
  if (digits.length >= 4) {
    formatted += ") " + digits.slice(4, 7);
  }
  if (digits.length >= 7) {
    formatted += "-" + digits.slice(7, 9);
  }
  if (digits.length >= 9) {
    formatted += "-" + digits.slice(9, 11);
  }

  return formatted;
};

// Валидатор телефона - проверяет полный формат
const validatePhone = (value: string): boolean | string => {
  if (!value) return "Введите номер телефона";

  // Полный формат: +7 (999) 888-77-44 = 18 символов
  if (value.length !== 18) {
    return "Введите полный номер телефона";
  }

  // Проверяем формат регуляркой
  const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(value)) {
    return "Неверный формат номера";
  }

  return true;
};

export const BookingForm: React.FC = () => {
  const [step, setStep] = useState<Step>("date-guests");

  // Данные формы
  const [date, setDate] = useState<Date>(new Date());
  const [guests, setGuests] = useState<number>(2);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  // React Hook Form для контактных данных
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ContactFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      comment: "",
    },
  });

  // Данные от API
  const [tables, setTables] = useState<Table[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);

  // --- 1. Загрузка столов ---
  useEffect(() => {
    const fetchTables = async () => {
      try {
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
  const onSubmit = async (formData: ContactFormData) => {
    if (!selectedTime || !selectedTableId) return;

    setLoading(true);
    try {
      const payload = {
        user_name: formData.name,
        user_phone: formData.phone, // Уже в формате +7 (999) 888-77-44
        date: format(date, "yyyy-MM-dd"),
        time: selectedTime,
        guest_count: guests,
        table_id: selectedTableId,
        comment: formData.comment,
      };

      const { data } = await apiClient.post("/bookings", payload);

      // Переход на оплату
      if (data.payment_url) {
        window.location.href = `/payment/test?booking_id=${data.booking_id}&amount=500`;
      } else {
        toast.success("Бронирование создано!");
      }
    } catch (e) {
      console.error("Booking Error:", e);
      const error = e as AxiosError<any>;
      const detail = error.response?.data?.detail;

      let errorMessage = "Неизвестная ошибка бронирования";

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail[0].msg || "Ошибка валидации данных";
      } else if (detail && typeof detail === "object" && detail.msg) {
        errorMessage = detail.msg;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Наблюдаем за полями для валидации кнопки
  const watchedName = watch("name");
  const watchedPhone = watch("phone");

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
                occupiedTableIds={occupiedTables}
              />
            </div>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-6 animate-in fade-in">
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
              {/* Поле имени */}
              <Controller
                name="name"
                control={control}
                rules={{ required: "Введите ваше имя" }}
                render={({ field }) => (
                  <div>
                    <input
                      {...field}
                      placeholder="Ваше имя"
                      className={`w-full bg-white/5 border p-3 rounded text-white ${errors.name ? "border-red-500" : "border-white/10"
                        } focus:border-luxury-gold outline-none transition-colors`}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Поле телефона с маской */}
              <Controller
                name="phone"
                control={control}
                rules={{ validate: validatePhone }}
                render={({ field: { onChange, value, ...field } }) => (
                  <div>
                    <input
                      {...field}
                      value={value}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        onChange(formatted);
                      }}
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      maxLength={18}
                      className={`w-full bg-white/5 border p-3 rounded text-white ${errors.phone ? "border-red-500" : "border-white/10"
                        } focus:border-luxury-gold outline-none transition-colors`}
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Комментарий */}
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Комментарий (необязательно)"
                    className="w-full bg-white/5 border border-white/10 p-3 rounded text-white h-24 focus:border-luxury-gold outline-none transition-colors"
                  />
                )}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-luxury-gold text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                `Оплатить депозит`
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep("table")}
              className="w-full text-center text-sm text-white/30 hover:text-white mt-2"
            >
              Назад
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
