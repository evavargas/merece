import { buttonClass } from "@/components/Button";
import { Cup, Instagram } from "@/components/icons";
import { Menu } from "@/components/Menu";
import { Wordmark } from "@/components/Wordmark";
import { ZonesMap } from "@/components/ZonesMap";
import { getProducts, getZones, INSTAGRAM_URL } from "@/lib/api";

const STEPS = [
  ["Elegí", "Mirá la carta y decidí qué te dan ganas."],
  ["Escribinos", "Tocá Pedir en el producto y mandanos el mensaje por WhatsApp, o escribinos por Instagram."],
  ["Te lo llevamos", "Coordinamos el delivery y recibís tu pedido en casa."],
] as const;

const TONE_CLASS = ["bg-accent text-on-color", "bg-highlight text-on-color", "bg-foreground text-background"];

const section = "mx-auto w-full max-w-5xl px-6";
const eyebrow = "font-hand text-2xl uppercase tracking-[0.12em]";
const h2 = "font-display text-4xl leading-tight sm:text-5xl";

export default async function Home() {
  const [products, zones] = await Promise.all([getProducts(), getZones()]);

  return (
    <>
      <header className={`${section} flex flex-wrap items-center justify-between gap-4 pt-6`}>
        <span className="font-display text-3xl leading-none">Merece</span>
        <a href={INSTAGRAM_URL} className={`${buttonClass("primary")} font-small !min-h-11 !px-5 text-[15px] font-extrabold`} aria-label="Instagram de Merece, @merece.singluten">
          <Instagram /> @merece.singluten
        </a>
      </header>

      <main>
        <section className={`${section} flex flex-col items-center gap-5 pb-20 pt-14 text-center`}>
          <Cup className="h-24 w-24 text-accent" />
          <h1 className="text-[clamp(4.5rem,19vw,7.5rem)]">
            <Wordmark />
          </h1>
          <p className="font-hand text-3xl uppercase tracking-[0.12em]">Sin gluten</p>
          <p className="max-w-xl text-lg">Pastelería clásica y artesanal, hecha para darse un gusto. Delivery en Montevideo.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <a href={INSTAGRAM_URL} className={buttonClass("primary")}>
              <Instagram /> Pedí por Instagram
            </a>
            <a href="#carta" className={buttonClass("outline")}>Ver la carta</a>
          </div>
        </section>

        <section id="carta" className="scroll-mt-4 bg-band py-20 text-band-foreground">
          <div className={section}>
            <div className="mb-14 flex flex-col items-center gap-2 text-center">
              <p className={`${eyebrow} text-highlight`}>La carta</p>
              <h2 className={h2}>Algo rico para hoy</h2>
              <p className="mt-2 max-w-md text-sm opacity-90">La disponibilidad cambia todos los días. Si algo no está, escribinos y lo coordinamos.</p>
            </div>
            <Menu products={products} />
          </div>
        </section>

        <section className="py-20">
          <div className={section}>
            <div className="mb-12 flex flex-col items-center gap-2 text-center">
              <p className={eyebrow}>Cómo pedir</p>
              <h2 className={h2}>Tres pasos y listo</h2>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map(([title, text], i) => (
                <li key={title} className="rounded-[28px] bg-muted p-7">
                  <span className={`font-display inline-flex h-11 w-11 items-center justify-center rounded-full text-[22px] text-on-color ${i === 1 ? "bg-highlight" : "bg-accent"}`}>
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-[15px]">{text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-14 flex flex-col items-center gap-4 text-center">
              <h3 className="font-display text-3xl sm:text-4xl">Entregamos en</h3>
              {zones && zones.features.length > 0 && (
                <ul className="flex flex-wrap justify-center gap-2.5">
                  {zones.features.map((z) => (
                    <li key={z.properties.id} className={`rounded-full px-4 py-1.5 text-sm font-medium ${TONE_CLASS[z.properties.tone]}`}>
                      {z.properties.name}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-muted-foreground">¿Otra zona? Consultanos por Instagram.</p>
            </div>
            {zones && zones.features.length > 0 && (
              <div className="mt-8">
                <ZonesMap zones={zones} />
              </div>
            )}
          </div>
        </section>

        <section className="bg-band py-[72px] text-band-foreground">
          <div className={`${section} flex flex-col items-center gap-5 text-center`}>
            <h2 className={h2}>Date el gusto</h2>
            <p className="max-w-md text-[17px]">Seguinos y hacé tu pedido por Instagram.</p>
            <a href={INSTAGRAM_URL} className={`${buttonClass("highlight")} font-small !min-h-[52px] !px-8 text-lg font-extrabold`}>
              <Instagram className="h-6 w-6" /> @merece.singluten
            </a>
            <p className="font-hand mt-4 text-[22px] uppercase tracking-[0.12em] text-accent">Merece · Sin gluten · Montevideo</p>
          </div>
        </section>
      </main>
    </>
  );
}
