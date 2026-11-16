"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartButton } from "@/components/cart/Cart";
import { useEgg } from "@/components/Egg";
import { Close, MenuIcon } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";

const LINKS = [
  { href: "#carta", label: "Carta" },
  { href: "#zonas", label: "Zonas" },
] as const;

// Menú superior: anclas + carrito. Al scrollear se oculta (queda la barra flotante).
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const { tapMerece } = useEgg();

  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0.15 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pastHero) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="#inicio"
          className="text-[clamp(1.4rem,4vw,1.75rem)] leading-none no-underline"
          aria-label="Merece, ir al inicio"
          onClick={() => {
            tapMerece();
            setOpen(false);
          }}
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="Secciones" className="hidden items-center gap-5 text-sm font-bold md:flex">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-foreground no-underline hover:text-accent">
                {l.label}
              </a>
            ))}
          </nav>

          <CartButton />

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-foreground/10 bg-background md:hidden">
          <nav aria-label="Secciones" className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3 sm:px-6">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-xl px-3 py-3 text-base font-bold text-foreground no-underline hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
