# Manual de marca — trato

Identidad **"Curado salvia"**: vintage soft, slow-fashion, prolijo. Pensada para
jóvenes que compran y venden ropa vintage / de segunda mano en Argentina.

---

## 1. Nombre y wordmark

- El nombre es **trato**, siempre en **minúscula** (incluso al inicio de oración
  en piezas de marca; en prosa legal/larga se admite según gramática).
- El wordmark es `trat` + **la "o" como sello de verificado**: un círculo salvia
  con un check crema. Ese sello es el símbolo de la marca y funciona solo como
  ícono de app / avatar / favicon.
- Tipografía del wordmark y titulares: **Bricolage Grotesque** (bold, tracking
  apretado). En el código: clase `font-display` (se carga vía `next/font`).
- Tipografía de texto/UI: **Inter** (`font-sans`).
- Componente: [src/components/Logo.tsx](src/components/Logo.tsx) (`<Logo size="sm|md|lg" />`).
- Generadores: ícono PWA/favicon en [src/lib/brand-icon.tsx](src/lib/brand-icon.tsx),
  imagen para compartir en [src/app/opengraph-image.tsx](src/app/opengraph-image.tsx).

## 2. Paleta

| Rol | Nombre | Hex | Tailwind |
|---|---|---|---|
| Primario | Salvia | `#66785B` | `brand-600` |
| Primario oscuro | Salvia profundo | `#515E48` | `brand-700` |
| Tinta (texto) | Carbón verdoso | `#2E312A` | `ink` / `brand-900` |
| Fondo | Crema vintage | `#F3EEE1` | `cream` |
| Acento | Óxido | `#B66B3C` | `accent-500` |
| Acento fuerte | Óxido oscuro | `#9C5832` | `accent-600` |

Reglas:
- Fondo general **crema**, superficies (cards) blancas. Nada de blanco puro de fondo de página.
- Salvia para acciones primarias, links y el sello de la marca.
- Óxido como acento **escaso**: destacados, detalles editoriales, subrayados. No usarlo para acciones.
- Modo oscuro: tonos `stone` (grises cálidos), salvia clara (`brand-300`) para links/acentos.

## 3. Tono de voz

- **Voseo argentino**, cercano y directo: "publicá", "encontrá", "vendé".
- Cálido y con personalidad, nunca corporativo. Habla de **ropa con historia**,
  **tesoros**, **placard**, **moda circular** — no de "artículos usados".
- La confianza es el diferencial: siempre que se pueda, recordar que las
  personas están **verificadas** (de ahí el check del logo).
- Claim principal: **"Vintage y segunda mano, entre personas reales."**
- Apoyos: "Ropa con historia, precios justos y gente verificada." ·
  "Moda circular, hecha en Argentina." · "Publicá gratis, sin comisiones."

## 4. Aplicaciones ya implementadas

- Logo en navbar y footer (`<Logo />`).
- Ícono de app (PWA 192/512, apple-touch-icon, favicon): sello o-check sobre crema.
- `theme-color`: salvia en claro, stone-900 en oscuro. Manifest crema/salvia.
- Imagen Open Graph (preview de WhatsApp/redes) con el wordmark e identidad nuevas.
- Emails (Resend): encabezado y botones en salvia.
- Mapa de zona: círculo de ubicación en salvia.
- Modo claro (crema) y **modo oscuro automático** según el sistema del usuario.

## 5. Assets de marketing

El material de campaña (posters, guiones, calendario) vive en la carpeta local
`Campaña Marketing Trato/` (fuera del repo, ver `.gitignore`). Al regenerarlo,
usar esta identidad: paleta de la sección 2, Bricolage Grotesque para títulos,
fotos con luz cálida y estética de feria americana / thrift.
