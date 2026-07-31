/*
 * ============================================================
 * SERVICIOS DE SESIÓN — authApi.js
 * ============================================================
 * Las tres llamadas que necesita la app para que alguien tenga cuenta y pueda
 * entrar. Son exactamente los mismos endpoints que usa la web; el backend no
 * se tocó ni hizo falta tocarlo.
 *
 *   POST /loginClient/login              entrar
 *   POST /registerClient                 registrarse (manda el código al correo)
 *   POST /registerClient/verifyCodeEmail confirmar el código y crear la cuenta
 * ============================================================
 */

import { peticion } from './api';

/*
 * Entrar. Devuelve { token, userType, client }.
 *
 * El `userType` importa: por esta misma puerta entran clientes y personal, y
 * el servidor es quien lo dice.
 */
export const loginClientDB = ({ email, password }) =>
  peticion('/loginClient/login', {
    metodo: 'POST',
    cuerpo: { email, password },
  });

/*
 * Registrarse. No crea la cuenta todavía: el backend guarda los datos en un
 * token de 15 minutos, lo deja en la cookie `registrationCookie` y manda un
 * código de 6 caracteres al correo. La cuenta nace en verificarCodigoCorreo.
 *
 * Ojo con el nombre de los campos: el backend espera `ClientAddress` con C
 * mayúscula, y `fullName` en vez del "nombre completo" de la pantalla.
 *
 * Se manda como JSON y no como FormData porque todavía no hay foto que subir.
 * El multer de la ruta deja pasar de largo las peticiones que no son
 * multipart, así que funciona igual; cuando se conecte la galería, esto
 * cambia a FormData y el resto se queda como está.
 */
export const registrarCliente = ({
  fullName,
  dui,
  phoneNumber,
  clientAddress,
  email,
  userName,
  password,
}) =>
  peticion('/registerClient', {
    metodo: 'POST',
    cuerpo: {
      fullName,
      dui,
      phoneNumber,
      ClientAddress: clientAddress,
      email,
      userName,
      password,
    },
  });

/*
 * Confirmar el código del correo. Aquí sí se crea la cuenta.
 *
 * Esta llamada depende de la cookie `registrationCookie` que dejó el registro:
 * el código por sí solo no le dice nada al servidor, los datos del cliente
 * viven dentro de esa cookie. En Android eso funciona sin hacer nada porque
 * React Native guarda las cookies por debajo (OkHttp), igual que un navegador;
 * por eso no hay que pasarle el correo ni los datos otra vez.
 */
export const verificarCodigoCorreo = (codigo) =>
  peticion('/registerClient/verifyCodeEmail', {
    metodo: 'POST',
    cuerpo: { verificationCodeRequest: codigo },
  });
