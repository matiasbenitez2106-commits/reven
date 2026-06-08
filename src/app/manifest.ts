import type { MetadataRoute } from "next";

// Manifest de la PWA: permite "instalar" Trato en el celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trato — Comprá y vendé usado",
    short_name: "Trato",
    description:
      "Compraventa de usados entre particulares verificados en Argentina. Sin comisiones.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#177853",
    lang: "es-AR",
    categories: ["shopping", "marketplace"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
