"use client";

import { useState } from "react";
import { type DrinkTemp } from "@/components/cart/Cart";
import { buttonClass } from "@/components/Button";

export function AmericanoDialog({
  context,
  onCancel,
  onConfirm,
}: {
  /** Nombre del producto/combo, solo como contexto (ej. "Combo Roll + Cappu"). */
  context?: string;
  onCancel: () => void;
  onConfirm: (temp: DrinkTemp) => void;
}) {
  const [temp, setTemp] = useState<DrinkTemp>("Caliente");
  const cold = temp === "Fría";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/45" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="americano-title"
        className="relative w-full max-w-sm rounded-[28px] border-2 border-foreground bg-background p-6 text-center shadow-2xl"
      >
        <p className="font-hand text-xl uppercase tracking-[0.1em] text-accent">Cómo querés el café</p>
        <h2 id="americano-title" className="font-display mt-2 text-3xl leading-tight">
          Americano
        </h2>
        {context && context !== "Americano" && (
          <p className="mt-1 text-sm text-muted-foreground">{context}</p>
        )}

        <div
          className={`mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors ${
            cold ? "border-accent bg-accent/15" : "border-foreground/15"
          }`}
        >
          <span id="temp-label">{cold ? "Café frío" : "Café caliente"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={cold}
            aria-labelledby="temp-label"
            onClick={() => setTemp(cold ? "Caliente" : "Fría")}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${cold ? "bg-accent" : "bg-foreground/20"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${cold ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <p className="mt-2 text-left text-xs text-muted-foreground">Por defecto caliente. Activá el switch si preferís el café frío.</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={() => onConfirm(temp)}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
