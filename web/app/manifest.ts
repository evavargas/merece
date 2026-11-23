import type { MetadataRoute } from "next";
import { LOCALE, t } from "@/lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t("site.manifestName"),
    short_name: t("brand.name"),
    description: t("site.manifestDescription"),
    start_url: "/",
    display: "browser",
    background_color: "#FFFFF0",
    theme_color: "#FFFFF0",
    lang: LOCALE,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
