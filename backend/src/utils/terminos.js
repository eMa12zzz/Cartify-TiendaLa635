/*
 * ============================================================
 * CONSENTIMIENTO — terminos.js (backend)
 * ============================================================
 * La versión de los términos que está en vigor, y cómo se lee una casilla que
 * llegó por multipart.
 *
 * POR QUÉ ESTÁ DUPLICADA. El texto vive en el frontend
 * (`frontend/src/utils/terminos.js`) y ahí también está su versión. Aquí hay
 * otra copia a propósito, por lo mismo que en familias.js: los dos lados no
 * comparten código, y el servidor no puede dejar que el navegador le dicte qué
 * versión se aceptó — bastaría con mandar "9.9" para que el registro quedara
 * con un consentimiento que nunca existió.
 *
 * REGLA: si sube la versión de un lado, súbala del otro. Aquí manda esta.
 * ============================================================
 */

export const VERSION_TERMINOS = '1.0';

/*
 * Las casillas llegan por FormData, y ahí todo es texto: un checkbox marcado
 * viaja como la cadena "true", no como el booleano true. Y `Boolean("false")`
 * es true, que es exactamente el error que dejaría pasar a quien NO aceptó.
 * De ahí que esto exista en vez de un `!!` suelto.
 */
export const esVerdadero = (valor) =>
  valor === true || valor === 'true' || valor === '1' || valor === 'on';
