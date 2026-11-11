// Genera web/lib/barrios.json: polígonos de los barrios cercanos al centro de Montevideo.
// Fuente: barrios de la Intendencia de Montevideo (datos abiertos), vía el espejo cecimargolis/mapas-montevideo.
// Uso: node scripts/build-barrios.mjs
import { writeFileSync } from "node:fs";

const SOURCE = "https://raw.githubusercontent.com/cecimargolis/mapas-montevideo/main/barrios.geojson";
const VIEW = { w: -56.235, e: -56.07, s: -34.955, n: -34.82 }; // barrios que toquen esta ventana
// Barrios con entrega, en el orden en que se muestran en la leyenda.
const DELIVERY = ["POCITOS", "PUNTA CARRETAS", "PARQUE RODO", "PALERMO", "CORDON", "CENTRO", "TRES CRUCES", "BUCEO"];
const LABELS = { "PARQUE RODO": "Parque Rodó", CORDON: "Cordón", POCITOS: "Pocitos", CENTRO: "Centro", BUCEO: "Buceo", "PUNTA CARRETAS": "Punta Carretas", PALERMO: "Palermo", "TRES CRUCES": "Tres Cruces" };

const gj = await (await fetch(SOURCE)).json();

// Douglas–Peucker: ~3 m de tolerancia alcanza para un mapa de landing.
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let max = 0, idx = 0;
  pts.forEach((p, i) => {
    const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len;
    if (d > max) [max, idx] = [d, i];
  });
  return max > tol ? [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)] : [a, b];
}
// Un anillo cerrado tiene inicio == fin (la "recta" degenera): se parte en el punto más lejano del inicio.
function simplify(ring, tol) {
  const far = ring.reduce((best, p, i) => (Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]) > best[0] ? [Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]), i] : best), [0, 0])[1];
  const out = [...dp(ring.slice(0, far + 1), tol).slice(0, -1), ...dp(ring.slice(far), tol)];
  return out.length >= 4 ? out : ring;
}
const round = (p) => p.map((v) => +v.toFixed(5));

// Centro de masa del anillo más grande (área con signo); alcanza para barrios casi convexos.
function centroid(ring) {
  let a = 0, x = 0, y = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i], [x1, y1] = ring[i + 1], f = x0 * y1 - x1 * y0;
    a += f; x += (x0 + x1) * f; y += (y0 + y1) * f;
  }
  return [x / (3 * a), y / (3 * a)];
}

// Colores: 0 lavanda, 1 durazno, 2 marrón suave. Dos barrios que se tocan nunca comparten color.
const vertices = (f) => new Set((f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).flatMap((p) => p[0].map((c) => c.map((v) => v.toFixed(4)).join())));
const delivery = DELIVERY.map((k) => gj.features.find((f) => f.properties.nombre === k));
if (delivery.includes(undefined)) throw new Error("Falta algún barrio de entrega en la fuente");
const verts = delivery.map(vertices);
const touches = (i, j) => [...verts[i]].some((v) => verts[j].has(v));
const tones = [];
delivery.forEach((_, i) => {
  const used = new Set(tones.flatMap((t, j) => (touches(i, j) ? [t] : [])));
  tones[i] = [0, 1, 2].find((t) => !used.has(t)) ?? 2;
});

const features = [];
for (const f of gj.features) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = polys.map((p) => p[0]);
  const inView = rings.some((r) => r.some(([lon, lat]) => lon > VIEW.w && lon < VIEW.e && lat > VIEW.s && lat < VIEW.n));
  if (!inView) continue;
  const key = f.properties.nombre;
  const order = DELIVERY.indexOf(key);
  const biggest = rings.reduce((a, b) => (b.length > a.length ? b : a));
  features.push({
    type: "Feature",
    properties: { name: LABELS[key] ?? key, delivery: order >= 0, tone: order >= 0 ? tones[order] : null, order },
    geometry: { type: "MultiPolygon", coordinates: polys.map((p) => [simplify(p[0], 0.00003).map(round)]) },
    label: round(centroid(biggest)),
  });
}

const missing = DELIVERY.filter((k) => !features.some((f) => f.properties.order === DELIVERY.indexOf(k)));
if (missing.length) throw new Error(`Faltan barrios: ${missing}`);

// "label" va dentro de properties para que MapLibre/Marker lo lea sin estructuras extra.
const out = features.map(({ label, ...f }) => ({ ...f, properties: { ...f.properties, label } }));
writeFileSync(new URL("../web/lib/barrios.json", import.meta.url), JSON.stringify({ type: "FeatureCollection", features: out }));
console.log(out.length, "barrios;", out.filter((f) => f.properties.delivery).map((f) => f.properties.name).join(", "));
