// Precio de envío del día: viene de `barrios.shipping` vía el GeoJSON de zonas.
export function shippingFor(barrioId: string | null, byId: Record<string, number | null>): number | null {
  if (!barrioId) return null;
  const v = byId[barrioId];
  return v === undefined ? null : v;
}
