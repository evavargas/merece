import map from "@/lib/zones-map.json";

// Mapa estático generado con scripts/build-zones-map.mjs. Datos © colaboradores de OpenStreetMap (ODbL).
const DELIVERY = map.zones.filter((z) => z.delivery);

export function ZonesMap() {
  return (
    <figure className="mx-auto w-full max-w-lg">
      <svg viewBox={`0 0 ${map.width} ${map.height}`} role="img" aria-labelledby="zonas-titulo" className="w-full rounded-[28px] bg-muted">
        <title id="zonas-titulo">Mapa de Montevideo con los barrios donde entregamos: {DELIVERY.map((z) => z.name).join(", ")}, Buceo</title>
        <defs><clipPath id="land-clip"><path d={map.land} /></clipPath></defs>
        <path d={map.land} className="fill-card" />
        <g clipPath="url(#land-clip)">
          {map.zones.map((z) => (
            <path
              key={z.name}
              d={z.d}
              className={`${z.delivery ? (DELIVERY.indexOf(z) % 2 ? "fill-highlight" : "fill-accent") : "fill-card"} stroke-foreground/40`}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ))}
        </g>
        {DELIVERY.map((z) => (
          <text key={z.name} x={z.x} y={z.y} textAnchor="middle" className="fill-on-color font-bold" style={{ fontSize: 14 }}>
            {z.name}
          </text>
        ))}
        <circle cx={map.buceo.x} cy={map.buceo.y} r="28" className="fill-accent stroke-foreground" strokeWidth="2" strokeDasharray="5 4" />
        <text x={map.buceo.x} y={map.buceo.y + 5} textAnchor="middle" className="fill-on-color font-bold" style={{ fontSize: 15 }}>Buceo</text>
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">
        Zonas aproximadas. Mapa © colaboradores de OpenStreetMap.
      </figcaption>
    </figure>
  );
}
