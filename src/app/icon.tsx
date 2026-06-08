import { ImageResponse } from "next/og";
import { brandIcon } from "@/lib/brand-icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Favicon de la pestaña del navegador.
export default function Icon() {
  return new ImageResponse(brandIcon(64), { ...size });
}
