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

export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: "pasteleria", title: "Pastelería", blurb: "Lo clásico de todos los días." },
  { id: "a_pedido", title: "Tortas a pedido", blurb: "Pedilas con anticipación." },
  { id: "acompanar", title: "Para acompañar", blurb: "Para armar la merienda completa." },
];

export const INSTAGRAM_URL = "https://www.instagram.com/merece.singluten/";

// Server-side: el navegador usa el rewrite de /api (next.config.ts).
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getProducts(): Promise<Product[] | null> {
  try {
    const res = await fetch(`${API_URL}/api/products`, { next: { revalidate: 30 } });
    return res.ok ? ((await res.json()) as Product[]) : null;
  } catch {
    return null;
  }
}

export const formatPriceLabel = (price: number | null) => (price === null ? "Consultar" : `$ ${formatPrice(price)}`);
