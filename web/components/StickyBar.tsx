"use client";

import { useEffect, useState } from "react";
import { CartButton, useCart } from "@/components/cart/Cart";
import { WhatsApp } from "@/components/icons";

// FAB WhatsApp (esquina) + al scrollear: Zonas + carrito; pasado el menú, también Carta.
export function StickyBar() {
  const { orderUrl, count, canSend, setOpen } = useCart();
  const [pastHero, setPastHero] = useState(false);
  const [pastCarta, setPastCarta] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const carta = document.getElementById("carta");
    const observers: IntersectionObserver[] = [];

    if (hero) {
      const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0.15 });
      io.observe(hero);
      observers.push(io);
    }
    if (carta) {
      const io = new IntersectionObserver(([e]) => setPastCarta(!e.isIntersecting), { threshold: 0 });
      io.observe(carta);
      observers.push(io);
    }

    return () => observers.forEach((io) => io.disconnect());
  }, []);

  const wa = (
    <a
      href={orderUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={count > 0 ? (canSend ? "Enviar pedido por WhatsApp" : "Abrir pedido") : "Pedí por WhatsApp"}
      onClick={(e) => {
        if (count > 0 && !canSend) {
          e.preventDefault();
          setOpen(true);
        }
      }}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsApp className="h-7 w-7" />
    </a>
  );

  return (
    <>
      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-20">{wa}</div>

      {pastHero && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-background/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur sm:gap-2">
            {pastCarta && (
              <a
                href="#carta"
                className="inline-flex h-11 items-center rounded-full px-3 text-sm font-bold text-foreground no-underline hover:bg-muted sm:px-4"
              >
                Carta
              </a>
            )}
            <a
              href="#zonas"
              className="inline-flex h-11 items-center rounded-full px-3 text-sm font-bold text-foreground no-underline hover:bg-muted sm:px-4"
            >
              Zonas de entrega
            </a>
            <CartButton className="!h-11 !w-11" />
          </div>
        </div>
      )}
    </>
  );
}
