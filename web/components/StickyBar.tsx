"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/Button";
import { Instagram } from "@/components/icons";
import { INSTAGRAM_URL } from "@/lib/api";

// Barra fija que aparece cuando la sección con id `heroId` sale de pantalla (ahí ya están los mismos botones).
export function StickyBar({ heroId }: { heroId: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, [heroId]);

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] motion-safe:transition-[translate,opacity] motion-safe:duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-2 rounded-full bg-background/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
        <a href={INSTAGRAM_URL} className={buttonClass("primary")}>
          <Instagram /> Pedí por Instagram
        </a>
        <Link
          href="/mi-primer-espresso"
          aria-label="Jugá a Mi primer espresso"
          title="Mi primer espresso"
          className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-[28px] leading-none no-underline transition-colors hover:bg-muted"
        >
          <span aria-hidden="true" className="-rotate-[5deg] bg-clip-text text-transparent [background-image:linear-gradient(to_bottom,var(--accent)_40%,var(--foreground)_40%)]">
            M
          </span>
        </Link>
      </div>
    </div>
  );
}
