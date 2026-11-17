# Merece — contexto, avance y estándares (landing)

Documento para quien hace pull y necesita entender **qué es el proyecto**, **qué se construyó**, **qué decisiones quedaron**, y **dónde no inventar**. Complementa:

| Documento | Para qué |
|---|---|
| [`README.md`](../README.md) | Cómo levantar el monorepo |
| [`design/merece-contexto-proyecto.md`](../design/merece-contexto-proyecto.md) | Negocio, marca, público, naming |
| [`design/DESIGN.md`](../design/DESIGN.md) | Tokens de color/tipo (sistema visual) |

Actualizado: noviembre 2026. Autoría de producto: Carlos + iteración con la dueña de Merece sobre copy, carta y UX.

---

## 1. En una frase

Landing de **Merece** (pastelería sin gluten + café de especialidad, Montevideo): carta online, carrito, pedido por WhatsApp, mapa de zonas de delivery, y un `/admin` mínimo para stock/precios/fotos/barrios.

No es un e‑commerce con checkout: el pago se coordina por chat (transferencia).

---

## 2. Qué problema resolvimos

Antes el flujo real era Instagram / WhatsApp a mano. Se armó una web que:

1. Muestra la carta con fotos y precios (Supabase).
2. Deja armar un pedido (opciones: leche, glaseado, roll caliente/frío, café en combos, Americano caliente/frío).
3. Manda el mensaje armado a WhatsApp (`wa.me/59897625315`).
4. Explica zonas y precios de envío del día.
5. Permite administrar catálogo y zonas sin tocar código.

Hubo un **boceto / ventanita** de exploración UX. Eso se consolidó en producción y el código del boceto se eliminó: **una sola landing**.

---

## 3. Stack (acordado)

```
web/     Next.js (App Router) + Tailwind — landing y /admin
api/     Hono (Node) — productos, barrios, auth admin, revalidate
supabase/  Postgres + Storage (fotos) + RLS
```

- Un solo origen en el browser: Next reescribe `/api/*` → API (`API_URL`), cookie admin `httpOnly`.
- Sin cuentas de cliente: admin = clave compartida (`ADMIN_PASSWORD`).
- Precios UYU con 2 decimales (`1.250,00`); vacío = “Consultar”.
- Stock `0` = “Sin stock por hoy”.

---

## 4. Lo que quedó construido (avance)

### Landing

- Hero con marca fuerte + easter egg (2 toques en “Merece” → juego espresso).
- Tema **claro por defecto** + toggle (footer); no forzar dark del sistema.
- Carta en secciones con **carteles neón**:
  - Lavanda + líneas laterales: Combos, “Deli merecidos”, bebidas.
  - Durazno (estilo hero): “Vos pedí y te lo preparamos” + debajo lavanda “48 hs de anticipación”.
- Cards de producto: nombre en **Bagel** (`font-display`), precio en mono; tortas a pedido muestran “24 cm, 12 porciones” en lavanda.
- Pedido en **tres pasos** (sección propia) y **Zonas de entrega** (sección propia, fondo distinto).
- Footer: Contacto (WA + IG) + “Para tener en cuenta” (SG, 48 hs, link a zonas).
- FAB WhatsApp + barra sticky (zonas / carrito / carta según scroll).

### Carrito y opciones

| Producto / caso | Flujo |
|---|---|
| Cafés con leche | Diálogo de leche |
| Americano | Caliente / frío (es del **café**) |
| Rolls | Glaseado + roll caliente/frío |
| **Combo Roll + Cappu** | Primero el roll; cappuccino **fijo caliente**; después leche |
| **Mini cookies + Café** | Eligen el café; luego leche o temp si aplica |
| Tortas a pedido | Aviso 48 hs al agregar |

Copy de opciones debe dejar claro **qué** se calienta (roll vs café). Evitar títulos ambiguos del combo en diálogos de temperatura.

### Zonas y envío

- Mapa MapLibre (OpenFreeMap) + lista **Delivery en el día** (barrio + precio).
- Leyenda: pedidos con anticipación / otra zona → consultar por WhatsApp.
- Colores de mapa: cerca = lavanda, lejos = durazno (cocina entre Pocitos y Parque Rodó).
- Precios de envío: **deben vivir atados al barrio** (migración `0005` → columna `barrios.shipping`; mientras tanto también `products/config/shipping.json` en Storage). Se editan en `/admin` → Barrios.
- **No** hardcodear tarifas en el frontend ni etiquetarlas como “estimados” si ya son precios de catálogo.

### Admin

- Productos: CRUD ligero, foto, categoría, precio, stock, descripción.
- Barrios: checkbox de habilitados + precio de envío del día → **Actualizar**.

### Extras

- Minijuego “Mi primer espresso” (`/mi-primer-espresso`), anillo neón durazno en el hero.
- JSON-LD tipo Bakery **sin** dirección de local y **sin** claims “apto celíacos”.

---

## 5. Estándares / principios que se consolidaron

### Producto y copy

- Tono uruguayo, cercano, corto. Menos párrafos de ayuda; la UI debe bastar.
- **No** afirmar “apto celíacos” hasta que inocuidad esté definida (ver contexto de negocio).
- “Sin gluten” no es el único mensaje: se vende por lo rico + café de especialidad.
- Combos y postres: copy de neón con personalidad (“Deli merecidos”, “Te lo merecés”).
- Pasos del pedido: simples (“Agregá tus pedidos al carrito” → validar → coordinamos entrega/pago).

### UX

- Una composición clara por sección; no meter zonas dentro de “tres pasos”.
- Carteles lavanda = categorías de carta; durazno = frases tipo hero / tortas a pedido.
- Opciones del carrito **explícitas** (café frío / roll caliente), no un solo “Caliente” genérico.
- WhatsApp: ícono con path estándar (el path simplificado se veía roto).

### Datos

- Catálogo y fotos en Supabase (persisten aunque el UI viva en el repo).
- Combos en carta: por nombre (`Combo …`, `… + Café`) y/o categoría; el enum DB `combos` puede no estar aplicado en remoto — la web no debe depender solo del enum.
- Revalidación por tags; no cachear a ciegas en el API (`Cache-Control: no-store` en lecturas críticas).

### Diseño (alineado a marca)

- Paleta: marrón `#3D2825`, marfil `#FFFFF0`, lavanda `#B9A5D6`, durazno `#F0AE86`.
- Tipografía: Bagel (marca/títulos), Gochi (neón/manuscrita), Roboto Mono (cuerpo), Nunito (datos chicos).
- Lavanda/durazno no como texto sobre marfil (contraste); sí como bloques, neón, chips.
- Tema claro default; dark es opt-in.

### Ingeniería

- No inventar dirección, mail, horarios ni precios de envío “de mentira” en copy.
- Secretos solo en `api/.env` (service role); nunca en el cliente.
- Tests de barrios (tonos cerca/lejos) y typecheck en `web` + `api`.

---

## 6. Ideas de producto que guiaron (y se fueron cerrando)

| Idea | Estado |
|---|---|
| Pedir por web → WhatsApp | Hecho |
| Combos (roll+cappu, cookies+café) | Hecho |
| Mini cookies también en postres | Hecho |
| Elegir café en combos “+ Café” | Hecho; Roll+Cappu es cappu fijo |
| Tortas a pedido con anticipación | Hecho (48 hs + tamaño 24 cm / 12 porciones) |
| Mapa de barrios + precios | Hecho |
| Local / cafetería física | Fuera de alcance inicial |
| Checkout online / pagos en web | No; transferencia por chat |
| App mobile propia | No en este repo (DESIGN.md menciona mobile de otro linaje) |

---

## 7. Qué comparamos / iteramos (para no repetir)

### Boceto vs producción

- Se prototipó carrito, nav, zonas y copy en boceto.
- Se **portó** a la landing real y se **borró** el boceto para no mantener dos UIs.
- Los precios de envío del boceto nacieron hardcodeados; eso se corrigió: deben salir de datos de barrio / admin, no de un mapa mágico en el front.

### Tema claro / oscuro

- Primero seguía el sistema → se forzó claro + toggle, y el toggle bajó al footer (menos ruido en el hero).

### Neón y categorías

- Primero “Postres” / frases largas de bebidas; se afinó a “Deli merecidos”, líneas divisorias lavanda, y tortas a pedido con neón durazno + “48 hs…”.
- Enum `combos` en Postgres: intento remoto falló/abortó; la carta agrupa combos por **nombre** (y categoría si existe).

### Diálogos de opciones

- Un “Caliente/Frío” genérico en el combo confundía roll vs café → se separó: roll siempre pregunta temp; cappu del combo va caliente; Americano aclara “café caliente/frío”.

### Footer

- Bloque “Pedidos” repetía los tres pasos → se reemplazó por datos útiles (SG, 48 hs, zonas).

### Copy de lemon pie / cards

- Se acortó descripción (sin “flameado”); tipografía de nombre vs precio para jerarquía visual.

---

## 8. Carta actual (orientativa)

Orden de secciones en UI (`CATEGORIES` en `web/lib/api.ts`):

1. **Combos** — p. ej. Combo Roll + Cappu; Mini cookies + Café  
2. **Deli merecidos** (postres) — rolls, budín, porción lemon, mini cookies, …  
3. **Para acompañar** — espresso, americano, cappuccino, flat white, iced latte  
4. **Tortas a pedido** — lemon pie entera, etc. (48 hs)

WhatsApp: `097 625 315` → internacional `59897625315`.  
Instagram: `@merece.singluten`.

---

## 9. Deuda / pendientes conocidos

- Aplicar en el proyecto Supabase remoto la migración `0005_barrios_shipping.sql` (columna `shipping`) si aún no está; hoy hay fallback por Storage.
- Confirmar licencia de polígonos de barrios (Intendencia / espejo usado en el seed).
- Protocolos de inocuidad antes de cualquier claim celíaco.
- Enum `product_category` + valor `combos` en DB si se quiere alinear admin/DB (hoy se puede mapear Combos → pastelería + nombre “Combo …”).
- Horarios / días de delivery: no inventar en la web hasta que estén definidos.

---

## 10. Cómo seguir sin romper el tono

1. Leer este doc + contexto de negocio + DESIGN.  
2. Cambios de precios/copy de productos: preferir **admin / Supabase**, no hardcode.  
3. Nuevas opciones de carrito: diálogo propio o copy que diga el sujeto (el roll / el café).  
4. Nuevas secciones de landing: una idea por bloque; neón lavanda = catálogo, durazno = frase de marca.  
5. No reintroducir boceto paralelo ni “estimados” falsos de envío.

---

## 11. Mapa mental rápido del repo

```
web/app/page.tsx          → composición de la landing
web/components/Menu.tsx   → carta + flujos de “Elegir”
web/components/cart/      → carrito, diálogos, shipping helper
web/components/Zones*     → mapa + lista de precios
web/components/NeonSign*  → carteles
api/src/products.ts       → CRUD productos + imagen
api/src/barrios.ts        → GeoJSON zonas + shipping + admin
supabase/migrations/      → esquema
design/                   → marca, mockups, contexto de negocio
docs/CONTEXTO-Y-AVANCE.md → este archivo
```
