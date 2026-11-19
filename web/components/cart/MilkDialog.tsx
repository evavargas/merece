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
    <div className="dialog-root fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[var(--scrim)]" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="milk-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Elegí la leche</p>
        <h2 id="milk-title" className="mt-1 text-xl font-bold leading-snug">
          {name}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed">¿Querés cambiar la leche entera por otra?</p>
        <fieldset className="mt-4 space-y-2 text-left">
          <legend className="sr-only">Tipo de leche</legend>
          {MILK_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                milk === opt ? "border-foreground bg-muted" : "border-foreground/15 hover:border-foreground/40"
              }`}
            >
              <input type="radio" name="milk" value={opt} checked={milk === opt} onChange={() => setMilk(opt)} className="accent-[var(--accent)]" />
              {opt}
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
