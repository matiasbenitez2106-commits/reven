# Auditoría de elementos blancos — modo claro

_Última actualización: 22 de junio de 2026_

Inventario de blanco hardcodeado en `src/` (paleta "Curado Salvia"). **Solo modo claro**;
no se revisó ni se propone tocar nada del modo oscuro (`dark:`). **Este documento es solo
un reporte: no se modificó ningún componente.**

## Cómo se buscó
Barrido de `src/` con estas formas de blanco:
- Tailwind: `bg-white`, `border-white`, `fill-white`, `from/to/via-white`, `ring-white`,
  `divide-white`, `stroke-white`, `outline-white`, y `text-white`.
- Hex/CSS: `#fff`, `#ffffff` (y mayúsculas), `rgb(255,255,255)`, `rgba(255,255,255,…)`,
  la palabra `white`.

## Resultado en una línea
**No hay superficies blancas** (cards, modales, header, inputs, chips) en modo claro: ya
están todas en la paleta cálida. Queda **1 blanco a cambiar** (trivial) + **1 dudoso**;
el resto son **excluidos intencionales** (botones sobre fotos) o **fuera de alcance**
(texto blanco sobre color y `#fff` de emails, que no son fondos).

## Tokens de referencia (para "acción sugerida")
- Fondo de página: `cream` **#F2F1EC**
- Superficie elevada (cards): `surface` **#FBFAF7**
- Borde: `line` **#E5E3DC**
- Hover de superficies: `surface-hover` **#EBE5D4** · Fondo hundido: `surface-sunken` **#ECE7DA**

---

## 1) A cambiar / dudosos (modo claro)

| Archivo | Línea | Elemento | ¿Par dark? | Acción sugerida |
|---|---|---|---|---|
| `src/components/Navbar.tsx` | 163 | Halo (`ring-white`) del puntito rojo de notificaciones, sobre la campana del navbar | **Sí** (`dark:ring-stone-900`) | Cambiar `ring-white` → `ring-surface` (#FBFAF7) para que el halo combine con el navbar (que es `surface`). Impacto visual mínimo; seguro (tiene par dark). |
| `src/app/mensajes/page.tsx` | 69 | `border-white` de la miniatura del producto (h-5 w-5) que se monta sobre el avatar, en la lista de conversaciones | **No** | **DUDOSO (decidir a ojo).** El borde blanco separa la miniatura del avatar. Opciones: dejarlo (anillo blanco a propósito) o pasarlo a `border-line` (#E5E3DC). ⚠️ No tiene par dark: si se cambia, tocaría también el oscuro → habría que sumarle `dark:border-stone-800` (o fijar el dark) para no alterarlo. |

---

## 2) Excluidos (intencionales — botones que flotan sobre fotos, sin par dark)

| Archivo | Línea | Elemento | ¿Par dark? | Estado |
|---|---|---|---|---|
| `src/components/listings/SaveButton.tsx` | 51 | Botón corazón (favorito) flotando sobre la foto — `hover:bg-white` | No | EXCLUIDO (intencional) |
| `src/components/listings/ImageUploader.tsx` | 96 | Botón de control sobre la foto subida — `hover:bg-white` | No | EXCLUIDO (intencional) |
| `src/components/listings/ImageUploader.tsx` | 107 | Botón de borrar foto subida — `hover:bg-white` | No | EXCLUIDO (intencional) |
| `src/components/listings/Gallery.tsx` | 52 | Botón zoom/lupa sobre la foto — `hover:bg-white` | No | EXCLUIDO (intencional) |
| `src/components/listings/Gallery.tsx` | 84 | Botón cerrar del visor a pantalla completa — `hover:bg-white/20` (+ `text-white`) | No | EXCLUIDO (intencional) |
| `src/components/listings/Gallery.tsx` | 96 | Flecha "anterior" del visor — `hover:bg-white/20` (+ `text-white`) | No | EXCLUIDO (intencional) |
| `src/components/listings/Gallery.tsx` | 106 | Flecha "siguiente" del visor — `hover:bg-white/20` (+ `text-white`) | No | EXCLUIDO (intencional) |

---

## 3) Fuera de alcance (no son fondos blancos)

### `text-white` como texto (foreground) — 44 usos
Todos son **texto blanco sobre superficies de color sólido**, no fondos. No aplican a esta
auditoría (la regla incluye `text-white` solo cuando hace de fondo, y ninguno lo hace).
Contextos:
- **Botones primarios salvia** (`bg-brand-600 text-white`): `ui/Button.tsx:15`, `page.tsx:42,71,177`,
  `HomeSearch.tsx:28`, `Navbar.tsx:131,226`, `BoostPlans.tsx:68`, `favoritos:58`, `publicar:26`,
  `mis-publicaciones:33`, `verificacion:34`, `verificar-email:52`, `contacto:96`, `ResetForm:33`,
  `articulos/[id]:275`, `ReportButton:85`, `PrintButton:9`, `AdminVerificationActions:31`,
  `CompleteDeletionButton:100`, `admin/usuarios:115,134`, `admin/publicaciones:66,77`,
  `admin/soporte:33,39`, `VerificationFlow:145`, `PlanCards:95`.
- **Botones rojos** (`bg-red-500/600`, peligro/borrar): `ui/Button.tsx:18`, `ReportButton:119`,
  `CompleteDeletionButton:156`.
- **Badges/indicadores** sobre color: `NotificationBell:104`, `Navbar:150,199`, `ProBadge:15`
  (indigo), `IncludedBoostButton:50` (indigo), `ImageUploader:86`, `page.tsx:149`,
  `ChatThread:98,127` (burbuja propia salvia), `articulos/[id]:144` (banner `bg-gray-900`).
- **3 de estos** (`Gallery:84,96,106`) están sobre los botones-sobre-foto ya excluidos.

→ **Acción: ninguna.** Es texto, no fondo; y va sobre color sólido (no sobre blanco).

### `#fff` en `src/lib/email.ts` — 7 usos (líneas 77, 90, 113, 133, 153, 178, 200)
`color:#fff` del texto de los botones salvia en las **plantillas de email** (HTML inline).
Son emails (no UI de la app), es color de **texto** (no fondo) y las plantillas **no tienen
modo oscuro**. → **Acción: ninguna** (fuera de alcance).

### `white` en archivos `.css`
Sin coincidencias (`globals.css` no usa la palabra `white`).

---

## Resumen / conteo

- **A cambiar: 1** → `Navbar.tsx:163` (`ring-white` → `ring-surface`). Trivial, bajo impacto, con par dark (seguro).
- **Dudosos a decidir a ojo: 1** → `mensajes/page.tsx:69` (`border-white` de la miniatura; sin par dark, ojo con el oscuro si se cambia).
- **Excluidos (intencionales): 7** → botones sobre fotos (SaveButton, ImageUploader ×2, Gallery ×4).
- **Fuera de alcance: 44** `text-white` (foreground sobre color) + **7** `#fff` (emails).
- **Superficies blancas (cards/modales/header/inputs/chips): 0.** ✅

## Nota (inconsistencia a revisar, aparte de los blancos)
La guía de este pedido dice "las cards/chips van un poco **más oscuras** que el fondo", pero
los tokens actuales son al revés: `surface` **#FBFAF7** (cards) es **más claro** que `cream`
**#F2F1EC** (fondo). No afecta esta auditoría de blancos, pero si la intención es que las
superficies elevadas sean más oscuras que el fondo, habría que revisar el valor de `surface`
(decisión de paleta aparte).

## Decisiones tomadas

- **Navbar `ring-white` → `ring-surface`** (resuelto): el halo del indicador de notificaciones
  ahora usa el token `surface` en modo claro. El par dark (`dark:ring-stone-900`) quedó intacto.
- **Miniatura de chat (`src/app/mensajes/page.tsx`):** se mantiene `border-white` **a propósito**
  (contraste funcional sobre imagen: separa la miniatura del avatar, mismo criterio que los
  botones sobre foto). No migra a token de paleta; queda documentado con un comentario en el código.
- **Inversión surface/fondo (PARKED):** `surface` (#FBFAF7) hoy es más claro que `cream`
  (#F2F1EC), lo que contradice la nota de diseño ("cards más oscuras que el fondo"). Pendiente de
  revisión visual lado a lado antes de cambiar nada. NO se modifican los tokens por ahora.
