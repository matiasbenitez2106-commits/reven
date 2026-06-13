import { ImageResponse } from "next/og";

// Logo de marca como PNG descargable (lockup horizontal: "trato" con la o-check).
// Disponible en /brand/logo — clic derecho → "Guardar imagen como…".
export const runtime = "edge";

const SALVIA = "#66785B";
const CREMA = "#F3EEE1";
const TINTA = "#2E312A";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF8F3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: TINTA }}>
          <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: -8, display: "flex" }}>
            trat
          </div>
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 9999,
              background: SALVIA,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
              marginTop: 36,
            }}
          >
            <svg width="86" height="86" viewBox="0 0 24 24" fill="none">
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
      </div>
    ),
    { width: 900, height: 360 }
  );
}
