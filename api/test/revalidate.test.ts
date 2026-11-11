import assert from "node:assert/strict";
import { test } from "node:test";

Object.assign(process.env, {
  SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ADMIN_PASSWORD: "clave-de-prueba", SESSION_SECRET: "s".repeat(32),
  WEB_URL: "https://web.example.com", REVALIDATE_SECRET: "secreto-de-prueba-largo",
});
const { revalidate } = await import("../src/revalidate.js");

test("avisa a la web con el secreto y las etiquetas", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response("{}"); }) as typeof fetch;
  try {
    await revalidate("products", "zones");
  } finally {
    globalThis.fetch = real;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://web.example.com/revalidate");
  assert.equal((calls[0].init.headers as Record<string, string>)["x-revalidate-secret"], "secreto-de-prueba-largo");
  assert.deepEqual(JSON.parse(calls[0].init.body as string), { tags: ["products", "zones"] });
});

test("si la web no responde, no lanza (el admin no debe fallar)", async () => {
  const real = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error("sin red"); }) as typeof fetch;
  try {
    await assert.doesNotReject(revalidate("products"));
  } finally {
    globalThis.fetch = real;
  }
});
