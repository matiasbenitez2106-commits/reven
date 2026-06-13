import { ImageResponse } from "next/og";

// Logo de marca como PNG descargable — EXACTAMENTE el de la app (wordmark "trato"
// con la o-check, en Bricolage Grotesque). /brand/logo → clic derecho → "Guardar".
// El símbolo solo (la o-check) está en /icons/512.
export const runtime = "edge";

const SALVIA = "#66785B";
const CREMA = "#F4F1EA";
const TINTA = "#2E312A";
const SURFACE = "#FCFAF5";

// Font real del logo (Bricolage Grotesque 700) desde un CDN estable.
const FONT_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/bricolage-grotesque@latest/latin-700-normal.ttf";

export async function GET() {
  let fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] = [];
  try {
    const data = await fetch(FONT_URL).then((r) => r.arrayBuffer());
    fonts = [{ name: "Bricolage", data, weight: 700, style: "normal" }];
  } catch {
    fonts = []; // fallback a la tipografía por defecto si el CDN falla
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SURFACE,
          fontFamily: "Bricolage",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", color: TINTA }}>
          <div style={{ fontSize: 180, fontWeight: 700, letterSpacing: -7, display: "flex" }}>
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
              marginLeft: 4,
              marginTop: 22,
            }}
          >
            <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5L10 17.5L19 7.5"
                stroke={CREMA}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 380, fonts }
  );
}
