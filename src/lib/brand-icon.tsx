import type { ReactElement } from "react";

// Ícono de marca "Curado salvia": la "o" de trato como sello de verificado
// (círculo salvia + check crema sobre fondo crema). Se usa para generar el
// favicon, el apple-touch-icon y los íconos del manifest (PWA) con next/og.
const SALVIA = "#66785B";
const CREMA = "#F3EEE1";

export function brandIcon(size: number): ReactElement {
  const stroke = Math.max(2.5, Math.round(size * 0.055));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: CREMA,
      }}
    >
      <div
        style={{
          width: "76%",
          height: "76%",
          borderRadius: "50%",
          background: SALVIA,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="58%"
          height="58%"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 12.5L10 17.5L19 7.5"
            stroke={CREMA}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
