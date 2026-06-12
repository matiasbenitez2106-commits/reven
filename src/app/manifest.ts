import type { MetadataRoute } from "next";

// Manifest de la PWA: permite "instalar" trato en el celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "trato — Vintage y segunda mano",
    short_name: "trato",
    description:
      "Vintage y segunda mano entre personas verificadas en Argentina. Sin comisiones.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F3EEE1",
    theme_color: "#66785B",
    lang: "es-AR",
    categories: ["shopping", "marketplace"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
