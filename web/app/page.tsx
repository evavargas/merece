import { buttonClass } from "@/components/Button";
import { CartProvider } from "@/components/cart/Cart";
import { EggProvider } from "@/components/Egg";
import { HeroBrand } from "@/components/HeroBrand";
import { Instagram } from "@/components/icons";
import { Menu } from "@/components/Menu";
import { NeonSign } from "@/components/NeonSign";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { StickyBar } from "@/components/StickyBar";
import { ZonesSection } from "@/components/ZonesSection";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { getProducts, getZones, INSTAGRAM_URL } from "@/lib/api";

const STEPS = [
  [
    "Elegí",
    "Agregá tus pedidos al carrito",
  ],
  [
    "Validá",
    "En el carrito revisá tu pedido y elegí la modalidad de envío. Recordá: las tortas a pedido llevan 48 hs de anticipación.",
  ],
  [
    "Te lo llevamos",
    "Una vez hecho el pedido, te escribimos para coordinar entrega y método de pago :)",
  ],
] as const;

const NEON_PHRASES = ["Te lo merecés", "¿Qué se te antoja hoy?"] as const;

// Datos estructurados para buscadores. Sin dirección (solo delivery) y sin afirmaciones de aptitud para celíacos.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Merece",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image.png`,
  logo: `${SITE_URL}/icons/icon-512.png`,
  telephone: "+59897625315",
  areaServed: { "@type": "City", name: "Montevideo" },
  sameAs: [INSTAGRAM_URL],
};

const section = "mx-auto w-full max-w-5xl px-6";
const h2 = "font-display text-4xl leading-tight sm:text-5xl";

export default async function Home() {
  const [products, zones] = await Promise.all([getProducts(), getZones()]);

  return (
    <CartProvider zones={zones?.features ?? []}>
      <EggProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <SiteNav />
        <main className="pb-24">
          <section id="inicio" className={`${section} flex flex-col items-center gap-4 pb-16 pt-8 text-center`}>
            <HeroBrand />
            <p className="max-w-xl text-xl">
              Pastelería Sin Gluten
              <br />y
              <br />Café de especialidad
            </p>
          </section>

          <section id="carta" className="scroll-mt-20 bg-band py-20 text-band-foreground">
            <div className={section}>
              <div className="mb-14 flex flex-col items-center gap-2 text-center">
                <h2 className="sr-only">{NEON_PHRASES[0]}</h2>
                <NeonSign phrases={NEON_PHRASES} className="font-hand mb-2 py-2 text-[clamp(2.75rem,11vw,5.5rem)] leading-[1.05]" />
              </div>
              <Menu products={products} />
            </div>
          </section>

          <section className="py-20">
            <div className={section}>
              <div className="mb-12 flex flex-col items-center gap-2 text-center">
                <h2 className={h2}>Pedí en tres pasos</h2>
              </div>
              <ol className="grid gap-6 md:grid-cols-3">
                {STEPS.map(([title, text], i) => (
                  <li key={title} className="rounded-[28px] bg-muted p-7">
                    <span
                      className={`font-display inline-flex h-11 w-11 items-center justify-center rounded-full text-[22px] text-on-color ${i === 1 ? "bg-highlight" : "bg-accent"}`}
                    >
                      {i + 1}
                    </span>
                    <h3 className="mt-4 text-lg font-bold">{title}</h3>
                    <p className="mt-1 text-[15px]">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="zonas" className="scroll-mt-20 bg-muted py-20">
            <div className={section}>
              <div className="mb-8 flex flex-col items-center gap-2 text-center">
                <h2 className={h2}>Zonas de entrega</h2>
              </div>
              {zones && zones.features.length > 0 ? (
                <ZonesSection zones={zones} />
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Para pedidos con anticipación, consultanos. ¿Otra zona? Escribinos por WhatsApp.
                </p>
              )}
            </div>
          </section>

          <section className="bg-band pb-16 pt-[72px] text-band-foreground">
            <div className={`${section} flex flex-col items-center gap-5 text-center`}>
              <h2 className={h2}>Date el gusto, te lo merecés.</h2>
              <p className="max-w-md text-[17px]">Seguinos en Instagram.</p>
              <a href={INSTAGRAM_URL} className={`${buttonClass("accent")} font-small !min-h-[52px] !px-8 text-lg font-extrabold`}>
                <Instagram className="h-6 w-6" /> @merece.singluten
              </a>
            </div>
          </section>
        </main>
        <SiteFooter />
        <StickyBar />
      </EggProvider>
    </CartProvider>
  );
}
