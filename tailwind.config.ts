import type { Config } from "tailwindcss";

const config: Config = {
  // Modo oscuro automático según la preferencia del sistema operativo.
  darkMode: "media",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marca "Curado salvia": verde salvia (apagado, vintage). brand-600 = primario.
        brand: {
          50: "#f4f6f1",
          100: "#e6ebdf",
          200: "#ccd6c0",
          300: "#abba9a",
          400: "#899a74",
          500: "#6f7f5a",
          600: "#66785b",
          700: "#515e48",
          800: "#3e4838",
          900: "#2e312a",
        },
        // Acento óxido / terracota apagada.
        accent: {
          50: "#fbf1e9",
          100: "#f1d9c4",
          200: "#e3b896",
          300: "#d4976a",
          400: "#c47e49",
          500: "#b66b3c",
          600: "#9c5832",
          700: "#7c4528",
          800: "#5e3520",
          900: "#412517",
        },
        // Modo claro: superficie crema ÚNICA y plana. El fondo de página y las
        // superficies elevadas (tarjetas, navbar, footer, chips, modales) comparten
        // el MISMO crema; se distinguen solo por borde/sombra, sin diferencia de color.
        // (El modo oscuro NO usa estos tokens: va por las variantes dark:bg-stone-*.)
        cream: "#f0ebdd", // fondo de página (modo claro)
        surface: "#f0ebdd", // superficies elevadas (tarjetas, navbar, footer, chips, modales)
        ink: "#2e312a", // tinta (texto)
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
