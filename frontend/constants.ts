import { Table, Zone, MenuItem, Review } from './types';

// INITIAL DATASETS
// These are used to populate the mock database on startup.

export const INITIAL_TABLES: Table[] = [
  // --- HALL 1 (WINDOW) ---
  { id: 101, table_number: "101", zone: Zone.WINDOW, seats: 2, x: 200, y: 150, rotation: 0 },
  { id: 102, table_number: "102", zone: Zone.WINDOW, seats: 2, x: 600, y: 150, rotation: 0 },
  { id: 103, table_number: "103", zone: Zone.WINDOW, seats: 4, x: 200, y: 350, rotation: 90 },
  { id: 104, table_number: "104", zone: Zone.WINDOW, seats: 4, x: 600, y: 350, rotation: 90 },
  { id: 105, table_number: "105", zone: Zone.WINDOW, seats: 6, x: 400, y: 500, rotation: 0 },

  // --- HALL 2 (MAIN) ---
  { id: 201, table_number: "201", zone: Zone.MAIN_HALL, seats: 4, x: 200, y: 200, rotation: 0 },
  { id: 202, table_number: "202", zone: Zone.MAIN_HALL, seats: 4, x: 600, y: 200, rotation: 0 },
  { id: 203, table_number: "203", zone: Zone.MAIN_HALL, seats: 8, x: 400, y: 300, rotation: 0 },
  { id: 204, table_number: "204", zone: Zone.MAIN_HALL, seats: 4, x: 200, y: 450, rotation: 0 },
  { id: 205, table_number: "205", zone: Zone.MAIN_HALL, seats: 4, x: 600, y: 450, rotation: 0 },

  // --- HALL 3 (QUIET) ---
  { id: 301, table_number: "301", zone: Zone.QUIET, seats: 2, x: 250, y: 200, rotation: 45 },
  { id: 302, table_number: "302", zone: Zone.QUIET, seats: 2, x: 550, y: 200, rotation: -45 },
  { id: 303, table_number: "303", zone: Zone.QUIET, seats: 4, x: 400, y: 400, rotation: 0 },
];

export const INITIAL_CATEGORIES: { id: string; label: string }[] = [
  { id: 'salads', label: 'Салаты' },
  { id: 'soups', label: 'Супы' },
  { id: 'starters', label: 'Закуски' },
  { id: 'pizza', label: 'Пицца' },
  { id: 'main', label: 'Горячее' },
  { id: 'beer', label: 'Пиво' },
  { id: 'alcohol', label: 'Алкоголь' },
  { id: 'soft_drinks', label: 'Б/А Напитки' },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // --- SALADS ---
  {
    id: 1,
    title: "Салат с печеной тыквой",
    ingredients: ["Тыква мускатная", "Сыр страчателла", "Кедровый орех", "Микс салат", "Медово-горчичная заправка", "Тыквенные семечки"],
    weight: 280,
    price: 650,
    category: "salads",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    isVegan: true
  },
  {
    id: 2,
    title: "Тартар из оленя",
    ingredients: ["Вырезка оленя", "Моченая брусника", "Эмульсия из можжевельника", "Лук шалот", "Ржаные чипсы", "Перепелиное яйцо"],
    weight: 180,
    price: 890,
    category: "starters",
    image: "https://images.unsplash.com/photo-1546221523-c495e267b14d?auto=format&fit=crop&w=800&q=80"
  },
  // --- SOUPS ---
  {
    id: 10,
    title: "Финская уха",
    ingredients: ["Лосось", "Судак", "Сливки 22%", "Картофель", "Лук порей", "Укропное масло", "Икра форели"],
    weight: 350,
    price: 720,
    category: "soups",
    image: "https://images.unsplash.com/photo-1547592166-23acbe346499?auto=format&fit=crop&w=800&q=80"
  },
  // --- MAIN ---
  {
    id: 3,
    title: "Утка конфи",
    ingredients: ["Утиная ножка", "Пюре из пастернака", "Вишневый соус", "Тимьян", "Чеснок конфи"],
    weight: 320,
    price: 1200,
    category: "main",
    image: "https://images.unsplash.com/photo-1518492104633-130d32220383?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    title: "Стейк Мясника",
    ingredients: ["Стейк (диафрагма)", "Перечный соус", "Печеный картофель", "Розмарин"],
    weight: 300,
    price: 1450,
    category: "main",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80",
    isSpicy: true
  },
  // --- PIZZA ---
  {
    id: 20,
    title: "Пицца с грушей и горгонзолой",
    ingredients: ["Тесто", "Сливочный соус", "Сыр моцарелла", "Сыр горгонзола", "Груша конференц", "Грецкий орех", "Мед"],
    weight: 450,
    price: 850,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 21,
    title: "Дьявола",
    ingredients: ["Тесто", "Томатный соус", "Моцарелла", "Острые колбаски пепперони", "Перец чили", "Орегано"],
    weight: 430,
    price: 790,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
    isSpicy: true
  },
  // --- DRINKS ---
  {
    id: 5,
    title: "Настойка 'Сеновал'",
    ingredients: ["Водка", "Мед", "Сбор трав", "Цедра лимона"],
    weight: 50,
    price: 350,
    category: "alcohol",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6,
    title: "Лагер Фирменный",
    ingredients: ["Светлое пиво"],
    weight: 500,
    price: 450,
    category: "beer",
    image: "https://images.unsplash.com/photo-1618183182103-623259966144?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 7,
    title: "Лимонад Малина-Базилик",
    ingredients: ["Малиновое пюре", "Свежий базилик", "Содовая", "Лед"],
    weight: 400,
    price: 390,
    category: "soft_drinks",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    isVegan: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    author: "Елена С.",
    rating: 5,
    date: "12 октября 2024",
    text: "Волшебное место! Настойки просто выше всяких похвал, а вид на Мойку создает непередаваемую атмосферу. Обязательно вернемся.",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=300&q=60"
  },
  {
    id: 2,
    author: "Михаил Д.",
    rating: 4,
    date: "5 октября 2024",
    text: "Тартар из оленя очень интересный, подача на высоте. Немного пришлось подождать столик, но это того стоило."
  },
  {
    id: 3,
    author: "Анна и Игорь",
    rating: 5,
    date: "28 сентября 2024",
    text: "Отмечали годовщину. Персонал очень внимательный, помогли с выбором вина. Спасибо за чудесный вечер!",
  }
];

export const TELEGRAM_BOT_TOKEN = "MOCK_TOKEN";
export const TELEGRAM_CHAT_ID = "MOCK_CHAT_ID";