import Image from "next/image";
import { CATEGORIES, formatPriceLabel, type Product } from "@/lib/api";
import { Cup } from "./icons";

function ProductCard({ p, tone }: { p: Product; tone: "accent" | "highlight" }) {
  const soldOut = p.stock === 0;
  return (
    <li className={`flex flex-col overflow-hidden rounded-3xl bg-card ${soldOut ? "text-muted-foreground" : "text-foreground"}`}>
      <div className={`relative aspect-[4/3] ${soldOut ? "bg-muted grayscale" : tone === "accent" ? "bg-accent" : "bg-highlight"} text-on-color`}>
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw" className="object-cover" />
        ) : (
          <Cup className="absolute inset-0 m-auto h-20 w-20 opacity-60" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={`text-lg font-bold leading-snug ${soldOut ? "line-through decoration-2" : ""}`}>{p.name}</h3>
          <span className="whitespace-nowrap font-bold">{formatPriceLabel(p.price)}</span>
        </div>
        {p.description && <p className="text-sm">{p.description}</p>}
        <span
          className={`mt-3 inline-flex w-fit rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
            soldOut ? "bg-muted text-muted-foreground" : "bg-accent text-on-color"
          }`}
        >
          {soldOut ? "Sin stock por hoy" : "Disponible"}
        </span>
      </div>
    </li>
  );
}

export function Menu({ products }: { products: Product[] | null }) {
  if (!products) {
    return <p className="text-center">No pudimos cargar la carta ahora. Escribinos por Instagram y te contamos qué hay.</p>;
  }
  return (
    <div className="flex flex-col gap-16">
      {CATEGORIES.map((cat, i) => {
        const items = products.filter((p) => p.category === cat.id);
        if (items.length === 0) return null;
        const tone = i % 2 === 0 ? "accent" : "highlight";
        return (
          <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
              <h3
                id={`cat-${cat.id}`}
                className={`inline-flex min-h-9 items-center rounded-full px-5 text-sm font-bold uppercase tracking-widest text-on-color ${
                  tone === "accent" ? "bg-accent" : "bg-highlight"
                }`}
              >
                {cat.title}
              </h3>
              <span className="text-sm opacity-80">{cat.blurb}</span>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} p={p} tone={tone} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
