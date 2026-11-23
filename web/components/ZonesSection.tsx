import { ZonesMap } from "@/components/ZonesMap";
import { formatPrice } from "@/lib/price";
import type { Zones } from "@/lib/api";
import { t } from "@/lib/i18n";

export function ZonesSection({ zones }: { zones: Zones }) {
  const rows = [...zones.features]
    .map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      tone: f.properties.tone,
      price: f.properties.shipping,
    }))
    .sort((a, b) => {
      const pa = a.price ?? Number.POSITIVE_INFINITY;
      const pb = b.price ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name, "es");
    });

  return (
    <div>
      <div className="grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1.4fr)] ">
        <ul className="divide-y divide-foreground/10 card-surface rounded-[28px] border border-foreground/10 bg-[var(--tile-panel)]">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2.5 font-bold">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.tone === 0 ? "bg-accent" : "bg-highlight"}`}
                />
                {r.name}
              </span>
              <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                {r.price !== null && r.price !== undefined
                  ? `$ ${formatPrice(r.price)}`
                  : t("price.ask")}
              </span>
            </li>
          ))}
        </ul>

        {zones.features.length > 0 && <ZonesMap zones={zones} />}

        <p className="pt-6 text-center text-sm font-extrabold uppercase tracking-widest lg:col-span-2">
          {t("zones.note")}
        </p>
      </div>
    </div>
  );
}
