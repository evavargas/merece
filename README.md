# Merece

Landing de la pastelería sin gluten **Merece** (Montevideo) y panel `/admin` para stock, precios, orden de la carta, fotos y zonas de entrega.

```
web/        Next.js 16 + Tailwind 4: landing y /admin
api/        Hono (Node): API de productos y barrios, login por clave
supabase/   Migraciones SQL y seeds
design/     Logos y maquetas originales
```

## Puesta en marcha

1. En [Supabase](https://supabase.com), correr en el SQL Editor las migraciones de `supabase/migrations/` en orden (y opcionalmente `supabase/seed.sql`).
2. `cp api/.env.example api/.env` y completar los valores (`SESSION_SECRET`: `openssl rand -hex 32`).
3. `cp web/.env.example web/.env.local`.
4. `npm install && npm run dev`: landing en <http://localhost:3000>, panel en <http://localhost:3000/admin>.

`npm test`, `npm run typecheck` y `npm run build` validan ambos paquetes.

## Textos

Todos los textos viven en `web/lib/i18n/es.ts` y se usan con `t("clave")`. Código, API y base guardan identificadores en inglés. Para sumar un idioma, crear otro archivo con las mismas claves y elegirlo en `web/lib/i18n/index.ts`.

## Deploy

`web/` en Vercel (variable `API_URL`) y `api/` en cualquier host Node (`npm run build -w api && npm start -w api`). Las migraciones nuevas se corren en Supabase **antes** de publicar el código que las necesita.

## Zonas de entrega

Carga inicial de barrios: `node scripts/build-barrios.mjs && supabase db query --linked -f supabase/barrios_seed.sql`. Los polígonos salen de los barrios de la Intendencia de Montevideo, vía el espejo `cecimargolis/mapas-montevideo`, que no declara licencia: conviene confirmar la de la Intendencia antes de lanzar.
