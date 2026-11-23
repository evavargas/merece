"use client";

import Link from "next/link";
import { CartButton } from "@/components/cart/Cart";
import { useEgg } from "@/components/Egg";
import { Wordmark } from "@/components/Wordmark";
import { t } from "@/lib/i18n";

export function SiteNav() {
  const { tapMerece } = useEgg();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="#inicio"
          className="text-[clamp(1.4rem,4vw,1.75rem)] leading-none no-underline"
          aria-label={t("nav.homeAria")}
          onClick={tapMerece}
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#carta" className="hidden text-sm font-bold text-foreground no-underline hover:underline md:inline">
            {t("nav.products")}
          </a>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
