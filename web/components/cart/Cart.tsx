"use client";

import Image from "next/image";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { shippingFor } from "@/components/cart/shipping";
import { buttonClass } from "@/components/Button";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { OptionSelect } from "@/components/ui/select";
import { Bike, Cart, Close, Cup, Store, Trash, WhatsApp } from "@/components/icons";
import { whatsappUrl, type Product, type Zone } from "@/lib/api";
import { MILK_OPTIONS, GLAZE_OPTIONS, type CartOpts, type DrinkTemp, type Fulfillment, type GlazeOption, type MilkOption, type RollsOpts } from "@/lib/cart-options";
import { t } from "@/lib/i18n";
import { buildOrderMessage, lineExtras } from "@/lib/order-message";
import { formatPrice } from "@/lib/price";

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
  if (opts?.warm) parts.push("warm");
  if (opts?.temp) parts.push(opts.temp);
  return parts.join("::");
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
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [barrioId, setBarrioId] = useState("");

  const api = useMemo<CartApi>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const shipping = fulfillment === "delivery" ? shippingFor(barrioId || null, shippingById) : 0;
    const barrio = barrios.find((b) => b.id === barrioId);
    const canSend = lines.length > 0 && (fulfillment === "pickup" || !!barrioId);
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
      orderUrl: whatsappUrl(buildOrderMessage(lines, fulfillment, barrio, shipping)),
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
  const shipCost = fulfillment === "pickup" ? 0 : shipping;
  const total = showMoney && shipCost !== null ? subtotal + shipCost : null;

  const barrioName = barrios.find((b) => b.id === barrioId)?.name;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-[var(--scrim)]" aria-label={t("cart.closeOrderAria")} onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-[var(--drawer)] shadow-2xl" aria-label={t("cart.ariaEmpty")}>
        <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3">
          <h2 className="text-base font-bold leading-none">{t("cart.title")} {count > 0 ? `(${count})` : ""}</h2>
          <div className="flex items-center gap-2">
            {lines.length > 0 && (
              <button type="button" className="px-1 text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={clear}>
                {t("cart.clear")}
              </button>
            )}
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted" aria-label={t("common.close")} onClick={() => setOpen(false)}>
              <Close className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="flex flex-col gap-4">
              <ul className="divide-y divide-foreground/10 card-surface rounded-xl border border-foreground/10 bg-[var(--tile-card)]">
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
                            <div className="mt-1.5">
                              <OptionSelect compact label={t("cart.milkLabel")} value={l.milk} onValueChange={(v) => setMilk(l.key, v as MilkOption)} options={MILK_OPTIONS.map((m) => ({ value: m, label: t(`milk.${m}`) }))} />
                            </div>
                          )}
                          {l.glaze && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <OptionSelect compact label={t("cart.glazeLabel")} value={l.glaze} onValueChange={(v) => setRollsOpts(l.key, { glaze: v as GlazeOption, warm: !!l.warm })} options={GLAZE_OPTIONS.map((g) => ({ value: g, label: t(`glaze.${g}`) }))} />
                              </div>
                              <label className="inline-flex items-center gap-1.5 text-xs font-bold">
                                <span>{t(l.warm ? "cart.switchHot" : "cart.switchCold")}</span>
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
                              <span>{t(l.temp === "cold" ? "cart.switchCold" : "cart.switchHot")}</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={l.temp === "cold"}
                                onClick={() => setTemp(l.key, l.temp === "cold" ? "hot" : "cold")}
                                className={`relative h-5 w-8 shrink-0 rounded-full transition-colors ${l.temp === "cold" ? "bg-accent" : "bg-foreground/20"}`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${l.temp === "cold" ? "translate-x-3" : ""}`}
                                />
                              </button>
                            </label>
                          )}
                          <div className="mt-1.5 inline-flex items-center rounded-full border border-foreground/15 bg-background">
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                              onClick={() => (l.qty <= 1 ? remove(l.key) : setQty(l.key, l.qty - 1))}
                              aria-label={l.qty <= 1 ? t("cart.qtyRemove") : t("cart.qtyLess")}
                            >
                              {l.qty <= 1 ? <Trash /> : "−"}
                            </button>
                            <span className="min-w-5 text-center text-xs font-bold">{l.qty}</span>
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center text-sm font-bold"
                              onClick={() => setQty(l.key, l.qty + 1)}
                              aria-label={t("cart.qtyMore")}
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
                    onClick={() => setFulfillment("pickup")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
                      fulfillment === "pickup" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    {t("cart.pickup")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment("delivery")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-bold transition-colors ${
                      fulfillment === "delivery" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Bike className="h-4 w-4" />
                    {t("cart.delivery")}
                  </button>
                </div>

                {fulfillment === "delivery" && (
                  <div className="mt-2">
                    <OptionSelect compact label={t("cart.zoneLabel")} placeholder={t("cart.zonePlaceholder")} value={barrioId} onValueChange={setBarrioId} options={barrios.map((b) => ({ value: b.id, label: b.name }))} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-foreground/10 px-4 py-3">
          {showMoney && (
            <div className="mb-2 space-y-0.5 text-sm">
              <p className="flex justify-between gap-3 text-muted-foreground">
                <span>{t("cart.subtotal")}</span>
                <span className="tabular-nums">$ {formatPrice(subtotal)}</span>
              </p>
              <p className="flex justify-between gap-3 text-muted-foreground">
                <span>{fulfillment === "pickup" ? t("cart.shipping") : barrioName ?? t("cart.shipping")}</span>
                <span className="tabular-nums">
                  {fulfillment === "pickup" ? t("cart.free") : shipCost !== null ? `$ ${formatPrice(shipCost)}` : "—"}
                </span>
              </p>
              {total !== null && (
                <p className="flex justify-between gap-3 pt-0.5 font-bold">
                  <span>{t("cart.total")}</span>
                  <span className="tabular-nums">$ {formatPrice(total)}</span>
                </p>
              )}
            </div>
          )}
          {lines.length === 0 ? (
            <a href="#carta" className={`${buttonClass("primary")} !min-h-11 w-full`} onClick={() => setOpen(false)}>
              {t("cart.viewProducts")}
            </a>
          ) : canSend ? (
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass("primary")} !min-h-11 w-full`}
              onClick={() => setOpen(false)}
            >
              <WhatsApp /> {t("cart.whatsapp")}
            </a>
          ) : (
            <button type="button" className={`${buttonClass("primary")} !min-h-11 w-full`} disabled>
              <WhatsApp /> {t(fulfillment === "delivery" ? "cart.pickZone" : "cart.incomplete")}
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
      aria-label={count ? t("cart.ariaCount", { count }) : t("cart.ariaEmpty")}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground transition-colors hover:bg-muted ${className}`}
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
