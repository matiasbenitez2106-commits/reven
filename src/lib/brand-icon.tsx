import type { ReactElement } from "react";

// Ícono de marca "Curado salvia": la "o" de trato como sello de verificado,
// AISLADA — círculo salvia que llena el ícono + tilde crema, sobre FONDO
// TRANSPARENTE. Lo usan el favicon, el apple-touch-icon y los íconos del
// manifest (PWA), generados con next/og.
const SALVIA = "#66785B";
const CREMA = "#F3EEE1";

export function brandIcon(size: number): ReactElement {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "transparent" }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="48" fill={SALVIA} />
        <path
          d="M30 51 L44 66 L72 35"
          fill="none"
          stroke={CREMA}
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
