"use client";

import Link from "next/link";
import { useEgg } from "@/components/Egg";
import { CatFace } from "@/components/CatFace";
import { Cup } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";

// Taza del hero; dos clics seguidos en “Merece” → gatito (easter egg → minijuego).
export function HeroBrand() {
  const { revealed, tapMerece } = useEgg();

  return (
    <div className="flex flex-col items-center gap-0">
      {revealed ? (
        <Link
          href="/mi-primer-espresso"
          aria-label="Jugá a Mi primer espresso"
          title="Mi primer espresso"
          className="neon-ring -mb-1 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3EFDF] transition-transform hover:scale-105 sm:h-24 sm:w-24"
        >
          <CatFace className="h-14 w-14 sm:h-16 sm:w-16" />
        </Link>
      ) : (
        <Cup steam className="-mb-1 h-20 w-20 text-accent sm:h-24 sm:w-24" />
      )}
      <h1 className="text-[clamp(4.5rem,19vw,7.5rem)] leading-none">
        <button type="button" className="cursor-pointer border-0 bg-transparent p-0" onClick={tapMerece} aria-label="Merece">
          <Wordmark />
        </button>
      </h1>
    </div>
  );
}
