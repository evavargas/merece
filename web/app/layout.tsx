import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Gochi_Hand, Nunito, Roboto_Mono } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel" });
const gochi = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-gochi" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });
const nunito = Nunito({ subsets: ["latin"], weight: "800", variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Merece · Pastelería sin gluten en Montevideo", template: "%s · Merece" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "es_UY", url: "/", title: "Merece · Pastelería sin gluten en Montevideo", description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Merece · Pastelería sin gluten en Montevideo", description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#FFFFF0",
};

// Aplica tema guardado antes del paint (evita flash). Por defecto: light.
const themeInit = `(function(){try{if(localStorage.getItem("merece-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY" className={`${bagel.variable} ${gochi.variable} ${mono.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
