"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const HOLD_MS = 3400;
const OFF_MS = 320;
const LONG_PHRASE = 24;

const SPARKS = [
  { left: "-3%", top: "-8%", s: "0.3em", d: "0s" },
  { left: "99%", top: "6%", s: "0.22em", d: "0.9s" },
  { left: "94%", top: "80%", s: "0.28em", d: "1.6s" },
  { left: "3%", top: "86%", s: "0.18em", d: "2.1s" },
] as const;

export function NeonSign({
  phrases,
  tone = "highlight",
  shrinkLong = true,
  className = "",
}: {
  phrases: readonly string[];
  tone?: "highlight" | "accent";
  shrinkLong?: boolean;
  className?: string;
}) {
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
    <div ref={ref} aria-hidden="true" data-lit={lit} data-tone={tone} className={`neon grid ${className}`}>
      {phrases.map((phrase, i) => {
        const letters = phrase.replace(/\s/g, "").length;
        const buzzAt = Math.floor(letters * 0.6);
        let n = 0;
        return (
          <span
            key={phrase}
            className={`col-start-1 row-start-1 self-center text-balance ${shrinkLong && phrase.length > LONG_PHRASE ? "text-[0.6em]" : ""} ${i === index ? "" : "invisible"}`}
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
      {SPARKS.map((k, i) => (
        <span key={i} className="neon-spark" style={{ left: k.left, top: k.top, "--s": k.s, "--d": k.d } as React.CSSProperties} />
      ))}
    </div>
  );
}
