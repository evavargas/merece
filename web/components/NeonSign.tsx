"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const HOLD_MS = 3400;
const OFF_MS = 320;
// Las frases más largas que esto se dibujan más chicas para que todas ocupen un alto parecido.
const LONG_PHRASE = 24;

// Cartel de neón decorativo: el texto accesible va aparte (el h2 de la sección), por eso es aria-hidden.
export function NeonSign({ phrases, className = "" }: { phrases: readonly string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(true);
      return;
    }

    let timer: number | undefined;
    const cycle = () => {
      timer = window.setTimeout(() => {
        setLit(false);
        timer = window.setTimeout(() => {
          setIndex((i) => (i + 1) % phrases.length);
          setLit(true);
          cycle();
        }, OFF_MS);
      }, HOLD_MS);
    };

    // Se enciende al entrar en pantalla y se apaga al salir, así el parpadeo se ve cada vez que llega.
    const io = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        setLit(entry.isIntersecting);
        if (entry.isIntersecting && phrases.length > 1) cycle();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [phrases.length]);

  return (
    <div ref={ref} aria-hidden="true" data-lit={lit} className={`neon grid ${className}`}>
      {phrases.map((phrase, i) => {
        const letters = phrase.replace(/\s/g, "").length;
        const buzzAt = Math.floor(letters * 0.6);
        let n = 0;
        return (
          <span
            key={phrase}
            className={`col-start-1 row-start-1 self-center text-balance ${phrase.length > LONG_PHRASE ? "text-[0.6em]" : ""} ${i === index ? "" : "invisible"}`}
          >
            {phrase.split(" ").map((word, w) => (
              <Fragment key={w}>
                <span className="inline-block whitespace-nowrap">
                  {[...word].map((ch, c) => (
                    <span key={c} className={`neon-letter ${n++ === buzzAt ? "neon-buzz" : ""}`}>
                      {ch}
                    </span>
                  ))}
                </span>{" "}
              </Fragment>
            ))}
          </span>
        );
      })}
    </div>
  );
}
