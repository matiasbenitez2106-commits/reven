import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import { ServiceWorkerRegister } from "./sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.apptrato.com"),
  title: {
    default: "Trato — Comprá y vendé usado, entre personas verificadas",
    template: "%s · Trato",
  },
  description:
    "Trato es la plataforma de compraventa de artículos usados entre particulares verificados en Argentina. Sin comisiones. Publicá gratis.",
  keywords: ["usados", "compraventa", "Argentina", "marketplace", "segunda mano"],
  openGraph: {
    type: "website",
    siteName: "Trato",
    locale: "es_AR",
    url: "/",
    title: "Trato — Comprá y vendé usado, entre personas reales",
    description:
      "Compraventa de usados entre particulares verificados en Argentina. Identidad verificada, sin comisiones.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trato — Comprá y vendé usado",
    description: "Compraventa de usados entre particulares verificados en Argentina.",
  },
  appleWebApp: {
    capable: true,
    title: "Trato",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#177853",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
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
