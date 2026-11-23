"use client";

import { Select as S } from "radix-ui";

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function OptionSelect({ value, onValueChange, options, label, placeholder, compact }: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger
        aria-label={label}
        className={`flex w-full items-center justify-between gap-2 rounded-xl bg-card text-left text-foreground ${compact ? "min-h-9 border border-input px-3 text-sm font-bold" : "min-h-11 border-2 border-input px-3"}`}
      >
        <S.Value placeholder={placeholder} />
        <S.Icon className="shrink-0"><Chevron /></S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={4} className="z-[70] min-w-[var(--radix-select-trigger-width)] card-surface overflow-hidden rounded-xl border-2 border-border bg-card p-1 text-foreground shadow-lg">
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
