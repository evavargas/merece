import { env } from "./env.js";

export type Tag = "products" | "zones";

// Avisa a la web que cambió algo para que renueve su caché. Nunca rompe la escritura del admin:
// si falla, la landing se corrige sola por la revalidación de seguridad (1 h).
// Se espera la respuesta porque en serverless la función se congela al responder.
export async function revalidate(...tags: Tag[]): Promise<void> {
  const { WEB_URL, REVALIDATE_SECRET } = env();
  if (!WEB_URL || !REVALIDATE_SECRET) return;
  try {
    const res = await fetch(`${WEB_URL}/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": REVALIDATE_SECRET },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error(`revalidate ${tags}: ${res.status}`);
  } catch (e) {
    console.error(`revalidate ${tags}:`, (e as Error).message);
  }
}
