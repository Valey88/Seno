// src/app/layout.tsx
import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

// ВАЖНО: Импорт без фигурных скобок { }, так как мы сделали export default
import ClientLayout from "@/components/layout/ClientLayout";

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
  title: "Трактир Сеновал | Мойка 82",
  description: "Новое прочтение северных традиций в историческом центре.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${manrope.variable} ${playfair.variable}`}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
