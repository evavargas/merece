"use client";

import { useEffect, useRef, useState } from "react";

// Hasta dónde se corren las pupilas dentro del ojo (unidades del viewBox).
const MAX_X = 4;
const MAX_Y = 3;

// Carita del gato del minijuego (design/espresso-game). Las pupilas siguen al puntero.
export function CatFace({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 120);
        setLook([(dx / d) * MAX_X * k, (dy / d) * MAX_Y * k]);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const [lx, ly] = look;
  return (
    <svg ref={ref} viewBox="152 280 124 106" aria-hidden="true" className={className}>
      <g stroke="#3D2825" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M174 350 L178 290 L214 314 L250 290 L254 350 Q254 380 214 380 Q174 380 174 350 Z" fill="#8B8791" />
        <g stroke="none">
          <path d="M214 316 Q206 330 198 346 Q190 362 200 372 Q214 381 228 372 Q238 362 230 346 Q222 330 214 316 Z" fill="#FFFFF0" />
          <path d="M184 303 L185 320 L198 314 Z" fill="#F0AE86" />
          <path d="M244 303 L243 320 L230 314 Z" fill="#F0AE86" />
        </g>
        <circle cx="197" cy="340" r="9.5" fill="#B8B456" strokeWidth="2.4" />
        <circle cx="231" cy="340" r="9.5" fill="#B8B456" strokeWidth="2.4" />
        <ellipse cx={197 + lx} cy={340 + ly} rx="2.6" ry="6" fill="#3D2825" stroke="none" />
        <ellipse cx={231 + lx} cy={340 + ly} rx="2.6" ry="6" fill="#3D2825" stroke="none" />
        <path d="M209 351 L219 351 L214 357 Z" fill="#F0AE86" stroke="none" />
        <path d="M214 357 L214 361 M214 361 Q208 366 203 362 M214 361 Q220 366 225 362" fill="none" strokeWidth="2.4" />
        <path d="M186 358 L160 352 M186 364 L161 368 M242 358 L268 352 M242 364 L267 368" fill="none" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
