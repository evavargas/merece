// Letras con leve rotación y salto de línea base, como en el logo (design/DESIGN.md).
const LETTERS = [
  ["M", "-rotate-[5deg]"],
  ["e", "rotate-[3deg] translate-y-1"],
  ["r", "-rotate-[3deg]"],
  ["e", "rotate-[4deg] translate-y-[3px]"],
  ["c", "-rotate-[4deg]"],
  ["e", "rotate-[2deg] translate-y-1"],
] as const;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display inline-flex leading-none ${className}`} aria-label="Merece" role="img">
      {LETTERS.map(([ch, tilt], i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`inline-block ${tilt} ${i === 0 ? "bg-clip-text text-transparent [background-image:linear-gradient(to_bottom,var(--accent)_40%,var(--foreground)_40%)]" : ""}`}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
