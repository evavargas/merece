import { buttonClass } from "@/components/Button";
import { CartProvider } from "@/components/cart/Cart";
import { DripBand, LongDrip } from "@/components/DripBand";
import { EggProvider } from "@/components/Egg";
import { HeroBrand } from "@/components/HeroBrand";
import { Instagram } from "@/components/icons";
import { Menu } from "@/components/Menu";
import { NeonSign } from "@/components/NeonSign";
import { Sprinkles } from "@/components/Sprinkles";
import { SiteFooter } from "@/components/SiteFooter";
import { BagIcon, ChatCheckIcon, DeliveryIcon } from "@/components/StepIcons";
import { SiteNav } from "@/components/SiteNav";
import { StickyBar } from "@/components/StickyBar";
import { ZonesSection } from "@/components/ZonesSection";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { getProducts, getZones, INSTAGRAM_URL } from "@/lib/api";
import { t, tl } from "@/lib/i18n";

const STEPS = [
  { key: "steps.one", Icon: BagIcon },
  { key: "steps.two", Icon: ChatCheckIcon },
  { key: "steps.three", Icon: DeliveryIcon },
] as const;

// Datos estructurados para buscadores. Sin dirección (solo delivery) y sin afirmaciones de aptitud para celíacos.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: t("brand.name"),
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
        <main>
          <div className="hero-bg -mt-17 pt-17">
            <section id="inicio" className={`${section} relative flex flex-col items-center gap-4 pb-8 pt-8 text-center`}>
              <Sprinkles tones={["bg-accent", "bg-highlight"]} />
              <HeroBrand />
              <p className="max-w-xl text-xl">
                {t("hero.tagline1")}
                <br />
                {t("hero.tagline2")}
                <br />
                {t("hero.tagline3")}
              </p>
            </section>
          </div>

          <section id="carta" className="carta relative scroll-mt-20 bg-carta pb-0 pt-36 text-carta-foreground sm:pt-28">
            <DripBand />
            {/* Gotas largas de los bordes, de distinta altura (no simétricas). Desde 1280 px: izquierda 280 y derecha 196. Debajo de 1280: una sola, más corta, a la izquierda. */}
            <LongDrip length={280} neck={18} r={12} className="left-3 hidden min-[1280px]:block" />
            <LongDrip length={196} neck={16} r={11} className="right-3 hidden min-[1280px]:block" />
            <LongDrip length={124} neck={14} r={9.5} className="left-4 min-[1280px]:hidden" />
            <div className={`${section} relative`}>
              <div className="mb-12 flex flex-col items-center gap-2 text-center">
                <h2 className="sr-only">{tl("menu.neon")[0]}</h2>
                <NeonSign phrases={tl("menu.neon")} className="font-hand py-2 text-[clamp(2.25rem,7vw,3.5rem)] leading-[1.05]" />
              </div>
              <Menu products={products} />
            </div>
          </section>

          <section className="relative bg-[var(--pasos)] pb-0 pt-32 sm:pt-40">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-carta to-transparent sm:h-40" />
            <div className={`${section} relative`}>
              <div className="mb-12 flex flex-col items-center gap-2 text-center">
                <h2 className={h2}>{t("steps.title")}</h2>
              </div>
              <ol className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                {STEPS.map(({ key, Icon }, i) => (
                  <li key={key} className="flex flex-col items-center rounded-[22px] card-surface bg-[var(--tile-step)] p-3 text-center sm:rounded-[28px] sm:p-6 md:p-7">
                    <span
                      className={`font-display inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-on-color sm:h-11 sm:w-11 sm:text-[22px] ${i === 1 ? "bg-highlight" : "bg-accent"}`}
                    >
                      {i + 1}
                    </span>
                    <Icon className="mt-3 h-14 w-14 text-foreground sm:mt-4 sm:h-20 sm:w-20" />
                    <h3 className="mt-3 text-balance text-sm font-bold leading-snug sm:mt-4 sm:text-lg">{t(key)}</h3>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="zonas" className="relative bg-zonas pb-20 pt-32 sm:pt-40">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[var(--pasos)] to-transparent sm:h-40" />
            <div className={`${section} relative`}>
              <div className="mb-12 flex flex-col items-center gap-2 text-center">
                <h2 className={h2}>{t("zones.title")}</h2>
              </div>
              {zones && zones.features.length > 0 ? (
                <ZonesSection zones={zones} />
              ) : (
                <p className="text-center text-sm text-muted-foreground">{t("zones.fallback")}</p>
              )}
            </div>
          </section>

          <section className="carta cierre card-surface bg-[var(--cierre)] pb-16 pt-[72px] text-carta-foreground">
            <Sprinkles tones={["bg-accent", "bg-background"]} />
            <div className={`${section} relative flex flex-col items-center gap-5 text-center`}>
              <h2 className="sr-only">{t("closing.heading")}</h2>
              <NeonSign phrases={tl("closing.neon")} tone="accent" shrinkLong={false} className="font-hand py-2 text-[clamp(2.25rem,7vw,3.5rem)] leading-[1.05]" />
              <p className="max-w-md text-[17px]">{t("closing.follow")}</p>
              <a href={INSTAGRAM_URL} className={`${buttonClass("cierre")} font-small !min-h-[52px] !px-8 text-lg font-extrabold`}>
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
