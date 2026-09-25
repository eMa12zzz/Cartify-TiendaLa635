import { TERMINOS } from './terminos';
import { PRIVACIDAD } from './privacidad';
import { COOKIES_DOC } from './cookies';
import { DEVOLUCIONES } from './devoluciones';

/*
 * ============================================================
 * LOS DOCUMENTOS LEGALES — legales/index.js
 * ============================================================
 * Términos, privacidad, cookies y devoluciones, escritos como DATOS: el mismo
 * texto lo pintan la página de cada uno (pages/Legal.jsx) y el modal del
 * registro, y la aplicación tiene una copia (movil/src/utils/legales.js).
 *
 * LA VERSIÓN NO ES DECORACIÓN. Al crear una cuenta se guarda qué versión
 * aceptó la persona y cuándo; sin eso no se puede demostrar que aceptó, ni
 * saber a quién repreguntarle el día que esto cambie. Los cuatro documentos
 * comparten versión porque se aceptan juntos. Si cambia lo que se promete,
 * SÚBALA aquí, en backend/src/utils/terminos.js y en la copia de la app.
 * ============================================================
 */

export const VERSION_LEGAL = '3.0';

// La fecha en que se redactó esta versión, no la de hoy.
export const FECHA_LEGAL = '24 de septiembre de 2026';

// En el orden en que se enlazan al pie de cada documento y de la tienda.
export const DOCUMENTOS_LEGALES = [TERMINOS, PRIVACIDAD, DEVOLUCIONES, COOKIES_DOC];

export const documentoLegal = (clave) => DOCUMENTOS_LEGALES.find((d) => d.clave === clave) || TERMINOS;

/*
 * El mensaje que va escrito de antemano en el WhatsApp de "borren mis datos".
 * La mitad de la gente que quiere ejercer este derecho abandona en el momento
 * de redactar la solicitud; aquí solo tiene que darle enviar.
 */
export const MENSAJE_BORRADO =
  'Hola, quiero pedir que borren mi cuenta y mis datos personales de la tienda en línea. Mi correo registrado es: ';
