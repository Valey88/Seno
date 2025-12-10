import { BookingRequest, Booking, BookingStatus, Table, User, MenuItem, Review, MenuCategory } from '../types';
import { INITIAL_TABLES, INITIAL_MENU_ITEMS, INITIAL_CATEGORIES, INITIAL_REVIEWS } from '../constants';

// --- CONSTANTS & KEYS ---
const STORAGE_KEYS = {
    TABLES: 'senoval_tables_v1',
    MENU: 'senoval_menu_v1',
    CATEGORIES: 'senoval_categories_v1',
    BOOKINGS: 'senoval_bookings_v1',
    REVIEWS: 'senoval_reviews_v1',
    USER: 'senoval_user_v1' // Simulating session
};

// --- HELPER: DATABASE CONNECTION (LOCAL STORAGE) ---
const loadFromStorage = <T>(key: string, defaultData: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultData;
    } catch (e) {
        console.error(`Error loading ${key}`, e);
        return defaultData;
    }
};

const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key}`, e);
    }
};

// --- INITIALIZE DATABASE ---
// We load data once into memory, then sync back to storage on changes.
let dbTables: Table[] = loadFromStorage(STORAGE_KEYS.TABLES, INITIAL_TABLES);
let dbMenu: MenuItem[] = loadFromStorage(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS);
let dbCategories: { id: string; label: string }[] = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
let dbReviews: Review[] = loadFromStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
let dbBookings: Booking[] = loadFromStorage(STORAGE_KEYS.BOOKINGS, [
    {
        id: "bk_old_1",
        date: "2024-10-20",
        time: "19:00",
        guests: 2,
        name: "Иван Петров",
        phone: "+79001234567",
        tableId: 101,
        status: BookingStatus.CONFIRMED,
        depositAmount: 500,
        createdAt: new Date("2024-10-15"),
        userId: "user_1",
        comment: "У окна пожалуйста"
    }
]);

// --- AUTH SERVICE ---

export const loginUser = async (phone: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await new Promise(r => setTimeout(r, 600)); 
    
    if (phone === 'admin' && password === 'admin') {
        const user: User = { id: 'admin_1', name: 'Администратор', phone: 'admin', role: 'ADMIN' };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user };
    }

    if (phone.length > 3) {
        const user: User = { id: 'user_' + Date.now(), name: 'Пользователь', phone: phone, role: 'USER' };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return { success: true, user };
    }

    return { success: false, error: "Неверный логин или пароль" };
};

export const requestEmailVerification = async (email: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    console.log(`%c[BACKEND] Email code for ${email}: 1234`, 'color: #D4AF37; font-weight: bold; font-size: 12px;');
    return true;
};

export const registerUser = async (name: string, phone: string, email: string, password: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await new Promise(r => setTimeout(r, 600));
    
    if (code !== '1234') {
        return { success: false, error: "Неверный код подтверждения" };
    }

    const user: User = { id: 'user_' + Date.now(), name, phone, email, role: 'USER' };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { success: true, user };
};

export const getCurrentUser = (): User | null => {
    return loadFromStorage(STORAGE_KEYS.USER, null);
};

export const logoutUser = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
};

// --- DATA READERS ---

export const getBookings = async (user?: User): Promise<Booking[]> => {
    await new Promise(r => setTimeout(r, 300)); // Simulate latency
    if (!user) return [];
    if (user.role === 'ADMIN') {
        return [...dbBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return dbBookings.filter(b => b.userId === user.id || b.phone === user.phone);
};

export const getTables = async (): Promise<Table[]> => {
    return [...dbTables];
};

export const getMenu = async (): Promise<MenuItem[]> => {
    return [...dbMenu];
};

export const getCategories = async (): Promise<{id: string, label: string}[]> => {
    return [...dbCategories];
};

export const getReviews = async (): Promise<Review[]> => {
    return [...dbReviews];
};

// --- DATA WRITERS (TRANSACTIONS) ---

// Bookings
export const updateBookingStatus = async (bookingId: string, status: BookingStatus): Promise<boolean> => {
    const idx = dbBookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
        dbBookings[idx].status = status;
        saveToStorage(STORAGE_KEYS.BOOKINGS, dbBookings);
        return true;
    }
    return false;
};

export const updateBookingDetails = async (booking: Booking): Promise<boolean> => {
    const idx = dbBookings.findIndex(b => b.id === booking.id);
    if (idx !== -1) {
        dbBookings[idx] = booking;
        saveToStorage(STORAGE_KEYS.BOOKINGS, dbBookings);
        return true;
    }
    return false;
};

export const createBookingAction = async (data: BookingRequest): Promise<{ success: boolean; paymentUrl?: string; error?: string }> => {
  await new Promise(r => setTimeout(r, 500));
  
  const selectedTable = dbTables.find(t => t.id === data.tableId);
  if (!selectedTable) return { success: false, error: "Стол не найден или был удален" };

  // Check for conflicts (simple logic)
  const conflict = dbBookings.find(b => 
      b.tableId === data.tableId && 
      b.date === data.date && 
      b.status !== BookingStatus.CANCELLED &&
      b.time === data.time // In real app, check time ranges
  );

  if (conflict) {
      return { success: false, error: "Этот стол уже забронирован на выбранное время" };
  }

  const newBooking: Booking = {
    ...data,
    id: `bk_${Date.now()}`,
    status: BookingStatus.PENDING,
    depositAmount: 500,
    createdAt: new Date(),
  };
  
  dbBookings.unshift(newBooking);
  saveToStorage(STORAGE_KEYS.BOOKINGS, dbBookings);

  return { 
    success: true, 
    paymentUrl: `https://yookassa.ru/checkout?orderId=${newBooking.id}&mock=true` 
  };
};

export const confirmPaymentAction = async (bookingId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const idx = dbBookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
        dbBookings[idx].status = BookingStatus.CONFIRMED;
        saveToStorage(STORAGE_KEYS.BOOKINGS, dbBookings);
    }
    return { success: true };
};

// Menu & Categories
export const addCategory = async (label: string): Promise<void> => {
    const id = label.toLowerCase().replace(/\s/g, '_');
    if (!dbCategories.find(c => c.id === id)) {
        dbCategories.push({ id, label });
        saveToStorage(STORAGE_KEYS.CATEGORIES, dbCategories);
    }
};

export const deleteCategory = async (id: string): Promise<void> => {
    dbCategories = dbCategories.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CATEGORIES, dbCategories);
};

export const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<void> => {
    const newItem = { ...item, id: Date.now() };
    dbMenu.push(newItem);
    saveToStorage(STORAGE_KEYS.MENU, dbMenu);
};

export const deleteMenuItem = async (id: number): Promise<void> => {
    dbMenu = dbMenu.filter(m => m.id !== id);
    saveToStorage(STORAGE_KEYS.MENU, dbMenu);
};

// Tables
export const addTable = async (table: Table): Promise<void> => {
    if(dbTables.find(t => t.id === table.id)) {
        throw new Error("ID стола уже существует");
    }
    dbTables.push(table);
    saveToStorage(STORAGE_KEYS.TABLES, dbTables);
};

export const updateTable = async (table: Table): Promise<void> => {
    const idx = dbTables.findIndex(t => t.id === table.id);
    if (idx !== -1) {
        dbTables[idx] = table;
        saveToStorage(STORAGE_KEYS.TABLES, dbTables);
    }
};

export const deleteTable = async (id: number): Promise<void> => {
    dbTables = dbTables.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.TABLES, dbTables);
};

// Reviews
export const addReview = async (review: Review): Promise<void> => {
    dbReviews.unshift(review);
    saveToStorage(STORAGE_KEYS.REVIEWS, dbReviews);
};

export const deleteReview = async (id: number): Promise<void> => {
    dbReviews = dbReviews.filter(r => r.id !== id);
    saveToStorage(STORAGE_KEYS.REVIEWS, dbReviews);
};

// Stats
export const getStats = async (): Promise<any> => {
    const totalBookings = dbBookings.length;
    const confirmed = dbBookings.filter(b => b.status === BookingStatus.CONFIRMED).length;
    const revenue = dbBookings.reduce((acc, curr) => curr.status === BookingStatus.CONFIRMED ? acc + curr.depositAmount : acc, 0);
    const guests = dbBookings.reduce((acc, curr) => curr.status === BookingStatus.CONFIRMED ? acc + curr.guests : acc, 0);
    
    return { totalBookings, confirmed, revenue, guests };
};