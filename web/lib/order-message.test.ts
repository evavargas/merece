import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOrderMessage, type OrderLine } from "./order-message.ts";

const coffee: OrderLine = { product: { name: "Cappuccino", price: 220, stock: 5, category: "coffees" }, qty: 2, milk: "oat", temp: "hot" };
const cake: OrderLine = { product: { name: "Torta brownie", price: 1400, stock: 1, category: "made_to_order" }, qty: 1 };

test("organized message with options, stock, summary and cake note", () => {
  assert.equal(
    buildOrderMessage([coffee, cake], "delivery", { name: "Pocitos" }, 50),
    [
      "Hola Merece! Quiero hacer este pedido:",
      "",
      "*Pedido*",
      "• 2 × Cappuccino — $ 440,00",
      "   Vegetal (avena) · café caliente",
      "   Stock disponible: 5",
      "• 1 × Torta brownie — $ 1.400,00",
      "   Torta a pedido, +48 hs de anticipación",
      "   Stock disponible: 1",
      "",
      "*Resumen*",
      "Subtotal: $ 1.840,00",
      "Envío a Pocitos: ~$ 50,00 (estimado)",
      "Total estimado: $ 1.890,00",
      "",
      "Pago por transferencia.",
      "Acepto el mínimo de 48 horas de anticipación para tortas a pedido.",
    ].join("\n"),
  );
});

test("no totals when a product has no price; pickup is free", () => {
  const ask: OrderLine = { product: { name: "Torta chajá", price: null, stock: 2, category: "made_to_order" }, qty: 1 };
  const msg = buildOrderMessage([ask], "pickup", undefined, null);
  assert.match(msg, /• 1 × Torta chajá — Consultar/);
  assert.match(msg, /Retiro: a coordinar · sin costo/);
  assert.doesNotMatch(msg, /Subtotal|Total estimado/);
});

test("empty cart falls back to the short greeting", () => {
  assert.equal(buildOrderMessage([], "pickup", undefined, null), "Hola Merece! Quiero hacer un pedido.\nPago por transferencia.");
});
