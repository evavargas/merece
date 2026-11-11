import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPrice, parsePrice } from "./price.ts";

test("acepta formatos válidos", () => {
  for (const [input, value] of [
    ["1250", 1250], ["1.250", 1250], ["$ 1.250", 1250], ["1.250,00", 1250], ["1.250,5", 1250.5], ["$ 1.250,50", 1250.5],
    ["12,50", 12.5], ["12.5", 12.5], ["12.50", 12.5], ["0,05", 0.05], ["240,0", 240], ["1.000.000", 1_000_000], ["", null], ["  ", null],
  ] as const) {
    assert.deepEqual(parsePrice(input), { ok: true, value }, input);
  }
});

test("rechaza más de 2 decimales, separadores mal puestos, negativos, texto y excesos", () => {
  for (const bad of ["1,250", "12,505", "1.2.3", "1.25.0", "-5", "abc", "1e3", "1.000.001", "1.000.000,01", "9999999", "1,2,3", ",5"]) {
    assert.equal(parsePrice(bad).ok, false, bad);
  }
});

test("formatea siempre con 2 decimales y puntos de miles", () => {
  assert.equal(formatPrice(5), "5,00");
  assert.equal(formatPrice(1250), "1.250,00");
  assert.equal(formatPrice(1250.5), "1.250,50");
  assert.equal(formatPrice(0.05), "0,05");
  assert.equal(formatPrice(1_000_000), "1.000.000,00");
});
