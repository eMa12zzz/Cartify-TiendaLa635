/*
 * ============================================================
 * MENSAJES DEL SERVIDOR, EN ESPAÑOL — mensajesBackend.js
 * ============================================================
 * La última red antes de que un mensaje en inglés le caiga en la cara a
 * alguien que solo vino a comprar arroz.
 *
 * Los controladores del backend ya se limpiaron y hoy responden en español,
 * así que este archivo podría parecer de sobra. No lo es. El día que se
 * agregue un endpoint nuevo y se escape un "Product not found" —y se va a
 * escapar, siempre pasa— el interceptor de api.js lo va a traducir igual,
 * sin que nadie tenga que acordarse de nada. Traducir en la puerta de
 * entrada es lo único que no depende de la memoria de quien programe mañana.
 *
 * Cómo decide, en orden:
 *   1. ¿Está en el diccionario? Se usa esa traducción.
 *   2. ¿Cae en una familia conocida ("X not found", "X created successfully")?
 *      Se arma la frase con el glosario de entidades.
 *   3. ¿Ya viene en español? Se devuelve intacto. El backend escribe mejores
 *      mensajes que cualquier traducción automática nuestra ("Solo quedan 3
 *      de Leche Salud" no lo mejora nadie desde aquí).
 *   4. ¿Parece inglés pero no lo reconocemos? Se cambia por el mensaje
 *      genérico del código HTTP. Un "No se encontró lo que buscaba" honesto
 *      es mejor que inglés crudo en una tienda de barrio.
 * ============================================================
 */

/*
 * Un mensaje decente para cada código, por si no hay nada mejor que decir.
 * Están escritos para el cliente, no para quien programa: nada de "Bad
 * Request", que no le dice a nadie qué hacer a continuación.
 */
const POR_ESTADO = {
  400: 'Revise los datos: algo quedó incompleto o no es válido.',
  401: 'Sesión expirada o inválida. Debe iniciar sesión.',
  403: 'No tiene permiso para esta acción.',
  404: 'No se encontró lo que buscaba.',
  408: 'El servidor tardó demasiado en responder.',
  409: 'Ese registro ya existe.',
  413: 'El archivo es demasiado grande.',
  422: 'Revise los datos: algo quedó incompleto o no es válido.',
  429: 'Demasiados intentos seguidos. Espere un momento.',
  500: 'Error interno del servidor.',
  502: 'El servidor no está respondiendo.',
  503: 'El servicio no está disponible en este momento.',
};

const POR_DEFECTO = 'Ha ocurrido un error inesperado.';

/*
 * Glosario de entidades: cómo se llama cada cosa en la tienda y de qué
 * género es. El género hace falta para no terminar diciendo "Marca creado".
 * Las claves van en minúscula porque el texto llega normalizado.
 */
const ENTIDADES = {
  'admin': ['administrador', 'm'],
  'administrator': ['administrador', 'm'],
  'brand': ['marca', 'f'],
  'client': ['cliente', 'm'],
  'customer': ['cliente', 'm'],
  'employee': ['empleado', 'm'],
  'gift card': ['tarjeta', 'f'],
  'module': ['módulo', 'm'],
  'order': ['pedido', 'm'],
  'print service': ['servicio de impresión', 'm'],
  'product': ['producto', 'm'],
  'product type': ['categoría', 'f'],
  'promotion': ['promoción', 'f'],
  'review': ['valoración', 'f'],
  'service': ['servicio', 'm'],
  'shopping': ['compra', 'f'],
  'supplier': ['proveedor', 'm'],
  'supplier movement': ['movimiento', 'm'],
  'user': ['usuario', 'm'],
};

/*
 * Traducciones exactas. Son los mensajes que el backend manda hoy (o mandaba
 * hasta hace poco) y que no encajan en ninguna familia: cada uno merece su
 * propia frase porque decirlos bien importa más que decirlos parejo.
 * La clave va normalizada: minúsculas, sin espacios de más, sin punto final.
 */
const DICCIONARIO = {
  // Errores generales
  'internal server error': 'Error interno del servidor.',
  'internal server error or invalid token': 'Error interno del servidor.',
  'error fetching clients': 'No se pudo cargar la lista de clientes.',

  // Validaciones de formulario
  'required fields': 'Faltan campos obligatorios.',
  'all fields are required': 'Faltan campos obligatorios.',
  'all fields are required, including at least one product':
    'Faltan campos obligatorios: agregue al menos un producto.',
  'missing required fields': 'Faltan campos obligatorios.',

  // Correo y códigos
  'invalid email': 'El correo no es válido.',
  'invalid code': 'El código no es válido.',
  'email sent': 'Le enviamos el código a su correo.',
  'error sending email': 'No se pudo enviar el correo.',
  'recovery code sent successfully': 'Le enviamos el código a su correo.',
  'code verified successfully': 'Código verificado.',
  'code not verified': 'Primero verifique el código.',
  'recovery session expired': 'La recuperación venció. Pida un código nuevo.',
  'verification session expired': 'El registro venció. Vuelva a empezar.',

  // Contraseñas
  'password required': 'Escriba su contraseña.',
  'incorrect password': 'La contraseña es incorrecta.',
  'passwords do not match': 'Las contraseñas no coinciden.',
  'both password fields are required': 'Escriba la contraseña nueva y su confirmación.',
  'password updated successfully': 'Contraseña actualizada.',

  // Estado de la cuenta
  'account disabled': 'La cuenta está desactivada.',
  'account not verified': 'La cuenta todavía no está verificada.',
  'account temporarily blocked. try again later':
    'Cuenta bloqueada un rato. Intente de nuevo en unos minutos.',
  'account blocked due to multiple failed login attempts':
    'Cuenta bloqueada por varios intentos fallidos. Espere 5 minutos.',

  // Sesión y registro
  'login successful': 'Sesión iniciada.',
  'logout successful': 'Sesión cerrada.',
  'unauthorized': 'Debe iniciar sesión.',
  'forbidden': 'No tiene permiso para esta acción.',
  'client already exists with this email': 'Ya existe una cuenta con ese correo.',
  'client registered successfully': 'Cuenta creada.',
  'administrator already exists': 'Ya existe un administrador con ese correo.',
};

/*
 * Palabras que en español no existen. Sirven para distinguir "esto es inglés
 * que no supimos traducir" de "esto ya venía en español y hay que respetarlo".
 * Se exige encontrar DOS distintas antes de dar por perdido el mensaje: con
 * una sola, un nombre de producto ("Pack not found"... o "Kit Escolar") podría
 * hacernos tirar a la basura un mensaje que sí servía.
 */
const SENALES_INGLES = new Set([
  'the', 'not', 'found', 'required', 'successfully', 'fields', 'invalid',
  'password', 'already', 'exists', 'failed', 'attempts', 'please', 'again',
  'must', 'missing', 'unauthorized', 'forbidden', 'created', 'updated',
  'deleted', 'internal', 'server', 'request', 'unable', 'cannot', 'with',
  'this', 'your', 'and', 'were', 'was', 'are', 'is', 'try', 'sent', 'match',
  'expired', 'disabled', 'blocked', 'verified', 'wrong', 'least', 'including',
]);

// Marcas inconfundibles de que el texto ya viene en español.
const MARCAS_ESPANOL = /[áéíóúüñ¿¡]/i;

/*
 * Deja el texto comparable: minúsculas, sin espacios sobrantes y sin el punto
 * final. Así "Client not found." y "client  not found" son la misma llave.
 */
const normalizar = (texto) =>
  String(texto).toLowerCase().replace(/\s+/g, ' ').trim().replace(/\.$/, '');

// "el proveedor" / "la marca", según el género del glosario.
const conArticulo = ([nombre, genero]) => `${genero === 'f' ? 'la' : 'el'} ${nombre}`;

// creado/creada, actualizado/actualizada, eliminado/eliminada.
const participio = (raiz, genero) => `${raiz}${genero === 'f' ? 'a' : 'o'}`;

// Busca la entidad tal cual viene ("product type" antes que "product").
const buscarEntidad = (crudo) => ENTIDADES[normalizar(crudo)] || null;

const pareceIngles = (normalizado) => {
  if (MARCAS_ESPANOL.test(normalizado)) return false;
  const distintas = new Set(
    normalizado.split(/[^a-z]+/).filter((p) => SENALES_INGLES.has(p))
  );
  return distintas.size >= 2;
};

/*
 * Las familias repetitivas del backend. Cada regla devuelve la frase ya armada
 * o null si no aplica; el orden importa poco porque los patrones no se pisan.
 */
const FAMILIAS = [
  // "Internal Server Error getBrands" — el nombre de la función no le sirve de
  // nada a quien está comprando. Eso es para el log del servidor.
  {
    patron: /^internal server error\b/,
    armar: () => 'Error interno del servidor.',
  },
  // "Brand not found" -> "No se encontró la marca"
  {
    patron: /^(.+?) not found$/,
    armar: ([, entidad]) => {
      const dato = buscarEntidad(entidad);
      return dato ? `No se encontró ${conArticulo(dato)}.` : 'No se encontró lo que buscaba.';
    },
  },
  // "Brand created successfully" -> "Marca creada"
  {
    patron: /^(.+?) (created|registered) successfully$/,
    armar: ([, entidad]) => {
      const dato = buscarEntidad(entidad);
      if (!dato) return null;
      const [nombre, genero] = dato;
      return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${participio('cread', genero)}.`;
    },
  },
  // "Brand updated successfully" -> "Marca actualizada"
  {
    patron: /^(.+?) updated successfully$/,
    armar: ([, entidad]) => {
      const dato = buscarEntidad(entidad);
      if (!dato) return null;
      const [nombre, genero] = dato;
      return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${participio('actualizad', genero)}.`;
    },
  },
  // "Brand deleted successfully" -> "Marca eliminada"
  {
    patron: /^(.+?) deleted successfully$/,
    armar: ([, entidad]) => {
      const dato = buscarEntidad(entidad);
      if (!dato) return null;
      const [nombre, genero] = dato;
      return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${participio('eliminad', genero)}.`;
    },
  },
  // "Supplier already exists" -> "Ya existe el proveedor"
  {
    patron: /^(.+?) already exists\b/,
    armar: ([, entidad]) => {
      const dato = buscarEntidad(entidad);
      return dato ? `Ya existe ${conArticulo(dato)}.` : null;
    },
  },
];

/*
 * El único punto de entrada. Recibe lo que devolvió el servidor y el código
 * HTTP, y devuelve algo que se pueda leer en voz alta en la tienda.
 *
 * `status` es opcional: solo se usa cuando no hay texto o cuando el texto es
 * inglés que no reconocimos.
 */
export const mensajeEnEspanol = (textoDelServidor, statusHttp) => {
  const respaldo = POR_ESTADO[statusHttp] || POR_DEFECTO;

  // Sin texto (o con algo que no es texto: a veces llega un objeto de error).
  if (typeof textoDelServidor !== 'string' || !textoDelServidor.trim()) {
    return respaldo;
  }

  const original = textoDelServidor.trim();
  const clave = normalizar(original);

  // 1. Traducción exacta.
  if (DICCIONARIO[clave]) return DICCIONARIO[clave];

  // 2. Familias repetitivas.
  for (const { patron, armar } of FAMILIAS) {
    const coincidencia = clave.match(patron);
    if (!coincidencia) continue;
    const traducido = armar(coincidencia);
    if (traducido) return traducido;
  }

  // 3. Ya venía en español (o al menos no parece inglés): no se toca.
  if (!pareceIngles(clave)) return original;

  // 4. Inglés desconocido: mejor genérico y en español que crudo y en inglés.
  //    Si esto aparece, es señal de que hay un endpoint nuevo sin traducir.
  console.warn('[mensajesBackend] mensaje en inglés sin traducir:', original);
  return respaldo;
};

export default mensajeEnEspanol;
