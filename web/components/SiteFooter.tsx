import { Instagram, WhatsApp } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wordmark } from "@/components/Wordmark";
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from "@/lib/api";

const PHONE_DISPLAY = "097 625 315";

function formatWaLink(n: string) {
  return `https://wa.me/${n}`;
}

// Pie de página: contacto y anclas con lo que ya publicamos (sin inventar local ni mail).
export function SiteFooter() {
  return (
    <footer className="border-t border-foreground/10 bg-muted text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-14 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-extrabold">Contacto</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <a
                href={formatWaLink(WHATSAPP_NUMBER)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-foreground no-underline hover:text-accent"
              >
                <WhatsApp className="h-4 w-4" />
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-foreground no-underline hover:text-accent"
              >
                <Instagram className="h-4 w-4" />
                @merece.singluten
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-extrabold">Para tener en cuenta</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Tortas a pedido: mín. 48 hs de anticipación</li>
            <li>
              Delivery en Montevideo ·{" "}
              <a href="#zonas" className="font-bold text-foreground no-underline hover:text-accent">
                ver zonas
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-foreground/10">
        <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-10 sm:left-6">
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-8 pb-28 text-center">
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
