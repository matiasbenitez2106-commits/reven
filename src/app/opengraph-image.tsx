import { ImageResponse } from "next/og";

// Imagen para previews al compartir el link del sitio (WhatsApp, redes, etc.).
export const runtime = "edge";
export const alt = "Trato — Comprá y vendé usado, entre personas reales";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f6e4e 0%, #177853 60%, #1f9268 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -3 }}>Trato</div>
        <div style={{ fontSize: 44, marginTop: 12, maxWidth: 920, lineHeight: 1.2 }}>
          Comprá y vendé usado, entre personas reales
        </div>
        <div style={{ fontSize: 28, marginTop: 32, opacity: 0.9 }}>
          Identidad verificada · Sin comisiones · Argentina
        </div>
      </div>
    ),
    { ...size }
  );
}
