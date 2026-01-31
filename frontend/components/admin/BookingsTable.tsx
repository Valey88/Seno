"use client";

import React, { useState, useMemo } from "react";
import { useBookingsStore } from "@/stores/bookingsStore";
import { Booking, BookingStatus } from "@/types";
import {
    Phone,
    Calendar,
    Clock,
    Users,
    MessageSquare,
    CheckCircle,
    XCircle,
    Loader2,
    Filter,
    Search,
    ChevronDown,
} from "lucide-react";

type StatusFilter = "all" | BookingStatus;

const STATUS_CONFIG = {
    PENDING: {
        label: "Ожидает",
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Clock,
    },
    CONFIRMED: {
        label: "Подтверждено",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle,
    },
    CANCELLED: {
        label: "Отменено",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: XCircle,
    },
};

export const BookingsTable: React.FC = () => {
    const { bookings, updateBookingStatus, isLoading } = useBookingsStore();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Filter bookings
    const filteredBookings = useMemo(() => {
        let result = [...bookings];

        // Filter by status
        if (statusFilter !== "all") {
            result = result.filter((b) => b.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (b) =>
                    b.name.toLowerCase().includes(query) ||
                    b.phone.includes(query) ||
                    b.date.includes(query)
            );
        }

        // Sort by date (newest first)
        result.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return result;
    }, [bookings, statusFilter, searchQuery]);

    // Status counts
    const statusCounts = useMemo(() => {
        return {
            all: bookings.length,
            PENDING: bookings.filter((b) => b.status === "PENDING").length,
            CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
            CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
        };
    }, [bookings]);

    // Handle status change
    const handleStatusChange = async (
        bookingId: string,
        newStatus: BookingStatus
    ) => {
        setUpdatingId(bookingId);
        try {
            await updateBookingStatus(Number(bookingId), newStatus);
        } catch (e) {
            console.error(e);
        } finally {
            setUpdatingId(null);
        }
    };

    // Quick actions
    const handleConfirm = (booking: Booking) => {
        handleStatusChange(booking.id, BookingStatus.CONFIRMED);
    };

    const handleCancel = (booking: Booking) => {
        handleStatusChange(booking.id, BookingStatus.CANCELLED);
    };

    return (
        <div className="space-y-6">
            {/* Header with filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* Status Tabs */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === "all"
                                ? "bg-luxury-gold text-black"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                            }`}
                    >
                        Все ({statusCounts.all})
                    </button>
                    {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((status) => {
                        const config = STATUS_CONFIG[status];
                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === status
                                        ? "bg-luxury-gold text-black"
                                        : "bg-white/5 text-white/60 hover:bg-white/10"
                                    }`}
                            >
                                {config.label} ({statusCounts[status]})
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                        type="text"
                        placeholder="Поиск по имени, телефону..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-luxury-gold/50"
                    />
                </div>
            </div>

            {/* Bookings List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-luxury-gold" size={32} />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                    {searchQuery || statusFilter !== "all"
                        ? "Бронирования не найдены"
                        : "Нет бронирований"}
                </div>
            ) : (
                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[#151515] border-b border-white/5 text-xs text-white/40 uppercase tracking-wider font-medium">
                        <div className="col-span-3">Гость</div>
                        <div className="col-span-2">Дата и время</div>
                        <div className="col-span-2">Детали</div>
                        <div className="col-span-2">Статус</div>
                        <div className="col-span-3 text-right">Действия</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-white/5">
                        {filteredBookings.map((booking) => {
                            const statusConfig =
                                STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
                            const isUpdating = updatingId === booking.id;

                            return (
                                <div
                                    key={booking.id}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center"
                                >
                                    {/* Guest Info */}
                                    <div className="md:col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury-gold to-yellow-600 flex items-center justify-center text-black font-bold text-sm shrink-0">
                                            {booking.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-white font-medium truncate">
                                                {booking.name}
                                            </div>
                                            <div className="text-white/40 text-sm flex items-center gap-1">
                                                <Phone size={12} />
                                                {booking.phone}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2 text-white">
                                            <Calendar size={14} className="text-luxury-gold" />
                                            {new Date(booking.date).toLocaleDateString("ru-RU", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </div>
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <Clock size={14} className="text-luxury-gold/60" />
                                            {booking.time?.slice(0, 5) || booking.time}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="md:col-span-2 space-y-1">
                                        <div className="flex items-center gap-2 text-white/80 text-sm">
                                            <Users size={14} />
                                            {booking.guests} гостей
                                        </div>
                                        <div className="text-white/40 text-sm">
                                            Стол: {booking.tableId || "—"}
                                        </div>
                                        {booking.comment && (
                                            <div className="text-yellow-400/70 text-xs truncate flex items-center gap-1">
                                                <MessageSquare size={10} />
                                                {booking.comment}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="md:col-span-2">
                                        {statusConfig && (
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
                                            >
                                                <statusConfig.icon size={12} />
                                                {statusConfig.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="md:col-span-3 flex items-center justify-end gap-2">
                                        {isUpdating ? (
                                            <Loader2
                                                className="animate-spin text-white/40"
                                                size={20}
                                            />
                                        ) : (
                                            <>
                                                {booking.status === "PENDING" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirm(booking)}
                                                            className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckCircle size={12} />
                                                            Подтвердить
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(booking)}
                                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                        >
                                                            <XCircle size={12} />
                                                            Отменить
                                                        </button>
                                                    </>
                                                )}
                                                {booking.status === "CONFIRMED" && (
                                                    <button
                                                        onClick={() => handleCancel(booking)}
                                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                    >
                                                        <XCircle size={12} />
                                                        Отменить
                                                    </button>
                                                )}
                                                {booking.status === "CANCELLED" && (
                                                    <span className="text-white/30 text-xs">
                                                        Нет действий
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Summary */}
            {filteredBookings.length > 0 && (
                <div className="flex justify-between items-center text-sm text-white/40 px-2">
                    <span>Показано: {filteredBookings.length} бронирований</span>
                    <span>
                        Ожидаемый депозит:{" "}
                        {filteredBookings
                            .filter((b) => b.status !== "CANCELLED")
                            .reduce((sum, b) => sum + (b.depositAmount || 0), 0)
                            .toLocaleString()}{" "}
                        ₽
                    </span>
                </div>
            )}
        </div>
    );
};
