import { createHash, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { z } from "zod";
import { env } from "./env.js";

const COOKIE = "merece_session";
const SESSION_SECONDS = 60 * 60 * 12;
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60 * 1000;

// shortcut: contador en memoria por IP, se pierde al reiniciar y no se comparte entre instancias;
// pasar a Redis/Upstash si el API corre en más de una instancia.
const fails = new Map<string, { count: number; resetAt: number }>();

const digest = (s: string) => createHash("sha256").update(s).digest();
const passwordOk = (given: string) => timingSafeEqual(digest(given), digest(env().ADMIN_PASSWORD));

const clientKey = (forwarded: string | undefined) => forwarded?.split(",")[0]?.trim() || "local";

export const requireAdmin = createMiddleware(async (c, next) => {
  const token = getCookie(c, COOKIE);
  try {
    if (!token) throw new Error("no token");
    await verify(token, env().SESSION_SECRET, "HS256");
  } catch {
    return c.json({ error: "No autorizado" }, 401);
  }
  await next();
});

export const auth = new Hono()
  .post("/login", async (c) => {
    const key = clientKey(c.req.header("x-forwarded-for"));
    const now = Date.now();
    const entry = fails.get(key);
    if (entry && entry.resetAt > now && entry.count >= MAX_FAILS) {
      return c.json({ error: "Demasiados intentos, probá más tarde" }, 429);
    }

    const body = z.object({ password: z.string().max(200) }).safeParse(await c.req.json().catch(() => null));
    if (!body.success || !passwordOk(body.data.password)) {
      const live = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
      fails.set(key, { ...live, count: live.count + 1 });
      return c.json({ error: "Clave incorrecta" }, 401);
    }

    fails.delete(key);
    const token = await sign({ admin: true, exp: Math.floor(now / 1000) + SESSION_SECONDS }, env().SESSION_SECRET, "HS256");
    setCookie(c, COOKIE, token, {
      httpOnly: true,
      secure: env().NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return c.json({ ok: true });
  })
  .post("/logout", (c) => {
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json({ ok: true });
  })
  .get("/me", requireAdmin, (c) => c.json({ ok: true }));
