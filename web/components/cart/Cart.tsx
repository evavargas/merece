"use client";

import Image from "next/image";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { shippingFor } from "@/components/cart/shipping";
import { buttonClass } from "@/components/Button";
import { Bike, Cart, Cup, Store, Trash, WhatsApp } from "@/components/icons";
import { formatPriceLabel, whatsappUrl, type Product, type Zone } from "@/lib/api";
import { formatPrice } from "@/lib/price";

export const MILK_OPTIONS = ["Leche entera", "Deslactosada", "Vegetal (avena)"] as const;
export type MilkOption = (typeof MILK_OPTIONS)[number];
export const GLAZE_OPTIONS = ["Con glaseado", "Sin glaseado"] as const;
export type GlazeOption = (typeof GLAZE_OPTIONS)[number];
export const COFFEE_OPTIONS = ["Espresso", "Americano", "Cappuccino", "Flat white", "Iced latte"] as const;
export type CoffeeOption = (typeof COFFEE_OPTIONS)[number];
export type DrinkTemp = "Caliente" | "Fría";
export type RollsOpts = { glaze: GlazeOption; warm: boolean };
export type CartOpts = { milk?: MilkOption; glaze?: GlazeOption; warm?: boolean; temp?: DrinkTemp; coffee?: CoffeeOption };
export type Fulfillment = "retiro" | "envio";

export type CartLine = { key: string; product: Product; qty: number } & CartOpts;

type BarrioOpt = { id: string; name: string; shipping: number | null };

type CartApi = {
  lines: CartLine[];
  count: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, opts?: CartOpts) => void;
  setQty: (key: string, qty: number) => void;
  setMilk: (key: string, milk: MilkOption) => void;
  setRollsOpts: (key: string, opts: RollsOpts) => void;
  setTemp: (key: string, temp: DrinkTemp) => void;
  remove: (key: string) => void;
  clear: () => void;
  fulfillment: Fulfillment;
  setFulfillment: (v: Fulfillment) => void;
  barrioId: string;
  setBarrioId: (id: string) => void;
  barrios: BarrioOpt[];
  shipping: number | null;
  orderUrl: string;
  canSend: boolean;
};

const Ctx = createContext<CartApi | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fuera de CartProvider");
  return c;
}

export function productUsesMilk(p: Product) {
  return /leche|latte|cappuccino|capuchino|flat\s*white/i.test(`${p.name} ${p.description ?? ""}`);
}

export function coffeeUsesMilk(coffee: CoffeeOption) {
  return /cappuccino|flat white|iced latte/i.test(coffee);
}

export function coffeeIsAmericano(coffee: CoffeeOption) {
  return coffee === "Americano";
}

export function productIsRolls(p: Product) {
  return /\brolls?\b/i.test(`${p.name} ${p.description ?? ""}`);
}

/** Combo Roll + Cappu: cappuccino fijo caliente; solo se customiza el roll (+ leche). */
export function productIsRollCappuCombo(p: Product) {
  return /\broll/i.test(p.name) && /cappu/i.test(p.name);
}

export function productIsAmericano(p: Product) {
  return /americano/i.test(p.name);
}

/** Combos donde eligen el café (ej. Mini cookies + Café). No incluye Roll + Cappu. */
export function productIsCoffeeCombo(p: Product) {
  if (productIsRollCappuCombo(p)) return false;
  const n = `${p.name} ${p.description ?? ""}`;
  return (/^combo\b/i.test(p.name.trim()) || /\+\s*café$/i.test(p.name.trim())) && /café|coffee/i.test(n);
}

function lineKey(productId: string, opts?: CartOpts) {
  const parts = [productId];
  if (opts?.coffee) parts.push(opts.coffee);
  if (opts?.milk) parts.push(opts.milk);
  if (opts?.glaze) parts.push(opts.glaze);
  if (opts?.warm) parts.push("caliente");
  if (opts?.temp) parts.push(opts.temp);
  return parts.join("::");
}

function lineExtras(l: CartLine) {
  const bits: string[] = [];
  if (l.coffee) bits.push(l.coffee);
  if (l.milk) bits.push(l.milk);
  if (l.glaze) bits.push(l.glaze);
  if (l.glaze) bits.push(l.warm ? "roll caliente" : "roll frío");
  if (l.temp) bits.push(l.temp === "Fría" ? "café frío" : "café caliente");
  return bits;
}

function buildMessage(
  lines: CartLine[],
  fulfillment: Fulfillment,
  barrio: BarrioOpt | undefined,
  shipping: number | null,
) {
  if (lines.length === 0) {
    return "Hola Merece! Quiero hacer un pedido.\nPago por transferencia.";
  }
  const rows = lines.map((l) => {
    const price = l.product.price === null ? "Consultar" : `$ ${formatPrice(l.product.price)}`;
    const extras = lineExtras(l);
    const opts = extras.length ? ` · ${extras.join(" · ")}` : "";
    const advance = l.product.category === "a_pedido" ? " · torta a pedido, +48 hs" : "";
    return `${l.qty} × ${l.product.name} (${price})${opts}${advance}`;
  });
  const priced = lines.filter((l) => l.product.price !== null);
  const subtotal = priced.reduce((s, l) => s + (l.product.price as number) * l.qty, 0);
  const subtotalLine = priced.length === lines.length ? `\nSubtotal $ ${formatPrice(subtotal)}` : "";

  let fulfillLine = "";
  let totalLine = "";
  if (fulfillment === "retiro") {
    fulfillLine = "\nRetiro: a coordinar · sin costo";
    if (priced.length === lines.length) totalLine = `\nTotal estimado $ ${formatPrice(subtotal)}`;
  } else if (barrio && shipping !== null) {
    fulfillLine = `\nEnvío a ${barrio.name}: ~$ ${formatPrice(shipping)} (estimado)`;
    if (priced.length === lines.length) totalLine = `\nTotal estimado $ ${formatPrice(subtotal + shipping)}`;
  } else if (barrio) {
    fulfillLine = `\nEnvío a ${barrio.name}: a coordinar`;
  } else {
    fulfillLine = "\nEnvío: (elegí tu barrio)";
  }

  const hasCake = lines.some((l) => l.product.category === "a_pedido");
  const cakeNote = hasCake ? "\nAcepto el mínimo de 48 horas de anticipación para tortas a pedido." : "";
  return `Hola Merece! Quiero hacer este pedido:\n${rows.join("\n")}${subtotalLine}${fulfillLine}${totalLine}\nPago por transferencia.${cakeNote}`;
}

function SectionTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-wide">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[12px] text-background">{n}</span>
      {children}
    </h3>
  );
}

export function CartProvider({ children, zones }: { children: ReactNode; zones: Zone[] }) {
  const barrios = useMemo(
    () =>
      [...zones]
        .map((z) => ({ id: z.properties.id, name: z.properties.name, shipping: z.properties.shipping }))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [zones],
  );
  const shippingById = useMemo(
    () => Object.fromEntries(barrios.map((b) => [b.id, b.shipping])),
    [barrios],
  );

  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("envio");
  const [barrioId, setBarrioId] = useState("");

  const api = useMemo<CartApi>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const shipping = fulfillment === "envio" ? shippingFor(barrioId || null, shippingById) : 0;
    const barrio = barrios.find((b) => b.id === barrioId);
    const canSend = lines.length > 0 && (fulfillment === "retiro" || !!barrioId);
    return {
      lines,
      count,
      open,
      setOpen,
      fulfillment,
      setFulfillment,
      barrios,
      barrioId,
      setBarrioId,
      shipping,
      canSend,
      orderUrl: whatsappUrl(buildMessage(lines, fulfillment, barrio, shipping)),
      add: (p, opts) => {
        const key = lineKey(p.id, opts);
        setLines((prev) => {
          const i = prev.findIndex((l) => l.key === key);
          if (i >= 0) {
            const next = [...prev];
            next[i] = { ...next[i], qty: next[i].qty + 1 };
            return next;
          }
          return [...prev, { key, product: p, qty: 1, ...opts }];
        });
        setOpen(true);
      },
      setQty: (key, qty) => {
        setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))));
      },
      setMilk: (key, milk) => {
        setLines((prev) => {
          const line = prev.find((l) => l.key === key);
          if (!line) return prev;
          const opts = { milk };
          const nextKey = lineKey(line.product.id, opts);
          const without = prev.filter((l) => l.key !== key);
          const existing = without.find((l) => l.key === nextKey);
          if (existing) {
            return without.map((l) => (l.key === nextKey ? { ...l, qty: l.qty + line.qty } : l));
          }
          return [...without, { ...line, key: nextKey, milk, glaze: undefined, warm: undefined }];
        });
      },
      setRollsOpts: (key, opts) => {
        setLines((prev) => {
          const line = prev.find((l) => l.key === key);
          if (!line) return prev;
          const nextKey = lineKey(line.product.id, opts);
          const without = prev.filter((l) => l.key !== key);
          const existing = without.find((l) => l.key === nextKey);
          if (existing) {
            return without.map((l) => (l.key === nextKey ? { ...l, qty: l.qty + line.qty } : l));
          }
          return [...without, { ...line, key: nextKey, glaze: opts.glaze, warm: opts.warm, milk: undefined }];
        });
      },
      setTemp: (key, temp) => {
        setLines((prev) => {
          const line = prev.find((l) => l.key === key);
          if (!line) return prev;
          const opts = { temp };
          const nextKey = lineKey(line.product.id, opts);
          const without = prev.filter((l) => l.key !== key);
          const existing = without.find((l) => l.key === nextKey);
          if (existing) {
            return without.map((l) => (l.key === nextKey ? { ...l, qty: l.qty + line.qty } : l));
          }
          return [...without, { ...line, key: nextKey, temp, milk: undefined, glaze: undefined, warm: undefined }];
        });
      },
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
    };
  }, [lines, open, barrioId, barrios, fulfillment, shippingById]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <CartPanel />
    </Ctx.Provider>
  );
}

function CartPanel() {
  const {
    open,
    setOpen,
    lines,
    count,
    setQty,
    setMilk,
    setRollsOpts,
    setTemp,
    remove,
    clear,
    orderUrl,
    barrios,
    barrioId,
    setBarrioId,
    shipping,
    canSend,
    fulfillment,
    setFulfillment,
  } = useCart();
  if (!open) return null;

  const priced = lines.filter((l) => l.product.price !== null);
  const subtotal = priced.reduce((s, l) => s + (l.product.price as number) * l.qty, 0);
  const showMoney = lines.length > 0 && priced.length === lines.length;
  const shipCost = fulfillment === "retiro" ? 0 : shipping;
  const total = showMoney && shipCost !== null ? subtotal + shipCost : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="Cerrar pedido" onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-background shadow-2xl" aria-label="Mi pedido">
        <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
          <h2 className="font-display text-2xl">Mi pedido {count > 0 ? `(${count})` : ""}</h2>
          <button type="button" className="text-sm font-bold underline-offset-2 hover:underline" onClick={() => setOpen(false)}>
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no elegiste nada. Mirás la carta y tocá “Elegir”.</p>
          ) : (
            <div className="flex flex-col gap-8">
              <section>
                <SectionTitle n={1}>Tu pedido</SectionTitle>
                <ul className="flex flex-col gap-3">
                  {lines.map((l) => {
                    const lineTotal = l.product.price === null ? null : l.product.price * l.qty;
                    return (
                      <li key={l.key} className="rounded-2xl border border-foreground/10 bg-card p-3">
                        <div className="flex gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted text-muted-foreground">
                            {l.product.imageUrl ? (
                              <Image src={l.product.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                            ) : (
                              <Cup className="absolute inset-0 m-auto h-8 w-8 opacity-50" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold leading-snug">{l.product.name}</p>
                                {lineExtras(l).length > 0 && (
                                  <p className="mt-0.5 text-sm text-muted-foreground">{lineExtras(l).join(" · ")}</p>
                                )}
                              </div>
                              <p className="shrink-0 font-bold">{lineTotal === null ? "Consultar" : `$ ${formatPrice(lineTotal)}`}</p>
                            </div>
                            {l.milk && (
                              <label className="mt-2 block text-xs">
                                <span className="sr-only">Leche</span>
                                <select
                                  className="w-full rounded-xl border border-foreground/15 bg-background px-2.5 py-1.5 font-bold"
                                  value={l.milk}
                                  onChange={(e) => setMilk(l.key, e.target.value as MilkOption)}
                                >
                                  {MILK_OPTIONS.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}
                            {l.glaze && (
                              <div className="mt-2 space-y-2">
                                <label className="block text-xs">
                                  <span className="sr-only">Glaseado</span>
                                  <select
                                    className="w-full rounded-xl border border-foreground/15 bg-background px-2.5 py-1.5 font-bold"
                                    value={l.glaze}
                                    onChange={(e) => setRollsOpts(l.key, { glaze: e.target.value as GlazeOption, warm: !!l.warm })}
                                  >
                                    {GLAZE_OPTIONS.map((g) => (
                                      <option key={g} value={g}>
                                        {g}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="flex items-center justify-between gap-2 text-xs font-bold">
                                  <span>{l.warm ? "Roll caliente" : "Roll frío"}</span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!!l.warm}
                                    onClick={() => setRollsOpts(l.key, { glaze: l.glaze!, warm: !l.warm })}
                                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${l.warm ? "bg-accent" : "bg-foreground/20"}`}
                                  >
                                    <span
                                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${l.warm ? "translate-x-4" : ""}`}
                                    />
                                  </button>
                                </label>
                              </div>
                            )}
                            {l.temp && (
                              <label className="mt-2 flex items-center justify-between gap-2 text-xs font-bold">
                                <span>{l.temp === "Fría" ? "Café frío" : "Café caliente"}</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={l.temp === "Fría"}
                                  onClick={() => setTemp(l.key, l.temp === "Fría" ? "Caliente" : "Fría")}
                                  className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${l.temp === "Fría" ? "bg-accent" : "bg-foreground/20"}`}
                                >
                                  <span
                                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${l.temp === "Fría" ? "translate-x-4" : ""}`}
                                  />
                                </button>
                              </label>
                            )}
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <div className="inline-flex items-center rounded-full border border-foreground/15 bg-background">
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                                  onClick={() => (l.qty <= 1 ? remove(l.key) : setQty(l.key, l.qty - 1))}
                                  aria-label={l.qty <= 1 ? "Quitar" : "Menos"}
                                >
                                  {l.qty <= 1 ? <Trash /> : "−"}
                                </button>
                                <span className="min-w-6 text-center text-sm font-bold">{l.qty}</span>
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-9 items-center justify-center font-bold"
                                  onClick={() => setQty(l.key, l.qty + 1)}
                                  aria-label="Más"
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground">{formatPriceLabel(l.product.price)}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <SectionTitle n={2}>¿Retirás o te lo llevamos?</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillment("retiro")}
                    className={`flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                      fulfillment === "retiro"
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/15 bg-card text-foreground hover:border-foreground/40"
                    }`}
                  >
                    <Store className="mb-1" />
                    <span className="font-bold">Retiro</span>
                    <span className={`text-xs ${fulfillment === "retiro" ? "text-background/80" : "text-muted-foreground"}`}>
                      A coordinar · sin costo
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment("envio")}
                    className={`flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                      fulfillment === "envio"
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/15 bg-card text-foreground hover:border-foreground/40"
                    }`}
                  >
                    <Bike className="mb-1" />
                    <span className="font-bold">Envío</span>
                    <span className={`text-xs ${fulfillment === "envio" ? "text-background/80" : "text-muted-foreground"}`}>
                      Según barrio
                    </span>
                  </button>
                </div>

                {fulfillment === "envio" && (
                  <label className="mt-4 block text-sm">
                    <span className="font-bold">Barrio</span>
                    <select
                      className="mt-1.5 w-full rounded-2xl border-2 border-foreground/15 bg-background px-3 py-3 font-bold"
                      value={barrioId}
                      onChange={(e) => setBarrioId(e.target.value)}
                      required
                    >
                      <option value="">Elegí tu barrio…</option>
                      {barrios.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                          {b.shipping !== null ? ` · $ ${formatPrice(b.shipping)}` : ""}
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 block text-xs text-muted-foreground">
                      ¿Otra zona? Escribinos por WhatsApp.
                    </span>
                  </label>
                )}
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-foreground/10 px-5 py-4">
          {showMoney && (
            <div className="mb-3 space-y-1 text-sm">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold">$ {formatPrice(subtotal)}</span>
              </p>
              <p className="flex justify-between text-muted-foreground">
                <span>{fulfillment === "retiro" ? "Retiro" : "Envío (est.)"}</span>
                <span>
                  {fulfillment === "retiro"
                    ? "Sin costo"
                    : shipCost !== null
                      ? `$ ${formatPrice(shipCost)}`
                      : "Elegí barrio"}
                </span>
              </p>
              {total !== null && (
                <p className="flex justify-between text-lg font-bold">
                  <span>Total estimado</span>
                  <span>$ {formatPrice(total)}</span>
                </p>
              )}
            </div>
          )}
          {canSend ? (
            <a href={orderUrl} target="_blank" rel="noopener noreferrer" className={`${buttonClass("primary")} w-full`} onClick={() => setOpen(false)}>
              <WhatsApp /> Enviar pedido por WhatsApp
            </a>
          ) : (
            <button type="button" className={`${buttonClass("primary")} w-full`} disabled>
              <WhatsApp /> {lines.length === 0 ? "Elegí productos" : fulfillment === "envio" ? "Elegí tu barrio" : "Agregá productos"}
            </button>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">Pago por transferencia · te pasamos los datos por WhatsApp</p>
          {lines.length > 0 && (
            <button type="button" className="mt-3 w-full text-sm underline" onClick={clear}>
              Vaciar pedido
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

export function CartButton({ className = "" }: { className?: string }) {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count ? `Mi pedido, ${count} productos` : "Mi pedido"}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-muted ${className}`}
    >
      <Cart />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight px-1 text-[11px] font-bold text-on-color">
          {count}
        </span>
      )}
    </button>
  );
}
