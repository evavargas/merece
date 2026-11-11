import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "./auth.ts";
import { supabase } from "./supabase.ts";

type Row = { id: string; name: string; geometry: unknown; label: [number, number]; neighbors: string[] };

// Colores 0/1/2: un barrio nunca repite el de un lindero habilitado. Se asignan por orden alfabético
// para que sean estables. shortcut: voraz, con 3 colores puede repetir en zonas muy densas; sumar un 4º si pasa.
export function assignTones(rows: Pick<Row, "id" | "name" | "neighbors">[]): Map<string, number> {
  const tones = new Map<string, number>();
  for (const r of [...rows].sort((a, b) => a.name.localeCompare(b.name, "es"))) {
    const used = new Set(r.neighbors.map((n) => tones.get(n)));
    tones.set(r.id, [0, 1, 2].find((t) => !used.has(t)) ?? 2);
  }
  return tones;
}

const body = z.object({ enabled: z.array(z.string().regex(/^[a-z0-9-]{1,60}$/)).max(200) });

export const barrios = new Hono()
  // Público: solo las zonas habilitadas, ya como GeoJSON listo para el mapa.
  .get("/", async (c) => {
    const { data, error } = await supabase().from("barrios").select("id, name, geometry, label, neighbors").eq("enabled", true).order("name");
    if (error) return c.json({ error: "No se pudieron leer las zonas" }, 500);
    const rows = data as Row[];
    const tones = assignTones(rows);
    c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return c.json({
      type: "FeatureCollection",
      features: rows.map((r) => ({ type: "Feature", geometry: r.geometry, properties: { id: r.id, name: r.name, tone: tones.get(r.id), label: r.label } })),
    });
  })
  // Admin: todos los barrios (sin polígonos) para la lista de activar/desactivar.
  .get("/all", requireAdmin, async (c) => {
    const { data, error } = await supabase().from("barrios").select("id, name, enabled").order("name");
    if (error) return c.json({ error: "No se pudieron leer los barrios" }, 500);
    return c.json(data);
  })
  // Admin: guarda la selección completa de una vez (la función SQL es atómica).
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
    return c.json({ ok: true, enabled: ids.length });
  });
