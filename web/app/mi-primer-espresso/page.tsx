import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { EspressoGame } from "@/components/espresso/EspressoGame";

const DESCRIPTION = "Prepará tu primer espresso, texturizá la leche y dibujá un corazón: el minijuego de Merece.";

export const metadata: Metadata = {
  title: "Mi primer espresso",
  description: DESCRIPTION,
  alternates: { canonical: "/mi-primer-espresso" },
  openGraph: { url: "/mi-primer-espresso", title: "Mi primer espresso · Merece", description: DESCRIPTION },
};

export default function MiPrimerEspresso() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center gap-6 px-4 pb-16 pt-6">
      <header className="flex w-full max-w-[640px] items-center justify-between gap-4">
        <Link href="/" className="font-display text-3xl leading-none no-underline">
          Merece
        </Link>
        <Link href="/#carta" className={`${buttonClass("accent")} !min-h-11 !px-5 text-[15px]`}>
          Ver la carta
        </Link>
      </header>
      <h1 className="font-display text-center text-[clamp(2.25rem,9vw,3.5rem)] leading-tight">Mi primer espresso</h1>
      <EspressoGame />
    </main>
  );
}
