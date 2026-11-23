const base = {
  viewBox: "0 0 100 100",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 4.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function BagIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M38 38 C38 20 62 20 62 38" />
      <path className="fill-accent" d="M22 38 H78 L74 84 Q73.5 90 67 90 H33 Q26.5 90 26 84 Z" />
      <path className="fill-highlight" d="M50 76 C42 69 38 65 42 60.5 C45.5 57 50 60 50 63 C50 60 54.5 57 58 60.5 C62 65 58 69 50 76 Z" />
    </svg>
  );
}

export function ChatCheckIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path className="fill-highlight" d="M22 20 H78 Q86 20 86 28 V60 Q86 68 78 68 H52 L34 84 V68 H22 Q14 68 14 60 V28 Q14 20 22 20 Z" />
      <path d="M33 45 L45 57 L67 34" />
    </svg>
  );
}

export function DeliveryIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect className="fill-accent" x="10" y="26" width="28" height="24" rx="5" />
      <path d="M10 38 H38" />
      <circle cx="30" cy="74" r="12" />
      <circle cx="76" cy="74" r="12" />
      <path d="M30 74 L46 52 H60 L76 74" />
      <path d="M60 52 L66 36 H78" />
      <path d="M40 52 H52" />
    </svg>
  );
}
