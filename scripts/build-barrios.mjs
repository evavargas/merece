// Genera supabase/barrios_seed.sql con los 62 barrios de Montevideo (polígonos simplificados).
// Fuente: barrios de la Intendencia de Montevideo (datos abiertos), vía el espejo cecimargolis/mapas-montevideo.
// Uso: node scripts/build-barrios.mjs && supabase db query --linked -f supabase/barrios_seed.sql
// El seed no pisa `enabled` de barrios ya cargados: las zonas con entrega se gestionan desde /admin.
import { writeFileSync } from "node:fs";

const SOURCE = "https://raw.githubusercontent.com/cecimargolis/mapas-montevideo/main/barrios.geojson";
// Zonas habilitadas solo la primera vez que se carga cada barrio.
const INITIAL_ENABLED = ["POCITOS", "PUNTA CARRETAS", "PARQUE RODO", "PALERMO", "CORDON", "CENTRO", "TRES CRUCES", "BUCEO", "PQUE BATLLE VILLA DOLORES", "BARRIO SUR", "CIUDAD VIEJA"];
const NAMES = {
  "BANADOS DE CARRASCO": "Bañados de Carrasco", "CAPURRO BELLA VISTA": "Capurro - Bella Vista", "CASABO PAJAS BLANCAS": "Casabó - Pajas Blancas",
  "CASTRO CASTELLANOS": "Castro - Castellanos", "COLON CENTRO Y NOROESTE": "Colón Centro y Noroeste", "COLON SURESTE ABAYUBA": "Colón Sureste - Abayubá",
  CONCILIACION: "Conciliación", CORDON: "Cordón", "FLOR DE MARONAS": "Flor de Maroñas", ITUZAINGO: "Ituzaingó", "JARDINES DEL HIPODROMO": "Jardines del Hipódromo",
  "LA PALOMA TOMKINSON": "La Paloma - Tomkinson", LARRANAGA: "Larrañaga", "LEZICA MELILLA": "Lezica - Melilla", MALVIN: "Malvín", "MALVIN NORTE": "Malvín Norte",
  "MANGA TOLEDO CHICO": "Manga - Toledo Chico", "MARONAS PARQUE GUARANI": "Maroñas - Parque Guaraní", "MERCADO MODELO Y BOLIVAR": "Mercado Modelo - Bolívar",
  "NUEVO PARIS": "Nuevo París", "PARQUE RODO": "Parque Rodó", "PENAROL LAVALLEJA": "Peñarol - Lavalleja", "PQUE BATLLE VILLA DOLORES": "Parque Batlle",
  "PRADO NUEVA SAVONA": "Prado - Nueva Savona", "PUNTA RIELES BELLA ITALIA": "Punta de Rieles - Bella Italia", "TRES OMBUES PBLO VICTORIA": "Tres Ombúes - Pueblo Victoria",
  UNION: "Unión", "VILLA ESPANOLA": "Villa Española", "VILLA GARCIA MANGA RURAL": "Villa García - Manga Rural", "VILLA MUNOZ RETIRO": "Villa Muñoz - Retiro",
};
const titleCase = (k) => k.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).replace(/ De | Del | Y | La | Las /g, (m) => m.toLowerCase());
const slug = (k) => k.toLowerCase().replace(/\s+/g, "-");

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

const polysOf = (f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);
const vertices = (f) => new Set(polysOf(f).flatMap((p) => p[0].map((c) => c.map((v) => v.toFixed(4)).join())));
const verts = gj.features.map(vertices);
const unknown = INITIAL_ENABLED.filter((k) => !gj.features.some((f) => f.properties.nombre === k));
if (unknown.length) throw new Error(`Barrios inexistentes en la fuente: ${unknown}`);

const q = (str) => `'${str.replaceAll("'", "''")}'`;
const rows = gj.features.map((f, i) => {
  const key = f.properties.nombre;
  const polys = polysOf(f);
  const biggest = polys.map((p) => p[0]).reduce((a, b) => (b.length > a.length ? b : a));
  const neighbors = gj.features.flatMap((g, j) => (j !== i && [...verts[i]].some((v) => verts[j].has(v)) ? [slug(g.properties.nombre)] : []));
  const geometry = { type: "MultiPolygon", coordinates: polys.map((p) => [simplify(p[0], 0.00003).map(round)]) };
  return `(${q(slug(key))}, ${q(NAMES[key] ?? titleCase(key))}, $j$${JSON.stringify(geometry)}$j$::jsonb, $j$${JSON.stringify(round(centroid(biggest)))}$j$::jsonb, array[${neighbors.map(q).join(",")}]::text[], ${INITIAL_ENABLED.includes(key)})`;
});

writeFileSync(
  new URL("../supabase/barrios_seed.sql", import.meta.url),
  `-- Generado por scripts/build-barrios.mjs. No pisa \`enabled\` de barrios existentes.
insert into barrios (id, name, geometry, label, neighbors, enabled) values
${rows.join(",\n")}
on conflict (id) do update set name = excluded.name, geometry = excluded.geometry, label = excluded.label, neighbors = excluded.neighbors;
`,
);
console.log(rows.length, "barrios");
