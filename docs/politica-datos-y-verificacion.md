# Política de datos y verificación de identidad

_Última actualización: 17 de junio de 2026_

Este documento explica cómo trato maneja los datos de identidad de sus usuarios
(DNI y selfie), qué pasa con esos datos cuando alguien pide darse de baja, y
cuáles son los requisitos que tiene en mente para mejorar el sistema de
verificación en el futuro.

Es un documento interno. Sirve para tomar decisiones de producto con claridad y
para que el equipo legal sepa el estado actual de cada punto.

---

## 1. Cuánto tiempo se guardan los datos de identidad (DNI y selfie)

### Qué son estos datos

Cuando un usuario se verifica en trato, el sistema guarda:

- Una foto del frente del DNI.
- Una foto del dorso del DNI.
- Una selfie del usuario.
- El número de DNI extraído del código de barras.

Todos estos datos se guardan encriptados (es decir, convertidos a un código
ilegible sin la clave correcta) en cumplimiento con la Ley 25.326 de Protección
de Datos Personales de Argentina.

### Mientras la cuenta está activa

Los datos se conservan mientras la cuenta esté activa. El motivo es doble:

1. **Prevención de fraude:** permite detectar si alguien intenta registrarse dos
   veces con el mismo documento, o si un usuario bloqueado intenta volver con una
   cuenta nueva.
2. **Respuesta a la justicia:** si un juez o autoridad competente emite una orden
   legal válida, trato puede presentar los datos de identidad del usuario
   involucrado.

### Al pedir la baja de la cuenta

Cuando un usuario pide darse de baja, la cuenta **no se borra de inmediato**.
En cambio, pasa por dos etapas:

**Etapa 1 — Suspensión (90 días de gracia):**
La cuenta queda suspendida durante 90 días. Durante ese tiempo el usuario no
puede operar en la plataforma, pero sus datos siguen guardados. Si cambia de
opinión, puede reactivar la cuenta dentro de ese período sin necesidad de volver
a verificarse.

**Etapa 2 — Eliminación definitiva:**
Si pasaron los 90 días y el usuario no reactivó la cuenta, los datos se borran.

Este comportamiento se explica en los Términos y Condiciones de trato (ver
sección 2 de este documento).

### Excepción: cuando hay una denuncia, disputa o fraude marcado

Si al momento de pedir la baja (o durante los 90 días de gracia) existe una
denuncia activa, una disputa abierta o una marca de fraude asociada a esa cuenta,
los datos **no se borran**. Tampoco cuando vencen los 90 días.

En ese caso, la cuenta y sus datos quedan bloqueados: no son accesibles para
la persona ni para el equipo de trato en general. Solo quedan disponibles para
dar cumplimiento a una orden legal o para resolver el caso que generó el bloqueo.

Una vez que el caso se resuelve definitivamente, los datos siguen el proceso
normal de eliminación.

> Nota para el equipo legal: el abogado del proyecto ya revisó y confirmó la
> redacción fina de los plazos (los 90 días) y el mecanismo preciso de la
> excepción de bloqueo. Lo aprobado es la redacción de esos puntos. Sin embargo,
> incorporar esos textos a los documentos legales públicos (Términos y
> Condiciones y Política de Privacidad) sigue pendiente: primero hay que
> actualizar el código de la app para que el borrado funcione en dos fases como
> describe esta política. Hoy el código borra la cuenta al instante, no respeta
> los 90 días. Hasta que eso esté implementado, los textos públicos no deben
> reflejar este comportamiento porque generarían una promesa que la app no cumple.

---

## 2. Dónde se informa al usuario de cada cosa

Los usuarios de trato deben poder leer estas reglas en los documentos legales
de la plataforma. La tabla siguiente indica qué va en cada documento:

| Tema | Documento donde se explica |
|---|---|
| Cómo funciona la baja de cuenta (los 90 días y la opción de reactivar) | Términos y Condiciones |
| Cuánto tiempo se guardan el DNI y la selfie, y por qué | Política de Privacidad |
| La excepción de bloqueo por denuncia o fraude | Ambos documentos (mención en T&C, detalle en Privacidad) |

Estos textos legales viven en el archivo `src/content/legal.ts` y se muestran
en las pantallas `/terminos` y `/privacidad` de la app. Cualquier cambio en la
política debe reflejarse en ese archivo.

---

## 3. Requisitos para un futuro reconocimiento facial (todavía no implementado)

Hoy el proceso de verificación de trato tiene tres pasos: foto del frente del
DNI, foto del dorso, y selfie. Un administrador revisa manualmente cada
solicitud y la aprueba o rechaza.

En el futuro se evalúa agregar reconocimiento facial automático para hacer ese
proceso más rápido y seguro. Para que cualquier proveedor de reconocimiento
facial sea aceptable, tiene que cumplir los siguientes tres requisitos:

### 3.1. Prueba de vida (también llamada "liveness detection")

El sistema debe ser capaz de confirmar que frente a la cámara hay una persona
real, no una foto impresa, un video en pantalla ni una máscara. Sin esta
capacidad, alguien podría intentar verificarse usando la foto del DNI de otra
persona.

### 3.2. Soporte del DNI argentino

El proveedor debe ser capaz de leer y validar correctamente el DNI argentino
(tanto el diseño actual como modelos anteriores). No todos los proveedores
internacionales soportan documentos de Argentina.

### 3.3. El proveedor no se queda con los datos biométricos

Los datos biométricos son las características únicas del cuerpo de una persona
que un sistema puede medir: la geometría del rostro, la distancia entre los ojos,
etc. Son datos extremadamente sensibles.

El proveedor elegido debe borrar esos datos una vez terminada la verificación.
No puede guardarlos, usarlos para entrenar modelos propios ni compartirlos con
terceros. Esto es un requisito no negociable para cumplir con la Ley 25.326 y
para mantener la confianza de los usuarios de trato.

---

## 4. Estado legal de esta política

| Punto | Estado |
|---|---|
| Enfoque general de retención y baja de datos | Revisado y aprobado por el abogado del proyecto |
| Redacción fina de los plazos (los 90 días) | Confirmado / aprobado por el abogado del proyecto |
| Redacción fina de la excepción de bloqueo | Confirmado / aprobado por el abogado del proyecto |
| Incorporación a los textos legales públicos (T&C y Privacidad) | Pendiente — requiere que la app implemente el borrado en dos fases (90 días); hoy el código borra al instante |
| Requisitos para reconocimiento facial | Definidos internamente, sin revisión legal aún |

---

*Documento de uso interno. No contiene datos de usuarios ni información sensible.*
