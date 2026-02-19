// src/app/layout.tsx
import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

// ВАЖНО: Импорт без фигурных скобок { }, так как мы сделали export default
import ClientLayout from "@/components/layout/ClientLayout";
import SEOHead from "@/components/SEOHead";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  weight: ["200", "300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Трактир Сеновал — Ресторан в Санкт-Петербурге | Бронирование столов онлайн",
  description: "Трактир Сеновал — уютный ресторан русской и европейской кухни в Санкт-Петербурге. Авторские блюда, банкеты, бронирование столов онлайн. Адрес: набережная реки Мойки, 82.",
  keywords: ["трактир сеновал", "ресторан санкт-петербург", "кафе спб", "бронирование столов", "банкетный зал спб", "ресторан мойка", "где поесть в центре спб"],
  authors: [{ name: "Traktir Senoval" }],
  creator: "Трактир Сеновал",
  publisher: "Трактир Сеновал",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://traktir-senoval.ru",
    siteName: "Трактир Сеновал",
    title: "Трактир Сеновал — Ресторан в Санкт-Петербурге",
    description: "Уютный ресторан на набережной Мойки. Русская и европейская кухня.",
    images: [
      {
        url: "/fone.png",
        width: 1200,
        height: 630,
        alt: "Трактир Сеновал — ресторан в Санкт-Петербурге",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Трактир Сеновал — Ресторан в Санкт-Петербурге",
    description: "Уютный ресторан на набережной Мойки. Русская и европейская кухня.",
    images: ["/fone.png"],
  },
  alternates: {
    canonical: "https://traktir-senoval.ru",
  },
  verification: {
    yandex: "YOUR_YANDEX_VERIFICATION_CODE", // Замените на код из Яндекс.Вебмастер
    google: "YOUR_GOOGLE_VERIFICATION_CODE", // Замените на код из Google Search Console
  },
  other: {
    "geo.region": "RU-SPE",
    "geo.placename": "Санкт-Петербург",
    "geo.position": "59.9386;30.3141",
    "ICBM": "59.9386, 30.3141",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${manrope.variable} ${playfair.variable}`}>
      <body>
        <SEOHead />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
