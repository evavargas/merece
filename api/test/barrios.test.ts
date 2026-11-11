import assert from "node:assert/strict";
import { test } from "node:test";

Object.assign(process.env, { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ADMIN_PASSWORD: "clave-de-prueba", SESSION_SECRET: "s".repeat(32) });
const { assignTones } = await import("../src/barrios.ts");
const { app } = await import("../src/app.ts");

test("barrios linderos nunca comparten color", () => {
  // a-b-c forman un triángulo; d solo toca a
  const rows = [
    { id: "a", name: "A", neighbors: ["b", "c", "d"] },
    { id: "b", name: "B", neighbors: ["a", "c"] },
    { id: "c", name: "C", neighbors: ["a", "b"] },
    { id: "d", name: "D", neighbors: ["a"] },
  ];
  const tones = assignTones(rows);
  for (const r of rows) for (const n of r.neighbors) assert.notEqual(tones.get(r.id), tones.get(n), `${r.id}-${n}`);
});

test("el color es estable: no depende del orden de entrada", () => {
  const rows = [{ id: "x", name: "X", neighbors: ["y"] }, { id: "y", name: "Y", neighbors: ["x"] }];
  assert.deepEqual([...assignTones(rows)], [...assignTones([...rows].reverse())]);
});

test("editar zonas exige sesión de admin", async () => {
  assert.equal((await app.request("/api/barrios/all")).status, 401);
  assert.equal((await app.request("/api/barrios", { method: "PUT", body: JSON.stringify({ enabled: [] }) })).status, 401);
});
