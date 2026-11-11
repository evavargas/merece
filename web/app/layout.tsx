import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Gochi_Hand, Nunito, Roboto_Mono } from "next/font/google";
import "./globals.css";

const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel" });
const gochi = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-gochi" });
const mono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });
const nunito = Nunito({ subsets: ["latin"], weight: "800", variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Merece · Pastelería sin gluten en Montevideo",
  description: "Pastelería clásica y artesanal sin gluten, hecha para darse un gusto. Delivery en Montevideo.",
  openGraph: { title: "Merece · Sin gluten", description: "Pastelería clásica y artesanal. Delivery en Montevideo.", locale: "es_UY", type: "website" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFF0" },
    { media: "(prefers-color-scheme: dark)", color: "#2A1A18" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bagel.variable} ${gochi.variable} ${mono.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
