import { t as translate } from "./i18n/index.ts";
export const MAX_PRICE = 1_000_000;

export type ParsedPrice = { ok: true; value: number | null } | { ok: false; error: string };

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function formatPrice(n: number): string {
  const cents = Math.round(n * 100);
  return `${group(String(Math.floor(cents / 100)))},${String(cents % 100).padStart(2, "0")}`;
}

const INT = String.raw`(\d+|\d{1,3}(?:\.\d{3})+)`;
const WITH_COMMA = new RegExp(`^${INT}(?:,(\\d{1,2}))?$`);
const WITH_DOT = /^(\d+)\.(\d{1,2})$/;

export function parsePrice(input: string): ParsedPrice {
  const t = input.trim().replace(/^\$\s*/, "").replace(/\s/g, "");
  if (t === "") return { ok: true, value: null };

  const m = WITH_COMMA.exec(t) ?? WITH_DOT.exec(t);
  if (!m) return { ok: false, error: translate("price.invalid") };

  const value = Number(`${m[1].replaceAll(".", "")}.${(m[2] ?? "").padEnd(2, "0")}`);
  if (value > MAX_PRICE) return { ok: false, error: translate("price.max", { max: formatPrice(MAX_PRICE) }) };
  return { ok: true, value };
}
