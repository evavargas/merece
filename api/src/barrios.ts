import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "./auth.js";
import { revalidate } from "./revalidate.js";
import { supabase } from "./supabase.js";

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

export const barrios = new Hono()
  // Público: solo las zonas habilitadas, ya como GeoJSON listo para el mapa.
  .get("/", async (c) => {
    const { data, error } = await supabase()
      .from("barrios")
      .select("id, name, geometry, label, neighbors, shipping")
      .eq("enabled", true)
      .order("name");
    if (error) return c.json({ error: "No se pudieron leer las zonas" }, 500);
    const rows = data as Row[];
    const tones = assignTones(rows);
    c.header("Cache-Control", "no-store");
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
    const { data, error } = await supabase().from("barrios").select("id, name, enabled, shipping").order("name");
    if (error) return c.json({ error: "No se pudieron leer los barrios" }, 500);
    return c.json(data);
  })
  // Admin: guarda la selección completa de una vez + precios de envío en la tabla.
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
      for (const [id, shipping] of Object.entries(parsed.data.shipping)) {
        const { error: shipErr } = await db.from("barrios").update({ shipping }).eq("id", id);
        if (shipErr) return c.json({ error: "No se pudo guardar el envío" }, 500);
      }
    }

    await revalidate("zones");
    return c.json({ ok: true, enabled: ids.length });
  });
