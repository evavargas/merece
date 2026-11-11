"use client";

import * as maplibregl from "maplibre-gl";
import type { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import barrios from "@/lib/barrios.json";

// Mapa base: OpenFreeMap (gratis, sin API key, datos de OpenStreetMap). Barrios: Intendencia de Montevideo.
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const AREA: LngLatBoundsLike = [[-56.26, -34.97], [-56.04, -34.8]]; // límite de paneo

maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function ZonesMapCanvas() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [accent, highlight, ink] = [token("--accent"), token("--highlight"), token("--on-color")];
    const tones = [accent, highlight, ink]; // el 3er color (marrón) va más suave, ver fill-opacity
    const delivery = barrios.features.filter((f) => f.properties.delivery);

    const bounds = new maplibregl.LngLatBounds();
    delivery.forEach((f) => f.geometry.coordinates.forEach((poly) => poly[0].forEach((p) => bounds.extend(p as [number, number]))));

    const map = new maplibregl.Map({
      container: el.current!,
      style: STYLE,
      bounds,
      fitBoundsOptions: { padding: 32, animate: false },
      maxBounds: AREA,
      minZoom: 10.5,
      maxZoom: 16,
      cooperativeGestures: true, // en celular se mueve con 2 dedos: no secuestra el scroll de la página
      attributionControl: { compact: true, customAttribution: "Barrios: Intendencia de Montevideo" },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      el.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"); // arranca cerrada
      map.addSource("barrios", { type: "geojson", data: barrios as GeoJSON.FeatureCollection });
      // Encima de toda la geometría del mapa base (calles, edificios) y por debajo de sus etiquetas de texto.
      const layers = map.getStyle().layers;
      const lastShape = layers.findLastIndex((l) => l.type !== "symbol");
      const firstLabel = layers.slice(lastShape + 1).find((l) => l.type === "symbol")?.id;
      map.addLayer({ id: "barrios-context", type: "line", source: "barrios", filter: ["==", ["get", "delivery"], false], paint: { "line-color": ink, "line-opacity": 0.18, "line-width": 1, "line-dasharray": [2, 2] } }, firstLabel);
      map.addLayer({ id: "barrios-fill", type: "fill", source: "barrios", filter: ["==", ["get", "delivery"], true], paint: { "fill-color": ["match", ["get", "tone"], 0, tones[0], 1, tones[1], tones[2]], "fill-opacity": ["match", ["get", "tone"], 2, 0.35, 0.6] } }, firstLabel);
      map.addLayer({ id: "barrios-line", type: "line", source: "barrios", filter: ["==", ["get", "delivery"], true], paint: { "line-color": ink, "line-width": 2, "line-opacity": 0.8 } }, firstLabel);
    });

    // Etiquetas HTML: usan las tipografías de la marca y no dependen de glifos del mapa base.
    const markers = delivery.map((f) => {
      const label = document.createElement("span");
      label.textContent = f.properties.name;
      label.setAttribute("aria-hidden", "true");
      label.className = "pointer-events-none rounded-full bg-card/90 px-1.5 text-[10px] font-bold leading-4 sm:px-2.5 sm:py-0.5 sm:text-xs text-foreground shadow-sm";
      return new maplibregl.Marker({ element: label }).setLngLat(f.properties.label as [number, number]).addTo(map);
    });

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, []);

  // El CSS de MapLibre fuerza position:relative en su contenedor (le gana a las utilidades de Tailwind),
  // por eso el contenedor llena a un padre absoluto con h-full en vez de ser absoluto él mismo.
  return (
    <div className="absolute inset-0">
      <div ref={el} className="h-full w-full" role="region" aria-label="Mapa de los barrios donde entregamos" />
    </div>
  );
}

