import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import { ServiceWorkerRegister } from "./sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.apptrato.com"),
  title: {
    default: "trato — Comprá y vendé lo que quieras, entre personas verificadas",
    template: "%s · trato",
  },
  description:
    "trato es el marketplace argentino para comprar y vender entre personas verificadas. Publicá y vendé gratis, sin comisiones.",
  keywords: [
    "vintage",
    "ropa usada",
    "segunda mano",
    "thrift",
    "feria americana",
    "moda circular",
    "compraventa",
    "Argentina",
    "marketplace",
  ],
  openGraph: {
    type: "website",
    siteName: "trato",
    locale: "es_AR",
    url: "/",
    title: "trato — Comprá y vendé lo que quieras, entre personas reales",
    description:
      "Personas verificadas, precios justos y cero comisiones. Hecho en Argentina.",
  },
  twitter: {
    card: "summary_large_image",
    title: "trato — Comprá y vendé lo que quieras",
    description: "Personas verificadas, precios justos y cero comisiones. Hecho en Argentina.",
  },
  appleWebApp: {
    capable: true,
    title: "trato",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#66785B" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1917" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Providers>
          <ServiceWorkerRegister />
          <Navbar />
          <EmailVerifyBanner />
          <main className="flex-1 pb-16 sm:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
