"use client";

import Image from "next/image";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { shippingFor } from "@/components/cart/shipping";
import { buttonClass } from "@/components/Button";
import { Bike, Cart, Close, Cup, Store, Trash, WhatsApp } from "@/components/icons";
import { whatsappUrl, type Product, type Zone } from "@/lib/api";
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

/** 6 mini cookies + Cappu: cappuccino fijo; solo eligen leche. */
export function productIsCookiesCappuCombo(p: Product) {
  return /cookie/i.test(p.name) && /cappu/i.test(p.name);
}

export function productIsAmericano(p: Product) {
  return /americano/i.test(p.name);
}

/** Combos donde eligen el café. No incluye combos con cappu fijo. */
export function productIsCoffeeCombo(p: Product) {
  if (productIsRollCappuCombo(p) || productIsCookiesCappuCombo(p)) return false;
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

  const barrioName = barrios.find((b) => b.id === barrioId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-foreground/40" aria-label="Cerrar pedido" onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-background shadow-2xl" aria-label="Mi pedido">
        <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3">
          <h2 className="font-display text-xl leading-none">Pedido {count > 0 ? `(${count})` : ""}</h2>
          <div className="flex items-center gap-2">
            {lines.length > 0 && (
              <button type="button" className="px-1 text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={clear}>
                Vaciar
              </button>
            )}
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted" aria-label="Cerrar" onClick={() => setOpen(false)}>
              <Close className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Vacío</p>
          ) : (
            <div className="flex flex-col gap-4">
              <ul className="divide-y divide-foreground/10 rounded-2xl border border-foreground/10 bg-card">
                {lines.map((l) => {
                  const lineTotal = l.product.price === null ? null : l.product.price * l.qty;
                  return (
                    <li key={l.key} className="p-2.5">
                      <div className="flex gap-2.5">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted text-muted-foreground">
                          {l.product.imageUrl ? (
                            <Image src={l.product.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <Cup className="absolute inset-0 m-auto h-5 w-5 opacity-50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold leading-snug">{l.product.name}</p>
                              {lineExtras(l).length > 0 && (
                                <p className="mt-0.5 text-xs text-muted-foreground">{lineExtras(l).join(" · ")}</p>
                              )}
                            </div>
                            <p className="shrink-0 text-sm font-bold tabular-nums">
                              {lineTotal === null ? "—" : `$ ${formatPrice(lineTotal)}`}
                            </p>
                          </div>
                          {l.milk && (
                            <label className="mt-1.5 block">
                              <span className="sr-only">Leche</span>
                              <select
                                className="w-full rounded-lg border border-foreground/15 bg-background px-2 py-1 text-xs font-bold"
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
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <label className="min-w-0 flex-1">
                                <span className="sr-only">Glaseado</span>
                                <select
                                  className="w-full rounded-lg border border-foreground/15 bg-background px-2 py-1 text-xs font-bold"
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
                              <label className="inline-flex items-center gap-1.5 text-xs font-bold">
                                <span>{l.warm ? "Caliente" : "Frío"}</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={!!l.warm}
                                  onClick={() => setRollsOpts(l.key, { glaze: l.glaze!, warm: !l.warm })}
                                  className={`relative h-5 w-8 shrink-0 rounded-full transition-colors ${l.warm ? "bg-accent" : "bg-foreground/20"}`}
                                >
                                  <span
                                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${l.warm ? "translate-x-3" : ""}`}
                                  />
                                </button>
                              </label>
                            </div>
                          )}
                          {l.temp && (
                            <label className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold">
                              <span>{l.temp === "Fría" ? "Frío" : "Caliente"}</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={l.temp === "Fría"}
                                onClick={() => setTemp(l.key, l.temp === "Fría" ? "Caliente" : "Fría")}
                                className={`relative h-5 w-8 shrink-0 rounded-full transition-colors ${l.temp === "Fría" ? "bg-accent" : "bg-foreground/20"}`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${l.temp === "Fría" ? "translate-x-3" : ""}`}
                                />
                              </button>
                            </label>
                          )}
                          <div className="mt-1.5 inline-flex items-center rounded-full border border-foreground/15 bg-background">
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                              onClick={() => (l.qty <= 1 ? remove(l.key) : setQty(l.key, l.qty - 1))}
                              aria-label={l.qty <= 1 ? "Quitar" : "Menos"}
                            >
                              {l.qty <= 1 ? <Trash /> : "−"}
                            </button>
                            <span className="min-w-5 text-center text-xs font-bold">{l.qty}</span>
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center text-sm font-bold"
                              onClick={() => setQty(l.key, l.qty + 1)}
                              aria-label="Más"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div>
                <div className="inline-flex w-full rounded-xl border border-foreground/15 p-0.5">
                  <button
                    type="button"
                    onClick={() => setFulfillment("retiro")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
                      fulfillment === "retiro" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Retiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment("envio")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
                      fulfillment === "envio" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Bike className="h-4 w-4" />
                    Envío
                  </button>
                </div>

                {fulfillment === "envio" && (
                  <label className="mt-2 block">
                    <span className="sr-only">Barrio</span>
                    <select
                      className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-bold"
                      value={barrioId}
                      onChange={(e) => setBarrioId(e.target.value)}
                      required
                    >
                      <option value="">Barrio…</option>
                      {barrios.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-foreground/10 px-4 py-3">
          {showMoney && (
            <div className="mb-2 space-y-0.5 text-sm">
              <p className="flex justify-between gap-3 text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">$ {formatPrice(subtotal)}</span>
              </p>
              <p className="flex justify-between gap-3 text-muted-foreground">
                <span>{fulfillment === "retiro" ? "Envío" : barrioName ?? "Envío"}</span>
                <span className="tabular-nums">
                  {fulfillment === "retiro" ? "Gratis" : shipCost !== null ? `$ ${formatPrice(shipCost)}` : "—"}
                </span>
              </p>
              {total !== null && (
                <p className="flex justify-between gap-3 pt-0.5 font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">$ {formatPrice(total)}</span>
                </p>
              )}
            </div>
          )}
          {canSend ? (
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass("primary")} !min-h-11 w-full`}
              onClick={() => setOpen(false)}
            >
              <WhatsApp /> WhatsApp
            </a>
          ) : (
            <button type="button" className={`${buttonClass("primary")} !min-h-11 w-full`} disabled>
              <WhatsApp /> {lines.length === 0 ? "Vacío" : fulfillment === "envio" ? "Elegí barrio" : "Vacío"}
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
