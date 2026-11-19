// Dripeado de cobertura entre el hero y la carta (como un drip cake). Todo en SVG, con un reflejo suave para que se vea brillante.
// <1280 px: el patrón se repite sin estirarse. Desde 1280 px: N copias (N entero según el ancho) que se estiran solo en horizontal,
// así los extremos del patrón coinciden con los bordes de la página y quedan ~90 px libres en cada borde para las gotas largas
// (LongDrip), que nunca chocan con otra gota. Colores: --drip (cobertura) y --drip-shine (reflejo), en globals.css.
const B = 10; // línea base de la cobertura
const F = 16; // ancho del empalme curvo
const W = 720;
const H = 90;

// (centro x, ancho del cuello, radio de la punta, largo total)
const DROPS = [
  [140, 14, 9.5, 78],
  [232, 34, 19.5, 74],
  [340, 11, 8, 52],
  [438, 28, 16.5, 88],
  [530, 12, 8.5, 60],
  [598, 24, 14.5, 70],
] as const;

function drop(cx: number, n: number, r: number, L: number) {
  const top = L - 2 * r;
  const l = cx - n / 2;
  const rt = cx + n / 2;
  return (
    ` H${l - F} C${l - F * 0.4} ${B} ${l} ${B + 3} ${l} ${B + F}` +
    ` V${top} C${l} ${top + r * 0.55} ${cx - r} ${top + r * 0.35} ${cx - r} ${L - r}` +
    ` A${r} ${r} 0 0 0 ${cx + r} ${L - r}` +
    ` C${cx + r} ${top + r * 0.35} ${rt} ${top + r * 0.55} ${rt} ${top}` +
    ` V${B + F} C${rt} ${B + 3} ${rt + F * 0.4} ${B} ${rt + F} ${B}`
  );
}

// Reflejo de una gota: una línea fina a lo largo del cuello y un óvalo brillante en la punta.
function Shine({ cx, n, r, L }: { cx: number; n: number; r: number; L: number }) {
  const top = L - 2 * r;
  const x = cx - n * (n >= 24 ? 0.28 : 0.17);
  const y1 = B + F + 4;
  const y2 = top + r * 0.4;
  return (
    <g fill="var(--drip-shine)" stroke="none">
      {y2 - y1 > 8 && <rect x={x - 1.1} y={y1} width={2.2} height={y2 - y1} rx={1.1} />}
      <ellipse cx={cx - r * 0.38} cy={L - r * 1.05} rx={Math.max(1.6, r * 0.2)} ry={Math.max(2.4, r * 0.34)} />
    </g>
  );
}

const TILE = `M0 0 V${B}${DROPS.map(([cx, n, r, L]) => drop(cx, n, r, L)).join("")} H${W} V0 Z`;

function Tile({ className }: { className: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={`h-[90px] ${className} fill-[var(--drip)]`} style={{ marginRight: -1 }}>
      <path d={TILE} />
      {DROPS.map(([cx, n, r, L]) => (
        <Shine key={cx} cx={cx} n={n} r={r} L={L} />
      ))}
    </svg>
  );
}

export function DripBand() {
  const scaled = "min-w-0 flex-1";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-px overflow-hidden">
      <div className="flex overflow-hidden min-[1280px]:hidden">{[0, 1].map((i) => <Tile key={i} className="w-[720px] shrink-0" />)}</div>
      <div className="hidden min-[1280px]:max-[1919px]:flex">{[0, 1].map((i) => <Tile key={i} className={scaled} />)}</div>
      <div className="hidden min-[1920px]:max-[2879px]:flex">{[0, 1, 2].map((i) => <Tile key={i} className={scaled} />)}</div>
      <div className="hidden min-[2880px]:flex">{[0, 1, 2, 3].map((i) => <Tile key={i} className={scaled} />)}</div>
    </div>
  );
}

// Gota larga de borde (única, no se repite). `neck` = ancho del cuello, `r` = radio de la punta, `length` = largo total.
export function LongDrip({ length, neck, r, className }: { length: number; neck: number; r: number; className: string }) {
  const w = 52;
  const cx = w / 2;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${w} ${length}`} className={`pointer-events-none absolute -top-px fill-[var(--drip)] ${className}`} style={{ height: length, width: w }}>
      <path d={`M0 0 V${B}${drop(cx, neck, r, length)} H${w} V0 Z`} />
      <Shine cx={cx} n={neck} r={r} L={length} />
    </svg>
  );
}
