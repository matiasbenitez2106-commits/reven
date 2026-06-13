# Manual de marca — trato

Identidad **"Curado salvia"**: cálida, prolija, de confianza.

**Regla de oro:** el ángulo "vintage / ropa / moda circular" es EXCLUSIVO de las
campañas de marketing externas (para atraer al público inicial: jóvenes que
venden ropa usada). DENTRO de la app el lenguaje es **genérico**: en trato se
puede comprar y vender cualquier cosa.

---

## 1. Nombre y wordmark

- El nombre es **trato**, siempre en **minúscula** (incluso al inicio de oración
  en piezas de marca; en prosa legal/larga se admite según gramática).
- El wordmark es `trat` + **la "o" como sello de verificado**: un círculo salvia
  con un check crema. Ese sello es el símbolo de la marca y funciona solo como
  ícono de app / avatar / favicon. **Es el logo DEFINITIVO: no se rediseña.**
- Tipografía del wordmark: **Bricolage Grotesque** — **EXCLUSIVA del logo**.
  No usarla en titulares ni en la UI (decisión del fundador).
- Tipografía de todo lo demás (titulares, texto, UI): **Inter** (`font-sans`).
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
- Cálido y con personalidad, nunca corporativo.
- La confianza es el diferencial: siempre que se pueda, recordar que las
  personas están **verificadas** (de ahí el check del logo).
- **Comprar Y vender son gratis**: decirlo completo — "Publicá y vendé gratis,
  sin comisiones" (nunca solo "publicá gratis").

### En la app (lenguaje genérico)
- Claim principal: **"Comprá y vendé lo que quieras, entre personas reales."**
- Apoyos: "Personas verificadas, precios justos y cero comisiones." ·
  "Hecho en Argentina." · "Publicá y vendé gratis, sin comisiones."

### En campañas de marketing (captación del público inicial)
- Acá SÍ va el ángulo vintage/ropa: "ropa con historia", "tesoros", "placard",
  "moda circular", estética thrift/feria americana.
- Las keywords SEO del sitio también pueden mantener "vintage", "ropa usada",
  "thrift" (son invisibles para el usuario, sirven para captar).

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
