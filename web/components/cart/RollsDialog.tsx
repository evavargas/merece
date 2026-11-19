"use client";

import { useState } from "react";
import { type GlazeOption, type RollsOpts } from "@/components/cart/Cart";
import { buttonClass } from "@/components/Button";

export function RollsDialog({
  name,
  continueLabel = "Agregar",
  onCancel,
  onConfirm,
}: {
  name: string;
  continueLabel?: string;
  onCancel: () => void;
  onConfirm: (opts: RollsOpts) => void;
}) {
  const [glaze, setGlaze] = useState<GlazeOption>("Con glaseado");
  const [warm, setWarm] = useState(false);
  const withGlaze = glaze === "Con glaseado";

  return (
    <div className="dialog-root fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[var(--scrim)]" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rolls-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cómo querés el roll</p>
        <h2 id="rolls-title" className="mt-1 text-xl font-bold leading-snug">
          {name}
        </h2>

        <div
          className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
            withGlaze ? "border-foreground bg-muted" : "border-foreground/15"
          }`}
        >
          <span id="glaze-label">{withGlaze ? "Con glaseado" : "Sin glaseado"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={withGlaze}
            aria-labelledby="glaze-label"
            onClick={() => setGlaze(withGlaze ? "Sin glaseado" : "Con glaseado")}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${withGlaze ? "bg-accent" : "bg-foreground/20"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${withGlaze ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div
          className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
            warm ? "border-foreground bg-muted" : "border-foreground/15"
          }`}
        >
          <span id="warm-label">{warm ? "Roll caliente" : "Roll frío"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={warm}
            aria-labelledby="warm-label"
            onClick={() => setWarm((v) => !v)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${warm ? "bg-accent" : "bg-foreground/20"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${warm ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={() => onConfirm({ glaze, warm })}>
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
