import { ImageResponse } from "next/og";

// Imagen para previews al compartir el link del sitio (WhatsApp, redes, etc.).
// Identidad "Curado salvia": crema + salvia + óxido, wordmark con la o-check.
export const runtime = "edge";
export const alt = "trato — Comprá y vendé lo que quieras, entre personas reales";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SALVIA = "#66785B";
const CREMA = "#F3EEE1";
const TINTA = "#2E312A";
const OXIDO = "#B66B3C";

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
          background: CREMA,
          color: TINTA,
          fontFamily: "sans-serif",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: -6,
              display: "flex",
            }}
          >
            trat
          </div>
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 9999,
              background: SALVIA,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 6,
              marginTop: 26,
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17.5L19 7.5"
                stroke={CREMA}
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 44, marginTop: 28, maxWidth: 960, lineHeight: 1.2 }}>
          Comprá y vendé lo que quieras, entre personas reales
        </div>
        <div style={{ fontSize: 28, marginTop: 30, color: OXIDO, fontWeight: 600 }}>
          Identidad verificada · Sin comisiones · Hecho en Argentina
        </div>
      </div>
    ),
    { ...size }
  );
}
