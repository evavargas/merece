# Merece

Landing de la pastelería sin gluten **Merece** (Montevideo) + panel `/admin` mínimo para controlar stock, precios y fotos.

```
web/        Next.js 16 + Tailwind 4 — landing y /admin
api/        Hono (Node) — API de productos y login por clave
supabase/   Migración SQL (tabla + bucket de fotos) y seed
design/     DESIGN.md, contexto del proyecto, logos y mockup original
```

## Puesta en marcha

1. Crear un proyecto en [Supabase](https://supabase.com) y correr `supabase/migrations/0001_products.sql` (y opcionalmente `supabase/seed.sql`) en el SQL Editor.
2. `cp api/.env.example api/.env` y completar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD` y `SESSION_SECRET` (`openssl rand -hex 32`).
3. `cp web/.env.example web/.env.local` (por defecto apunta a `http://localhost:4000`).
4. `npm install && npm run dev` → landing en <http://localhost:3000>, panel en <http://localhost:3000/admin>.

`npm test` corre los tests del API; `npm run typecheck` y `npm run build` validan ambos paquetes.

## Cómo funciona

- **Sin usuarios:** `/admin` pide una clave (`ADMIN_PASSWORD`). El API la compara en tiempo constante y emite una cookie `httpOnly` de 12 h. 10 intentos fallidos bloquean la IP 15 min.
- **Un solo origen:** Next reescribe `/api/*` hacia el API (`API_URL`), así la cookie no necesita CORS.
- **Stock:** número de unidades por producto; `0` se muestra como "Sin stock por hoy". Precio vacío se muestra como "Consultar".
- **Fotos:** JPG/PNG/WebP hasta 5 MB, se guardan en el bucket público `products` de Supabase.
- La landing se regenera cada 30 s, por eso los cambios del panel tardan hasta medio minuto en verse.
- La `service_role` key vive solo en el API; la tabla tiene RLS activado y sin políticas.

## Deploy

`web/` en Vercel (variable `API_URL`). `api/` en cualquier host Node (`npm run build -w api && npm start -w api`).

## Mapa de zonas

`web/lib/zones-map.json` se genera con `node scripts/build-zones-map.mjs` (OpenStreetMap, ODbL). Las zonas con entrega son `ZONES` en `web/app/page.tsx` y en el script; OSM no tiene polígono de Buceo, por eso se muestra como círculo aproximado.
