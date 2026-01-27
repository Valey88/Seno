export enum Zone {
  HALL_1 = "HALL_1",
  HALL_2 = "HALL_2",
  HALL_3 = "HALL_3",
  // Legacy aliases for backward compatibility
  WINDOW = "HALL_1",
  MAIN_HALL = "HALL_2",
  QUIET = "HALL_3"
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED"
}

export type UserRole = 'GUEST' | 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string; // Added for registration
  role: UserRole;
  password?: string; // Mock password
}

export interface Table {
  id: number;
  zone: Zone;
  seats: number;
  x: number; // For SVG positioning
  y: number; // For SVG positioning
  rotation?: number; // 0, 45, 90, etc.
  isReserved?: boolean;
}

export type MenuCategory = 'salads' | 'soups' | 'main' | 'pizza' | 'starters' | 'beer' | 'alcohol' | 'soft_drinks';

export interface MenuItem {
  id: number;
  title: string;
  description?: string; // Short marketing description
  ingredients: string[]; // Full list of ingredients
  weight: number; // in grams
  price: number;
  image: string;
  category: MenuCategory;
  isSpicy?: boolean;
  isVegan?: boolean;
}

export interface BookingRequest {
  date: string; // ISO Date
  time: string; // HH:mm
  guests: number;
  name: string;
  phone: string;
  tableId: number | null;
  comment?: string;
  userId?: string; // Link to registered user
}

export interface Booking extends BookingRequest {
  id: string;
  status: BookingStatus;
  depositAmount: number;
  createdAt: Date;
}

export interface Review {
  id: number;
  author: string;
  rating: number; // 1-5
  date: string;
  text: string;
  image?: string;
  images?: string[];
}
