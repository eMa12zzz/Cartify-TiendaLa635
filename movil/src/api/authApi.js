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
 * Se manda como JSON y no como FormData porque todavía no hay foto que subir.
 * El multer de la ruta deja pasar de largo las peticiones que no son
 * multipart, así que funciona igual; cuando se conecte la galería, esto
 * cambia a FormData y el resto se queda como está.
 *
 * ── El consentimiento ──
 *
 * `aceptaTerminos` NO es opcional: sin él el backend contesta 400 con "Hay que
 * aceptar los términos y el aviso de privacidad" y no hay cuenta. Lo revisa el
 * servidor aunque el formulario ya lo revise, porque cualquiera puede mandar
 * el registro sin pasar por la pantalla. Ver
 * `backend/src/controller/Clients/registerClient.js`.
 *
 * La VERSIÓN de los términos no se manda: la pone el servidor con la suya. Si
 * se aceptara la que dice el cliente, bastaría con inventarse un número para
 * dejar registrado el consentimiento de un texto que nunca existió.
 *
 * Van como booleanos de verdad y no como "true": el backend los lee con
 * `esVerdadero`, que acepta ambos, pero esto es JSON y no multipart — no hay
 * razón para mandar texto.
 */
export const registrarCliente = ({
  fullName,
  dui,
  phoneNumber,
  email,
  userName,
  password,
  aceptaTerminos,
  promociones,
}) =>
  peticion('/registerClient', {
    metodo: 'POST',
    cuerpo: {
      fullName,
      dui,
      phoneNumber,
      email,
      userName,
      password,
      aceptaTerminos: !!aceptaTerminos,
      promociones: !!promociones,
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
