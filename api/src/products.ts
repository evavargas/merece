import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "./auth.js";
import { revalidate } from "./revalidate.js";
import { BUCKET, imageUrl, supabase } from "./supabase.js";

const category = z.enum(["combos", "coffees", "desserts", "made_to_order"]);

const productInput = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  category,
  price: z.number().min(0).max(1_000_000).refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "max_2_decimals").nullable().default(null),
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
const orderInput = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

export const products = new Hono()
  .get("/", async (c) => {
    const { data, error } = await supabase().from("products").select("*").order("sort_order").order("name");
    if (error) return c.json({ error: "read_failed" }, 500);
    c.header("Cache-Control", "no-store"); // la caché la maneja la web (revalidación por etiqueta); un CDN en el medio la dejaba desactualizada
    return c.json((data as Row[]).map(toDto));
  })
  // Display order: `ids` come in the order the admin wants; each gets sort_order = its position. Registered before "/:id" routes.
  .put("/order", requireAdmin, async (c) => {
    const body = orderInput.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "invalid_input" }, 400);
    const db = supabase();
    const results = await Promise.all(body.data.ids.map((id, i) => db.from("products").update({ sort_order: i }).eq("id", id)));
    if (results.some((r) => r.error)) return c.json({ error: "update_failed" }, 500);
    await revalidate("products");
    return c.body(null, 204);
  })
  .post("/", requireAdmin, async (c) => {
    const body = productInput.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "invalid_input", issues: body.error.issues }, 400);
    const { data, error } = await supabase().from("products").insert(toColumns(body.data)).select().single();
    if (error) return c.json({ error: "create_failed" }, 500);
    await revalidate("products");
    return c.json(toDto(data as Row), 201);
  })
  .patch("/:id", requireAdmin, async (c) => {
    const id = idParam.safeParse(c.req.param("id"));
    const body = productInput.partial().safeParse(await c.req.json().catch(() => null));
    if (!id.success || !body.success) return c.json({ error: "invalid_input" }, 400);
    // partial() conserva los defaults de zod; solo se actualiza lo que vino en el body.
    const sent = await c.req.json();
    const patch = Object.fromEntries(Object.entries(body.data).filter(([k]) => k in sent));
    const { data, error } = await supabase().from("products").update(toColumns(patch)).eq("id", id.data).select().maybeSingle();
    if (error) return c.json({ error: "update_failed" }, 500);
    if (!data) return c.json({ error: "not_found" }, 404);
    await revalidate("products");
    return c.json(toDto(data as Row));
  })
  .delete("/:id", requireAdmin, async (c) => {
    const id = idParam.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ error: "invalid_input" }, 400);
    const { data, error } = await supabase().from("products").delete().eq("id", id.data).select("image_path").maybeSingle();
    if (error) return c.json({ error: "delete_failed" }, 500);
    const path = (data as { image_path: string | null } | null)?.image_path;
    if (path) await supabase().storage.from(BUCKET).remove([path]);
    await revalidate("products");
    return c.body(null, 204);
  })
  .put("/:id/image", requireAdmin, async (c) => {
    const id = idParam.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ error: "invalid_input" }, 400);
    const form = await c.req.parseBody().catch(() => null);
    const file = form?.["file"];
    if (!(file instanceof File)) return c.json({ error: "file_missing" }, 400);
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return c.json({ error: "unsupported_image_type" }, 415);
    if (file.size > MAX_IMAGE_BYTES) return c.json({ error: "image_too_large" }, 413);

    const db = supabase();
    const { data: current } = await db.from("products").select("image_path").eq("id", id.data).maybeSingle();
    if (!current) return c.json({ error: "not_found" }, 404);

    const path = `${id.data}/${Date.now()}.${ext}`;
    const up = await db.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) return c.json({ error: "upload_failed" }, 500);

    const { data, error } = await db.from("products").update({ image_path: path }).eq("id", id.data).select().single();
    if (error) {
      await db.storage.from(BUCKET).remove([path]);
      return c.json({ error: "save_failed" }, 500);
    }
    const old = (current as { image_path: string | null }).image_path;
    if (old) await db.storage.from(BUCKET).remove([old]);
    await revalidate("products");
    return c.json(toDto(data as Row));
  });
