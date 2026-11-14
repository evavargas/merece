import { formatPrice } from "./price";

export type Category = "pasteleria" | "a_pedido" | "acompanar";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number | null;
  stock: number;
  imageUrl: string | null;
  sortOrder: number;
};

// `neon`: en vez de la etiqueta, la categoría se presenta con un cartel de neón que rota estas frases.
// `hideTitle`: sin etiqueta visible; el título queda solo para lectores de pantalla.
// `badge`: texto del badge de las tarjetas con stock (sin stock siempre dice "Sin stock por hoy").
export const CATEGORIES: { id: Category; title: string; neon?: readonly string[]; hideTitle?: boolean; badge?: string }[] = [
  { id: "pasteleria", title: "Pastelería", hideTitle: true },
  { id: "a_pedido", title: "Tortas a pedido", hideTitle: true, badge: "Torta a pedido" },
  { id: "acompanar", title: "Para acompañar", neon: ["¿Sin bebida para acompañar el postre?", "Elegí tu favorita"] },
];

export type Zone = {
  type: "Feature";
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
  properties: { id: string; name: string; tone: number; label: [number, number] };
};
export type Zones = { type: "FeatureCollection"; features: Zone[] };

// Formato internacional sin "+" ni el 0 local (097 905 849 → 59897905849), como pide wa.me.
const WHATSAPP_NUMBER = "59897905849";
export const whatsappUrl = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const INSTAGRAM_URL = "https://www.instagram.com/merece.singluten/";

// Server-side: el navegador usa el rewrite de /api (next.config.ts).
const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Los cambios del admin invalidan la caché al instante (app/revalidate/route.ts); esto es solo la red de seguridad.
const SAFETY_REVALIDATE = 3600;

export async function getProducts(): Promise<Product[] | null> {
  try {
    const res = await fetch(`${API_URL}/api/products`, { next: { revalidate: SAFETY_REVALIDATE, tags: ["products"] } });
    return res.ok ? ((await res.json()) as Product[]) : null;
  } catch {
    return null;
  }
}

export async function getZones(): Promise<Zones | null> {
  try {
    const res = await fetch(`${API_URL}/api/barrios`, { next: { revalidate: SAFETY_REVALIDATE, tags: ["zones"] } });
    return res.ok ? ((await res.json()) as Zones) : null;
  } catch {
    return null;
  }
}

export const formatPriceLabel = (price: number | null) => (price === null ? "Consultar" : `$ ${formatPrice(price)}`);
