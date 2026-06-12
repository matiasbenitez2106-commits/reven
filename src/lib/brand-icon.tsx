import type { ReactElement } from "react";

// Ícono de marca (monograma "T" sobre verde trato). Se usa para generar el
// favicon, el apple-touch-icon y los íconos del manifest (PWA) con next/og.
export function brandIcon(size: number): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#177853",
        color: "#ffffff",
        fontFamily: "sans-serif",
        fontWeight: 800,
        fontSize: Math.round(size * 0.62),
        lineHeight: 1,
      }}
    >
      t
    </div>
  );
}
