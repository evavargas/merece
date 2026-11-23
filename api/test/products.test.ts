import assert from "node:assert/strict";
import { test } from "node:test";

Object.assign(process.env, {
  SUPABASE_URL: "https://x.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "k",
  ADMIN_PASSWORD: "clave-de-prueba",
  SESSION_SECRET: "s".repeat(32),
});
const { app } = await import("../src/app.js");

const put = (body: unknown, cookie?: string) =>
  app.request("/api/products/order", {
    method: "PUT",
    headers: { "content-type": "application/json", ...(cookie && { cookie }) },
    body: JSON.stringify(body),
  });

test("reordering products requires an admin session", async () => {
  assert.equal((await put({ ids: [] })).status, 401);
});

test("reordering rejects bad bodies with a stable error code", async () => {
  const login = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "8.8.8.8" },
    body: JSON.stringify({ password: "clave-de-prueba" }),
  });
  const cookie = login.headers.get("set-cookie")!.split(";")[0];
  for (const bad of [{}, { ids: [] }, { ids: ["not-a-uuid"] }]) {
    const res = await put(bad, cookie);
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "invalid_input" });
  }
});
