import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Gochi_Hand, Nunito, Roboto_Mono } from "next/font/google";
import { LOCALE, t } from "@/lib/i18n";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel" });
const gochi = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-gochi" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });
const nunito = Nunito({ subsets: ["latin"], weight: "800", variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: t("site.title"), template: t("site.titleTemplate") },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: LOCALE.replace("-", "_"), url: "/", title: t("site.title"), description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: t("site.title"), description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFF0" },
    { media: "(prefers-color-scheme: dark)", color: "#2A1A18" },
  ],
};

const themeInit = `(function(){var s=null;try{s=localStorage.getItem("merece-theme")}catch(e){}if(s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={LOCALE} className={`${bagel.variable} ${gochi.variable} ${mono.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
