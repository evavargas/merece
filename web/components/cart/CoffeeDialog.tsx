"use client";

import { useState } from "react";
import { COFFEE_OPTIONS, type CoffeeOption } from "@/components/cart/Cart";
import { buttonClass } from "@/components/Button";

export function CoffeeDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: (coffee: CoffeeOption) => void;
}) {
  const [coffee, setCoffee] = useState<CoffeeOption>("Cappuccino");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/45" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coffee-title"
        className="relative w-full max-w-sm rounded-[28px] border-2 border-foreground bg-background p-6 text-center shadow-2xl"
      >
        <p className="font-hand text-xl uppercase tracking-[0.1em] text-accent">Elegí tu café</p>
        <h2 id="coffee-title" className="font-display mt-2 text-3xl leading-tight">
          {name}
        </h2>
        <fieldset className="mt-5 space-y-2 text-left">
          <legend className="sr-only">Café</legend>
          {COFFEE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                coffee === opt ? "border-accent bg-accent/15" : "border-foreground/15 hover:border-foreground/40"
              }`}
            >
              <input type="radio" name="coffee" value={opt} checked={coffee === opt} onChange={() => setCoffee(opt)} className="accent-[var(--accent)]" />
              {opt}
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={() => onConfirm(coffee)}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
