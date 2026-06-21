import { ImageResponse } from "next/og";
import { brandIcon } from "@/lib/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ícono para "Agregar a pantalla de inicio" en iOS.
export default function AppleIcon() {
  return new ImageResponse(brandIcon(180, "solid"), { ...size });
}
