const ITEMS = [
  { x: 6, y: 14, w: 16, h: 6, r: -25, t: 0, d: "0s", m: true },
  { x: 14, y: 42, w: 8, h: 8, r: 0, t: 1, d: "1.2s", m: false },
  { x: 22, y: 70, w: 14, h: 5, r: 35, t: 1, d: "2.4s", m: false },
  { x: 4, y: 82, w: 7, h: 7, r: 0, t: 0, d: "0.6s", m: true },
  { x: 28, y: 22, w: 6, h: 6, r: 0, t: 0, d: "3.1s", m: false },
  { x: 94, y: 18, w: 14, h: 5, r: 30, t: 1, d: "0.9s", m: true },
  { x: 86, y: 46, w: 9, h: 9, r: 0, t: 0, d: "1.8s", m: false },
  { x: 76, y: 72, w: 16, h: 6, r: -35, t: 0, d: "2.9s", m: false },
  { x: 95, y: 84, w: 7, h: 7, r: 0, t: 1, d: "0.3s", m: true },
  { x: 72, y: 20, w: 6, h: 6, r: 0, t: 1, d: "3.6s", m: false },
] as const;

export function Sprinkles({ tones }: { tones: readonly string[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {ITEMS.map((it, i) => (
        <span
          key={i}
          className={`sprinkle absolute rounded-full ${tones[it.t % tones.length]} ${it.m ? "" : "hidden md:block"}`}
          style={{ left: `${it.x}%`, top: `${it.y}%`, width: it.w, height: it.h, "--r": `${it.r}deg`, "--d": it.d } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
