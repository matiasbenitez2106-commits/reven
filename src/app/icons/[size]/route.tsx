import { ImageResponse } from "next/og";
import { brandIcon } from "@/lib/brand-icon";

// Íconos del manifest (PWA): /icons/192 y /icons/512.
export function GET(_req: Request, { params }: { params: { size: string } }) {
  const s = params.size === "512" ? 512 : 192;
  return new ImageResponse(brandIcon(s), { width: s, height: s });
}
