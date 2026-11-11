import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "./auth.js";
import { BUCKET, imageUrl, supabase } from "./supabase.js";

const category = z.enum(["pasteleria", "a_pedido", "acompanar"]);

const productInput = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  category,
  price: z.number().min(0).max(1_000_000).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Máximo 2 decimales").nullable().default(null),
  stock: z.number().int().min(0).max(9999).default(0),
  sortOrder: z.number().int().default(0),
});

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Row = {
  id: string; name: string; description: string; category: string;
  price: number | null; stock: number; image_path: string | null; sort_order: number;
};

const toDto = (r: Row) => ({
  id: r.id, name: r.name, description: r.description, category: r.category,
  price: r.price, stock: r.stock, imageUrl: imageUrl(r.image_path), sortOrder: r.sort_order,
});

const toColumns = (p: Partial<z.infer<typeof productInput>>) => ({
  ...(p.name !== undefined && { name: p.name }),
  ...(p.description !== undefined && { description: p.description }),
  ...(p.category !== undefined && { category: p.category }),
  ...(p.price !== undefined && { price: p.price }),
  ...(p.stock !== undefined && { stock: p.stock }),
  ...(p.sortOrder !== undefined && { sort_order: p.sortOrder }),
});

const idParam = z.uuid();

export const products = new Hono()
  .get("/", async (c) => {
    const { data, error } = await supabase().from("products").select("*").order("sort_order").order("name");
    if (error) return c.json({ error: "No se pudo leer el catálogo" }, 500);
    c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return c.json((data as Row[]).map(toDto));
  })
  .post("/", requireAdmin, async (c) => {
    const body = productInput.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Datos inválidos", issues: body.error.issues }, 400);
    const { data, error } = await supabase().from("products").insert(toColumns(body.data)).select().single();
    if (error) return c.json({ error: "No se pudo crear" }, 500);
    return c.json(toDto(data as Row), 201);
  })
  .patch("/:id", requireAdmin, async (c) => {
    const id = idParam.safeParse(c.req.param("id"));
    const body = productInput.partial().safeParse(await c.req.json().catch(() => null));
    if (!id.success || !body.success) return c.json({ error: "Datos inválidos" }, 400);
    // partial() conserva los defaults de zod; solo se actualiza lo que vino en el body.
    const sent = await c.req.json();
    const patch = Object.fromEntries(Object.entries(body.data).filter(([k]) => k in sent));
    const { data, error } = await supabase().from("products").update(toColumns(patch)).eq("id", id.data).select().maybeSingle();
    if (error) return c.json({ error: "No se pudo actualizar" }, 500);
    if (!data) return c.json({ error: "No existe" }, 404);
    return c.json(toDto(data as Row));
  })
  .delete("/:id", requireAdmin, async (c) => {
    const id = idParam.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ error: "Datos inválidos" }, 400);
    const { data, error } = await supabase().from("products").delete().eq("id", id.data).select("image_path").maybeSingle();
    if (error) return c.json({ error: "No se pudo borrar" }, 500);
    const path = (data as { image_path: string | null } | null)?.image_path;
    if (path) await supabase().storage.from(BUCKET).remove([path]);
    return c.body(null, 204);
  })
  .put("/:id/image", requireAdmin, async (c) => {
    const id = idParam.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ error: "Datos inválidos" }, 400);
    const form = await c.req.parseBody().catch(() => null);
    const file = form?.["file"];
    if (!(file instanceof File)) return c.json({ error: "Falta el archivo" }, 400);
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return c.json({ error: "Solo JPG, PNG o WebP" }, 415);
    if (file.size > MAX_IMAGE_BYTES) return c.json({ error: "Máximo 5 MB" }, 413);

    const db = supabase();
    const { data: current } = await db.from("products").select("image_path").eq("id", id.data).maybeSingle();
    if (!current) return c.json({ error: "No existe" }, 404);

    const path = `${id.data}/${Date.now()}.${ext}`;
    const up = await db.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) return c.json({ error: "No se pudo subir la foto" }, 500);

    const { data, error } = await db.from("products").update({ image_path: path }).eq("id", id.data).select().single();
    if (error) {
      await db.storage.from(BUCKET).remove([path]);
      return c.json({ error: "No se pudo guardar la foto" }, 500);
    }
    const old = (current as { image_path: string | null }).image_path;
    if (old) await db.storage.from(BUCKET).remove([old]);
    return c.json(toDto(data as Row));
  });
