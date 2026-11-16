import assert from "node:assert/strict";
import { test } from "node:test";

Object.assign(process.env, { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", ADMIN_PASSWORD: "clave-de-prueba", SESSION_SECRET: "s".repeat(32) });
const { assignTones } = await import("../src/barrios.js");
const { app } = await import("../src/app.js");

test("cerca = lavanda (0), lejos = durazno (1)", () => {
  const rows = [
    { id: "pocitos", name: "Pocitos", neighbors: [] },
    { id: "parque-rodo", name: "Parque Rodó", neighbors: [] },
    { id: "punta-carretas", name: "Punta Carretas", neighbors: [] },
    { id: "centro", name: "Centro", neighbors: [] },
    { id: "cordon", name: "Cordón", neighbors: [] },
    { id: "barrio-sur", name: "Barrio Sur", neighbors: [] },
    { id: "tres-cruces", name: "Tres Cruces", neighbors: [] },
    { id: "palermo", name: "Palermo", neighbors: [] },
  ];
  const tones = assignTones(rows);
  assert.equal(tones.get("pocitos"), 0);
  assert.equal(tones.get("parque-rodo"), 0);
  assert.equal(tones.get("punta-carretas"), 0);
  assert.equal(tones.get("centro"), 1);
  assert.equal(tones.get("cordon"), 1);
  assert.equal(tones.get("barrio-sur"), 1);
  assert.equal(tones.get("tres-cruces"), 1);
  assert.equal(tones.get("palermo"), 1);
});

test("el color es estable: no depende del orden de entrada", () => {
  const rows = [
    { id: "pocitos", name: "Pocitos", neighbors: [] },
    { id: "centro", name: "Centro", neighbors: [] },
  ];
  const a = Object.fromEntries(assignTones(rows));
  const b = Object.fromEntries(assignTones([...rows].reverse()));
  assert.deepEqual(a, b);
});

test("editar zonas exige sesión de admin", async () => {
  assert.equal((await app.request("/api/barrios/all")).status, 401);
  assert.equal((await app.request("/api/barrios", { method: "PUT", body: JSON.stringify({ enabled: [] }) })).status, 401);
});
