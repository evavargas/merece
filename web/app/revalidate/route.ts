import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

const ALLOWED = new Set(["products", "zones"]);

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// El API llama acá después de cada cambio del admin; invalida la caché de la landing al instante.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: "Revalidación no configurada" }, { status: 503 });
  if (!same(request.headers.get("x-revalidate-secret") ?? "", secret)) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t): t is string => typeof t === "string" && ALLOWED.has(t)) : [];
  if (tags.length === 0) return Response.json({ error: "Sin etiquetas válidas" }, { status: 400 });

  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  return Response.json({ ok: true, tags });
}
