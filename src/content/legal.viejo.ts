import type { LegalDocContent } from "@/components/LegalDoc";

// Contenido legal de trato. Redactado para el MVP en base a la Ley 25.326 (Argentina).
// IMPORTANTE: reemplazá los correos provisorios (privacidad@apptrato.com / soporte@apptrato.com)
// y completá la razón social y el domicilio legal del responsable antes de operar en serio.
// Este contenido es informativo y no constituye asesoramiento legal.

export const UPDATED_VIEJO = "7 de junio de 2026";

export const PRIVACY_VIEJO: LegalDocContent = {
  title: "Política de Privacidad de trato",
  intro:
    "En trato nos tomamos en serio la protección de tus datos personales. Esta Política de Privacidad explica de forma clara qué datos recolectamos, para qué los usamos, cómo los cuidamos, con quién los compartimos y qué derechos tenés sobre ellos. Te pedimos que la leas con atención antes de crear tu cuenta o usar el servicio. Está redactada de acuerdo con la Ley 25.326 de Protección de los Datos Personales de la República Argentina, su Decreto Reglamentario 1558/2001 y las resoluciones de la Agencia de Acceso a la Información Pública (AAIP). Si algo no te queda claro, escribinos: estamos para ayudarte.",
  sections: [
    {
      heading: "Quiénes somos (Responsable de los datos)",
      body: [
        "trato es un marketplace entre particulares (C2C) para la compraventa de productos usados en la Argentina, en el que las personas usuarias están verificadas. El responsable de la base de datos personales es quien opera el servicio “trato” (en adelante, “trato”, “nosotros” o “la app”).",
        "Para cualquier consulta sobre tus datos o esta política, podés contactarnos a través de los canales que figuran al final de este documento. Allí también indicamos la dirección y el correo a los que podés dirigir tus solicitudes.",
      ],
      bullets: [
        "Responsable: trato (titular del marketplace).",
        "Correo para temas de privacidad y datos personales: privacidad@apptrato.com",
        "Correo de soporte general: soporte@apptrato.com",
      ],
    },
    {
      heading: "Marco legal y alcance",
      body: [
        "Esta política se rige por la Ley 25.326 de Protección de los Datos Personales, su Decreto Reglamentario 1558/2001 y las resoluciones de la Agencia de Acceso a la Información Pública (AAIP), que es la autoridad de aplicación en la Argentina. El derecho a la protección de tus datos (habeas data) tiene rango constitucional (artículo 43 de la Constitución Nacional).",
        "Esta política aplica a todos los datos personales que tratamos cuando usás trato: cuando creás tu cuenta, cuando verificás tu identidad, cuando publicás o navegás avisos, cuando chateás con otras personas usuarias y cuando pagás suscripciones o publicaciones destacadas.",
        "La base de datos de trato está (o será) inscripta en el Registro Nacional de Bases de Datos de la AAIP, conforme a la obligación legal del responsable.",
      ],
    },
    {
      heading: "Qué datos recolectamos y con qué finalidad",
      body: [
        "Recolectamos solo los datos que necesitamos para que el marketplace funcione, para verificar identidades y prevenir fraudes, y para cumplir con la ley. A continuación detallamos cada categoría, distinguiendo los datos comunes de los datos sensibles.",
      ],
      bullets: [
        "Datos de cuenta (datos comunes): nombre, apellido, email, contraseña (que guardamos siempre hasheada con bcrypt, nunca en texto plano), provincia, ciudad y una ubicación aproximada (latitud/longitud obtenida por geocodificación de tu ciudad y provincia). Finalidad: crear y administrar tu cuenta, autenticarte y permitir búsquedas por proximidad.",
        "Datos de verificación de identidad (DATOS SENSIBLES y BIOMÉTRICOS): número de DNI, foto del frente del DNI, foto del dorso del DNI y una selfie. Finalidad: verificar que sos quien decís ser, prevenir fraudes y suplantación de identidad, y habilitarte a operar de forma segura en el marketplace. El detalle de cómo tratamos estos datos está en las secciones 4 y 7.",
        "Datos de publicaciones (públicos): título, descripción, precio, categoría, condición, fotos del producto y ubicación del aviso (provincia, ciudad, barrio y ubicación aproximada). Finalidad: mostrar tus avisos a otras personas usuarias.",
        "Chat y mensajes: el contenido de los mensajes que intercambiás con otras personas usuarias. Finalidad: permitir la coordinación de las operaciones de compraventa.",
        "Favoritos y vistas de publicaciones: registro de los avisos que marcás como favoritos y de las vistas que reciben las publicaciones. Finalidad: mejorar tu experiencia y ofrecer estadísticas a las personas vendedoras con plan PRO+.",
        "Denuncias y reportes: la información que enviás al denunciar una publicación o a otra persona usuaria. Finalidad: moderar contenidos y mantener la comunidad segura.",
        "Suscripciones y pagos: los pagos de suscripciones y publicaciones destacadas se procesan a través de MercadoPago. trato NO almacena los datos de tu tarjeta. Finalidad: cobrar planes y servicios pagos.",
        "Notificaciones: tus preferencias y el envío de notificaciones dentro de la app y por email. Finalidad: avisarte de mensajes, actividad de tus avisos y novedades del servicio.",
        "Cookies de sesión: usamos cookies técnicas de sesión (NextAuth, JWT). Finalidad: mantener tu sesión iniciada. Más detalle en la sección 11.",
      ],
    },
    {
      heading: "Datos sensibles y biométricos: cómo los tratamos",
      body: [
        "Para verificar tu identidad necesitamos tratar datos sensibles: tu número de DNI, las fotos del frente y dorso de tu DNI, y una selfie. Bajo la Ley 25.326, el tratamiento de datos sensibles está prohibido salvo excepciones, y la única base que usamos es tu consentimiento expreso, libre e informado. Queremos que entiendas bien tres puntos clave.",
        "Primero: el reconocimiento facial se hace EN TU DISPOSITIVO. La comparación entre la cara de tu DNI y la de tu selfie se ejecuta en tu propio navegador (con la tecnología face-api.js). Los descriptores y plantillas biométricas de tu rostro NO se envían a nuestros servidores ni se almacenan. Al servidor solo llegan dos números: un “match score” (similitud entre la selfie y la cara del DNI) y un “liveness score” (indicio de que hay una persona real frente a la cámara). Esos números los conservamos como evidencia de la decisión de verificación.",
        "Segundo: los datos sensibles son FACULTATIVOS. No estás obligado a darnos tu DNI, las fotos ni la selfie. Ahora bien, la verificación de identidad es un paso necesario para operar en trato: si decidís no aportar estos datos, no vas a poder completar la verificación y, por lo tanto, no vas a poder publicar ni realizar ciertas operaciones dentro del marketplace.",
        "Tercero: tu consentimiento se pide por separado. Cuando iniciás el proceso de verificación, te pedimos un consentimiento específico y diferenciado de la aceptación general de los Términos y Condiciones, mediante una casilla dedicada en la que se te advierte el carácter sensible de los datos y la finalidad concreta (verificación de identidad antifraude). Registramos la fecha y hora de ese consentimiento para poder acreditarlo. Podés revocar tu consentimiento en cualquier momento (ver sección 9).",
      ],
    },
    {
      heading: "Base legal del tratamiento y consentimiento",
      body: [
        "Tratamos tus datos sobre las siguientes bases legales:",
        "Tu consentimiento es la base para el tratamiento de los datos sensibles de verificación de identidad. Ese consentimiento es expreso, libre, informado y específico, y podés retirarlo cuando quieras.",
      ],
      bullets: [
        "Para los datos comunes de cuenta, publicaciones, chat y operación del marketplace: la ejecución de la relación que tenemos con vos como persona usuaria del servicio y tu consentimiento al registrarte y aceptar los Términos y Condiciones.",
        "Para los datos sensibles y biométricos de verificación de identidad (número de DNI, fotos del DNI, selfie y scores de reconocimiento facial): tu CONSENTIMIENTO EXPRESO, LIBRE E INFORMADO, prestado mediante una casilla específica y separada del resto, conforme a los artículos 5 y 7 de la Ley 25.326.",
        "Para conservar cierta información de pagos y operaciones: el cumplimiento de obligaciones legales (por ejemplo, fiscales) que pesan sobre trato.",
      ],
    },
    {
      heading: "Deber de información (qué pasa si das o no das tus datos)",
      body: [
        "Antes de recolectar tus datos te informamos, de forma clara y expresa, lo siguiente, conforme al artículo 6 de la Ley 25.326:",
      ],
      bullets: [
        "Finalidad y destinatarios: usamos tus datos para operar el marketplace, verificar identidades y prevenir fraudes, habilitar la mensajería y procesar pagos de suscripciones y publicaciones destacadas. Los destinatarios son trato y los encargados de tratamiento (terceros) que detallamos en la sección 8.",
        "Existencia de la base de datos e identidad del responsable: existe una base de datos de personas usuarias administrada por trato, cuya identidad y domicilio figuran en este documento.",
        "Carácter obligatorio o facultativo: los datos básicos de cuenta son necesarios para tener una cuenta. Los datos sensibles de verificación son facultativos, pero sin ellos no vas a poder completar la verificación ni operar plenamente en la app.",
        "Consecuencias de dar, no dar o dar datos inexactos: si no completás la verificación, no vas a poder publicar ni realizar ciertas operaciones; si proporcionás datos inexactos, la verificación puede ser rechazada o tu cuenta puede ser suspendida.",
        "Tus derechos: podés ejercer en cualquier momento los derechos de acceso, rectificación, actualización y supresión de tus datos (ver sección 9).",
      ],
    },
    {
      heading: "Cómo protegemos tus datos (seguridad)",
      body: [
        "Aplicamos medidas técnicas y organizativas para proteger tus datos, de acuerdo con el artículo 9 de la Ley 25.326 y la Resolución AAIP 47/2018. Estas son las medidas concretas que ya tenemos implementadas:",
      ],
      bullets: [
        "Contraseñas: nunca se guardan en texto plano. Se almacenan hasheadas con bcrypt.",
        "Cifrado de datos sensibles en reposo: el número de DNI y los identificadores/URLs de las imágenes de verificación se guardan ENCRIPTADOS con el algoritmo AES-256-GCM.",
        "Almacenamiento privado de imágenes: las fotos del DNI y la selfie se guardan en Cloudinary con entrega privada (configuración “authenticated”). No son accesibles por una URL pública ni navegando carpetas: solo pueden verse mediante una URL firmada, no adivinable, generada puntualmente.",
        "Reconocimiento facial en el dispositivo: la comparación biométrica corre en tu navegador. No subimos descriptores ni plantillas faciales al servidor; solo conservamos dos valores numéricos (match score y liveness score).",
        "Acceso restringido: la documentación de verificación solo es accesible para administradores autorizados, mediante URL firmada y por causa justificada (por ejemplo, ante una denuncia). El acceso a los datos está controlado por roles.",
      ],
    },
    {
      heading: "Con quién compartimos tus datos (encargados de tratamiento y terceros)",
      body: [
        "Para prestar el servicio nos apoyamos en proveedores que actúan como encargados de tratamiento (artículo 25 de la Ley 25.326). A todos ellos les exigimos confidencialidad y medidas de seguridad adecuadas, y solo tratan tus datos por nuestra cuenta y para las finalidades aquí descriptas. No vendemos tus datos personales.",
        "Los proveedores que utilizamos son:",
      ],
      bullets: [
        "Neon: base de datos PostgreSQL donde se almacena la información de la app.",
        "Vercel: hosting e infraestructura donde corre la aplicación.",
        "Cloudinary: almacenamiento de imágenes (las imágenes de DNI y selfie se guardan con entrega privada).",
        "Resend: envío de correos electrónicos (notificaciones y comunicaciones del servicio).",
        "MercadoPago: procesamiento de pagos de suscripciones y publicaciones destacadas. trato no almacena datos de tarjetas; los procesa MercadoPago bajo su propia política de privacidad.",
        "Servicio de geocodificación basado en OpenStreetMap/Nominatim: para convertir tu ciudad y provincia en una ubicación aproximada y permitir búsquedas por proximidad.",
        "Eventualmente, un proveedor de verificación de identidad (por ejemplo, Onfido), en caso de que en el futuro se incorpore para reforzar el proceso de verificación. Si esto ocurriera, se actualizará esta política en consecuencia.",
      ],
    },
    {
      heading: "Cooperación con autoridades y prevención de fraude",
      body: [
        "Conservamos los datos de verificación de identidad (número de DNI, fotos del documento y selfie), encriptados y con acceso restringido a administradores, para prevenir fraudes y poder colaborar con la justicia.",
        "Si ocurre un delito vinculado a una operación (por ejemplo, una estafa o un robo), podemos divulgar estos datos a la autoridad competente —policía, fiscalía o juzgado— cuando exista un requerimiento legal o una denuncia que lo justifique. Importante: estos datos NO se entregan directamente a otras personas usuarias; la información de identidad de un tercero solo se comparte con las autoridades por los canales legales correspondientes.",
        "Por este motivo, si tenés una denuncia en revisión en tu contra, es posible que no puedas eliminar tu cuenta hasta que se resuelva.",
      ],
    },
    {
      heading: "Tus derechos sobre tus datos",
      body: [
        "Como titular de los datos, la ley te reconoce los siguientes derechos, que podés ejercer en forma gratuita:",
      ],
      bullets: [
        "Acceso (artículos 14 y 15): pedirnos si tratamos datos tuyos y conocer su contenido, origen, finalidad y eventuales cesiones. Te respondemos dentro de los 10 días corridos. Podés ejercerlo a intervalos no menores a 6 meses, salvo que acredites un interés legítimo.",
        "Rectificación y actualización (artículo 16): corregir o actualizar datos inexactos, erróneos o desactualizados. Plazo máximo de respuesta: 5 días hábiles.",
        "Supresión (artículo 16): pedir que eliminemos tus datos cuando su tratamiento ya no corresponda o cuando revoques tu consentimiento. Plazo máximo: 5 días hábiles. No procede cuando pueda perjudicar derechos de terceros o cuando exista una obligación legal de conservar los datos.",
        "Confidencialidad y bloqueo: solicitar el bloqueo o sometimiento a confidencialidad de tus datos en los casos previstos por la ley.",
        "Revocación del consentimiento: como el tratamiento de datos sensibles se basa en tu consentimiento, podés revocarlo cuando quieras. La revocación habilita la supresión de las imágenes de DNI/selfie y datos asociados, salvo lo que debamos conservar por ley.",
      ],
    },
    {
      heading: "Cómo ejercer tus derechos y reclamar",
      body: [
        "Para ejercer cualquiera de los derechos de la sección anterior, escribinos a privacidad@apptrato.com o al domicilio del responsable. Para poder atender tu pedido y resguardar tus datos, es posible que necesitemos verificar tu identidad antes de responder.",
        "Si considerás que no respetamos tus derechos, podés presentar una denuncia ante la Agencia de Acceso a la Información Pública (AAIP), que es el órgano de control en materia de protección de datos personales en la Argentina, o iniciar la acción judicial de habeas data prevista en el artículo 43 de la Constitución Nacional y en la Ley 25.326.",
        "Por transparencia, dejamos constancia de que la ley argentina de protección de datos está en proceso de reforma. Las versiones en discusión prevén nuevos derechos (por ejemplo, portabilidad de datos, oposición al tratamiento y derecho a no ser objeto de decisiones basadas únicamente en tratamientos automatizados). Aún no están vigentes; si se aprueban, adaptaremos esta política.",
      ],
    },
    {
      heading: "Cookies",
      body: [
        "Usamos cookies estrictamente técnicas y necesarias para el funcionamiento del servicio. En particular, cookies de sesión gestionadas por NextAuth (basadas en tokens JWT) que sirven para mantener tu sesión iniciada mientras navegás la app.",
        "Estas cookies son imprescindibles para que puedas usar trato de forma segura. No las usamos para publicidad ni para perfilar tu comportamiento. Podés bloquear o borrar las cookies desde la configuración de tu navegador, pero en ese caso es posible que no puedas mantener la sesión iniciada ni usar correctamente el servicio.",
      ],
    },
    {
      heading: "Plazos de conservación de los datos",
      body: [
        "Conservamos tus datos solo durante el tiempo necesario para las finalidades para las que fueron recolectados, conforme al artículo 4, inciso 7, de la Ley 25.326. Aplicamos criterios de minimización y borrado seguro:",
      ],
      bullets: [
        "Datos de cuenta: se conservan mientras tu cuenta esté activa. Si te das de baja, los eliminamos o anonimizamos, salvo lo que debamos conservar por obligación legal.",
        "Imágenes de DNI y selfie: se conservan, encriptadas y con acceso restringido a administradores, mientras tu cuenta esté activa y por un plazo prudencial posterior, con el fin de prevenir fraudes y de poder responder a requerimientos de la justicia o de autoridades competentes (por ejemplo, ante la denuncia de un delito). No se publican ni se entregan a otras personas usuarias.",
        "Scores de reconocimiento facial (match y liveness): se conservan como prueba de la decisión de verificación.",
        "Descriptores y plantillas biométricas: no se conservan, porque el reconocimiento facial corre en tu dispositivo y nunca llegan a nuestros servidores.",
        "Datos de pagos: la información mínima de operaciones puede conservarse por el plazo que exijan las normas fiscales y legales aplicables.",
        "Al ejercer la supresión o al darte de baja, eliminamos efectivamente las imágenes (incluida su baja en Cloudinary) y los datos sensibles asociados, salvo que exista una denuncia o investigación en curso, o una obligación legal que nos exija conservarlos por un plazo determinado.",
      ],
    },
    {
      heading: "Transferencia internacional de datos",
      body: [
        "Algunos de nuestros proveedores (por ejemplo, Vercel, Neon y Cloudinary) pueden alojar u operar datos fuera de la Argentina, incluso en países que la AAIP no considera de “nivel adecuado” de protección (como Estados Unidos). Esto implica una transferencia internacional de datos, regulada por el artículo 12 de la Ley 25.326.",
        "Para que esa transferencia sea lícita, nos amparamos en los mecanismos de legitimación previstos por la normativa: la suscripción de cláusulas contractuales modelo aprobadas por la AAIP (Disposición 60/2016, actualizada por la Resolución AAIP 198/2023) con los encargados de tratamiento y, cuando corresponde, tu consentimiento expreso para la transferencia internacional. A todos los encargados les exigimos confidencialidad y medidas de seguridad equivalentes a las que aplicamos nosotros (artículo 25 de la Ley 25.326).",
        "Dado el carácter sensible de los datos de verificación, te informamos esta circunstancia para que la tengas presente al prestar tu consentimiento.",
      ],
    },
    {
      heading: "Servicio solo para mayores de 18 años",
      body: [
        "trato está dirigido exclusivamente a personas mayores de 18 años con capacidad legal para contratar y para prestar válidamente su consentimiento. No está permitido el uso del servicio por menores de edad.",
        "Si tomamos conocimiento de que una cuenta corresponde a una persona menor de 18 años, podremos suspenderla y eliminar los datos asociados.",
      ],
    },
    {
      heading: "Cambios en esta política",
      body: [
        "Podemos actualizar esta Política de Privacidad para reflejar cambios en el servicio, en nuestros proveedores o en la normativa aplicable. Cuando hagamos cambios relevantes, te lo comunicaremos a través de la app o por email, e indicaremos siempre la fecha de vigencia de la versión actualizada.",
        "Te recomendamos revisar esta página periódicamente. El uso continuado del servicio luego de la entrada en vigencia de los cambios implica que tomaste conocimiento de ellos. Cuando se trate de cambios que afecten el tratamiento de datos sensibles, te pediremos nuevamente tu consentimiento cuando corresponda.",
      ],
      bullets: ["Fecha de vigencia: 7 de junio de 2026.", "Última actualización: 7 de junio de 2026."],
    },
    {
      heading: "Contacto",
      body: [
        "Si tenés preguntas, quejas o querés ejercer tus derechos sobre tus datos personales, escribinos. Estamos para ayudarte.",
      ],
      bullets: [
        "Privacidad y protección de datos: privacidad@apptrato.com",
        "Soporte general: soporte@apptrato.com",
        "Órgano de control: Agencia de Acceso a la Información Pública (AAIP) — ante la cual podés presentar denuncias en materia de protección de datos personales.",
      ],
    },
  ],
};

export const TERMS_VIEJO: LegalDocContent = {
  title: "Términos y Condiciones de trato",
  intro:
    "Bienvenido/a a trato. Estos Términos y Condiciones (los “Términos”) regulan el acceso y uso de la plataforma trato (el “Servicio”). Al registrarte, acceder o usar trato, aceptás estos Términos en su totalidad. Si no estás de acuerdo, no uses el Servicio. Te pedimos que los leas con atención, porque definen tus derechos, tus obligaciones y los límites de la responsabilidad de trato.",
  sections: [
    {
      heading: "Qué es trato (y qué no es)",
      body: [
        "trato es una plataforma digital que CONECTA a compradores y vendedores particulares de productos usados en Argentina. Nuestra función es poner en contacto a las partes y ofrecer herramientas para que publiquen, busquen y se comuniquen entre sí.",
        "Es muy importante que entiendas el rol de trato. trato NO es vendedor ni comprador, NO es parte de la compraventa que se realiza entre los usuarios, y NO interviene en la entrega de los productos ni en el pago entre las partes. trato tampoco retiene dinero de las transacciones ni cobra comisión por venta.",
        "trato obtiene sus ingresos exclusivamente a través de suscripciones (planes pagos) y publicaciones destacadas. Cualquier acuerdo de compraventa se celebra directa y únicamente entre el comprador y el vendedor, que son los responsables exclusivos de cumplirlo.",
      ],
      bullets: [
        "trato NO vende ni compra productos.",
        "trato NO es parte del contrato de compraventa entre usuarios.",
        "trato NO participa en la entrega ni en el pago entre las partes.",
        "trato NO retiene dinero ni cobra comisión por las ventas.",
        "trato SÍ ofrece, de forma paga, suscripciones y publicaciones destacadas.",
      ],
    },
    {
      heading: "Requisitos para usar el Servicio",
      body: [
        "Para usar trato necesitás cumplir con todos los requisitos que se detallan a continuación. Si no los cumplís, no podés registrarte ni operar en la plataforma.",
        "La verificación de identidad por DNI es un paso obligatorio: sin completarla no vas a poder publicar avisos ni contactar vendedores. Esta medida existe para aumentar la seguridad y la confianza dentro de la comunidad.",
      ],
      bullets: [
        "Ser mayor de 18 años.",
        "Brindar datos personales veraces, completos y actualizados.",
        "Completar la verificación de identidad por DNI para poder publicar y contactar vendedores.",
        "Usar el Servicio cumpliendo estos Términos y la ley argentina vigente.",
      ],
    },
    {
      heading: "Verificación de identidad",
      body: [
        "Para habilitar las funciones de publicar y contactar vendedores, te vamos a pedir que verifiques tu identidad mediante tu DNI. Al hacerlo, declarás que los datos y la documentación que aportás son verdaderos y te pertenecen.",
        "Está terminantemente prohibido usar documentos de terceros, datos falsos o cualquier maniobra para eludir o falsear la verificación. El incumplimiento puede derivar en la suspensión o eliminación de tu cuenta.",
        "Tus datos personales se tratan conforme a la normativa de protección de datos personales aplicable en Argentina y a nuestra Política de Privacidad.",
      ],
    },
    {
      heading: "Tu cuenta",
      body: [
        "Para operar necesitás crear una cuenta. Sos responsable de la información que cargás y del uso que se haga de tu cuenta.",
        "Las credenciales de acceso (usuario y contraseña) son personales e intransferibles. Cuidá tu contraseña y avisanos de inmediato si detectás un uso no autorizado de tu cuenta.",
      ],
      bullets: [
        "Una sola cuenta por persona.",
        "Sos responsable de mantener la confidencialidad de tus credenciales.",
        "Sos responsable de toda actividad realizada desde tu cuenta.",
        "Está prohibido suplantar la identidad de otra persona o crear cuentas en nombre de terceros sin autorización.",
      ],
    },
    {
      heading: "Reglas sobre las publicaciones",
      body: [
        "En trato solo podés publicar productos usados, legales y que estén efectivamente disponibles para la venta. La información de cada aviso (descripción, fotos, precio, estado del producto) debe ser veraz y no inducir a error.",
        "Sos el único responsable del contenido que publicás y de que tengas derecho a vender el producto ofrecido.",
      ],
    },
    {
      heading: "Productos y contenido prohibido",
      body: [
        "Está prohibido publicar, ofrecer o intentar comercializar a través de trato los siguientes productos o contenidos. Esta lista es enunciativa: también queda prohibido todo aquello que esté prohibido por la ley.",
      ],
      bullets: [
        "Armas, municiones y explosivos.",
        "Drogas y sustancias ilegales.",
        "Medicamentos.",
        "Productos robados o de origen ilícito.",
        "Falsificaciones, réplicas o productos que infrinjan marcas o derechos de terceros.",
        "Animales.",
        "Material sexual.",
        "Documentos oficiales.",
        "Cualquier otro producto, servicio o contenido prohibido por la ley vigente.",
      ],
    },
    {
      heading: "Conducta prohibida",
      body: [
        "Para mantener un entorno seguro y confiable, no está permitido realizar ninguna de las siguientes conductas dentro de trato o en relación con el Servicio.",
      ],
      bullets: [
        "Cometer fraudes, estafas o cualquier engaño en perjuicio de otros usuarios.",
        "Enviar spam o mensajes masivos no solicitados.",
        "Acosar, amenazar, discriminar o agredir a otros usuarios.",
        "Realizar scraping o extracción automatizada de datos de la plataforma.",
        "Eludir, manipular o falsear la verificación de identidad o cualquier medida de seguridad.",
        "Usar el Servicio con fines distintos a los previstos o para actividades ilegales.",
      ],
    },
    {
      heading: "Transacciones entre particulares",
      body: [
        "Las compraventas que se inicien a través de trato se coordinan, acuerdan y ejecutan exclusivamente entre el comprador y el vendedor. trato no participa en la negociación, la entrega ni el pago, y no es responsable por el cumplimiento del acuerdo entre las partes.",
        "trato no garantiza la veracidad, exactitud ni legalidad de las publicaciones, ni la identidad real, la solvencia o la conducta de los usuarios. Cada parte debe actuar con prudencia y diligencia.",
        "Te recomendamos seguir estas pautas de seguridad para reducir riesgos:",
      ],
      bullets: [
        "Encontrarte en lugares públicos, concurridos y bien iluminados.",
        "Revisar el producto en persona antes de pagar.",
        "Verificar el funcionamiento y el estado real del producto.",
        "Desconfiar de precios demasiado bajos o de pedidos de pago anticipado.",
        "No compartir datos sensibles ni credenciales con otros usuarios.",
        "Si algo te parece sospechoso, no concretar la operación y denunciarlo.",
      ],
    },
    {
      heading: "Planes pagos: PRO y PRO+",
      body: [
        "trato ofrece suscripciones pagas que habilitan funciones y beneficios adicionales dentro del Servicio. Los planes disponibles y sus precios son:",
        "El cobro de las suscripciones se realiza a través de MercadoPago. Al contratar un plan, autorizás el cobro recurrente correspondiente a través de ese medio de pago.",
      ],
      bullets: ["Plan PRO: $3.990 por mes.", "Plan PRO+: $8.990 por mes."],
    },
    {
      heading: "Publicaciones destacadas",
      body: [
        "Además de las suscripciones, podés contratar publicaciones destacadas, que dan mayor visibilidad a un aviso dentro del Servicio. Las publicaciones destacadas son un pago único (no recurrente) y se facturan a través de MercadoPago.",
        "El alcance y la duración del destacado son los que se indiquen al momento de la contratación.",
      ],
    },
    {
      heading: "Renovación, cancelación y reembolsos",
      body: [
        "Las suscripciones PRO y PRO+ se renuevan automáticamente al finalizar cada período mensual, mediante el cobro a través de MercadoPago, salvo que las canceles antes de la fecha de renovación.",
        "Podés cancelar tu suscripción cuando quieras desde tu cuenta. La cancelación detiene las futuras renovaciones, pero tu plan sigue activo hasta el final del período ya pagado; no se realizan cobros adicionales luego de la cancelación.",
        "Reembolsos: salvo el ejercicio del derecho de arrepentimiento previsto por la ley (ver sección 16) y los casos en que la ley argentina obligue a reintegrar, los importes abonados por suscripciones ya iniciadas y por publicaciones destacadas no son reembolsables. Si tenés un problema con un cobro, escribinos y lo vamos a revisar.",
      ],
      bullets: [
        "Renovación automática mensual de PRO y PRO+ hasta que canceles.",
        "La cancelación frena las renovaciones futuras.",
        "Al cancelar, el plan sigue activo hasta el fin del período ya abonado.",
        "Reembolsos sujetos a esta política, al derecho de arrepentimiento y a la ley aplicable.",
      ],
    },
    {
      heading: "Cambios de precio",
      body: [
        "trato puede modificar los precios de los planes y de las publicaciones destacadas. Si cambiamos el precio de tu suscripción, te lo vamos a avisar con anticipación razonable.",
        "Si no estás de acuerdo con el nuevo precio, podés cancelar la suscripción antes de que entre en vigencia. Si continuás usando el plan luego de la fecha del cambio, se entiende que aceptaste el nuevo precio.",
      ],
    },
    {
      heading: "Licencia sobre el contenido que publicás",
      body: [
        "El contenido que cargás en tus publicaciones (textos, fotos y demás materiales) sigue siendo tuyo. Vos sos responsable de tener los derechos sobre ese contenido.",
        "Al publicar en trato, le otorgás a trato una licencia gratuita y no exclusiva para alojar, mostrar, reproducir y promocionar tus publicaciones dentro del Servicio, con la finalidad de hacerlas visibles a otros usuarios y difundir la plataforma. Esta licencia se limita a lo necesario para prestar y promocionar el Servicio.",
      ],
    },
    {
      heading: "Moderación, suspensión y eliminación de cuentas",
      body: [
        "trato puede revisar denuncias y moderar el contenido de la plataforma para hacer cumplir estos Términos y la ley.",
        "Cuando detectemos incumplimientos, podremos adoptar medidas proporcionales al caso, incluyendo despublicar avisos, restringir funciones, y suspender o eliminar cuentas. En casos graves o de actividad ilícita, podremos actuar de inmediato y, si corresponde, colaborar con las autoridades competentes.",
      ],
      bullets: [
        "Revisar denuncias de usuarios.",
        "Despublicar avisos que infrinjan estos Términos o la ley.",
        "Suspender o eliminar cuentas que incumplan.",
      ],
    },
    {
      heading: "Propiedad intelectual de trato",
      body: [
        "La marca trato, su logo, el software, el diseño, la interfaz y todos los elementos que componen la plataforma son propiedad de trato o de sus licenciantes, y están protegidos por las leyes de propiedad intelectual.",
        "No podés copiar, modificar, distribuir, descompilar ni usar la marca o el software de trato sin autorización previa y por escrito. El uso del Servicio no te transfiere ningún derecho de propiedad intelectual sobre trato.",
      ],
    },
    {
      heading: "Defensa del Consumidor y derecho de arrepentimiento",
      body: [
        "En lo que corresponda, las relaciones de consumo con trato se rigen por la Ley 24.240 de Defensa del Consumidor y sus normas complementarias.",
        "Derecho de arrepentimiento: como los planes pagos y las publicaciones destacadas se contratan online (a distancia), tenés derecho a arrepentirte de la contratación dentro de los 10 (diez) días corridos contados desde la contratación del servicio, sin necesidad de expresar la causa y sin penalidad alguna, conforme a la Ley 24.240. Para ejercerlo, escribinos al contacto indicado más abajo. Tené en cuenta que este derecho puede no aplicar cuando el servicio contratado ya fue íntegramente prestado o comenzó a ejecutarse con tu conformidad antes de vencido el plazo, en los términos que prevé la ley.",
      ],
    },
    {
      heading: "Limitación de responsabilidad",
      body: [
        "trato actúa como intermediario que conecta a usuarios particulares. Dentro de los límites permitidos por la ley, trato no es responsable por:",
        "trato no garantiza que el Servicio esté disponible de forma ininterrumpida o libre de errores, aunque trabajamos para que funcione correctamente. Nada en esta sección limita los derechos que la ley te reconoce como consumidor ni la responsabilidad que la ley no permite excluir.",
      ],
      bullets: [
        "El cumplimiento, la calidad, la legalidad o la veracidad de las operaciones entre comprador y vendedor.",
        "Los productos publicados por los usuarios y el estado real de los mismos.",
        "La conducta de los usuarios dentro o fuera de la plataforma.",
        "Los daños derivados de operaciones acordadas y ejecutadas directamente entre las partes.",
      ],
    },
    {
      heading: "Modificaciones de los Términos",
      body: [
        "trato puede modificar estos Términos para adaptarlos a cambios legales, técnicos o del Servicio. Cuando haya cambios relevantes, te los vamos a avisar por los medios disponibles (por ejemplo, dentro de la plataforma o por correo electrónico) con anticipación razonable.",
        "Si seguís usando el Servicio después de que los cambios entren en vigencia, se entiende que aceptás los Términos modificados. Si no estás de acuerdo, podés dejar de usar trato y cancelar tu cuenta.",
      ],
    },
    {
      heading: "Ley aplicable y jurisdicción",
      body: [
        "Estos Términos se rigen por las leyes de la República Argentina.",
        "Ante cualquier conflicto, las partes se someten a los tribunales competentes de Argentina, sin perjuicio de las normas de competencia que la ley establezca a favor del consumidor.",
      ],
    },
    {
      heading: "Contacto",
      body: [
        "Si tenés dudas, reclamos o querés ejercer alguno de tus derechos (incluido el de arrepentimiento), escribinos. Vamos a responderte a la brevedad.",
        "Correo de contacto: soporte@apptrato.com",
      ],
    },
  ],
};
