import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "./auth.js";
import { revalidate } from "./revalidate.js";
import { BUCKET, supabase } from "./supabase.js";

type Row = {
  id: string;
  name: string;
  geometry: unknown;
  label: [number, number];
  neighbors: string[];
  shipping: number | null;
};

// 0 = lavanda (más cerca), 1 = durazno (más lejos). Cocina entre Pocitos y Parque Rodó.
const NEAR = new Set(["parque-rodo", "pocitos", "punta-carretas"]);
const FAR = new Set(["cordon", "barrio-sur", "tres-cruces", "centro", "palermo"]);

const SHIPPING_PATH = "config/shipping.json";

export function assignTones(rows: Pick<Row, "id" | "name" | "neighbors">[]): Map<string, number> {
  const tones = new Map<string, number>();
  for (const r of rows) {
    if (NEAR.has(r.id)) tones.set(r.id, 0);
    else if (FAR.has(r.id)) tones.set(r.id, 1);
    else tones.set(r.id, 1);
  }
  return tones;
}

const body = z.object({
  enabled: z.array(z.string().regex(/^[a-z0-9-]{1,60}$/)).max(200),
  shipping: z.record(z.string().regex(/^[a-z0-9-]{1,60}$/), z.number().min(0).max(1_000_000).nullable()).optional(),
});

async function readShippingFile(): Promise<Record<string, number | null>> {
  const dl = await supabase().storage.from(BUCKET).download(SHIPPING_PATH);
  if (dl.error || !dl.data) return {};
  try {
    const parsed = JSON.parse(await dl.data.text()) as Record<string, number | null>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeShippingFile(rates: Record<string, number | null>) {
  const body = JSON.stringify(rates, null, 2);
  const { error } = await supabase().storage.from(BUCKET).upload(SHIPPING_PATH, body, {
    contentType: "application/json",
    upsert: true,
  });
  return error;
}

async function loadEnabled(): Promise<{ rows: Row[]; error: string | null }> {
  const db = supabase();
  const fileRates = await readShippingFile();
  const withShipping = await db.from("barrios").select("id, name, geometry, label, neighbors, shipping").eq("enabled", true).order("name");
  if (!withShipping.error) {
    return {
      rows: (withShipping.data as Row[]).map((r) => ({
        ...r,
        shipping: r.shipping ?? fileRates[r.id] ?? null,
      })),
      error: null,
    };
  }

  // Migración 0005 aún no aplicada: leemos sin la columna y usamos el archivo de precios.
  if (withShipping.error.code === "42703") {
    const legacy = await db.from("barrios").select("id, name, geometry, label, neighbors").eq("enabled", true).order("name");
    if (legacy.error) return { rows: [], error: "No se pudieron leer las zonas" };
    return {
      rows: (legacy.data as Omit<Row, "shipping">[]).map((r) => ({ ...r, shipping: fileRates[r.id] ?? null })),
      error: null,
    };
  }
  return { rows: [], error: "No se pudieron leer las zonas" };
}

export const barrios = new Hono()
  // Público: solo las zonas habilitadas, ya como GeoJSON listo para el mapa.
  .get("/", async (c) => {
    const { rows, error } = await loadEnabled();
    if (error) return c.json({ error }, 500);
    const tones = assignTones(rows);
    c.header("Cache-Control", "no-store"); // la caché la maneja la web (revalidación por etiqueta); un CDN en el medio la dejaba desactualizada
    return c.json({
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        geometry: r.geometry,
        properties: {
          id: r.id,
          name: r.name,
          tone: tones.get(r.id),
          label: r.label,
          shipping: r.shipping,
        },
      })),
    });
  })
  // Admin: todos los barrios (sin polígonos) para la lista de activar/desactivar + precio de envío.
  .get("/all", requireAdmin, async (c) => {
    const db = supabase();
    const fileRates = await readShippingFile();
    const withShipping = await db.from("barrios").select("id, name, enabled, shipping").order("name");
    if (!withShipping.error) {
      return c.json(
        (withShipping.data as { id: string; name: string; enabled: boolean; shipping: number | null }[]).map((r) => ({
          ...r,
          shipping: r.shipping ?? fileRates[r.id] ?? null,
        })),
      );
    }

    if (withShipping.error.code === "42703") {
      const legacy = await db.from("barrios").select("id, name, enabled").order("name");
      if (legacy.error) return c.json({ error: "No se pudieron leer los barrios" }, 500);
      return c.json(
        (legacy.data as { id: string; name: string; enabled: boolean }[]).map((r) => ({
          ...r,
          shipping: fileRates[r.id] ?? null,
        })),
      );
    }
    return c.json({ error: "No se pudieron leer los barrios" }, 500);
  })
  // Admin: guarda la selección completa de una vez (la función SQL es atómica) + precios de envío.
  .put("/", requireAdmin, async (c) => {
    const parsed = body.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "Datos inválidos" }, 400);
    const ids = [...new Set(parsed.data.enabled)];

    const db = supabase();
    const { data: known, error: readError } = await db.from("barrios").select("id");
    if (readError) return c.json({ error: "No se pudo guardar" }, 500);
    const unknown = ids.filter((id) => !(known as { id: string }[]).some((k) => k.id === id));
    if (unknown.length) return c.json({ error: `Barrios inexistentes: ${unknown.join(", ")}` }, 400);

    const { error } = await db.rpc("set_enabled_barrios", { ids });
    if (error) return c.json({ error: "No se pudo guardar" }, 500);

    if (parsed.data.shipping) {
      const rates = { ...(await readShippingFile()), ...parsed.data.shipping };
      const fileErr = await writeShippingFile(rates);
      if (fileErr) return c.json({ error: "No se pudo guardar el envío" }, 500);

      for (const [id, shipping] of Object.entries(parsed.data.shipping)) {
        const { error: shipErr } = await db.from("barrios").update({ shipping }).eq("id", id);
        if (shipErr && shipErr.code !== "42703") return c.json({ error: "No se pudo guardar el envío" }, 500);
      }
    }

    await revalidate("zones");
    return c.json({ ok: true, enabled: ids.length });
  });
