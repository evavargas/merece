import { t } from "./i18n/index.ts";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://merecesingluten.vercel.app").replace(/\/$/, "");
export const SITE_NAME = t("brand.name");
export const SITE_DESCRIPTION = t("site.description");
