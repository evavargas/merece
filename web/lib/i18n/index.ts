import { es } from "./es.ts";

export const LOCALE = "es-UY";

const messages = es;

type Messages = typeof messages;
type StringKey = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages];
type ListKey = { [K in keyof Messages]: Messages[K] extends readonly string[] ? K : never }[keyof Messages];
type Vars = Record<string, string | number>;

export function t(key: StringKey, vars?: Vars): string {
  const one = `${key}_one` as keyof Messages;
  const raw = (vars?.count === 1 && one in messages ? messages[one] : messages[key]) as string;
  return vars ? raw.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : raw;
}

export const tl = (key: ListKey): readonly string[] => messages[key];

export function tError(code: string): string {
  const key = `error.${code}`;
  return key in messages ? t(key as StringKey) : t("error.unknown");
}
