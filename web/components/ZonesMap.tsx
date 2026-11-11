"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// MapLibre pesa ~800 KB: se descarga recién cuando el mapa está por entrar en pantalla.
const Canvas = dynamic(() => import("./ZonesMapCanvas"), { ssr: false });

export function ZonesMap() {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
    io.observe(box.current!);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="relative aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-[28px] bg-muted">
      {near && <Canvas />}
    </div>
  );
}
