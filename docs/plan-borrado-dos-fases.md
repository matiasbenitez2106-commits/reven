# Plan: borrado de cuenta en dos fases

_Última actualización: 17 de junio de 2026_

> **Este documento es un plan, no una implementación.** Nada de lo que se describe
> aquí fue programado todavía. Sirve para tener claro qué hay que construir, en qué
> orden y por qué, antes de escribir una sola línea de código.
>
> Una vez que todo esté funcionando, el último paso será actualizar los textos legales
> públicos (Términos y Condiciones y Política de Privacidad). No antes.

---

Hoy en trato, cuando alguien pide borrar su cuenta, el borrado ocurre al instante y
es irreversible. Este plan cambia eso: la cuenta entra en un período de gracia de
90 días durante el cual la persona puede arrepentirse y volver. Recién al cumplirse
ese plazo, el sistema borra los datos de forma definitiva. Además, si hay una
denuncia o disputa abierta, la cuenta no se borra: queda "congelada" hasta que el
asunto se resuelva.

Para más contexto sobre cómo trato trata los datos personales y la verificación de
identidad, ver `docs/politica-datos-y-verificacion.md`.

---

## Sección 1 — Piezas a crear o cambiar

Estas son las partes del sistema que hay que construir o modificar, una por una.

### 1. Estado de la cuenta en la base de datos

**Qué es:** agregar tres campos nuevos a la tabla de usuarios de la base de datos.
La base de datos es como el archivo central del proyecto; hoy cada usuario tiene un
registro con su email, contraseña cifrada, etc. Hay que sumarle:

- **Cuándo se pidió la baja** (fecha y hora exacta del pedido).
- **Fecha programada de borrado** (ese momento más 90 días).
- **Bloqueada por motivo legal** (una marca que dice "esta cuenta no se puede borrar
  todavía porque hay una denuncia en curso").

**Para qué sirve:** sin estos datos el sistema no puede saber en qué etapa está cada
cuenta. Es la base sobre la que se apoya todo lo demás.

**Nivel de riesgo:** bajo. Solo se agregan columnas nuevas; no se toca ningún
comportamiento existente.

---

### 2. Cambiar el flujo de baja

**Qué es:** modificar lo que pasa cuando alguien confirma que quiere borrar su cuenta.

Hoy: confirma → cuenta borrada al instante.

Con este plan: confirma → la cuenta queda marcada como "baja pedida", se suspende
(no puede usarse con normalidad), sus publicaciones se pausan (dejan de ser visibles
para otros) y se manda un mail de aviso. Los datos NO se borran todavía.

Suspender una cuenta significa bloquearle el acceso normal, igual que cuando el
admin suspende a un usuario por mal comportamiento. Pausar una publicación significa
ocultarla del buscador, sin eliminarla.

**Para qué sirve:** da el período de gracia. La persona tiene 90 días para cambiar
de idea.

---

### 3. Flujo de reactivación

**Qué es:** una pantalla o botón que permita a la persona, dentro de los 90 días,
cancelar el pedido de baja y volver a tener la cuenta activa normalmente.

**Para qué sirve:** sin esto, la gracia no tiene sentido. Si alguien se arrepiente,
tiene que poder volver. Al reactivar, las publicaciones pausadas se restauran solas.

---

### 4. Robot diario (tarea programada)

**Qué es:** un programa que corre automáticamente una vez por día, sin que nadie
tenga que hacer nada. Revisa si alguna cuenta cumplió los 90 días desde que se
pidió la baja y, si es así, ejecuta el borrado real y definitivo de esa cuenta
(datos en la base de datos e imágenes en Cloudinary, el servicio donde se guardan
las fotos).

**Para qué sirve:** automatiza el borrado final. Sin esto, alguien tendría que
hacerlo a mano.

**Por qué es la pieza más delicada:** actúa solo y borra para siempre. Si tiene
un error, puede borrar cuentas equivocadas o borrarlas antes de tiempo. Por eso se
va a probar primero en modo "ensayo" (ver Sección 4).

---

### 5. Excepción de bloqueo

**Qué es:** una regla que dice: si una cuenta tiene una denuncia, disputa o
investigación por fraude abierta en el momento en que se pide la baja, esa cuenta
NO entra en el período de gracia ni se programa para borrado. En cambio, queda
"bloqueada": los datos se congelan, solo el equipo de trato (y si fuera necesario,
autoridades) puede acceder a ellos, y no se borran hasta que el asunto se resuelva.

**Para qué sirve:** cumplir con la obligación legal de conservar datos cuando hay
una denuncia en curso, algo que exige la Ley 25.326.

---

### 6. Manejo del login durante la gracia

**Qué es:** definir qué puede hacer alguien que inicia sesión mientras su cuenta
está en período de gracia (entre que pidió la baja y los 90 días).

Puede entrar, pero solo para ver el aviso de que su cuenta está en proceso de baja
y para reactivarla si se arrepiente. No puede usar el marketplace con normalidad.

**Para qué sirve:** evita que la persona use la plataforma como si nada durante la
gracia, pero tampoco la deja completamente afuera (necesita poder reactivar).

---

### 7. Visibilidad en el panel admin

**Qué es:** agregar en el panel de administración (la sección privada que solo usa
el equipo de trato) dos vistas o estados nuevos:

- **"En gracia":** cuentas que pidieron la baja y están dentro de los 90 días.
  Muestra cuántos días quedan y el botón para cancelar la baja si es necesario.
- **"Bloqueada":** cuentas que no se pueden borrar por tener una denuncia abierta.
  Da acceso al dossier de identidad (los datos de verificación de DNI) para uso
  legal.

**Para qué sirve:** que el equipo pueda ver qué pasa con cada cuenta en situación
especial y actuar si hace falta.

---

### 8. Emails

**Qué es:** tres mensajes automáticos que el sistema manda a la persona:

1. **Aviso al pedir la baja:** confirma el pedido, muestra la fecha exacta en que
   se borrarán los datos y da un link para reactivar la cuenta durante los 90 días.
2. **Recordatorio:** unos días antes de que se cumpla el plazo, un recordatorio de
   que el borrado está próximo y que todavía puede reactivar.
3. **Confirmación final:** cuando el borrado se ejecuta, un último email que confirma
   que los datos fueron eliminados.

**Para qué sirve:** transparencia con el usuario y cumplimiento de buenas prácticas
de protección de datos.

---

### 9. Textos legales (T&C + Privacidad)

**Qué es:** actualizar los Términos y Condiciones y la Política de Privacidad para
reflejar todo este mecanismo: el período de gracia, el bloqueo por denuncia, los
plazos, los emails, etc.

**Para qué sirve:** que el usuario sepa exactamente qué pasa con sus datos cuando
pide la baja.

**Importante:** este es el ÚLTIMO paso. Se hace recién cuando todo lo anterior esté
funcionando y probado. No tiene sentido publicar promesas legales sobre algo que
todavía no existe.

---

## Sección 2 — Qué se reaprovecha de lo que ya existe

No hay que construir todo desde cero. Varias piezas del sistema actual se pueden
reusar o adaptar:

- **Suspensión de cuentas (`suspendedAt`):** el panel de admin ya tiene la capacidad
  de suspender una cuenta (bloquea el login y pausa las publicaciones). Este mismo
  mecanismo se reusa para poner la cuenta en estado de gracia, sin tener que
  inventar uno nuevo.

- **Función de borrado real (`deleteUserAccount`):** hoy existe una función que borra
  la cuenta de la base de datos y elimina las imágenes de Cloudinary. El robot diario
  la va a llamar a los 90 días, en lugar de hacerlo al instante como ahora.

- **Chequeo de denuncias en revisión:** la baja actual ya chequea si hay denuncias
  abiertas antes de borrar. Esa lógica se mueve y se convierte en la condición que
  activa el bloqueo legal en lugar del borrado.

- **Estado "pausada" de las publicaciones:** el sistema ya sabe pausar publicaciones.
  Se reusa para ocultarlas durante la gracia.

- **Sistema de emails (`email.ts`):** la infraestructura para mandar correos ya
  existe. Solo hay que escribir los textos nuevos y los momentos en que se disparan.

- **Modal de confirmación (escribir "ELIMINAR"):** la pantalla donde el usuario
  confirma que quiere borrar su cuenta ya existe. Se adapta para que quede claro
  que no es inmediato.

- **Panel de admin y dossier de identidad:** el panel ya existe y ya da acceso a los
  datos de verificación. Solo hay que agregar las vistas de "en gracia" y "bloqueada".

---

## Sección 3 — Decisiones de diseño ya tomadas

Estas no son preguntas abiertas: son decisiones que ya están aprobadas y sobre las
que se va a construir.

1. **Login durante la gracia:** la persona puede iniciar sesión, pero solo para ver
   el aviso de que su cuenta está en proceso de baja o para reactivarla. No puede
   usar el marketplace con normalidad.

2. **Publicaciones durante la gracia:** quedan pausadas (ocultas para otros), pero
   no se borran. Si la persona reactiva, vuelven solas.

3. **Baja con denuncia abierta:** se puede pedir la baja aunque haya una denuncia,
   pero en ese caso la cuenta no entra en gracia: queda bloqueada con los datos
   congelados, accesibles solo para cumplimiento legal, hasta que la denuncia se
   resuelva.

4. **Resolución de una cuenta bloqueada:** cuando la denuncia se cierra, el borrado
   no es automático. Lo decide el admin a mano, caso por caso.

5. **Los tres emails:** aviso al pedir la baja (con link de reactivación y fecha de
   borrado), recordatorio antes del vencimiento, y confirmación cuando los datos
   se borran.

6. **Plazo de 90 días fijos:** aprobado por el abogado. No hay variaciones por tipo
   de cuenta ni por otras condiciones.

7. **Restauración automática al reactivar:** si la persona cancela la baja dentro
   de los 90 días, sus publicaciones pausadas se reactivan solas, sin que tenga que
   hacer nada más.

8. **Email y DNI "ocupados" durante la gracia:** mientras la cuenta está en período
   de gracia, nadie más puede registrarse con el mismo email o el mismo número de
   DNI. Esos datos quedan reservados hasta que la cuenta se borre de verdad.

9. **Robot diario con Vercel Cron:** el robot que ejecuta los borrados va a usar
   el servicio de tareas programadas de Vercel, que requiere el plan Vercel Pro.
   Ese cambio de plan corresponde de todas formas porque trato es un proyecto
   comercial en producción.

10. **La cuenta de admin no se puede dar de baja:** se mantiene la regla existente.
    La única cuenta de administrador del sistema está protegida contra el flujo de baja.

---

## Sección 4 — Orden de trabajo

De lo más seguro a lo más delicado. Cada paso se prueba antes de pasar al siguiente.

**Paso 1 — Estado de la cuenta en la base de datos**
Agregar las columnas nuevas a la tabla de usuarios. No cambia ningún comportamiento;
solo suma información disponible para los pasos siguientes. Es el paso más seguro.

**Paso 2 — Emails de aviso**
Escribir los textos de los tres emails y conectarlos con el sistema de correo
existente. Se puede probar en sandbox (modo de prueba que manda los correos solo
al equipo, no a usuarios reales) antes de activarlos.

**Paso 3 — Cambiar el flujo de baja**
Modificar el botón de "borrar cuenta" para que en lugar de borrar al instante,
marque la cuenta como pendiente, la suspenda, pause las publicaciones y mande el
email de aviso. Este es el primer cambio que los usuarios podrían notar.

**Paso 4 — Reactivación y login en gracia**
Construir la pantalla de reactivación y ajustar lo que ve alguien que entra durante
la gracia. Probar el ciclo completo: pedir baja → entrar → reactivar → verificar
que las publicaciones vuelven.

**Paso 5 — Visibilidad en el panel admin**
Agregar las vistas de "en gracia" y "bloqueada" al panel. El admin puede ver los
estados y acceder al dossier de identidad en casos legales.

**Paso 6 — Excepción de bloqueo**
Implementar la lógica de denuncia abierta → cuenta bloqueada, y la resolución
manual por el admin. Probar el flujo completo de bloqueo y desbloqueo.

**Paso 7 — Robot diario**
Este es el paso más delicado porque actúa solo y borra para siempre.

Se hace en dos etapas:
- Primero en modo "ensayo": el robot corre, detecta qué cuentas borraría, pero solo
  lo registra en un log (un registro de actividad) sin borrar nada. Se revisa ese
  registro para confirmar que la selección es correcta.
- Cuando el modo ensayo da resultados correctos durante varios días, se activa el
  borrado real.

**Paso 8 — Actualizar textos legales (T&C + Privacidad)**
Solo cuando todo lo anterior funciona y está probado. Se actualizan los textos
públicos para reflejar el mecanismo completo.
