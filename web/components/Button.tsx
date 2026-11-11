import type { ComponentProps } from "react";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-bold no-underline transition-colors min-h-12 px-7 text-base disabled:opacity-50 cursor-pointer";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  outline: "border-2 border-foreground text-foreground hover:bg-muted",
  highlight: "bg-highlight text-on-color hover:brightness-95",
  ghost: "text-foreground hover:bg-muted",
} as const;

export function buttonClass(variant: keyof typeof variants = "primary") {
  return `${base} ${variants[variant]}`;
}

export function Button({ variant = "primary", className = "", ...rest }: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button className={`${buttonClass(variant)} ${className}`} {...rest} />;
}
