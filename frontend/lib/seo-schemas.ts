// SEO Schema.org JSON-LD structured data for local restaurant
export const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": "https://traktir-senoval.ru/#restaurant",
    "name": "Трактир Сеновал",
    "alternateName": "Traktir Senoval",
    "description": "Уютный ресторан русской и европейской кухни в Оренбурге. Авторские блюда, банкеты, бронирование столов онлайн.",
    "url": "https://traktir-senoval.ru",
    "telephone": "+7 (XXX) XXX-XX-XX", // ЗАМЕНИТЕ на реальный номер
    "email": "info@traktir-senoval.ru", // ЗАМЕНИТЕ на реальный email
    "image": [
        "https://traktir-senoval.ru/fone.png",
        "https://traktir-senoval.ru/XXXL.webp"
    ],
    "logo": "https://traktir-senoval.ru/logo.png",
    "priceRange": "₽₽",
    "servesCuisine": ["Русская кухня", "Европейская кухня"],
    "acceptsReservations": "true",
    "menu": "https://traktir-senoval.ru/menu",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "набережная реки Мойки, 82",
        "addressLocality": "Санкт-Петербург",
        "addressRegion": "Санкт-Петербург",
        "postalCode": "190000",
        "addressCountry": "RU"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 59.9386,
        "longitude": 30.3141
    },
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "12:00",
            "closes": "23:00"
        },
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Saturday", "Sunday"],
            "opens": "12:00",
            "closes": "00:00"
        }
    ],
    "sameAs": [
        // ДОБАВЬТЕ ссылки на соц.сети когда будут
        // "https://vk.com/traktir_senoval",
        // "https://t.me/traktir_senoval"
    ],
    "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "50",
        "bestRating": "5",
        "worstRating": "1"
    },
    "potentialAction": {
        "@type": "ReserveAction",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://traktir-senoval.ru/booking",
            "actionPlatform": [
                "http://schema.org/DesktopWebPlatform",
                "http://schema.org/MobileWebPlatform"
            ]
        },
        "result": {
            "@type": "Reservation",
            "name": "Бронирование стола"
        }
    }
};

export const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Трактир Сеновал",
    "url": "https://traktir-senoval.ru",
    "logo": "https://traktir-senoval.ru/logo.png",
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+7 (XXX) XXX-XX-XX", // ЗАМЕНИТЕ
        "contactType": "reservations",
        "areaServed": "RU",
        "availableLanguage": "Russian"
    }
};

export const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Трактир Сеновал",
    "url": "https://traktir-senoval.ru",
    "potentialAction": {
        "@type": "SearchAction",
        "target": "https://traktir-senoval.ru/menu?search={search_term_string}",
        "query-input": "required name=search_term_string"
    }
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
    }))
});
