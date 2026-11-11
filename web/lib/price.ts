// Precios en pesos uruguayos enteros. Formato es-UY: "." miles, "," decimales (solo se admiten ceros).
export const MAX_PRICE = 1_000_000;

export type ParsedPrice = { ok: true; value: number | null } | { ok: false; error: string };

export function parsePrice(input: string): ParsedPrice {
  const t = input.trim().replace(/^\$\s*/, "").replace(/\s/g, "");
  if (t === "") return { ok: true, value: null }; // vacío = "Consultar"

  let digits: string | undefined;
  if (/^\d+(,0+)?$/.test(t)) digits = t.split(",")[0];
  else if (/^\d{1,3}(\.\d{3})+(,0+)?$/.test(t)) digits = t.split(",")[0].replaceAll(".", "");

  if (digits === undefined) {
    return { ok: false, error: /^\d+[.,]\d{1,2}$/.test(t) ? "Usá pesos enteros, sin centésimos (ej: 1.250)" : "Ingresá solo números (ej: 1.250)" };
  }
  const value = Number(digits);
  if (value > MAX_PRICE) return { ok: false, error: `El máximo es $ ${formatPrice(MAX_PRICE)}` };
  return { ok: true, value };
}

export const formatPrice = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
