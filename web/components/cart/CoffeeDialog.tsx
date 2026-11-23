"use client";

import { useState } from "react";
import { COFFEE_OPTIONS, type CoffeeOption } from "@/lib/cart-options";
import { t } from "@/lib/i18n";
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
  const [coffee, setCoffee] = useState<CoffeeOption>("cappuccino");

  return (
    <div className="dialog-root fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[var(--scrim)]" aria-label={t("common.close")} onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coffee-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("coffeeDialog.title")}</p>
        <h2 id="coffee-title" className="mt-1 text-xl font-bold leading-snug">
          {name}
        </h2>
        <fieldset className="mt-5 space-y-2 text-left">
          <legend className="sr-only">{t("coffeeDialog.legend")}</legend>
          {COFFEE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                coffee === opt ? "border-foreground bg-muted" : "border-foreground/15 hover:border-foreground/40"
              }`}
            >
              <input type="radio" name="coffee" value={opt} checked={coffee === opt} onChange={() => setCoffee(opt)} className="accent-[var(--accent)]" />
              {t(`coffee.${opt}`)}
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button type="button" className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={() => onConfirm(coffee)}>
            {t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
