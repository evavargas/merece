import assert from "node:assert/strict";
import { test } from "node:test";
import { t, tError, tl } from "./i18n/index.ts";

test("fills placeholders and leaves unknown ones untouched", () => {
  assert.equal(t("footer.rights", { year: 2026 }), "© 2026 Merece. Todos los derechos reservados.");
  assert.equal(t("product.askMessage", { name: "Lemon pie" }), "Hola Merece! Quería consultar por: Lemon pie");
  assert.equal(t("product.askMessage"), "Hola Merece! Quería consultar por: {name}");
});

test("uses the singular form only when count is 1", () => {
  assert.equal(t("product.stock", { count: 1 }), "Queda 1");
  assert.equal(t("product.stock", { count: 5 }), "Quedan 5");
  assert.equal(t("product.stock", { count: 0 }), "Quedan 0");
});

test("lists and API error codes", () => {
  assert.deepEqual(tl("category.coffees.neon"), ["¿Qué café te llevás hoy?", "Elegí tu bebida favorita"]);
  assert.equal(tError("wrong_password"), "Clave incorrecta");
  assert.equal(tError("something_new"), "Algo salió mal");
});
