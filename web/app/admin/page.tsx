"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { OptionSelect } from "@/components/ui/select";
import { CATEGORIES, type Category, type Product } from "@/lib/api";

class Unauthorized extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 401 && !path.endsWith("/login")) throw new Unauthorized();
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Algo salió mal");
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const field =
  "min-h-11 w-full rounded-xl border-2 border-input bg-card px-3 text-foreground placeholder:text-muted-foreground";

export default function AdminPage() {
  const [state, setState] = useState<"loading" | "out" | "in">("loading");

  useEffect(() => {
    call("/api/auth/me").then(() => setState("in"), () => setState("out"));
  }, []);

  if (state === "loading") return <main className="p-8 text-center">Cargando…</main>;
  if (state === "out") return <Login onDone={() => setState("in")} />;
  return <Panel onLogout={() => setState("out")} />;
}

function Login({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get("password");
    setBusy(true);
    setError("");
    try {
      await call("/api/auth/login", json("POST", { password }));
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-5xl">Merece</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 font-bold">
          Clave
          <input name="password" type="password" required autoFocus autoComplete="current-password" className={field} aria-describedby={error ? "login-error" : undefined} />
        </label>
        {error && <p id="login-error" role="alert" className="text-destructive">{error}</p>}
        <Button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
      </form>
    </main>
  );
}

function Panel({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  // Cualquier 401 devuelve al login; el resto se muestra como mensaje.
  const guard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      setError("");
      return await fn();
    } catch (e) {
      if (e instanceof Unauthorized) onLogout();
      else setError((e as Error).message);
    }
  }, [onLogout]);

  const load = useCallback(async () => {
    const list = await guard(() => call<Product[]>("/api/products"));
    if (list) setProducts(list);
  }, [guard]);

  useEffect(() => { void load(); }, [load]);

  const replace = (p: Product) => setProducts((all) => all.map((x) => (x.id === p.id ? p : x)));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Stock</h1>
        <Button variant="outline" className="!min-h-11" onClick={async () => { await call("/api/auth/logout", { method: "POST" }); onLogout(); }}>
          Salir
        </Button>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-muted p-3 text-destructive">{error}</p>}

      <ul className="flex flex-col gap-3">
        {products.map((p) => (
          <Row
            key={p.id}
            product={p}
            onSave={(patch) => guard(async () => replace(await call<Product>(`/api/products/${p.id}`, json("PATCH", patch))))}
            onPhoto={(file) => guard(async () => {
              const body = new FormData();
              body.append("file", file);
              replace(await call<Product>(`/api/products/${p.id}/image`, { method: "PUT", body }));
            })}
            onDelete={() => guard(async () => {
              await call(`/api/products/${p.id}`, { method: "DELETE" });
              setProducts((all) => all.filter((x) => x.id !== p.id));
            })}
          />
        ))}
      </ul>

      <NewProduct onCreate={(input) => guard(async () => {
        const created = await call<Product>("/api/products", json("POST", input));
        setProducts((all) => [...all, created]);
      })} />
    </main>
  );
}

function Row({ product: p, onSave, onPhoto, onDelete }: {
  product: Product;
  onSave: (patch: { price: number | null; stock: number }) => Promise<unknown>;
  onPhoto: (f: File) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [price, setPrice] = useState(p.price?.toString() ?? "");
  const [stock, setStock] = useState(p.stock.toString());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const nextPrice = price.trim() === "" ? null : Number(price);
  const nextStock = Number(stock);
  const valid = Number.isInteger(nextStock) && nextStock >= 0 && (nextPrice === null || (Number.isInteger(nextPrice) && nextPrice >= 0));
  const dirty = nextPrice !== p.price || nextStock !== p.stock;

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); await fn(); setBusy(false); };

  return (
    <li className="grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-3 rounded-2xl bg-card p-3 sm:grid-cols-[64px_1fr_auto_auto_auto]">
      <label className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-accent text-center text-[11px] font-bold leading-tight text-on-color focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring">
        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de admin, no necesita optimización */}
        {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : "+ Foto"}
        <span className="sr-only">Cambiar foto de {p.name}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(() => onPhoto(f)); e.target.value = ""; }} />
      </label>
      <div className="min-w-0">
        <p className="truncate font-bold">{p.name}</p>
        <p className="text-xs text-muted-foreground">{CATEGORIES.find((c) => c.id === p.category)?.title}</p>
      </div>
      <label className="flex flex-col text-xs font-bold sm:w-28">
        Precio $
        <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Consultar" className={field} />
      </label>
      <label className="flex flex-col text-xs font-bold sm:w-24">
        Stock
        <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={field} />
      </label>
      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <Button className="!min-h-11 flex-1 !px-5" disabled={!dirty || !valid || busy} onClick={() => run(() => onSave({ price: nextPrice, stock: nextStock }))}>
          Guardar
        </Button>
        {confirming ? (
          <Button variant="outline" className="!min-h-11 !px-4 !border-destructive !text-destructive" onClick={() => run(onDelete)}>¿Borrar?</Button>
        ) : (
          <Button variant="ghost" className="!min-h-11 !px-4" aria-label={`Borrar ${p.name}`} onClick={() => { setConfirming(true); setTimeout(() => setConfirming(false), 4000); }}>✕</Button>
        )}
      </div>
    </li>
  );
}

function NewProduct({ onCreate }: { onCreate: (p: { name: string; category: Category; price: number | null; stock: number }) => Promise<unknown> }) {
  const [category, setCategory] = useState<Category>("pasteleria");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const price = String(f.get("price")).trim();
    await onCreate({ name: String(f.get("name")), category, price: price === "" ? null : Number(price), stock: Number(f.get("stock") || 0) });
    form.reset();
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl bg-muted p-4 sm:grid-cols-[1fr_auto_6rem_5rem_auto] sm:items-end">
      <label className="flex flex-col text-xs font-bold">Nuevo producto<input name="name" required maxLength={80} className={field} placeholder="Nombre" /></label>
      <div className="flex flex-col text-xs font-bold">
        Categoría
        <OptionSelect label="Categoría" value={category} onValueChange={(v) => setCategory(v as Category)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.title }))} />
      </div>
      <label className="flex flex-col text-xs font-bold">Precio $<input name="price" inputMode="numeric" pattern="[0-9]*" className={field} placeholder="Consultar" /></label>
      <label className="flex flex-col text-xs font-bold">Stock<input name="stock" inputMode="numeric" pattern="[0-9]*" defaultValue="0" className={field} /></label>
      <Button className="!min-h-11">Agregar</Button>
    </form>
  );
}
