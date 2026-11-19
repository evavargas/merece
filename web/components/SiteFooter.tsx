import { Instagram, WhatsApp } from "@/components/icons";
import { PeekingCat } from "@/components/PeekingCat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from "@/lib/api";

function formatWaLink(n: string) {
  return `https://wa.me/${n}`;
}

// Pie de página: íconos de contacto, logo y selector de tema (sin inventar local ni mail).
export function SiteFooter() {
  return (
    <footer className="relative bg-[var(--footer)] text-foreground">
      <PeekingCat />
      <div className="relative">
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-10 sm:left-6">
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-8 pb-48 text-center sm:pb-28">
          <div className="flex items-center gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Merece"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={formatWaLink(WHATSAPP_NUMBER)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de Merece"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90"
            >
              <WhatsApp className="h-5 w-5" />
            </a>
          </div>
          <a href="#inicio" className="text-[clamp(1.75rem,5vw,2.25rem)] leading-none text-foreground no-underline" aria-label="Merece">
            <Wordmark />
          </a>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Merece. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
