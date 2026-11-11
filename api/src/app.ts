import { Hono } from "hono";
import { auth } from "./auth.ts";
import { products } from "./products.ts";

export const app = new Hono()
  .get("/health", (c) => c.json({ ok: true }))
  .route("/api/auth", auth)
  .route("/api/products", products);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Error interno" }, 500);
});
