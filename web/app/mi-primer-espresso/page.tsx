import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { EspressoGame } from "@/components/espresso/EspressoGame";
import { t } from "@/lib/i18n";

const DESCRIPTION = t("game.pageDescription");

export const metadata: Metadata = {
  title: t("game.pageTitle"),
  description: DESCRIPTION,
  alternates: { canonical: "/mi-primer-espresso" },
  openGraph: { url: "/mi-primer-espresso", title: t("game.pageOgTitle"), description: DESCRIPTION },
};

export default function MiPrimerEspresso() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center gap-6 px-4 pb-16 pt-6">
      <header className="flex w-full max-w-[640px] items-center justify-between gap-4">
        <Link href="/" className="font-display text-3xl leading-none no-underline">
          {t("brand.name")}
        </Link>
        <Link href="/#carta" className={`${buttonClass("accent")} !min-h-11 !px-5 text-[15px]`}>
          {t("game.viewMenu")}
        </Link>
      </header>
      <h1 className="font-display text-center text-[clamp(2.25rem,9vw,3.5rem)] leading-tight">{t("game.pageTitle")}</h1>
      <EspressoGame />
    </main>
  );
}
