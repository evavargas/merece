"use client";

// Select al estilo shadcn/ui (Radix). Reemplaza al <select> nativo (design/DESIGN.md).
import { Select as S } from "radix-ui";

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function OptionSelect({ value, onValueChange, options, label }: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger
        aria-label={label}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-input bg-card px-3 text-left text-foreground"
      >
        <S.Value />
        <S.Icon><Chevron /></S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={4} className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border-2 border-border bg-card p-1 text-foreground shadow-lg">
          <S.Viewport>
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} className="flex min-h-10 cursor-pointer items-center rounded-lg px-3 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-on-color data-[state=checked]:font-bold">
                <S.ItemText>{o.label}</S.ItemText>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
