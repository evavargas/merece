import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Merece · Pastelería sin gluten",
    short_name: "Merece",
    description: "Pastelería clásica y artesanal sin gluten. Delivery en Montevideo.",
    start_url: "/",
    display: "browser",
    background_color: "#FFFFF0",
    theme_color: "#FFFFF0",
    lang: "es-UY",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
