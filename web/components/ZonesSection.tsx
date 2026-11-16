import { ZonesMap } from "@/components/ZonesMap";
import { formatPrice } from "@/lib/price";
import type { Zones } from "@/lib/api";

export function ZonesSection({ zones }: { zones: Zones }) {
  const rows = [...zones.features]
    .map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      tone: f.properties.tone,
      price: f.properties.shipping,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,22rem)] lg:items-start">
        {zones.features.length > 0 && <ZonesMap zones={zones} />}

        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest">Delivery en el día</h3>
          <ul className="mt-4 divide-y divide-foreground/10 rounded-[28px] border border-foreground/10 bg-background">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex items-center gap-2.5 font-bold">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.tone === 0 ? "bg-accent" : "bg-highlight"}`}
                  />
                  {r.name}
                </span>
                <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {r.price !== null && r.price !== undefined ? `$ ${formatPrice(r.price)}` : "Consultar"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Para pedidos con anticipación, consultanos.
        <br />
        ¿Otra zona? Escribinos por WhatsApp.
      </p>
    </div>
  );
}
