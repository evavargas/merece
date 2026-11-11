// El empaquetador rompe el worker de MapLibre; se sirve como archivo estático desde /maplibre/.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const dist = dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json"));
mkdirSync("public/maplibre", { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(join(dist, "dist", f), join("public/maplibre", f));
