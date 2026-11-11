import { Hono } from "hono";
import { auth } from "./auth.js";
import { barrios } from "./barrios.js";
import { products } from "./products.js";

export const app = new Hono()
  .get("/health", (c) => c.json({ ok: true }))
  .route("/api/auth", auth)
  .route("/api/products", products)
  .route("/api/barrios", barrios);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Error interno" }, 500);
});

// Vercel (Hono zero-config) toma este archivo como entrada y exige el export por defecto.
export default app;
