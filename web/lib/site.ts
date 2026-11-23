import { t } from "./i18n/index.ts";

// URL pública del sitio (canónica, sitemap, Open Graph). Se sobreescribe con NEXT_PUBLIC_SITE_URL si cambia el dominio.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://merecesingluten.vercel.app").replace(/\/$/, "");
export const SITE_NAME = t("brand.name");
export const SITE_DESCRIPTION = t("site.description");
