"use client";

import Image from "next/image";
import { useState } from "react";
import {
  coffeeIsAmericano,
  coffeeUsesMilk,
  productIsAmericano,
  productIsCoffeeCombo,
  productIsRollCappuCombo,
  productIsRolls,
  productUsesMilk,
  useCart,
  type CartOpts,
  type CoffeeOption,
} from "@/components/cart/Cart";
import { AmericanoDialog } from "@/components/cart/AmericanoDialog";
import { CoffeeDialog } from "@/components/cart/CoffeeDialog";
import { MilkDialog } from "@/components/cart/MilkDialog";
import { RollsDialog } from "@/components/cart/RollsDialog";
import { buttonClass } from "@/components/Button";
import { Cup } from "@/components/icons";
import { NeonSign } from "@/components/NeonSign";
import { CATEGORIES, formatPriceLabel, productsInCategory, whatsappUrl, type Product } from "@/lib/api";

function AdvanceNoticeDialog({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/45" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="advance-title"
        className="relative w-full max-w-sm rounded-[28px] border-2 border-foreground bg-background p-6 text-center shadow-2xl"
      >
        <p className="font-hand text-xl uppercase tracking-[0.1em] text-highlight">Torta a pedido</p>
        <h2 id="advance-title" className="font-display mt-2 text-3xl leading-tight">
          {name}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed">
          Las tortas a pedido requieren un mínimo de <b>48 horas de anticipación</b>. ¿Estás de acuerdo y la agregamos a tu pedido?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`${buttonClass("highlight")} w-full sm:w-auto`} onClick={onConfirm}>
            Sí, agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ p, needsAdvance }: { p: Product; needsAdvance: boolean }) {
  const { add } = useCart();
  const [askAdvance, setAskAdvance] = useState(false);
  const [askMilk, setAskMilk] = useState(false);
  const [askRolls, setAskRolls] = useState(false);
  const [askAmericano, setAskAmericano] = useState(false);
  const [askCoffee, setAskCoffee] = useState(false);
  const [pendingOpts, setPendingOpts] = useState<CartOpts>({});
  const soldOut = p.stock === 0;
  const withMilk = productUsesMilk(p);
  const isRolls = productIsRolls(p);
  const isRollCappu = productIsRollCappuCombo(p);
  const isAmericano = productIsAmericano(p);
  const isCoffeeCombo = productIsCoffeeCombo(p);

  const resetDialogs = () => {
    setAskAdvance(false);
    setAskMilk(false);
    setAskRolls(false);
    setAskAmericano(false);
    setAskCoffee(false);
    setPendingOpts({});
  };

  const tryAdd = () => {
    if (needsAdvance) setAskAdvance(true);
    else if (isRolls || isRollCappu) setAskRolls(true);
    else if (isCoffeeCombo) setAskCoffee(true);
    else if (isAmericano) setAskAmericano(true);
    else if (withMilk) setAskMilk(true);
    else add(p);
  };

  const confirmAdd = (opts?: CartOpts) => {
    resetDialogs();
    add(p, opts);
  };

  const afterCoffee = (opts: CartOpts, coffee: CoffeeOption) => {
    const next = { ...opts, coffee };
    if (coffeeIsAmericano(coffee)) {
      setPendingOpts(next);
      setAskAmericano(true);
      return;
    }
    if (coffeeUsesMilk(coffee)) {
      setPendingOpts(next);
      setAskMilk(true);
      return;
    }
    confirmAdd(next);
  };

  const confirmRolls = (opts: CartOpts) => {
    setAskRolls(false);
    // Roll + Cappu: cappuccino fijo caliente; solo eligen leche.
    if (isRollCappu) {
      setPendingOpts({ ...opts, coffee: "Cappuccino" });
      setAskMilk(true);
      return;
    }
    if (isCoffeeCombo) {
      setPendingOpts(opts);
      setAskCoffee(true);
      return;
    }
    if (withMilk) {
      setPendingOpts(opts);
      setAskMilk(true);
      return;
    }
    confirmAdd(opts);
  };

  const confirmCoffee = (coffee: CoffeeOption) => {
    setAskCoffee(false);
    afterCoffee(pendingOpts, coffee);
  };

  return (
    <li className={`flex flex-col overflow-hidden rounded-3xl bg-card ${soldOut ? "text-muted-foreground" : "text-foreground"}`}>
      <div className={`relative aspect-[4/3] ${soldOut ? "bg-muted grayscale" : "bg-highlight"} text-on-color`}>
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw" className="object-cover" />
        ) : (
          <Cup className="absolute inset-0 m-auto h-20 w-20 opacity-60" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={`font-display text-xl leading-snug ${soldOut ? "line-through decoration-2" : ""}`}>{p.name}</h3>
          <span className="whitespace-nowrap text-sm font-bold tabular-nums">{formatPriceLabel(p.price)}</span>
        </div>
        {p.description && <p className="text-sm whitespace-pre-line">{p.description}</p>}
        {soldOut && (
          <span className="mt-3 inline-flex w-fit rounded-full bg-muted px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Sin stock por hoy
          </span>
        )}
        {needsAdvance && !soldOut && <p className="mt-2 text-xs font-bold text-accent">24 cm, 12 porciones</p>}
        <div className="mt-auto pt-4">
          {soldOut ? (
            <a
              href={whatsappUrl(`Hola Merece! Quería consultar por: ${p.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass("outline")} !min-h-11 w-full`}
            >
              Consultar
            </a>
          ) : (
            <button type="button" onClick={tryAdd} className={`${buttonClass("accent")} !min-h-11 w-full`}>
              Elegir
            </button>
          )}
        </div>
      </div>
      {askAdvance && <AdvanceNoticeDialog name={p.name} onCancel={() => setAskAdvance(false)} onConfirm={() => confirmAdd()} />}
      {askCoffee && (
        <CoffeeDialog
          name={p.name}
          onCancel={() => {
            setAskCoffee(false);
            setPendingOpts({});
          }}
          onConfirm={confirmCoffee}
        />
      )}
      {askMilk && (
        <MilkDialog
          name={pendingOpts.coffee ?? p.name}
          onCancel={() => {
            setAskMilk(false);
            setPendingOpts({});
          }}
          onConfirm={(milk) => confirmAdd({ ...pendingOpts, milk })}
        />
      )}
      {askRolls && (
        <RollsDialog
          name={p.name}
          continueLabel={isRollCappu || isCoffeeCombo ? "Continuar" : "Agregar"}
          onCancel={() => setAskRolls(false)}
          onConfirm={confirmRolls}
        />
      )}
      {askAmericano && (
        <AmericanoDialog
          context={p.name}
          onCancel={() => {
            setAskAmericano(false);
            setPendingOpts({});
          }}
          onConfirm={(temp) => confirmAdd({ ...pendingOpts, temp })}
        />
      )}
    </li>
  );
}

function RuledNeon({ phrases }: { phrases: readonly string[] }) {
  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <span
        aria-hidden="true"
        className="h-px min-w-6 flex-1 bg-accent/45 shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_55%,transparent)]"
      />
      <div className="min-w-0 max-w-[min(100%,20rem)] sm:max-w-md">
        <NeonSign
          phrases={phrases}
          tone="accent"
          shrinkLong={false}
          className="font-hand py-2 text-center text-[clamp(2rem,6vw,3.25rem)] leading-[1.05]"
        />
      </div>
      <span
        aria-hidden="true"
        className="h-px min-w-6 flex-1 bg-accent/45 shadow-[0_0_8px_color-mix(in_srgb,var(--accent)_55%,transparent)]"
      />
    </div>
  );
}

export function Menu({ products }: { products: Product[] | null }) {
  if (!products) {
    return <p className="text-center">No pudimos cargar la carta ahora. Escribinos por WhatsApp y te contamos qué hay.</p>;
  }
  return (
    <div className="flex flex-col gap-16">
      {CATEGORIES.map((cat) => {
        const items = productsInCategory(products, cat.id);
        if (items.length === 0) return null;
        const needsAdvance = cat.id === "a_pedido";
        const isHighlight = (cat.neonTone ?? "accent") === "highlight";
        return (
          <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
            {cat.neon ? (
              <div className="mb-8 flex flex-col gap-6">
                <h3 id={`cat-${cat.id}`} className="sr-only">
                  {cat.title}
                </h3>
                {isHighlight ? (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <NeonSign
                      phrases={cat.neon}
                      tone="highlight"
                      shrinkLong={false}
                      className="font-hand mb-2 py-2 text-[clamp(2.75rem,11vw,5.5rem)] leading-[1.05]"
                    />
                  </div>
                ) : (
                  <RuledNeon phrases={cat.neon} />
                )}
                {cat.neonRuled && <RuledNeon phrases={cat.neonRuled} />}
              </div>
            ) : cat.hideTitle ? (
              <h3 id={`cat-${cat.id}`} className="sr-only">
                {cat.title}
              </h3>
            ) : (
              <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
                <h3
                  id={`cat-${cat.id}`}
                  className="inline-flex min-h-9 items-center rounded-full bg-highlight px-5 text-sm font-bold uppercase tracking-widest text-on-color"
                >
                  {cat.title}
                </h3>
              </div>
            )}
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} p={p} needsAdvance={needsAdvance} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
