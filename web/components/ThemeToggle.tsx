"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/icons";
import { t } from "@/lib/i18n";

const KEY = "merece-theme";

function setClass(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function hasChoice() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

function apply(theme: "light" | "dark") {
  setClass(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}

// Un solo botón sol/luna (en el footer). Por defecto toma el tema del sistema; al tocarlo, queda la elección guardada.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    // Sin elección guardada, sigue al sistema también si cambia con la página abierta.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (hasChoice()) return;
      const next = e.matches ? "dark" : "light";
      setClass(next);
      setTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    apply(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t(theme === "dark" ? "theme.toLightAria" : "theme.toDarkAria")}
      title={t(theme === "dark" ? "theme.light" : "theme.dark")}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 text-foreground transition-colors hover:bg-foreground/10 ${className}`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
