"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type EggApi = { revealed: boolean; tapMerece: () => void };

const Ctx = createContext<EggApi | null>(null);
const WINDOW_MS = 500;

export function useEgg() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEgg fuera de EggProvider");
  return c;
}

export function EggProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const lastTap = useRef(0);

  const tapMerece = useCallback(() => {
    if (revealed) return;
    const now = Date.now();
    if (now - lastTap.current < WINDOW_MS) {
      setRevealed(true);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
  }, [revealed]);

  return <Ctx.Provider value={{ revealed, tapMerece }}>{children}</Ctx.Provider>;
}
