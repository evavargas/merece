"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonClass } from "@/components/Button";
import { OptionSelect } from "@/components/ui/select";
import { formatPrice, parsePrice } from "@/lib/price";
import { CATEGORIES, isComboProduct, type Category, type Product } from "@/lib/api";
import { t, tError } from "@/lib/i18n";

const DESCRIPTION_MAX = 300;

class Unauthorized extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 401 && !path.endsWith("/login")) throw new Unauthorized();
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(tError(String(data.error ?? "")));
  return data as T;
}

const displayCategory = (p: Pick<Product, "name" | "category">): Category => (isComboProduct(p) ? "combos" : p.category);
const bySortOrder = (a: Product, b: Product) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

function BackToSite({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`${buttonClass("ghost")} !min-h-11 ${className}`}>
      ← {t("admin.backToSite")}
    </Link>
  );
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const field =
  "min-h-11 w-full rounded-xl border-2 border-input bg-card px-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-0";

export default function AdminPage() {
  const [state, setState] = useState<"loading" | "out" | "in">("loading");

  useEffect(() => {
    call("/api/auth/me").then(() => setState("in"), () => setState("out"));
  }, []);

  if (state === "loading") return <main className="p-8 text-center">{t("admin.loading")}</main>;
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
      <BackToSite className="self-start !px-0" />
      <h1 className="font-display text-5xl">{t("brand.name")}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 font-bold">
          {t("admin.password")}
          <input name="password" type="password" required autoFocus autoComplete="current-password" className={field} aria-describedby={error ? "login-error" : undefined} />
        </label>
        {error && <p id="login-error" role="alert" className="text-destructive">{error}</p>}
        <Button disabled={busy}>{t(busy ? "admin.signingIn" : "admin.signIn")}</Button>
      </form>
    </main>
  );
}

function Panel({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"productos" | "barrios">("productos");

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

  const move = (cat: Category, id: string, dir: -1 | 1) => guard(async () => {
    const ids = products.filter((p) => displayCategory(p) === cat).sort(bySortOrder).map((p) => p.id);
    const from = ids.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await call("/api/products/order", json("PUT", { ids }));
    setProducts((all) => all.map((p) => (ids.includes(p.id) ? { ...p, sortOrder: ids.indexOf(p.id) } : p)));
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col md:flex-row">
      <aside className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border p-4 md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:flex-col md:items-stretch md:border-b-0 md:border-r md:p-6">
        <p className="font-display text-3xl md:mb-4">{t("brand.name")}</p>
        <nav aria-label="Secciones" className="flex gap-2 md:flex-col">
          {([["productos", t("admin.tabProducts")], ["barrios", t("admin.tabZones")]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              className={`min-h-11 cursor-pointer rounded-full px-5 text-left font-bold ${tab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex gap-2 md:ml-0 md:mt-auto md:flex-col md:items-stretch">
          <BackToSite className="!px-5 md:text-left" />
          <Button variant="outline" className="!min-h-11" onClick={async () => { await call("/api/auth/logout", { method: "POST" }); onLogout(); }}>
            {t("admin.logout")}
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
        <h1 className="font-display mb-6 text-4xl">{t(tab === "productos" ? "admin.tabProducts" : "admin.tabZones")}</h1>
      {error && <p role="alert" className="mb-4 rounded-xl bg-muted p-3 text-destructive">{error}</p>}

      {tab === "barrios" ? (
        <Zones guard={guard} />
      ) : (
        <>
      <p className="mb-4 text-sm text-muted-foreground">{t("admin.orderHint")}</p>
      {CATEGORIES.map((cat) => {
        const items = products.filter((p) => displayCategory(p) === cat.id).sort(bySortOrder);
        if (items.length === 0) return null;
        return (
          <section key={cat.id} className="mb-8" aria-labelledby={`admin-cat-${cat.id}`}>
            <h2 id={`admin-cat-${cat.id}`} className="mb-3 text-lg font-bold">{t(`category.${cat.id}.title`)}</h2>
            <ul className="flex flex-col gap-3">
              {items.map((p, i) => (
                <Row
                  key={p.id}
                  product={p}
                  canUp={i > 0}
                  canDown={i < items.length - 1}
                  onMove={(dir) => move(cat.id, p.id, dir)}
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
          </section>
        );
      })}

      <NewProduct onCreate={(input) => guard(async () => {
        const section = displayCategory(input);
        const sortOrder = 1 + Math.max(-1, ...products.filter((p) => displayCategory(p) === section).map((p) => p.sortOrder));
        const created = await call<Product>("/api/products", json("POST", { ...input, sortOrder }));
        setProducts((all) => [...all, created]);
      })} />
        </>
      )}
    </main>
    </div>
  );
}

function Row({ product: p, canUp, canDown, onMove, onSave, onPhoto, onDelete }: {
  product: Product;
  canUp: boolean;
  canDown: boolean;
  onMove: (dir: -1 | 1) => Promise<unknown>;
  onSave: (patch: { price: number | null; stock: number; description: string }) => Promise<unknown>;
  onPhoto: (f: File) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const [price, setPrice] = useState(p.price === null ? "" : formatPrice(p.price));
  const [stock, setStock] = useState(p.stock.toString());
  const [description, setDescription] = useState(p.description);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const parsed = parsePrice(price);
  const nextPrice = parsed.ok ? parsed.value : null;
  const nextStock = Number(stock);
  const valid = parsed.ok && Number.isInteger(nextStock) && nextStock >= 0 && nextStock <= 9999 && description.length <= DESCRIPTION_MAX;
  const dirty = nextPrice !== p.price || nextStock !== p.stock || description.trim() !== p.description;

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); await fn(); setBusy(false); };

  return (
    <li className="grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-3 rounded-2xl bg-card p-3 sm:grid-cols-[64px_1fr_auto_auto_auto]">
      <label className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-accent text-center text-[11px] font-bold leading-tight text-on-color focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : t("admin.addPhoto")}
        <span className="sr-only">{t("admin.changePhoto", { name: p.name })}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(() => onPhoto(f)); e.target.value = ""; }} />
      </label>
      <div className="min-w-0">
        <p className="truncate font-bold">{p.name}</p>
        <p className="text-xs text-muted-foreground">
          {t(`category.${displayCategory(p)}.title`)}
        </p>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-bold sm:w-28">
        {t("admin.price")}
        <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={() => parsed.ok && setPrice(parsed.value === null ? "" : formatPrice(parsed.value))} placeholder={t("price.ask")} aria-invalid={!parsed.ok} aria-describedby={parsed.ok ? undefined : `err-${p.id}`} className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-bold sm:w-24">
        {t("admin.stock")}
        <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={field} />
      </label>
      <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold sm:order-last sm:col-span-full">
        {t("admin.description")}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={DESCRIPTION_MAX} placeholder={t("admin.descriptionPlaceholder")} className={`${field} py-2 font-normal`} />
        <span className="self-end font-normal text-muted-foreground">{description.length}/{DESCRIPTION_MAX}</span>
      </label>
      {!parsed.ok && <p id={`err-${p.id}`} role="alert" className="col-span-2 text-sm text-destructive sm:col-span-full">{parsed.error}</p>}
      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <Button variant="ghost" className="!min-h-11 !px-3" aria-label={t("admin.moveUp", { name: p.name })} disabled={!canUp || busy} onClick={() => run(() => onMove(-1))}>▲</Button>
        <Button variant="ghost" className="!min-h-11 !px-3" aria-label={t("admin.moveDown", { name: p.name })} disabled={!canDown || busy} onClick={() => run(() => onMove(1))}>▼</Button>
        <Button className="!min-h-11 flex-1 !px-5" disabled={!dirty || !valid || busy} onClick={() => run(async () => { await onSave({ price: nextPrice, stock: nextStock, description: description.trim() }); setDescription((d) => d.trim()); })}>
          {t("admin.save")}
        </Button>
        {confirming ? (
          <Button variant="outline" className="!min-h-11 !px-4 !border-destructive !text-destructive" onClick={() => run(onDelete)}>{t("admin.confirmDelete")}</Button>
        ) : (
          <Button variant="ghost" className="!min-h-11 !px-4" aria-label={t("admin.delete", { name: p.name })} onClick={() => { setConfirming(true); setTimeout(() => setConfirming(false), 4000); }}>✕</Button>
        )}
      </div>
    </li>
  );
}

function NewProduct({ onCreate }: { onCreate: (p: { name: string; category: Category; price: number | null; stock: number }) => Promise<unknown> }) {
  const [category, setCategory] = useState<Category>("desserts");
  const [priceError, setPriceError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const price = parsePrice(String(f.get("price")));
    if (!price.ok) return setPriceError(price.error);
    setPriceError("");
    const rawName = String(f.get("name")).trim();
    const name = category === "combos" && !/^combo\b/i.test(rawName) ? `Combo ${rawName}` : rawName;
    const savedCategory: Category = category === "combos" ? "desserts" : category;
    await onCreate({ name, category: savedCategory, price: price.value, stock: Number(f.get("stock") || 0) });
    form.reset();
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-3 rounded-2xl bg-muted p-4 sm:grid-cols-[1fr_auto_6rem_5rem_auto] sm:items-end">
      <label className="flex flex-col gap-1.5 text-xs font-bold">{t("admin.newProduct")}<input name="name" required maxLength={80} className={field} placeholder={t("admin.name")} /></label>
      <div className="flex flex-col gap-1.5 text-xs font-bold">
        {t("admin.category")}
        <OptionSelect label={t("admin.category")} value={category} onValueChange={(v) => setCategory(v as Category)} options={CATEGORIES.map((c) => ({ value: c.id, label: t(`category.${c.id}.title`) }))} />
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-bold">{t("admin.price")}<input name="price" inputMode="decimal" className={field} placeholder={t("price.ask")} aria-invalid={!!priceError} aria-describedby={priceError ? "new-price-error" : undefined} /></label>
      <label className="flex flex-col gap-1.5 text-xs font-bold">{t("admin.stock")}<input name="stock" inputMode="numeric" pattern="[0-9]*" defaultValue="0" className={field} /></label>
      <Button className="!min-h-11">{t("common.add")}</Button>
      {priceError && <p id="new-price-error" role="alert" className="text-sm text-destructive sm:col-span-full">{priceError}</p>}
    </form>
  );
}

type Barrio = { id: string; name: string; enabled: boolean; shipping: number | null };

function Zones({ guard }: { guard: <T>(fn: () => Promise<T>) => Promise<T | undefined> }) {
  const [barrios, setBarrios] = useState<Barrio[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shippingDraft, setShippingDraft] = useState<Record<string, string>>({});
  const [savedShipping, setSavedShipping] = useState<Record<string, number | null>>({});
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void guard(() => call<Barrio[]>("/api/barrios/all")).then((list) => {
      if (!list) return;
      const on = new Set(list.filter((b) => b.enabled).map((b) => b.id));
      const ship: Record<string, number | null> = {};
      const draft: Record<string, string> = {};
      for (const b of list) {
        ship[b.id] = b.shipping;
        draft[b.id] = b.shipping === null ? "" : formatPrice(b.shipping);
      }
      setBarrios(list);
      setSaved(on);
      setSelected(on);
      setSavedShipping(ship);
      setShippingDraft(draft);
    });
  }, [guard]);

  const shippingDirty = [...selected].some((id) => {
    const parsed = parsePrice(shippingDraft[id] ?? "");
    if (!parsed.ok) return true;
    return parsed.value !== (savedShipping[id] ?? null);
  });
  const dirty = selected.size !== saved.size || [...selected].some((id) => !saved.has(id)) || shippingDirty;
  const norm = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const shown = barrios.filter((b) => norm(b.name).includes(norm(query)));

  const toggle = (id: string) => {
    setDone(false);
    setSelected((cur) => { const next = new Set(cur); if (!next.delete(id)) next.add(id); return next; });
  };

  async function update() {
    const shipping: Record<string, number | null> = {};
    for (const id of selected) {
      const parsed = parsePrice(shippingDraft[id] ?? "");
      if (!parsed.ok) return;
      shipping[id] = parsed.value;
    }
    setBusy(true);
    const ok = await guard(() => call("/api/barrios", json("PUT", { enabled: [...selected], shipping })));
    if (ok) {
      setSaved(new Set(selected));
      setSavedShipping((prev) => ({ ...prev, ...shipping }));
      setDone(true);
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="zonas-titulo">
      <h2 id="zonas-titulo" className="text-lg font-bold">{t("admin.zonesTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("admin.zonesHelp")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1.5 text-xs font-bold">
          {t("admin.searchZone")}
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("admin.searchPlaceholder")} className={field} />
        </label>
        <Button className="!min-h-11" disabled={!dirty || busy} onClick={update}>{t(busy ? "admin.saving" : "admin.update")}</Button>
      </div>
      <p role="status" className="mt-3 min-h-6 text-sm">
        {done ? t("admin.zonesSaved") : dirty ? t("admin.unsaved") : t("admin.zonesCount", { selected: selected.size, total: barrios.length })}
      </p>

      <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b) => {
          const on = selected.has(b.id);
          const parsed = parsePrice(shippingDraft[b.id] ?? "");
          return (
            <li key={b.id} className={`rounded-xl px-3 py-2 ${on ? "bg-accent text-on-color" : "bg-card"}`}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={on} onChange={() => toggle(b.id)} className="h-5 w-5 shrink-0 accent-[var(--primary)]" />
                <span className="font-bold">{b.name}</span>
              </label>
              {on && (
                <label className="mt-1 flex items-center gap-2 pb-1 pl-8 text-xs font-bold">
                  {t("admin.shipping")}
                  <input
                    inputMode="decimal"
                    value={shippingDraft[b.id] ?? ""}
                    onChange={(e) => {
                      setDone(false);
                      setShippingDraft((d) => ({ ...d, [b.id]: e.target.value }));
                    }}
                    onBlur={() => {
                      if (parsed.ok) setShippingDraft((d) => ({ ...d, [b.id]: parsed.value === null ? "" : formatPrice(parsed.value) }));
                    }}
                    placeholder={t("price.ask")}
                    aria-invalid={!parsed.ok}
                    className={`${field} !min-h-9 ${on ? "border-on-color/30 bg-on-color/10 text-on-color placeholder:text-on-color/50" : ""}`}
                  />
                </label>
              )}
            </li>
          );
        })}
        {shown.length === 0 && <li className="text-sm text-muted-foreground">{t("admin.noZones")}</li>}
      </ul>
    </section>
  );
}
