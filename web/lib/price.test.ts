import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPrice, parsePrice } from "./price.ts";

const ok = (s: string) => parsePrice(s);

test("acepta formatos es-UY válidos", () => {
  for (const [input, value] of [["1250", 1250], ["1.250", 1250], ["$ 1.250", 1250], ["1.250,00", 1250], ["240,0", 240], ["1.000.000", 1_000_000], ["", null], ["  ", null]] as const) {
    assert.deepEqual(ok(input), { ok: true, value }, input);
  }
});

test("rechaza decimales, separadores mal puestos, negativos y texto", () => {
  for (const bad of ["12,50", "12.5", "1.25", "1,250", "-5", "abc", "1e3", "1.2.3", "1.000.001", "9999999"]) {
    assert.equal(ok(bad).ok, false, bad);
  }
});

test("formatea con puntos de miles", () => {
  assert.equal(formatPrice(5), "5");
  assert.equal(formatPrice(1250), "1.250");
  assert.equal(formatPrice(1_000_000), "1.000.000");
});
