import type { Product } from "./api.ts";
import type { CartOpts, Fulfillment } from "./cart-options.ts";
import { t } from "./i18n/index.ts";
import { formatPrice } from "./price.ts";

export type OrderLine = { product: Pick<Product, "name" | "price" | "stock" | "category">; qty: number } & CartOpts;

/** Human labels of the options chosen for a line (used in the cart and in the WhatsApp message). */
export function lineExtras(l: OrderLine): string[] {
  const bits: string[] = [];
  if (l.coffee) bits.push(t(`coffee.${l.coffee}`));
  if (l.milk) bits.push(t(`milk.${l.milk}`));
  if (l.glaze) bits.push(t(`glaze.${l.glaze}`), t(l.warm ? "extra.rollWarm" : "extra.rollCold"));
  if (l.temp) bits.push(t(l.temp === "cold" ? "extra.drinkCold" : "extra.drinkHot"));
  return bits;
}

/** WhatsApp text, in blocks: greeting, items (with options and stock), summary, payment and notes. */
export function buildOrderMessage(lines: OrderLine[], fulfillment: Fulfillment, zone: { name: string } | undefined, shipping: number | null): string {
  if (lines.length === 0) return t("msg.emptyOrder");

  const items = lines.flatMap((l) => {
    const price = l.product.price === null ? t("price.ask") : `$ ${formatPrice(l.product.price * l.qty)}`;
    const extras = lineExtras(l);
    return [
      t("msg.item", { qty: l.qty, name: l.product.name, price }),
      ...(extras.length ? [t("msg.itemOptions", { options: extras.join(" · ") })] : []),
      ...(l.product.category === "made_to_order" ? [t("msg.itemAdvance")] : []),
      t("msg.itemStock", { stock: l.product.stock }),
    ];
  });

  const allPriced = lines.every((l) => l.product.price !== null);
  const subtotal = lines.reduce((sum, l) => sum + (l.product.price ?? 0) * l.qty, 0);
  const summary: string[] = [];
  let total: number | null = null;
  if (allPriced) summary.push(t("msg.subtotal", { amount: formatPrice(subtotal) }));
  if (fulfillment === "pickup") {
    summary.push(t("msg.pickup"));
    if (allPriced) total = subtotal;
  } else if (zone && shipping !== null) {
    summary.push(t("msg.deliveryEstimate", { zone: zone.name, amount: formatPrice(shipping) }));
    if (allPriced) total = subtotal + shipping;
  } else {
    summary.push(zone ? t("msg.deliveryToArrange", { zone: zone.name }) : t("msg.deliveryPickZone"));
  }
  if (total !== null) summary.push(t("msg.totalEstimate", { amount: formatPrice(total) }));

  const hasCake = lines.some((l) => l.product.category === "made_to_order");
  return [
    t("msg.greeting"),
    "",
    t("msg.itemsHeading"),
    ...items,
    "",
    t("msg.summaryHeading"),
    ...summary,
    "",
    t("msg.payment"),
    ...(hasCake ? [t("msg.advanceNote")] : []),
  ].join("\n");
}
