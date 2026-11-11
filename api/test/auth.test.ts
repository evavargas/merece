import assert from "node:assert/strict";
import { test } from "node:test";

Object.assign(process.env, {
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "k",
  ADMIN_PASSWORD: "clave-de-prueba",
  SESSION_SECRET: "s".repeat(32),
});
const { app } = await import("../src/app.js");

const login = (password: string) =>
  app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9" },
    body: JSON.stringify({ password }),
  });

test("rutas de admin rechazan sin sesión", async () => {
  assert.equal((await app.request("/api/auth/me")).status, 401);
  assert.equal((await app.request("/api/products", { method: "POST", body: "{}" })).status, 401);
  assert.equal((await app.request("/api/products/x", { method: "DELETE" })).status, 401);
});

test("clave correcta da cookie de sesión que habilita /me", async () => {
  const res = await login("clave-de-prueba");
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/i);
  const me = await app.request("/api/auth/me", { headers: { cookie: cookie.split(";")[0] } });
  assert.equal(me.status, 200);
});

test("clave incorrecta falla y se bloquea tras 10 intentos", async () => {
  for (let i = 0; i < 10; i++) assert.equal((await login("mala")).status, 401);
  assert.equal((await login("clave-de-prueba")).status, 429);
});
