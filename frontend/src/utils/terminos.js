/*
 * ============================================================
 * TÉRMINOS Y AVISO DE PRIVACIDAD — terminos.js
 * ============================================================
 * El texto legal de la tienda, escrito como DATOS y no como pantalla.
 *
 * Por qué así: el mismo contenido lo tiene que pintar la página `/terminos`, y
 * mañana quizá un modal o un correo. Si el texto vive metido dentro del JSX,
 * cada lugar nuevo termina con su propia copia y a la semana dicen cosas
 * distintas. Aquí está una vez; quien lo muestre solo decide cómo se ve.
 *
 * LA VERSIÓN NO ES DECORACIÓN. Cuando alguien acepta, se guarda en su cuenta
 * cuál versión aceptó y cuándo. Sin eso no se puede demostrar que aceptó, ni
 * saber a quién hay que repreguntarle el día que este texto cambie. Si edita el
 * contenido de abajo de forma que cambie lo que se promete, SUBA LA VERSIÓN —
 * aquí y en `backend/src/utils/terminos.js`, que tiene la suya.
 *
 * Y una advertencia honesta: esto es un texto claro y de buena fe, no un
 * documento revisado por un abogado. Dice lo que la tienda de verdad hace hoy;
 * si la tienda cambia, hay que venir a cambiarlo.
 * ============================================================
 */

export const VERSION_TERMINOS = '1.0';

// Se muestra al pie del documento. Va escrita y no calculada: es la fecha en
// que se redactó este texto, no la de hoy.
export const FECHA_TERMINOS = '5 de agosto de 2026';

/*
 * La tabla de datos: qué se pide, para qué, quién más lo ve y cuánto se guarda.
 *
 * Esta tabla es el corazón del aviso. Un muro de párrafos legales lo salta
 * todo el mundo; cuatro columnas se leen de una pasada, y es exactamente lo
 * que alguien quiere saber cuando entrega su teléfono a una tienda.
 */
export const TABLA_DATOS = [
  {
    dato: 'Nombre y nombre de usuario',
    para: 'Saber quién hizo el pedido y saludarle por su nombre.',
    quien: 'Solo la tienda.',
    cuanto: 'Mientras tenga su cuenta.',
  },
  {
    dato: 'Correo electrónico',
    para: 'Confirmar que la cuenta es suya, recuperar la contraseña y avisarle de su pedido.',
    quien: 'La tienda y el servicio de correo que envía los mensajes.',
    cuanto: 'Mientras tenga su cuenta.',
  },
  {
    dato: 'Teléfono',
    para: 'Llamarle si quien lleva el pedido no encuentra la casa.',
    quien: 'La tienda y la persona que le lleva ese pedido.',
    cuanto: 'Mientras tenga su cuenta.',
  },
  {
    dato: 'DUI (opcional)',
    para: 'Identificarle si hay un reclamo con un pedido. Puede dejarlo en blanco: su cuenta funciona igual.',
    quien: 'Solo la tienda.',
    cuanto: 'Mientras tenga su cuenta, o hasta que lo borre.',
  },
  {
    dato: 'Direcciones de entrega y su punto en el mapa',
    para: 'Llegar a su puerta y calcular cuánto tarda el reparto en su zona.',
    quien: 'La tienda y la persona que le lleva ese pedido.',
    cuanto: 'Hasta que usted borre la dirección.',
  },
  {
    dato: 'Foto de perfil (opcional)',
    para: 'Que su cuenta se reconozca de un vistazo. Nada más.',
    quien: 'La tienda y el servicio donde se guardan las imágenes.',
    cuanto: 'Hasta que la cambie o la quite.',
  },
  {
    dato: 'Sus pedidos y sus puntos',
    para: 'Armar sus recibos, sumar sus puntos de fidelidad y llevar la contabilidad de la tienda.',
    quien: 'Solo la tienda.',
    cuanto: 'Los pedidos quedan en la contabilidad aunque cierre su cuenta, pero sin su nombre.',
  },
  {
    dato: 'Su contraseña',
    para: 'Entrar a su cuenta.',
    quien: 'Nadie. No la guardamos: guardamos una huella cifrada de la que no se puede volver atrás.',
    cuanto: 'Mientras tenga su cuenta.',
  },
];

/*
 * Los terceros que de verdad tocan algo. Están con nombre y con lo que ven,
 * porque decir "podemos compartir sus datos con proveedores de servicios" es
 * la forma elegante de no decir nada.
 */
const TERCEROS = [
  'El servicio donde se guardan las imágenes (Cloudinary): su foto de perfil, si subió una.',
  'El servicio de correo que manda los mensajes de verificación y recuperación: su correo.',
  'La base de datos donde vive la tienda (MongoDB Atlas): todo lo de la tabla de arriba.',
  'El mapa (OpenStreetMap): cuando busca una dirección, se le manda el texto que escribió para encontrar el punto. Nunca su nombre ni su teléfono.',
  'El asistente por voz (Google Gemini), y solo cuando la tienda no entendió sola: se le manda lo que usted dijo y la lista de productos, sin su nombre, su correo ni su dirección.',
];

/*
 * El documento completo.
 *
 * Cada sección tiene un `id` porque el índice de la izquierda salta a él, y los
 * bloques van tipados para que la pantalla sea un solo `switch` en vez de un
 * archivo con el texto incrustado a mano.
 */
export const SECCIONES = [
  {
    id: 'resumen',
    titulo: 'En corto',
    bloques: [
      {
        tipo: 'destacado',
        texto:
          'Esta es la tienda del barrio, en línea. Usted compra, nosotros le llevamos. Le pedimos los datos justos para poder entregarle, no los vendemos a nadie, y puede pedir que los borremos cuando quiera.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Lo de abajo es lo mismo, explicado con detalle. Está escrito para leerse, no para cansar: si algo no se entiende, escríbanos y se lo explicamos.',
      },
    ],
  },
  {
    id: 'cuenta',
    titulo: 'Su cuenta',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Puede ver la tienda y llenar el carrito sin cuenta. La cuenta hace falta para pagar, guardar direcciones, acumular puntos y ver sus pedidos.',
      },
      {
        tipo: 'lista',
        puntos: [
          'Los datos que ponga tienen que ser suyos y de verdad. Un teléfono equivocado es un pedido que no llega.',
          'Usted responde por lo que se haga desde su cuenta, así que no comparta su contraseña. Nadie de la tienda se la va a pedir nunca, ni por WhatsApp ni por teléfono.',
          'Si vemos que una cuenta se usa para estafar o para molestar a otras personas, la cerramos.',
        ],
      },
    ],
  },
  {
    id: 'pedidos',
    titulo: 'Pedidos, precios y entregas',
    bloques: [
      {
        tipo: 'lista',
        puntos: [
          'El precio que vale es el que se ve cuando usted confirma el pedido.',
          'Las existencias se mueven todo el día. Si algo se acabó justo después de su pedido, le avisamos y se le descuenta del total; no se lo cambiamos por otra cosa sin preguntarle.',
          'El tiempo de entrega que le mostramos sale del promedio real de las entregas anteriores a su zona. Es un estimado honesto, no una promesa: la lluvia y el tráfico existen.',
          'Hay productos que solo se le entregan a personas mayores de edad. Quien se los lleve puede pedirle un documento, y si no lo tiene a mano, ese producto se devuelve.',
        ],
      },
    ],
  },
  {
    id: 'pagos',
    titulo: 'Pagos, puntos y saldo',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Hoy la tienda no cobra tarjetas en línea. Se paga al recibir el pedido o en la caja de la tienda. Por eso mismo, en la aplicación nunca se le va a pedir el número completo de una tarjeta ni su código de seguridad.',
      },
      {
        tipo: 'lista',
        puntos: [
          'Los puntos de fidelidad se ganan comprando y se vencen. Cuánto se gana y cuándo vence se ve en "Mi cuenta > Mis puntos", que siempre manda sobre lo que diga cualquier otro lado.',
          'El saldo de las tarjetas de regalo se canjea en la tienda, no caduca solo, y no se cambia por efectivo.',
          'Los puntos y el saldo son de su cuenta: no se pasan a otra persona.',
        ],
      },
    ],
  },
  {
    id: 'datos',
    titulo: 'Qué datos le pedimos y para qué',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Todo lo que la tienda guarda de usted cabe en esta tabla. No hay una lista aparte más larga.',
      },
      { tipo: 'tabla' },
      {
        tipo: 'nota',
        texto:
          'Cuando su pedido va en camino puede ver por dónde viene. Esa ubicación es la de quien se lo lleva, no la suya, y se borra en cuanto le entregan.',
      },
    ],
  },
  {
    id: 'terceros',
    titulo: 'Quién más ve sus datos',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'No vendemos sus datos ni los prestamos para publicidad de nadie. Los únicos que tocan algo son los servicios que hacen funcionar la tienda, y cada uno ve solo lo suyo:',
      },
      { tipo: 'lista', puntos: TERCEROS },
      {
        tipo: 'parrafo',
        texto:
          'Fuera de eso, solo entregaríamos algo si nos lo ordena una autoridad competente.',
      },
    ],
  },
  {
    id: 'derechos',
    titulo: 'Qué puede pedirnos',
    bloques: [
      {
        tipo: 'lista',
        puntos: [
          'Ver lo que tenemos suyo: está todo en "Mi cuenta", sin pedir permiso a nadie.',
          'Corregirlo: desde "Mi cuenta > Detalles de la cuenta".',
          'Dejar de recibir promociones: desde "Mi cuenta > Notificaciones", en cualquier momento y sin dar explicaciones. Los avisos de sus pedidos siguen llegando, porque esos no son publicidad.',
          'Que borremos su cuenta y sus datos: con el botón de aquí abajo. Le respondemos dentro de los 15 días siguientes.',
        ],
      },
      { tipo: 'borrado' },
      {
        tipo: 'nota',
        texto:
          'Al borrar su cuenta se van su nombre, su correo, su teléfono, sus direcciones y su foto. Los pedidos que ya hizo se quedan en la contabilidad de la tienda —eso lo pide la ley de cualquier negocio— pero desligados de usted.',
      },
    ],
  },
  {
    id: 'cambios',
    titulo: 'Si esto cambia',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Cuando alguien acepta estas condiciones, se guarda en su cuenta cuál versión aceptó y en qué fecha. Sirve para algo concreto: el día que cambiemos el texto sabemos exactamente a quién hay que volver a preguntarle, en vez de dar por sentado que todo el mundo estuvo de acuerdo con algo que nunca leyó.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Los cambios pequeños —arreglar una palabra, aclarar una frase— no cambian la versión. Los que cambien lo que prometemos, sí.',
      },
    ],
  },
];

/*
 * El mensaje que va escrito de antemano en el WhatsApp de "borren mis datos".
 *
 * Va con el texto puesto a propósito: la mitad de la gente que quiere ejercer
 * este derecho abandona en el momento de tener que redactar la solicitud. Aquí
 * solo tiene que darle enviar.
 */
export const MENSAJE_BORRADO =
  'Hola, quiero pedir que borren mi cuenta y mis datos personales de la tienda en linea. Mi correo registrado es: ';
