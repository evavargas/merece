// URL pública del sitio (canónica, sitemap, Open Graph). Se sobreescribe con NEXT_PUBLIC_SITE_URL si cambia el dominio.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://merecesingluten.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Merece";
export const SITE_DESCRIPTION = "Pastelería clásica y artesanal sin gluten, hecha para darse un gusto. Delivery en Montevideo. Pedí por WhatsApp o Instagram.";
