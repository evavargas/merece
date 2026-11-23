export function shippingFor(barrioId: string | null, byId: Record<string, number | null>): number | null {
  if (!barrioId) return null;
  const v = byId[barrioId];
  return v === undefined ? null : v;
}
