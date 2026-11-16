"use client";

import { useState } from "react";
import { MILK_OPTIONS, type MilkOption } from "@/components/cart/Cart";
import { buttonClass } from "@/components/Button";

export function MilkDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: (milk: MilkOption) => void;
}) {
  const [milk, setMilk] = useState<MilkOption>("Leche entera");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/45" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="milk-title"
        className="relative w-full max-w-sm rounded-[28px] border-2 border-foreground bg-background p-6 text-center shadow-2xl"
      >
        <p className="font-hand text-xl uppercase tracking-[0.1em] text-accent">Elegí la leche</p>
        <h2 id="milk-title" className="font-display mt-2 text-3xl leading-tight">
          {name}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed">¿Querés cambiar la leche entera por otra?</p>
        <fieldset className="mt-4 space-y-2 text-left">
          <legend className="sr-only">Tipo de leche</legend>
          {MILK_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                milk === opt ? "border-accent bg-accent/15" : "border-foreground/15 hover:border-foreground/40"
              }`}
            >
              <input type="radio" name="milk" value={opt} checked={milk === opt} onChange={() => setMilk(opt)} className="accent-[var(--accent)]" />
              {opt}
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={() => onConfirm(milk)}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
