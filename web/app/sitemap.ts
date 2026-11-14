import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /admin no se indexa.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/mi-primer-espresso`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
