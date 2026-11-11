// Genera web/lib/zones-map.json (paths SVG) desde OpenStreetMap. Uso: node scripts/build-zones-map.mjs
// Datos © colaboradores de OpenStreetMap (ODbL). Se corre a mano; el resultado se commitea.
import { writeFileSync } from "node:fs";

const UA = { "User-Agent": "merece-map-build/1.0" };
const BBOX = { w: -56.2152, e: -56.105, s: -34.9385, n: -34.8466 };
const ZONES = ["Pocitos", "Parque Rodó", "Cordón", "Centro"];
// Más barrios de contexto (sin color de entrega) para que el mapa se lea como ciudad.
const CONTEXT = ["Punta Carretas", "Palermo", "Barrio Sur", "Ciudad Vieja", "La Mondiola"];
const BUCEO = { lon: -56.1286576, lat: -34.8978004 }; // OSM solo tiene un punto, no polígono

async function retry(fn, n = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) { if (i >= n) throw e; await new Promise((r) => setTimeout(r, 4000 * (i + 1))); }
  }
}
const getJson = (url, init) => retry(async () => {
  const r = await fetch(url, { ...init, headers: { ...UA, ...init?.headers } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
});

const query = `[out:json][timeout:120];rel["boundary"="neighborhood"](${BBOX.s},${BBOX.w},${BBOX.n},${BBOX.e});out geom;`;
const [{ elements }, [dept]] = await Promise.all([
  getJson("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: query }) }),
  getJson("https://nominatim.openstreetmap.org/search?q=Montevideo,Uruguay&format=json&limit=1&polygon_geojson=1&polygon_threshold=0.0001"),
]);

// Une los ways de una relación en anillos cerrados.
function rings(rel) {
  const segs = rel.members.filter((m) => m.role === "outer" && m.geometry).map((m) => m.geometry.map((p) => [p.lon, p.lat]));
  const out = [];
  while (segs.length) {
    let ring = segs.shift();
    for (let moved = true; moved && !same(ring[0], ring.at(-1));) {
      moved = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i], end = ring.at(-1);
        if (same(s[0], end)) ring = ring.concat(s.slice(1));
        else if (same(s.at(-1), end)) ring = ring.concat(s.slice(0, -1).reverse());
        else continue;
        segs.splice(i, 1); moved = true; break;
      }
    }
    out.push(ring);
  }
  return out;
}
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

// Sutherland–Hodgman contra el rectángulo del mapa.
function clip(poly) {
  const edges = [
    [(p) => p[0] >= BBOX.w, (a, b) => [BBOX.w, a[1] + ((b[1] - a[1]) * (BBOX.w - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= BBOX.e, (a, b) => [BBOX.e, a[1] + ((b[1] - a[1]) * (BBOX.e - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= BBOX.s, (a, b) => [a[0] + ((b[0] - a[0]) * (BBOX.s - a[1])) / (b[1] - a[1]), BBOX.s]],
    [(p) => p[1] <= BBOX.n, (a, b) => [a[0] + ((b[0] - a[0]) * (BBOX.n - a[1])) / (b[1] - a[1]), BBOX.n]],
  ];
  for (const [inside, cut] of edges) {
    const input = poly; poly = [];
    input.forEach((cur, i) => {
      const prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) { if (!inside(prev)) poly.push(cut(prev, cur)); poly.push(cur); }
      else if (inside(prev)) poly.push(cut(prev, cur));
    });
    if (!poly.length) break;
  }
  return poly;
}

const K = Math.cos((((BBOX.n + BBOX.s) / 2) * Math.PI) / 180);
const SCALE = 6000; // unidades SVG por grado
const W = Math.round((BBOX.e - BBOX.w) * K * SCALE), H = Math.round((BBOX.n - BBOX.s) * SCALE);
const proj = ([lon, lat]) => [(lon - BBOX.w) * K * SCALE, (BBOX.n - lat) * SCALE];
const path = (rs) => rs.filter((r) => r.length > 2).map((r) => "M" + r.map((p) => proj(p).map((v) => v.toFixed(1)).join(" ")).join("L") + "Z").join("");
const centroid = (r) => { const p = r.map(proj); return [p.reduce((a, b) => a + b[0], 0) / p.length, p.reduce((a, b) => a + b[1], 0) / p.length]; };

const byName = (n) => elements.find((e) => e.tags.name === n);
const zone = (name, hasDelivery) => {
  const rel = byName(name);
  if (!rel) throw new Error(`Falta ${name} en OSM`);
  const rs = rings(rel).map(clip);
  const biggest = rs.reduce((a, b) => (b.length > a.length ? b : a));
  const [x, y] = centroid(biggest);
  return { name, delivery: hasDelivery, d: path(rs), x: +x.toFixed(1), y: +y.toFixed(1) };
};

const coast = (dept.geojson.type === "Polygon" ? [dept.geojson.coordinates] : dept.geojson.coordinates).flatMap((p) => p.slice(0, 1)).map(clip);
const [bx, by] = proj([BUCEO.lon, BUCEO.lat]);

writeFileSync(
  new URL("../web/lib/zones-map.json", import.meta.url),
  JSON.stringify({
    width: W, height: H,
    land: path(coast),
    zones: [...CONTEXT.filter(byName).map((n) => zone(n, false)), ...ZONES.map((n) => zone(n, true))],
    buceo: { x: +bx.toFixed(1), y: +by.toFixed(1) },
  }),
);
console.log("ok", W, H);
