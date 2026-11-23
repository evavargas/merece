import { t } from "./i18n/index.ts";
import { formatPrice } from "./price";

export type Category = "combos" | "coffees" | "desserts" | "made_to_order";

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

export const CATEGORIES = [
  { id: "combos", neonTone: "accent" },
  { id: "coffees", neonTone: "accent" },
  { id: "desserts", neonTone: "accent" },
  { id: "made_to_order", neonTone: "highlight" },
] as const satisfies readonly { id: Category; neonTone: "highlight" | "accent" }[];

export type Zone = {
  type: "Feature";
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
  properties: { id: string; name: string; tone: number; label: [number, number]; shipping: number | null };
};
export type Zones = { type: "FeatureCollection"; features: Zone[] };

export const WHATSAPP_NUMBER = "59897625315";
export const whatsappUrl = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export const INSTAGRAM_URL = "https://www.instagram.com/merece.singluten/";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

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

export const formatPriceLabel = (price: number | null) => (price === null ? t("price.ask") : `$ ${formatPrice(price)}`);

export function isComboProduct(p: Pick<Product, "name" | "category">) {
  const n = p.name.trim();
  return p.category === "combos" || /^combo\b/i.test(n) || /\+\s*café$/i.test(n) || /\+\s*cappu/i.test(n);
}

export function productsInCategory(products: Product[], cat: Category) {
  if (cat === "combos") return products.filter(isComboProduct);
  if (cat === "desserts") return products.filter((p) => p.category === "desserts" && !isComboProduct(p));
  return products.filter((p) => p.category === cat);
}
