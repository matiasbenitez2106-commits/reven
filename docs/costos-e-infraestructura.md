# Costos e infraestructura

_Última actualización: 17 de junio de 2026_

Este documento explica en qué servicios vive trato, cuánto cuesta cada uno y
cuándo pasa de gratuito a pago. Es una referencia para tomar decisiones de
negocio con claridad.

> Los precios son los de junio de 2026. Conviene confirmarlos en la página de
> cada servicio antes de tomar decisiones, porque cambian seguido.

---

## 1. Dos tipos de costos

Los costos de trato se dividen en dos categorías:

- **Costos fijos:** se pagan todos los meses pase lo que pase, sin importar
  cuántos usuarios tenga la app ni cuántas publicaciones haya.

- **Costos variables:** arrancan gratis y solo se empieza a pagar cuando el uso
  supera cierto límite. A mayor volumen de usuarios o actividad, mayor es el
  costo.

---

## 2. Los servicios y sus costos

| Servicio | Para qué sirve | Gratis hasta | Costo cuando se supera |
|---|---|---|---|
| **Vercel** | Donde vive y corre la app | Plan gratuito solo para proyectos sin fines de lucro | **20 USD/mes** (Plan Pro, obligatorio para proyectos comerciales) |
| **Neon** | La base de datos: guarda textos, usuarios, publicaciones, mensajes | 0,5 GB | ~5 USD/mes |
| **Cloudinary** | Las imágenes: fotos del DNI, selfies, fotos de productos | 25 GB por mes (entre lo almacenado y lo que la gente ve) | ~89 USD/mes |
| **Resend** | Envío de emails: verificación, recuperación de contraseña, etc. | 3.000 emails por mes (con tope de 100 por día) | 20 USD/mes |
| **MapTiler** | Los mapas de ubicación en las publicaciones | Plan gratuito amplio | Poco probable que sea el primer problema |
| **MercadoPago** | El sistema de cobros: suscripciones y publicaciones destacadas | Sin costo mensual | Un porcentaje de cada cobro procesado |

---

## 3. El primer costo real: Vercel Pro

Vercel es el servicio donde vive la app. Su plan gratuito tiene una condición
importante: es solo para proyectos sin fines de lucro o para uso personal.

Como trato genera ingresos (suscripciones, publicaciones destacadas), no
corresponde el plan gratuito. El plan que hay que usar es el **Pro, que cuesta
20 USD por mes**.

Este es el primer costo fijo que aparece, independientemente del tráfico o del
tamaño de la app.

---

## 4. El salto de precio más grande: Cloudinary

Cloudinary guarda todas las imágenes de trato: las fotos del frente y dorso del
DNI, la selfie de verificación, y las fotos de cada publicación.

El plan gratuito cubre **25 GB por mes**, contando tanto el espacio usado para
guardar las imágenes como el volumen de imágenes que la app muestra a los
usuarios. Ese límite alcanza para una cantidad considerable de usuarios y
publicaciones al comienzo.

El problema es que cuando se supera ese límite, el salto de precio es grande:
el siguiente plan arranca en **~89 USD/mes**. Es el costo variable más
importante a monitorear a medida que crezca la base de usuarios.

---

## 5. El límite diario de Resend

Resend es el servicio que manda los emails: el email de verificación al
registrarse, el link para recuperar contraseña, las notificaciones, etc.

El plan gratuito permite **3.000 emails por mes**, pero tiene un tope de
**100 emails por día**. Ese tope diario es el que puede tocarse antes que el
mensual, especialmente en días con muchos registros nuevos o una campaña de
difusión.

Si ese límite se supera, los emails de ese día quedan sin enviarse, lo que
afecta directamente la experiencia del usuario (alguien que se registra y no
recibe el email de verificación, por ejemplo).

Cuando se necesite más capacidad, el plan pago arranca en **20 USD/mes**.

---

## 6. MercadoPago: la pregunta pendiente

MercadoPago no cobra una mensualidad fija. Cobra un **porcentaje de cada
cobro que procesa**.

Hoy trato usa MercadoPago para dos cosas:
- Las **suscripciones** de los vendedores (planes PRO y PRO+).
- Las **publicaciones destacadas** (pago único para aparecer primero en los resultados).

Hay una pregunta de negocio que hay que definir antes de crecer:

> ¿Los pagos de las compraventas entre usuarios van a pasar por trato?

Si la respuesta es **sí**, MercadoPago cobra una comisión sobre cada venta
entre particulares, lo que entra en conflicto directo con la propuesta de
valor de trato ("cero comisiones al vendedor").

Si la respuesta es **no**, los compradores y vendedores se arreglan entre ellos
(efectivo, transferencia, etc.) y trato solo cobra por las suscripciones y los
destacados. En ese caso, MercadoPago solo interviene en los pagos que le
corresponden a trato como plataforma.

Esta decisión tiene impacto en el modelo de negocio y en cómo se le comunica
a los usuarios.

---

## 7. Un costo futuro a tener en cuenta: verificación facial avanzada

Hoy el proceso de verificación de identidad (DNI + selfie) lo revisa
manualmente un administrador. En el futuro se evalúa automatizar ese proceso
con un proveedor externo de reconocimiento facial.

Si eso sucede, ese tipo de proveedores generalmente cobran **por cada
verificación completada**, no una tarifa fija mensual. Eso significa que el
costo crece directamente con la cantidad de usuarios nuevos que se registren.

Es un dato importante para proyectar costos cuando la plataforma escale.
Para más detalle sobre los requisitos de ese proveedor, ver
`docs/politica-datos-y-verificacion.md`, sección 3.

---

*Documento de uso interno. No contiene datos de usuarios ni información sensible.*
