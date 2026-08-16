/*
 * ============================================================
 * LAS OPCIONES DE LAS COOKIES — cookieSesion.js
 * ============================================================
 * Un solo sitio que decide cómo se emiten TODAS las cookies de la app.
 *
 * EL PROBLEMA QUE RESUELVE
 * En local, el frontend (5173) y el backend (4000) son puertos distintos del
 * mismo `localhost`, y el navegador los trata con manga ancha. Desplegados son
 * DOMINIOS distintos —la tienda en Vercel, la API en Render— y ahí el navegador
 * considera la cookie "de terceros" y la DESCARTA sin decir nada.
 *
 * Y no avisa: el login responde 200, el token viaja en el cuerpo, todo parece
 * haber salido bien. La siguiente pantalla dice que no hay sesión. Es de los
 * errores que más tiempo cuestan porque nada apunta a la causa.
 *
 * La combinación que lo arregla es `sameSite: "none"` + `secure: true`, y las
 * dos van juntas por obligación: el navegador rechaza una cookie `none` que no
 * sea `secure`.
 *
 * POR QUÉ NO SE PONE SIEMPRE
 * Porque `secure` exige HTTPS. En local se trabaja en HTTP, y aunque los
 * navegadores hacen una excepción con `localhost`, dejarlo encendido invita a
 * una tarde perdida el día que alguien pruebe desde el teléfono por la IP de
 * la red —que ya no es localhost y ya no tiene la excepción—.
 *
 * Así que lo decide una variable de entorno. En Render se pone
 * COOKIES_ENTRE_DOMINIOS=true; en local no se pone nada y todo sigue igual.
 * ============================================================
 */

const ENTRE_DOMINIOS = process.env.COOKIES_ENTRE_DOMINIOS === "true";

/*
 * @param {number} maxAge - cuánto vive la cookie, en milisegundos.
 * @param {object} extra  - lo propio de cada cookie, si hiciera falta.
 *
 * `httpOnly` va siempre: es lo que impide que un script de la página lea el
 * token. Es la diferencia entre "alguien inyectó un script" y "alguien se
 * llevó la sesión de todos".
 */
export const opcionesCookie = (maxAge, extra = {}) => ({
  httpOnly: true,
  maxAge,
  ...(ENTRE_DOMINIOS
    ? { sameSite: "none", secure: true }
    : /*
       * En local, "lax" es el valor por defecto del navegador de todas formas;
       * escribirlo deja claro que es una decisión y no un olvido.
       */
      { sameSite: "lax", secure: false }),
  ...extra,
});

export default opcionesCookie;
