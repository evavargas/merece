import { t } from "@/lib/i18n";

// "Merece" en Bagel Fat One, letras alineadas en la línea base; la M va bañada en lavanda.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display inline-flex leading-none ${className}`} aria-label={t("brand.name")} role="img">
      <span aria-hidden="true" className="bg-clip-text text-transparent [background-image:linear-gradient(to_bottom,var(--accent)_40%,var(--foreground)_40%)]">
        M
      </span>
      <span aria-hidden="true">erece</span>
    </span>
  );
}
