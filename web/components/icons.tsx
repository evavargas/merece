export function Instagram({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function Cup({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M30 14 C26 22 34 26 30 34" />
      <path d="M48 10 C44 20 54 24 48 34" />
      <path d="M66 14 C62 22 70 26 66 34" />
      <path d="M18 44 L78 44 L74 74 C73 82 66 88 58 88 L38 88 C30 88 23 82 22 74 Z" />
      <path d="M78 52 C92 52 92 72 76 72" />
    </svg>
  );
}
