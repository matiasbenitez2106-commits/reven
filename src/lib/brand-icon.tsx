import type { ReactElement } from "react";

// Ícono de marca "Curado salvia": la "o" de trato como sello de verificado
// (círculo salvia + tilde crema). El sello es el mismo; cambia el fondo según
// el contexto, con dos variantes:
//   - "transparent" (favicon): el sello flota SIN fondo, para verse limpio
//     sobre pestañas claras u oscuras.
//   - "solid" (íconos de app iOS/PWA): el sello sobre un cuadrado salvia LLENO
//     y opaco; iOS no admite transparencia (le metería fondo negro), así que
//     el círculo se funde con el fondo y queda un cuadrado verde con el tilde.
// Generados con next/og.
const SALVIA = "#66785B";
const CREMA = "#F3EEE1";

export function brandIcon(
  size: number,
  variant: "transparent" | "solid" = "transparent"
): ReactElement {
  if (variant === "solid") {
    // Íconos de app: cuadrado salvia lleno + tilde crema centrado y grande.
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: SALVIA }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M27 52 L45 70 L75 32"
            fill="none"
            stroke={CREMA}
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  // Favicon: sello transparente (círculo salvia que llena el lienzo + tilde crema).
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
