import { TERMINOS } from './terminos';
import { PRIVACIDAD } from './privacidad';
import { DEVOLUCIONES } from './devoluciones';

/*
 * Los documentos legales en la app: los mismos textos que la web
 * (frontend/src/utils/legales), con la MISMA versión, porque se aceptan
 * igual en los dos lados. La política de cookies no viene: la app no usa
 * cookies, y lo que guarda en el teléfono lo explica la de privacidad.
 *
 * Si cambia lo que se promete, suba la versión aquí, en la web y en
 * backend/src/utils/terminos.js.
 */
export const VERSION_LEGAL = '3.0';
export const FECHA_LEGAL = '24 de septiembre de 2026';

export const DOCUMENTOS_LEGALES = [TERMINOS, PRIVACIDAD, DEVOLUCIONES];

export const documentoLegal = (clave) => DOCUMENTOS_LEGALES.find((d) => d.clave === clave) || TERMINOS;

// La web, para abrir la política de cookies desde la app si alguien la busca.
export const URL_WEB_LEGAL = 'https://cartify-tienda-la635.vercel.app';
