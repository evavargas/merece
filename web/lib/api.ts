import { formatPrice } from "./price";

export type Category = "pasteleria" | "a_pedido" | "acompanar" | "combos";

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
// `neonTone`: color del cartel (por defecto lavanda).
// `neonRuled`: cartel lavanda con líneas a los costados (puede ir debajo de un neon highlight).
// `hideTitle`: sin etiqueta visible; el título queda solo para lectores de pantalla.
// El orden de la lista es el orden de la carta.
export const CATEGORIES: {
  id: Category;
  title: string;
  neon?: readonly string[];
  neonTone?: "highlight" | "accent";
  neonRuled?: readonly string[];
  hideTitle?: boolean;
}[] = [
  { id: "combos", title: "Combos", neon: ["Combos"], neonTone: "accent" },
  { id: "pasteleria", title: "Postres", neon: ["Deli merecidos"], neonTone: "accent" },
  { id: "acompanar", title: "Para acompañar", neon: ["¿Sin bebida para acompañar el postre?", "Elegí tu bebida favorita"], neonTone: "accent" },
  {
    id: "a_pedido",
    title: "Tortas a pedido",
    neon: ["Vos pedí y te lo preparamos"],
    neonTone: "highlight",
    neonRuled: ["48 hs de anticipación"],
  },
];

export type Zone = {
  type: "Feature";
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
  properties: { id: string; name: string; tone: number; label: [number, number]; shipping: number | null };
};
export type Zones = { type: "FeatureCollection"; features: Zone[] };

// Formato internacional sin "+" ni el 0 local (097 625 315 → 59897625315), como pide wa.me.
export const WHATSAPP_NUMBER = "59897625315";
export const whatsappUrl = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// Mensaje corto al pedir un producto (siempre con número en el link: evita el bug de mandar a "elegí un chat").
export function productOrderMessage(name: string, price: number | null, soldOut = false) {
  if (soldOut) return `Hola Merece! Quería consultar por: ${name}`;
  const priceBit = price === null ? "" : ` (${formatPriceLabel(price)})`;
  return `Hola Merece! Quiero pedir: ${name}${priceBit}\nDelivery en Montevideo · Pago por transferencia.`;
}

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

// Combos: categoría DB `combos`, nombre "Combo …", o "… + Café".
export function isComboProduct(p: Pick<Product, "name" | "category">) {
  const n = p.name.trim();
  return p.category === "combos" || /^combo\b/i.test(n) || /\+\s*café$/i.test(n) || /\+\s*cappu/i.test(n);
}

export function productsInCategory(products: Product[], cat: Category) {
  if (cat === "combos") return products.filter(isComboProduct);
  if (cat === "pasteleria") return products.filter((p) => p.category === "pasteleria" && !isComboProduct(p));
  return products.filter((p) => p.category === cat);
}
