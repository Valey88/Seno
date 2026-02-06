import Script from 'next/script';
import { restaurantSchema, organizationSchema, websiteSchema } from '@/lib/seo-schemas';

/**
 * SEO Head component with JSON-LD structured data
 * Add this to layout.tsx or individual pages
 */
export function SEOHead() {
    return (
        <>
            {/* Restaurant Schema */}
            <Script
                id="restaurant-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(restaurantSchema),
                }}
                strategy="beforeInteractive"
            />

            {/* Organization Schema */}
            <Script
                id="organization-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
                strategy="beforeInteractive"
            />

            {/* Website Schema */}
            <Script
                id="website-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
                strategy="beforeInteractive"
            />
        </>
    );
}

export default SEOHead;
