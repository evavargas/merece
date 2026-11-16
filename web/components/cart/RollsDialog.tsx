"use client";

import { useState } from "react";
import { GLAZE_OPTIONS, type GlazeOption, type RollsOpts } from "@/components/cart/Cart";
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-foreground/45" aria-label="Cerrar" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rolls-title"
        className="relative w-full max-w-sm rounded-[28px] border-2 border-foreground bg-background p-6 text-center shadow-2xl"
      >
        <p className="font-hand text-xl uppercase tracking-[0.1em] text-accent">Cómo querés el roll</p>
        <h2 id="rolls-title" className="font-display mt-2 text-3xl leading-tight">
          {name}
        </h2>

        <fieldset className="mt-5 space-y-2 text-left">
          <legend className="mb-2 text-sm font-bold">Glaseado</legend>
          {GLAZE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-colors ${
                glaze === opt ? "border-accent bg-accent/15" : "border-foreground/15 hover:border-foreground/40"
              }`}
            >
              <input type="radio" name="glaze" value={opt} checked={glaze === opt} onChange={() => setGlaze(opt)} className="accent-[var(--accent)]" />
              {opt}
            </label>
          ))}
        </fieldset>

        <div
          className={`mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-colors ${
            warm ? "border-accent bg-accent/15" : "border-foreground/15"
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
        <p className="mt-2 text-left text-xs text-muted-foreground">Por defecto frío. Activá el switch si preferís el roll caliente.</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
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
