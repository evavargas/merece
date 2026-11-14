import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { CatFace } from "@/components/CatFace";
import { Instagram } from "@/components/icons";
import { INSTAGRAM_URL } from "@/lib/api";

// Barra flotante fija: los dos llamados a la acción de la landing.
export function StickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 rounded-full bg-background/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
        <a href={INSTAGRAM_URL} className={`${buttonClass("primary")} whitespace-nowrap max-sm:px-5`}>
          <Instagram /> Pedí por Instagram
        </a>
        <Link
          href="/mi-primer-espresso"
          aria-label="Jugá a Mi primer espresso"
          title="Mi primer espresso"
          className="flex h-12 w-12 shrink-0 items-center justify-center neon-ring rounded-full bg-[#F3EFDF] transition-transform hover:scale-105"
        >
          <CatFace className="h-9 w-9" />
        </Link>
      </div>
    </div>
  );
}
