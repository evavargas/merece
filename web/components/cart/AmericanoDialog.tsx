"use client";

import { useState } from "react";
import { type DrinkTemp } from "@/lib/cart-options";
import { t } from "@/lib/i18n";
import { buttonClass } from "@/components/Button";

export function AmericanoDialog({
  context,
  onCancel,
  onConfirm,
}: {
  context?: string;
  onCancel: () => void;
  onConfirm: (temp: DrinkTemp) => void;
}) {
  const [temp, setTemp] = useState<DrinkTemp>("hot");
  const cold = temp === "cold";

  return (
    <div className="dialog-root fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[var(--scrim)]" aria-label={t("common.close")} onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="americano-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("americano.title")}</p>
        <h2 id="americano-title" className="mt-1 text-xl font-bold leading-snug">
          {t("coffee.americano")}
        </h2>
        {context && context !== t("coffee.americano") && (
          <p className="mt-1 text-sm text-muted-foreground">{context}</p>
        )}

        <div
          className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
            cold ? "border-foreground bg-muted" : "border-foreground/15"
          }`}
        >
          <span id="temp-label">{t(cold ? "drink.cold" : "drink.hot")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={cold}
            aria-labelledby="temp-label"
            onClick={() => setTemp(cold ? "hot" : "cold")}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${cold ? "bg-accent" : "bg-foreground/20"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${cold ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <p className="mt-2 text-left text-xs text-muted-foreground">{t("americano.hint")}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={`${buttonClass("outline")} w-full sm:w-auto`} onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button type="button" className={`${buttonClass("primary")} w-full sm:w-auto`} onClick={() => onConfirm(temp)}>
            {t("common.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
