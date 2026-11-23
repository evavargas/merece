"use client";

import { CatFace } from "@/components/CatFace";
import { Wordmark } from "@/components/Wordmark";
import { t } from "@/lib/i18n";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 pb-8 pt-8 text-center">
      <div className="relative h-[190px] w-[200px]">
        <svg viewBox="0 0 200 190" className="absolute inset-0 h-full w-full" aria-hidden="true" {...stroke}>
          <path className="fill-highlight" d="M62 66 L166 66 L158 10 L70 10 Z" />
          <path d="M80 56 L152 56 L148 22 L84 22 Z" strokeWidth="3" />
          <path fill="#b86a45" d="M20 92 H120 L166 66 H64 Z" />
          <path fill="#dd8f64" d="M120 92 L166 66 V146 L120 172 Z" />
        </svg>
        <CatFace className="absolute left-[56px] top-[30px] w-[72px]" />
        <svg viewBox="0 0 200 190" className="absolute inset-0 h-full w-full" aria-hidden="true" {...stroke}>
          <path className="fill-highlight" d="M20 92 H120 V172 H20 Z" />
          <path fill="#f6c3a1" d="M20 92 H120 L116 118 H24 Z" />
          <g className="fill-highlight" stroke="none">
            <circle cx="34" cy="182" r="2.6" />
            <circle cx="48" cy="181" r="1.8" />
            <circle cx="132" cy="182" r="2.4" />
            <circle cx="146" cy="181" r="1.6" />
          </g>
        </svg>
        <span className="absolute left-[48px] top-[84px] h-3 w-5 rounded-full border-[2.5px] border-[#3D2825] bg-[#8B8791]" />
        <span className="absolute left-[88px] top-[84px] h-3 w-5 rounded-full border-[2.5px] border-[#3D2825] bg-[#8B8791]" />
        <div className="absolute left-[70px] top-[138px] -translate-x-1/2 text-[17px] leading-none text-[#3D2825]" style={{ "--foreground": "#3D2825" } as React.CSSProperties}>
          <Wordmark />
        </div>
      </div>
      <p className="font-hand text-3xl leading-none">{t("cart.empty")}</p>
    </div>
  );
}
